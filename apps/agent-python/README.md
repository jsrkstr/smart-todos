# SmartTodos Python Agent

Python-based LangGraph multi-agent system for SmartTodos task management.

## Overview

This is a Python port of the TypeScript LangGraph agent system, featuring:

- **Multi-agent supervisor pattern** with 5 specialized agents:
  - Task Creation Agent: Create structured tasks from natural language
  - Planning Agent: Break down tasks and prioritize work
  - Execution Coach Agent: Provide motivation and guidance
  - Adaptation Agent: Adjust strategies when circumstances change
  - Analytics Agent: Analyze patterns and provide insights

- **StateGraph** architecture with PostgreSQL persistence
- **Tool calling** for task CRUD operations
- **Message history management** with automatic summarization
- **Context loading** (user profiles, tasks, psychological profiles)

## Installation

1. Install dependencies:
```bash
cd apps/agent-python
pip install -r requirements.txt
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your credentials
```

Required environment variables:
- `OPENAI_API_KEY`: Your OpenAI API key
- `POSTGRES_USER`: PostgreSQL username
- `POSTGRES_PASSWORD`: PostgreSQL password
- `POSTGRES_HOST`: PostgreSQL host
- `POSTGRES_DATABASE`: PostgreSQL database name

## Project Structure

```
src/
  agents/
    supervisor.py          # Routes requests to specialized agents
    task_creation.py       # Creates tasks from natural language
    planning.py            # Breaks down and prioritizes tasks
    execution_coach.py     # Provides motivation and guidance
    adaptation.py          # Adjusts strategies
    analytics.py           # Analyzes patterns
  services/
    database.py            # Database service layer (PostgreSQL)
  utils/
    llm.py                 # LLM utilities and system prompts
    actions.py             # Action execution logic
    task_tools.py          # Tool definitions for task operations
    pg_store.py            # PostgreSQL store for LangGraph
  types/
    state.py               # State management with Pydantic
    enums.py               # Agent and action type enums
  graph.py                 # Main supervisor graph
  index.py                 # Entry point
```

## Usage

### As a module

```python
from src.index import process_request

response = await process_request(
    user_id="user-123",
    message="Create a task to finish the project report by Friday",
    thread_id="thread-456",
    task_id=None  # Optional: specify if request is about a specific task
)

print(response['response'])
```

### Running the test

```bash
cd apps/agent-python
python -m src.index
```

## Integration with Next.js

The Python agent can be called from the Next.js API:

1. Run the Python agent as a separate service (e.g., FastAPI server)
2. Call it from Next.js API routes
3. Share the same PostgreSQL database for conversation persistence

## Agent Workflow

1. **Load Context**: Fetch user profile and tasks from database
2. **Determine Agent**: Supervisor classifies the request and routes to appropriate specialized agent
3. **Process Request**: Specialized agent processes the request using LLM and tools
4. **Execute Actions**: Actions are executed (create/update tasks, log activities, etc.)
5. **Generate Summary**: If conversation gets long, create a summary and clean up old messages
6. **Return Response**: Return agent's response to the user

## Database Schema

Uses the existing Prisma schema from the Next.js app. Key tables:
- `User`: User accounts and authentication
- `PsychProfile`: User psychological profiles and preferences
- `Task`: Tasks with priorities, deadlines, and subtasks
- `Coach`: Coaching personalities
- `ChatMessage`: Conversation history
- `langgraph.*`: LangGraph checkpointer and store tables

## Key Differences from TypeScript Version

1. **Type System**: Uses Pydantic models instead of TypeScript interfaces
2. **Async/Await**: Python async syntax
3. **Database**: Direct psycopg2 instead of Prisma (could be switched to Prisma Client Python)
4. **Output Parsing**: Uses LangChain's StructuredOutputParser with ResponseSchema
5. **Message Handling**: Uses LangChain Python message classes

## Development

### Adding a new agent

1. Create agent file in `src/agents/`
2. Define processing function with structured output
3. Add agent type to `AgentType` enum
4. Update supervisor routing logic
5. Add node to graph in `graph.py`

### Adding new tools

1. Define tool schemas in `src/utils/task_tools.py`
2. Implement tool functions
3. Add to `create_task_tools()` function
4. Tools are automatically available to agent executor

## Debugging

### Console Logging

The agent system includes comprehensive console logging with emojis for easy tracking:

**Example output:**
```
🚀 [process_request] Starting new request
   User: cm9cmam9...
   Message: 'How many tasks do I have?'
   Thread: thread-123
   TaskId: None

🔵 [loadContext] Starting - userId=cm9cmam9t0000tg5ibyifmfxi
✅ [loadContext] User profile loaded - coach=Marcus Aurelius
✅ [loadContext] Complete - user=True, task=False

🔵 [determineAgent] Starting - input='How many tasks do I have?...'
✅ [determineAgent] Routing to: Analytics

🔀 [route_to_load_tasks] Agent needs tasks → loadTasks

🔵 [loadTasks] Starting - userId=cm9cmam9t0000tg5ibyifmfxi
✅ [loadTasks] Loaded 5 tasks (2 completed)

🔀 [route_from_load_tasks] Routing to → analyticsAgent

🟢 [analyticsAgent] Starting
✅ [analyticsAgent] Complete - actions=1

✅ [process_request] Request complete
   Response length: 142
   Error: None
```

**Legend:**
- 🚀 Entry/Exit points
- 🔵 Node execution start
- ✅ Successful completion
- ❌ Errors
- 🔀 Routing decisions
- 🟢 Agent processing

### LangSmith (Recommended)

For visual debugging and tracing, use LangSmith:

1. Get API key from https://smith.langchain.com/
2. Add to `.env`:
```bash
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=your_langsmith_api_key
LANGCHAIN_PROJECT=smart-todos-agent
```

3. View traces at https://smith.langchain.com/

**LangSmith provides:**
- Visual graph execution flow
- Input/output inspection for each node
- Token usage tracking
- Latency measurements
- Error traces with full context
- Comparison between runs

## Troubleshooting

### Connection issues
- Verify PostgreSQL credentials in `.env`
- Ensure PostgreSQL allows SSL connections
- Check that `langgraph` schema exists

### Import errors
- Ensure all dependencies are installed: `pip install -r requirements.txt`
- Check Python version (3.9+)

### LLM errors
- Verify `OPENAI_API_KEY` is set correctly
- Check OpenAI API rate limits and quotas

### Debugging tips
- Check console logs for emoji markers to trace execution flow
- Use LangSmith for detailed traces
- Look for 🔀 routing decisions to understand agent selection
- Check 🔵/✅ pairs to identify where nodes fail
