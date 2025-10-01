from typing import Any, Optional, List, Dict, Annotated, Union
from langchain_core.messages import BaseMessage
from langgraph.graph import add_messages
from pydantic import BaseModel, ConfigDict
from .enums import AgentType, ActionType


class ActionItem(BaseModel):
    """Represents an action to be executed."""
    type: ActionType
    payload: Optional[Dict[str, Any]] = None


class Coach(BaseModel):
    """Coach model."""
    model_config = ConfigDict(extra='ignore')

    id: str
    name: str
    coachingStyle: Optional[str] = None
    directness: Optional[int] = None
    encouragementLevel: Optional[int] = None


class PsychProfile(BaseModel):
    """Psychological profile model."""
    model_config = ConfigDict(extra='ignore')

    id: str
    userId: str
    productivityTime: Optional[str] = None
    taskApproach: Optional[str] = None
    difficultyPreference: Optional[str] = None
    coach: Optional[Coach] = None


class Settings(BaseModel):
    """User settings model."""
    model_config = ConfigDict(extra='ignore')

    id: str
    userId: str
    theme: Optional[str] = None
    notifications: Optional[bool] = None


class User(BaseModel):
    """User model with profile and settings."""
    model_config = ConfigDict(extra='ignore')

    id: str
    email: str
    name: Optional[str] = None
    psychProfile: Optional[PsychProfile] = None
    settings: Optional[Settings] = None


class Task(BaseModel):
    """Task model."""
    model_config = ConfigDict(extra='ignore')

    id: str
    userId: str
    title: str
    description: Optional[str] = None
    priority: str
    stage: Optional[str] = None
    stageStatus: Optional[str] = None
    completed: bool = False
    deadline: Optional[str] = None
    date: Optional[str] = None
    dueDate: Optional[str] = None
    estimatedMinutes: Optional[int] = None
    parentId: Optional[str] = None
    children: Optional[List['Task']] = None


class Context(BaseModel):
    """Additional context for the conversation."""
    taskId: Optional[str] = None


class State(BaseModel):
    """
    Main state for the agent graph.
    Uses add_messages reducer for the messages field.
    """
    # Core identifiers
    userId: str

    # Input and response
    input: str = ""
    agentResponse: Optional[str] = None

    # Messages with reducer
    messages: Annotated[List[BaseMessage], add_messages] = []

    # Context
    context: Optional[Context] = None
    user: Optional[User] = None
    task: Optional[Task] = None
    tasks: Optional[List[Task]] = None

    # Agent state
    activeAgentType: Optional[AgentType] = None
    actionItems: List[ActionItem] = []

    # Conversation management
    summary: Optional[str] = None

    # Error handling
    error: Optional[str] = None

    class Config:
        arbitrary_types_allowed = True
