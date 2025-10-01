from typing import Dict, Any
from langchain.agents import create_tool_calling_agent, AgentExecutor
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import AIMessage
from ..types import State, AgentType
from ..utils.llm import create_llm, get_system_prompt
from ..utils.task_tools import create_task_tools


async def process_task_creation(state: State, config: Dict[str, Any]) -> Dict[str, Any]:
    """
    Process the user input with Task Creation agent.

    Args:
        state: Current state
        config: Configuration dictionary

    Returns:
        Dictionary of state updates
    """
    # Create LLM
    llm = create_llm('gpt-4o', 0.2)

    # Create tools with context
    context = {'userId': state.userId}
    tools = create_task_tools(context)

    # Prepare conversation history
    conversation_history = [
        msg for msg in state.messages
        if msg.type == 'human' or (
            msg.type == 'ai' and
            hasattr(msg, 'additional_kwargs') and
            msg.additional_kwargs.get('agentType') == AgentType.TASK_CREATION.value
        )
    ]

    # Task and user context
    task_context = ""
    if state.task:
        task_context = f"""Task: {state.task.title}
Description: {state.task.description or 'None'}
Priority: {state.task.priority}
Deadline: {state.task.deadline or 'None'}"""
    else:
        task_context = "No task provided"

    user_context = ""
    if state.user and state.user.psychProfile:
        user_context = f"""Productivity Time: {state.user.psychProfile.productivityTime or 'Not set'}
Task Approach: {state.user.psychProfile.taskApproach or 'Not set'}
Difficulty Preference: {state.user.psychProfile.difficultyPreference or 'Not set'}"""
    else:
        user_context = "No user profile available"

    # Create prompt template
    prompt = ChatPromptTemplate.from_messages([
        ('system', get_system_prompt('taskCreation') + f"""

Task Context:
{task_context}

User Context:
{user_context}

Use the provided tools to create tasks as needed. Be thorough in extracting all relevant details from the user's request."""),
        MessagesPlaceholder(variable_name='conversation_history'),
        ('human', '{input}'),
        MessagesPlaceholder(variable_name='agent_scratchpad'),
    ])

    # Create the agent
    agent = create_tool_calling_agent(llm, tools, prompt)
    agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True)

    # Execute the agent
    result = await agent_executor.ainvoke({
        'input': state.input,
        'conversation_history': conversation_history
    })

    # Extract the response
    agent_response = result.get('output', '')

    updates = {
        'agentResponse': agent_response,
        'messages': [
            AIMessage(
                content=agent_response,
                additional_kwargs={'agentType': AgentType.TASK_CREATION.value}
            )
        ]
    }

    return updates
