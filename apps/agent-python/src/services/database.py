import os
import psycopg
from psycopg.rows import dict_row
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from dotenv import load_dotenv
from cuid import cuid

load_dotenv()


def serialize_datetime_fields(obj: Dict[str, Any]) -> Dict[str, Any]:
    """Convert datetime objects to ISO strings."""
    for key, value in obj.items():
        if isinstance(value, (datetime, date)):
            obj[key] = value.isoformat()
    return obj


def get_db_connection():
    """Get a database connection."""
    return psycopg.connect(
        host=os.getenv('POSTGRES_HOST'),
        dbname=os.getenv('POSTGRES_DATABASE'),
        user=os.getenv('POSTGRES_USER'),
        password=os.getenv('POSTGRES_PASSWORD'),
        sslmode='require',
        row_factory=dict_row
    )


class UserService:
    """Service for user-related database operations."""

    @staticmethod
    async def get_user_with_profile(user_id: str) -> Optional[Dict[str, Any]]:
        """Get user with psychological profile and coach information."""
        conn = get_db_connection()
        try:
            with conn.cursor() as cursor:
                # Get user
                cursor.execute("""
                    SELECT * FROM "User" WHERE id = %s
                """, (user_id,))
                user = cursor.fetchone()

                if not user:
                    return None

                user = dict(user)
                user = serialize_datetime_fields(user)

                # Get psychological profile
                cursor.execute("""
                    SELECT * FROM "PsychProfile" WHERE "userId" = %s
                """, (user_id,))
                psych_profile = cursor.fetchone()

                if psych_profile:
                    psych_profile = dict(psych_profile)
                    psych_profile = serialize_datetime_fields(psych_profile)

                    # Get coach if exists
                    if psych_profile.get('coachId'):
                        cursor.execute("""
                            SELECT * FROM "Coach" WHERE id = %s
                        """, (psych_profile['coachId'],))
                        coach = cursor.fetchone()
                        psych_profile['coach'] = serialize_datetime_fields(dict(coach)) if coach else None

                    user['psychProfile'] = psych_profile

                # Get settings
                cursor.execute("""
                    SELECT * FROM "Settings" WHERE "userId" = %s
                """, (user_id,))
                settings = cursor.fetchone()
                user['settings'] = serialize_datetime_fields(dict(settings)) if settings else None

                return user
        finally:
            conn.close()


