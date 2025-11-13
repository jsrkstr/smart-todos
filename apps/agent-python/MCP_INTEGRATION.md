# MCP Integration Guide for Python Agent

This guide explains how to integrate the Smart Todos MCP server with the Python LangGraph agent.

## Overview

The MCP (Model Context Protocol) server exposes database operations as tools that can be called by AI agents. The Python agent can use these tools instead of directly accessing the database.

## Setup

### 1. Install Node.js dependencies for MCP server

```bash
cd apps/mcp-server
pnpm install
pnpm build
```

### 2. Configure environment variables

Ensure both the MCP server and Python agent share the same environment variables:

**apps/mcp-server/.env**
```bash
DATABASE_URL="postgresql://user:password@localhost:5432/smart_todos"
JWT_SECRET="your-secret-key"
```

**apps/agent-python/.env**
```bash
# Add MCP server path (optional - defaults to ../mcp-server)
MCP_SERVER_PATH="../mcp-server"
```

## Usage in Python Agent

### Basic Usage

```python
from services.mcp_client import get_mcp_client

# Initialize MCP client with JWT token
mcp = get_mcp_client(jwt_token="user-jwt-token-here")

# Get all incomplete tasks
tasks = mcp.get_tasks(completed=False)

# Create a new task
new_task = mcp.create_task(
    title="Finish project report",
    description="Complete the Q4 project report",
    priority="high",
    due_date="2024-12-31T23:59:59Z"
)

# Update a task
updated_task = mcp.update_task(
    task_id="task-123",
    completed=True
)

# Get user profile
profile = mcp.get_user_profile()

# Get chat history
messages = mcp.get_chat_history(limit=10)
```

### Integration with LangGraph Tools

You can wrap MCP client methods as LangChain tools for use in your agents:

```python
from langchain.tools import tool
from services.mcp_client import get_mcp_client

# Global JWT token (set from request context)
_current_jwt_token = None

def set_jwt_token(token: str):
    global _current_jwt_token
    _current_jwt_token = token

@tool
def get_tasks_tool(completed: bool = None, priority: str = None) -> list:
    """Get tasks from the database with optional filtering"""
    mcp = get_mcp_client(_current_jwt_token)
    return mcp.get_tasks(completed=completed, priority=priority)

@tool
def create_task_tool(title: str, description: str = None, priority: str = None) -> dict:
    """Create a new task"""
    mcp = get_mcp_client(_current_jwt_token)
    return mcp.create_task(title=title, description=description, priority=priority)

@tool
def update_task_tool(task_id: str, completed: bool = None, priority: str = None) -> dict:
    """Update an existing task"""
    mcp = get_mcp_client(_current_jwt_token)
    return mcp.update_task(task_id=task_id, completed=completed, priority=priority)

# Use in agent executor
from langgraph.prebuilt import create_react_agent

tools = [get_tasks_tool, create_task_tool, update_task_tool]
agent = create_react_agent(llm, tools)

# Before processing request, set JWT token
set_jwt_token(user_jwt_token)

# Run agent
result = await agent.ainvoke({"messages": [("user", "Show me my incomplete tasks")]})
```

### Modifying Existing Agent Code

**Option 1: Replace database service with MCP client**

In `src/services/database.py`, replace direct database calls with MCP client:

```python
# OLD: Direct database access
def get_tasks(user_id: str):
    query = "SELECT * FROM tasks WHERE user_id = %s"
    cursor.execute(query, (user_id,))
    return cursor.fetchall()

# NEW: Via MCP client
from services.mcp_client import get_mcp_client

def get_tasks(user_id: str, jwt_token: str):
    mcp = get_mcp_client(jwt_token)
    return mcp.get_tasks()
```

**Option 2: Add MCP tools alongside existing tools**

In `src/utils/task_tools.py`, add MCP-based tools:

```python
from langchain.tools import tool
from services.mcp_client import get_mcp_client

# Keep existing tools and add MCP versions
@tool
def mcp_get_tasks(jwt_token: str, completed: bool = None) -> list:
    """Get tasks via MCP server"""
    mcp = get_mcp_client(jwt_token)
    return mcp.get_tasks(completed=completed)
```

**Option 3: Hybrid approach (recommended)**

