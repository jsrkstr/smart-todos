import os
from typing import Dict, Any
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.postgres import PostgresSaver
from langchain_core.messages import HumanMessage, AIMessage, RemoveMessage
from .types import State, AgentType
from .agents.supervisor import determine_agent
from .agents.task_creation import process_task_creation
from .agents.planning import process_planning
from .agents.execution_coach import process_execution_coach
from .agents.adaptation import process_adaptation
from .agents.analytics import process_analytics
from .services.database import UserService, TaskService
from .utils.llm import create_llm
from dotenv import load_dotenv

load_dotenv()


async def load_context_node(state: State) -> Dict[str, Any]:
    """Load user profile and optionally task context based on what's needed."""
    print(f"🔵 [loadContext] Starting - userId={state.userId}")
    updates = {}

    try:
        # Always load user profile (lightweight)
        if state.userId:
            user_data = await UserService.get_user_with_profile(state.userId)
            if user_data:
                from .types import User
                updates['user'] = User(**user_data)
                coach_name = user_data.get('psychProfile', {}).get('coach', {}).get('name', 'None')
                print(f"✅ [loadContext] User profile loaded - coach={coach_name}")

        # Load specific task if taskId is provided
        if state.context and state.context.taskId and state.userId:
            task_data = await TaskService.get_task(state.context.taskId, state.userId)
            if task_data:
                from .types import Task
                updates['task'] = Task(**task_data)
                print(f"✅ [loadContext] Specific task loaded - title={task_data.get('title')}")

        print(f"✅ [loadContext] Complete - user={bool(updates.get('user'))}, task={bool(updates.get('task'))}")

    except Exception as error:
        print(f"❌ [loadContext] Error: {error}")
        import traceback
        traceback.print_exc()
        updates['error'] = f"Failed to load context: {error}"

    return updates


async def load_tasks_node(state: State) -> Dict[str, Any]:
    """Load all tasks for agents that need them."""
    print(f"🔵 [loadTasks] Starting - userId={state.userId}")
    updates = {}

    try:
        if state.userId:
            tasks_data = await TaskService.get_tasks(state.userId)
            if tasks_data:
                from .types import Task
                updates['tasks'] = [Task(**task) for task in tasks_data]
                completed = sum(1 for t in tasks_data if t.get('completed'))
                print(f"✅ [loadTasks] Loaded {len(tasks_data)} tasks ({completed} completed)")

    except Exception as error:
        print(f"❌ [loadTasks] Error: {error}")
        updates['error'] = f"Failed to load tasks: {error}"

    return updates


async def generate_summary_node(state: State) -> Dict[str, Any]:
    """Generate a summary of the conversation when it gets too long."""
    print(f"🔵 [generateSummary] Starting - message_count={len(state.messages)}")
    updates = {}
    summary = state.summary
    conversation_history = ' '.join([msg.content for msg in state.messages])

    try:
        if summary:
            prompt = f"This is summary of the conversation to date: \n{summary}\n\n Extend the summary by taking into account the new messages below: \n{conversation_history}"
        else:
            prompt = f"Create a summary of the conversation below: \n{conversation_history}"

        llm = create_llm('gpt-4o-mini', 0.2)
        response = await llm.ainvoke(prompt)
        updates['summary'] = response.content

        # Remove old messages, keep only last 2
        messages_to_remove = [
            RemoveMessage(id=msg.id)
            for msg in state.messages[:-2]
            if msg.id
        ]
        updates['messages'] = messages_to_remove
        print(f"✅ [generateSummary] Complete - removed {len(messages_to_remove)} old messages")

    except Exception as error:
        print(f"❌ [generateSummary] Error: {error}")
        updates['error'] = f"Failed to generate summary: {error}"

    return updates


async def determine_agent_node(state: State) -> Dict[str, Any]:
    """Determine which specialized agent should handle the request."""
    print(f"🔵 [determineAgent] Starting - input='{state.input[:50]}...'")
    try:
        result = await determine_agent(state)
        agent_type = result.get('activeAgentType')
        print(f"✅ [determineAgent] Routing to: {agent_type.value if agent_type else 'None'}")
        return result
    except Exception as error:
        print(f"❌ [determineAgent] Error: {error}")
        return {
            'error': f"Failed to determine agent: {error}",
            'activeAgentType': AgentType.TASK_CREATION
        }


async def task_creation_agent_node(state: State) -> Dict[str, Any]:
    """Task creation agent node."""
    print(f"🟢 [taskCreationAgent] Starting")
    try:
        result = await process_task_creation(state, {})
        print(f"✅ [taskCreationAgent] Complete - response length={len(result.get('agentResponse', ''))}")
        return result
    except Exception as error:
        print(f"❌ [taskCreationAgent] Error: {error}")
        return {'error': f"Task creation agent error: {error}"}


async def planning_agent_node(state: State) -> Dict[str, Any]:
    """Planning agent node."""
    print(f"🟢 [planningAgent] Starting")
    try:
        result = await process_planning(state)
        print(f"✅ [planningAgent] Complete - actions={len(result.get('actionItems', []))}")
        return result
    except Exception as error:
        print(f"❌ [planningAgent] Error: {error}")
        return {'error': f"Planning agent error: {error}"}


async def execution_coach_agent_node(state: State) -> Dict[str, Any]:
    """Execution coach agent node."""
    print(f"🟢 [executionCoachAgent] Starting")
    try:
        result = await process_execution_coach(state)
        print(f"✅ [executionCoachAgent] Complete - actions={len(result.get('actionItems', []))}")
        return result
    except Exception as error:
        print(f"❌ [executionCoachAgent] Error: {error}")
        return {'error': f"Execution coach agent error: {error}"}