class TaskService:
    """Service for task-related database operations."""

    @staticmethod
    async def get_task(task_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific task by ID."""
        conn = get_db_connection()
        try:
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT * FROM "Task"
                    WHERE id = %s AND "userId" = %s
                """, (task_id, user_id))
                task = cursor.fetchone()

                if not task:
                    return None

                task = dict(task)
                task = serialize_datetime_fields(task)

                # Get children (subtasks)
                cursor.execute("""
                    SELECT * FROM "Task" WHERE "parentId" = %s
                """, (task_id,))
                children = cursor.fetchall()
                task['children'] = [serialize_datetime_fields(dict(child)) for child in children] if children else []

                return task
        finally:
            conn.close()

    @staticmethod
    async def get_tasks(user_id: str, filters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """Get all tasks with optional filters."""
        conn = get_db_connection()
        try:
            with conn.cursor() as cursor:
                query = """
                    SELECT * FROM "Task"
                    WHERE "userId" = %s AND "parentId" IS NULL
                """
                params = [user_id]

                if filters:
                    if 'completed' in filters:
                        query += " AND completed = %s"
                        params.append(filters['completed'])
                    if 'priority' in filters:
                        query += " AND priority = %s"
                        params.append(filters['priority'])

                query += """ ORDER BY position ASC, deadline ASC, priority DESC"""

                cursor.execute(query, params)
                tasks = cursor.fetchall()

                result = []
                for task in tasks:
                    task = dict(task)
                    task = serialize_datetime_fields(task)

                    # Get children for each task
                    cursor.execute("""
                        SELECT * FROM "Task" WHERE "parentId" = %s
                    """, (task['id'],))
                    children = cursor.fetchall()
                    task['children'] = [serialize_datetime_fields(dict(child)) for child in children] if children else []

                    result.append(task)

                return result
        finally:
            conn.close()

    @staticmethod
    async def create_task(data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new task."""
        conn = get_db_connection()
        try:
            # Generate CUID for the task if not provided
            if 'id' not in data:
                data['id'] = cuid()

            # Add timestamps if not provided
            if 'createdAt' not in data:
                data['createdAt'] = datetime.now()
            if 'updatedAt' not in data:
                data['updatedAt'] = datetime.now()

            with conn.cursor() as cursor:
                columns = ', '.join([f'"{k}"' for k in data.keys()])
                placeholders = ', '.join(['%s'] * len(data))

                cursor.execute(f"""
                    INSERT INTO "Task" ({columns})
                    VALUES ({placeholders})
                    RETURNING *
                """, list(data.values()))

                task = cursor.fetchone()
                conn.commit()
                return serialize_datetime_fields(dict(task))
        finally:
            conn.close()

    @staticmethod
    async def update_task(data: Dict[str, Any]) -> Dict[str, Any]:
        """Update a task."""
        conn = get_db_connection()
        try:
            task_id = data.pop('id')
            user_id = data.pop('userId', None)

            with conn.cursor() as cursor:
                set_clause = ', '.join([f'"{k}" = %s' for k in data.keys()])
                values = list(data.values())
                values.append(task_id)

                cursor.execute(f"""
                    UPDATE "Task"
                    SET {set_clause}
                    WHERE id = %s
                    RETURNING *
                """, values)

                task = cursor.fetchone()
                conn.commit()
                return serialize_datetime_fields(dict(task))
        finally:
            conn.close()

    @staticmethod
    async def update_many_tasks(updates: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Update many tasks."""
        conn = get_db_connection()
        try:
            results = []
            with conn.cursor() as cursor:
                for update in updates:
                    task_id = update.pop('id')
                    set_clause = ', '.join([f'"{k}" = %s' for k in update.keys()])
                    values = list(update.values())
                    values.append(task_id)

                    cursor.execute(f"""
                        UPDATE "Task"
                        SET {set_clause}
                        WHERE id = %s
                        RETURNING *
                    """, values)

                    task = cursor.fetchone()
                    results.append(serialize_datetime_fields(dict(task)))

                conn.commit()
            return results
        finally:
            conn.close()

    @staticmethod
    async def create_subtasks(parent_task_id: str, user_id: str, subtasks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Create multiple subtasks."""
        conn = get_db_connection()
        try:
            results = []
            with conn.cursor() as cursor:
                for subtask in subtasks:
                    subtask['userId'] = user_id
                    subtask['parentId'] = parent_task_id

                    # Generate CUID for the subtask if not provided
                    if 'id' not in subtask:
                        subtask['id'] = cuid()

                    # Add timestamps if not provided
                    if 'createdAt' not in subtask:
                        subtask['createdAt'] = datetime.now()
                    if 'updatedAt' not in subtask:
                        subtask['updatedAt'] = datetime.now()

                    columns = ', '.join([f'"{k}"' for k in subtask.keys()])
                    placeholders = ', '.join(['%s'] * len(subtask))

                    cursor.execute(f"""
                        INSERT INTO "Task" ({columns})
                        VALUES ({placeholders})
                        RETURNING *
                    """, list(subtask.values()))

                    task = cursor.fetchone()
                    results.append(serialize_datetime_fields(dict(task)))

                conn.commit()
            return results
        finally:
            conn.close()


class LogService:
    """Service for logging activities."""

    @staticmethod
    async def create_log(data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Create a log entry."""
        # Placeholder - implement if needed
        return None


class ChatMessageService:
    """Service for chat messages."""

    @staticmethod
    async def create_message(data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a chat message."""
        conn = get_db_connection()
        try:
            with conn.cursor() as cursor:
                columns = ', '.join([f'"{k}"' for k in data.keys()])
                placeholders = ', '.join(['%s'] * len(data))

                cursor.execute(f"""
                    INSERT INTO "ChatMessage" ({columns})
                    VALUES ({placeholders})
                    RETURNING *
                """, list(data.values()))

                message = cursor.fetchone()
                conn.commit()
                return serialize_datetime_fields(dict(message))
        finally:
            conn.close()

    @staticmethod
    async def get_messages(user_id: str, task_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get chat messages."""
        conn = get_db_connection()
        try:
            with conn.cursor() as cursor:
                if task_id:
                    cursor.execute("""
                        SELECT * FROM "ChatMessage"
                        WHERE "userId" = %s AND "taskId" = %s
                        ORDER BY "createdAt" ASC
                    """, (user_id, task_id))
                else:
                    cursor.execute("""
                        SELECT * FROM "ChatMessage"
                        WHERE "userId" = %s
                        ORDER BY "createdAt" ASC
                    """, (user_id,))

                messages = cursor.fetchall()
                return [serialize_datetime_fields(dict(msg)) for msg in messages]
        finally:
            conn.close()