Keep direct database access for context loading (faster), use MCP for agent actions:

```python
# In src/graph.py or src/index.py

async def process_request(user_id: str, message: str, jwt_token: str):
    # Fast context loading via direct DB
    from services.database import load_user_context
    context = load_user_context(user_id)

    # Agent actions via MCP
    from services.mcp_client import get_mcp_client
    mcp = get_mcp_client(jwt_token)

    # Build state with both
    state = {
        "context": context,
        "mcp_client": mcp,
        # ... rest of state
    }

    # Run agent
    result = await agent.invoke(state)
    return result
```

## Available MCP Tools

### Task Operations
- `get_tasks(completed, priority, start_date, end_date, parent_id)` - Get tasks with filtering
- `get_task(task_id)` - Get single task details
- `create_task(title, description, priority, due_date, parent_id, tags)` - Create new task
- `update_task(task_id, title, description, priority, due_date, completed, tags)` - Update task
- `delete_task(task_id)` - Delete task (soft delete)
- `get_subtasks(task_id)` - Get subtasks for a parent task

### User Operations
- `get_user_profile()` - Get user profile
- `get_psych_profile()` - Get psychological profile
- `get_user_settings()` - Get user settings

### Chat Operations
- `get_chat_history(limit)` - Get chat message history
- `create_chat_message(role, content)` - Create chat message

### Pomodoro Operations
- `get_pomodoros(task_id, start_date, end_date)` - Get pomodoro sessions
- `create_pomodoro(duration, completed, task_id)` - Create pomodoro session

## Authentication

All MCP tools require JWT authentication. The token is automatically added by the MCP client:

1. User authenticates via `/api/auth/credentials` and receives JWT token
2. Token is passed to Python agent in the request
3. Python agent creates MCP client with the token
4. MCP client adds token to all tool calls
5. MCP server verifies token and extracts userId

## Error Handling

```python
from services.mcp_client import get_mcp_client

try:
    mcp = get_mcp_client(jwt_token)
    tasks = mcp.get_tasks()
except Exception as e:
    # Handle authentication errors
    if "JWT verification failed" in str(e):
        print("Invalid or expired token")
    # Handle not found errors
    elif "not found" in str(e):
        print("Resource not found")
    # Handle other errors
    else:
        print(f"MCP error: {e}")
```

## Performance Considerations

1. **Connection Reuse**: The MCP client maintains a persistent connection to the MCP server
2. **Batch Operations**: For multiple operations, keep the same client instance
3. **Context Loading**: Consider loading context directly from DB for better performance
4. **Hybrid Approach**: Use direct DB for reads, MCP for writes

## Testing

Test the MCP integration:

```python
# test_mcp.py
import asyncio
from services.mcp_client import get_mcp_client

async def test_mcp():
    # Use a valid JWT token from your system
    jwt_token = "eyJhbGc..."

    mcp = get_mcp_client(jwt_token)

    # Test getting tasks
    tasks = mcp.get_tasks(completed=False)
    print(f"Found {len(tasks)} incomplete tasks")

    # Test creating a task
    new_task = mcp.create_task(
        title="Test task from MCP",
        priority="low"
    )
    print(f"Created task: {new_task['id']}")

    # Test updating the task
    updated = mcp.update_task(new_task['id'], completed=True)
    print(f"Updated task: {updated['completed']}")

    # Cleanup
    mcp.close()

if __name__ == "__main__":
    asyncio.run(test_mcp())
```

Run the test:
```bash
cd apps/agent-python
python test_mcp.py
```

## Debugging

Enable MCP server logging:

```bash
# In apps/mcp-server
pnpm dev  # Runs with live reload and error logging
```

Check MCP server stderr output for:
- Tool call requests
- Authentication failures
- Database errors
- Validation errors

## Migration Path

**Phase 1: Parallel Operation**
- Keep existing database service
- Add MCP client alongside
- Test MCP tools in isolation

**Phase 2: Selective Migration**
- Replace write operations with MCP calls
- Keep read operations as direct DB (performance)
- Monitor for issues

**Phase 3: Full Migration**
- Replace all database calls with MCP
- Remove direct database service
- Update all agent tools

**Phase 4: Optimization**
- Implement connection pooling
- Add caching layer
- Optimize frequent operations
