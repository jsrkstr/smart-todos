import os
import json
import psycopg
from psycopg_pool import ConnectionPool
from typing import Dict, List, Any, Optional
from langgraph.store.base import BaseStore


class PostgresStore(BaseStore):
    """PostgreSQL-backed store for LangGraph."""

    def __init__(self, conn_string: str, table_name: str = "langgraph_pg_store"):
        """
        Initialize PostgreSQL store.

        Args:
            conn_string: PostgreSQL connection string
            table_name: Name of the table to use for storage
        """
        super().__init__()
        self.pool = ConnectionPool(conn_string, min_size=1, max_size=10)
        self.table_name = table_name

    def _make_key(self, namespace: List[str], key: str) -> str:
        """Create composite key from namespace and key."""
        if namespace:
            return f"{':'.join(namespace)}:{key}"
        return key

    def get(self, namespace: List[str], key: str) -> Optional[Any]:
        """Get a value by namespace and key."""
        composite_key = self._make_key(namespace, key)
        result = self.batch_load([composite_key])
        return result.get(composite_key)

    def put(
        self,
        namespace: List[str],
        key: str,
        value: Dict[str, Any],
        index: Optional[List[str]] = None
    ) -> None:
        """Put a value in the store."""
        composite_key = self._make_key(namespace, key)
        self.batch_save({composite_key: value})

    def delete(self, namespace: List[str], key: str) -> None:
        """Delete a value from the store."""
        composite_key = self._make_key(namespace, key)
        with self.pool.connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    f"DELETE FROM {self.table_name} WHERE key = %s",
                    (composite_key,)
                )
                conn.commit()

    def get_all(self, namespace: List[str]) -> Dict[str, Any]:
        """Get all values in a namespace."""
        prefix = f"{':'.join(namespace)}:" if namespace else ''
        with self.pool.connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    f"SELECT key, value FROM {self.table_name} WHERE key LIKE %s",
                    (f"{prefix}%",)
                )
                rows = cursor.fetchall()
                result = {}
                for row in rows:
                    result[row['key']] = row['value']
                return result

    def clear(self, namespace: List[str]) -> None:
        """Clear all values in a namespace."""
        prefix = f"{':'.join(namespace)}:" if namespace else ''
        with self.pool.connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    f"DELETE FROM {self.table_name} WHERE key LIKE %s",
                    (f"{prefix}%",)
                )
                conn.commit()

    def search(
        self,
        namespace_prefix: List[str],
        filter_dict: Optional[Dict[str, Any]] = None,
        limit: Optional[int] = None,
        offset: Optional[int] = None,
        query: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Search for values in the store."""
        prefix = f"{':'.join(namespace_prefix)}:" if namespace_prefix else ''
        query_str = f"SELECT key, value FROM {self.table_name} WHERE key LIKE %s"
        params = [f"{prefix}%"]

        if query:
            query_str += " AND (key ILIKE %s OR value::text ILIKE %s)"
            params.extend([f"%{query}%", f"%{query}%"])

        if limit:
            query_str += f" LIMIT %s"
            params.append(limit)

        if offset:
            query_str += f" OFFSET %s"
            params.append(offset)

        with self.pool.connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(query_str, params)
                rows = cursor.fetchall()
                return [
                    {
                        'key': row['key'],
                        'value': row['value'],
                        'namespace': namespace_prefix
                    }
                    for row in rows
                ]

    def initialize(self) -> None:
        """Initialize the store (create table if not exists)."""
        with self.pool.connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SET search_path TO langgraph")
                cursor.execute(f"""
                    CREATE TABLE IF NOT EXISTS {self.table_name} (
                        key TEXT PRIMARY KEY,
                        value JSONB
                    )
                """)
                conn.commit()

    def batch_load(self, keys: List[str]) -> Dict[str, Any]:
        """Load multiple keys at once."""
        if not keys:
            return {}

        with self.pool.connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    f"SELECT key, value FROM {self.table_name} WHERE key = ANY(%s)",
                    (keys,)
                )
                rows = cursor.fetchall()
                result = {}
                for row in rows:
                    result[row['key']] = row['value']
                return result

    def batch_save(self, pairs: Dict[str, Any]) -> None:
        """Save multiple key-value pairs at once."""
        if not pairs:
            return

        with self.pool.connection() as conn:
            with conn.cursor() as cursor:
                for key, value in pairs.items():
                    # Convert value to JSON if it's a dict
                    json_value = json.dumps(value) if isinstance(value, dict) else value
                    cursor.execute(f"""
                        INSERT INTO {self.table_name} (key, value)
                        VALUES (%s, %s)
                        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
                    """, (key, json_value))
                conn.commit()

    def batch(self, operations: List[Any]) -> List[Any]:
        """Execute a batch of operations synchronously."""
        results = []
        for op in operations:
            if hasattr(op, 'namespace') and hasattr(op, 'key'):
                if hasattr(op, 'value'):
                    # Put operation
                    self.put(op.namespace, op.key, op.value)
                    results.append(None)
                else:
                    # Get operation
                    result = self.get(op.namespace, op.key)
                    results.append(result)
            else:
                results.append(None)
        return results

    async def abatch(self, operations: List[Any]) -> List[Any]:
        """Execute a batch of operations asynchronously."""
        # For now, just call the sync version
        # In a production system, you'd want true async operations
        return self.batch(operations)

    def close(self) -> None:
        """Close all connections in the pool."""
        self.pool.close()
