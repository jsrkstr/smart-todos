from enum import Enum


class AgentType(str, Enum):
    """Types of specialized agents in the system."""
    SUPERVISOR = "Supervisor"
    TASK_CREATION = "TaskCreation"
    PLANNING = "Planning"
    EXECUTION_COACH = "ExecutionCoach"
    ADAPTATION = "Adaptation"
    ANALYTICS = "Analytics"


class ActionType(str, Enum):
    """Types of actions agents can take."""
    CREATE_TASK = "createTask"
    UPDATE_TASK = "updateTask"
    CREATE_SUBTASKS = "createSubtasks"
    UPDATE_MANY_TASKS = "updateManyTasks"
    SEARCH_TASKS = "searchTasks"
    LOG_ACTIVITY = "logActivity"
    SCHEDULE_REMINDER = "scheduleReminder"
    PROVIDE_MOTIVATION = "provideMotivation"
    GIVE_ADVICE = "giveAdvice"
    ASK_QUESTION = "askQuestion"
    NONE = "none"
