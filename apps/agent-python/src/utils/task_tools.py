from typing import Any, Dict, List, Optional
from langchain.tools import StructuredTool
from pydantic import BaseModel, Field
from ..services.database import TaskService, UserService


# Tool Schemas
class ReadAllTasksInput(BaseModel):
    """Input schema for reading all tasks."""
    completed: Optional[bool] = Field(None, description="Filter by completion status")
    priority: Optional[str] = Field(None, description="Filter by priority: low, medium, or high")


class ReadUserInput(BaseModel):
    """Input schema for reading user details."""
    pass


class UpdateTaskDataInput(BaseModel):
    """Task data to update."""
    title: Optional[str] = Field(None, description="New title for the task")
    description: Optional[str] = Field(None, description="New description for the task")
    priority: Optional[str] = Field(None, description="New priority level: low, medium, or high")
    deadline: Optional[str] = Field(None, description="New deadline (ISO string)")
    date: Optional[str] = Field(None, description="New planned date (ISO string)")
    estimatedMinutes: Optional[int] = Field(None, description="New estimated time in minutes")
    stage: Optional[str] = Field(None, description="New task stage")
    stageStatus: Optional[str] = Field(None, description="New stage status")
    completed: Optional[bool] = Field(None, description="Mark as completed")


class UpdateTaskInput(BaseModel):
    """Input schema for updating a task."""
    taskId: str = Field(..., description="The ID of the task to update")
    data: UpdateTaskDataInput = Field(..., description="The task data to update")


class UpdateTasksManyDataInput(BaseModel):
    """Individual task update data."""
    id: str
    priority: Optional[str] = Field(None, description="New priority level")
    position: Optional[int] = Field(None, description="Position of task in the list")
    estimatedMinutes: Optional[int] = Field(None, description="New estimated time")
    priorityReason: Optional[str] = Field(None, description="Explanation of priority")
    deadline: Optional[str] = Field(None, description="New deadline (ISO string)")
    date: Optional[str] = Field(None, description="New planned date (ISO string)")


class UpdateTasksManyInput(BaseModel):
    """Input schema for updating many tasks."""
    data: List[UpdateTasksManyDataInput] = Field(..., description="List of task updates")


class CreateTaskInput(BaseModel):
    """Input schema for creating a task."""
    title: str = Field(..., description="Title of the task")
    description: Optional[str] = Field(None, description="Description of the task")
    priority: Optional[str] = Field("medium", description="Priority level")
    deadline: Optional[str] = Field(None, description="Deadline (ISO string)")
    date: Optional[str] = Field(None, description="Planned date (ISO string)")
    estimatedMinutes: Optional[int] = Field(None, description="Estimated time in minutes")
    parentId: Optional[str] = Field(None, description="Parent task ID if this is a subtask")


# Tool Functions
async def read_all_tasks_func(
    completed: Optional[bool] = None,
    priority: Optional[str] = None,
    context: Optional[Dict[str, Any]] = None
) -> List[Dict[str, Any]]:
    """Fetch all tasks for the user with optional filters."""
    if not context:
        return {"error": "Context not provided to tool"}

    user_id = context.get('userId')
    if not user_id:
        return {"error": "User ID not found in context"}

    filters = {}
    if completed is not None:
        filters['completed'] = completed
    if priority:
        filters['priority'] = priority

    try:
        tasks = await TaskService.get_tasks(user_id, filters)
        return tasks
    except Exception as e:
        return {"error": str(e)}


async def read_user_func(context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Fetch user details including preferences and settings."""
    if not context:
        return {"error": "Context not provided to tool"}

    user_id = context.get('userId')
    if not user_id:
        return {"error": "User ID not found in context"}

    try:
        user = await UserService.get_user_with_profile(user_id)
        return user or {"error": "User not found"}
    except Exception as e:
        return {"error": str(e)}


async def update_task_func(
    taskId: str,
    data: Dict[str, Any],
    context: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """Update a single task with new data."""
    if not context:
        return {"error": "Context not provided to tool"}

    user_id = context.get('userId')
    if not user_id:
        return {"error": "User ID not found in context"}

    try:
        update_data = {
            'id': taskId,
            'userId': user_id,
            **data
        }
        task = await TaskService.update_task(update_data)
        return task
    except Exception as e:
        return {"error": str(e)}


async def update_tasks_many_func(
    data: List[Dict[str, Any]],
    context: Optional[Dict[str, Any]] = None
) -> List[Dict[str, Any]]:
    """Update many tasks with new data."""
    if not context:
        return {"error": "Context not provided to tool"}

    user_id = context.get('userId')
    if not user_id:
        return {"error": "User ID not found in context"}

    try:
        tasks = await TaskService.update_many_tasks(data)
        return tasks
    except Exception as e:
        return {"error": str(e)}


async def create_task_func(
    title: str,
    description: Optional[str] = None,
    priority: str = "medium",
    deadline: Optional[str] = None,
    date: Optional[str] = None,
    estimatedMinutes: Optional[int] = None,
    parentId: Optional[str] = None,
    context: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """Create a new task."""
    if not context:
        return {"error": "Context not provided to tool"}

    user_id = context.get('userId')
    if not user_id:
        return {"error": "User ID not found in context"}

    try:
        task_data = {
            'userId': user_id,
            'title': title,
            'completed': False,
            'priority': priority
        }
        if description:
            task_data['description'] = description
        if deadline:
            task_data['deadline'] = deadline
        if date:
            task_data['date'] = date
        if estimatedMinutes:
            task_data['estimatedMinutes'] = estimatedMinutes
        if parentId:
            task_data['parentId'] = parentId

        task = await TaskService.create_task(task_data)
        return task
    except Exception as e:
        return {"error": str(e)}


def create_task_tools(context: Dict[str, Any]) -> List[StructuredTool]:
    """
    Create task management tools with context binding.

    Args:
        context: Dictionary containing userId and other context data

    Returns:
        List of StructuredTool instances
    """
    return [
        StructuredTool(
            name="read_all_tasks",
            description="Fetch all tasks for the user with optional filters",
            func=lambda **kwargs: read_all_tasks_func(**kwargs, context=context),
            args_schema=ReadAllTasksInput,
            coroutine=lambda **kwargs: read_all_tasks_func(**kwargs, context=context)
        ),
        StructuredTool(
            name="read_user",
            description="Fetch user details including preferences and settings",
            func=lambda **kwargs: read_user_func(context=context),
            args_schema=ReadUserInput,
            coroutine=lambda **kwargs: read_user_func(context=context)
        ),
        StructuredTool(
            name="update_task",
            description="Update a single task with new data",
            func=lambda **kwargs: update_task_func(**kwargs, context=context),
            args_schema=UpdateTaskInput,
            coroutine=lambda **kwargs: update_task_func(**kwargs, context=context)
        ),
        StructuredTool(
            name="update_tasks_many",
            description="Update many tasks with new data",
            func=lambda **kwargs: update_tasks_many_func(**kwargs, context=context),
            args_schema=UpdateTasksManyInput,
            coroutine=lambda **kwargs: update_tasks_many_func(**kwargs, context=context)
        ),
        StructuredTool(
            name="create_task",
            description="Create a new task",
            func=lambda **kwargs: create_task_func(**kwargs, context=context),
            args_schema=CreateTaskInput,
            coroutine=lambda **kwargs: create_task_func(**kwargs, context=context)
        )
    ]