async def adaptation_agent_node(state: State) -> Dict[str, Any]:
    """Adaptation agent node."""
    print(f"🟢 [adaptationAgent] Starting")
    try:
        result = await process_adaptation(state)
        print(f"✅ [adaptationAgent] Complete - actions={len(result.get('actionItems', []))}")
        return result
    except Exception as error:
        print(f"❌ [adaptationAgent] Error: {error}")
        return {'error': f"Adaptation agent error: {error}"}


async def analytics_agent_node(state: State) -> Dict[str, Any]:
    """Analytics agent node."""
    print(f"🟢 [analyticsAgent] Starting")
    try:
        result = await process_analytics(state)
        print(f"✅ [analyticsAgent] Complete - actions={len(result.get('actionItems', []))}")
        return result
    except Exception as error:
        print(f"❌ [analyticsAgent] Error: {error}")
        return {'error': f"Analytics agent error: {error}"}


def route_to_load_tasks(state: State) -> str:
    """Determine if we need to load tasks before going to the agent."""
    # If no active agent type is set, end
    if state.activeAgentType is None:
        print(f"🔀 [route_to_load_tasks] No agent type set → END")
        return END

    # Agents that need tasks list
    agents_needing_tasks = {
        AgentType.ANALYTICS,
        AgentType.PLANNING,
        AgentType.EXECUTION_COACH,
    }

    # If agent needs tasks and we don't have them, load tasks first
    if state.activeAgentType in agents_needing_tasks and not state.tasks:
        print(f"🔀 [route_to_load_tasks] Agent needs tasks → loadTasks")
        return 'loadTasks'

    # Otherwise go directly to the agent
    agent_routes = {
        AgentType.TASK_CREATION: 'taskCreationAgent',
        AgentType.PLANNING: 'planningAgent',
        AgentType.EXECUTION_COACH: 'executionCoachAgent',
        AgentType.ADAPTATION: 'adaptationAgent',
        AgentType.ANALYTICS: 'analyticsAgent',
    }

    route = agent_routes.get(state.activeAgentType, 'taskCreationAgent')
    print(f"🔀 [route_to_load_tasks] Routing to → {route}")
    return route


def route_from_load_tasks(state: State) -> str:
    """Route from loadTasks to the appropriate agent."""
    agent_routes = {
        AgentType.TASK_CREATION: 'taskCreationAgent',
        AgentType.PLANNING: 'planningAgent',
        AgentType.EXECUTION_COACH: 'executionCoachAgent',
        AgentType.ADAPTATION: 'adaptationAgent',
        AgentType.ANALYTICS: 'analyticsAgent',
    }

    route = agent_routes.get(state.activeAgentType, 'taskCreationAgent')
    print(f"🔀 [route_from_load_tasks] Routing to → {route}")
    return route


def route_agent(state: State) -> str:
    """Route after agent completes."""
    # If we have a response, end the conversation
    if state.agentResponse:
        # Generate a summary if conversation is getting long
        if len(state.messages) > 6:
            print(f"🔀 [route_agent] Message count high ({len(state.messages)}) → generateSummary")
            return 'generateSummary'
        print(f"🔀 [route_agent] Agent complete → END")
        return END

    print(f"🔀 [route_agent] No response → END")
    return END


def create_supervisor_graph():
    """
    Create and compile the supervisor graph.

    Returns:
        Compiled graph with checkpointer
    """
    print("🔧 [create_supervisor_graph] Initializing graph...")

    # Initialize PostgreSQL checkpointer
    conn_string = f"postgresql://{os.getenv('POSTGRES_USER')}:{os.getenv('POSTGRES_PASSWORD')}@{os.getenv('POSTGRES_HOST')}:5432/{os.getenv('POSTGRES_DATABASE')}?sslmode=require"

    # Setup the database schema (one-time setup)
    with PostgresSaver.from_conn_string(conn_string) as setup_saver:
        setup_saver.setup()

    # Initialize the graph
    graph_builder = StateGraph(State)

    # Add nodes
    graph_builder.add_node('loadContext', load_context_node)
    graph_builder.add_node('loadTasks', load_tasks_node)
    graph_builder.add_node('generateSummary', generate_summary_node)
    graph_builder.add_node('determineAgent', determine_agent_node)
    graph_builder.add_node('taskCreationAgent', task_creation_agent_node)
    graph_builder.add_node('planningAgent', planning_agent_node)
    graph_builder.add_node('executionCoachAgent', execution_coach_agent_node)
    graph_builder.add_node('adaptationAgent', adaptation_agent_node)
    graph_builder.add_node('analyticsAgent', analytics_agent_node)

    # Define edges
    graph_builder.add_edge(START, 'loadContext')
    graph_builder.add_edge('loadContext', 'determineAgent')

    # Conditional edge from determineAgent - may go to loadTasks or directly to agent
    graph_builder.add_conditional_edges(
        'determineAgent',
        route_to_load_tasks
    )

    # After loading tasks, route to the appropriate agent
    graph_builder.add_conditional_edges(
        'loadTasks',
        route_from_load_tasks
    )

    # Specialized agents go directly to END after completing
    graph_builder.add_edge('taskCreationAgent', END)
    graph_builder.add_edge('planningAgent', END)
    graph_builder.add_edge('executionCoachAgent', END)
    graph_builder.add_edge('adaptationAgent', END)
    graph_builder.add_edge('analyticsAgent', END)

    # Summary generation leads to end
    graph_builder.add_edge('generateSummary', END)

    # Compile the graph without checkpointer for now (simpler)
    return graph_builder.compile()
