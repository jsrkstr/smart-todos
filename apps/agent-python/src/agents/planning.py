from typing import Dict, Any, List
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import AIMessage
from langchain.output_parsers import StructuredOutputParser, ResponseSchema
from ..types import State, AgentType, ActionItem
from ..utils.llm import create_llm, get_system_prompt


async def process_planning(state: State) -> Dict[str, Any]:
    """
    Process the user input with Planning agent.

    Args:
        state: Current state

    Returns:
        Dictionary of state updates
    """
    # Create LLM
    llm = create_llm('gpt-4o', 0.2)

    # Create parser for structured output
    response_schemas = [
        ResponseSchema(
            name="actions",
            description="Array of actions to take. Each action has 'type' (createSubtasks, updateTask, updateManyTasks, none) and 'payload' (any data)"
        ),
        ResponseSchema(
            name="reasoning",
            description="Your explanation of the breakdown or prioritization strategy"
        ),
        ResponseSchema(
            name="response",
            description="A concise, helpful response to the user explaining your actions and plans"
        )
    ]
    output_parser = StructuredOutputParser.from_response_schemas(response_schemas)

    # Prepare conversation history
    conversation_history = [
        msg for msg in state.messages
        if msg.type == 'human' or (
            msg.type == 'ai' and
            hasattr(msg, 'additional_kwargs') and
            msg.additional_kwargs.get('agentType') == AgentType.PLANNING.value
        )
    ]

    # Task and user context
    task_context = "No task provided"
    if state.task:
        task_context = f"""Task: {state.task.title}
Description: {state.task.description or 'None'}
Priority: {state.task.priority}
Deadline: {state.task.deadline or 'None'}"""

    user_context = "No user profile available"
    if state.user and state.user.psychProfile:
        user_context = f"""Productivity Time: {state.user.psychProfile.productivityTime or 'Not set'}
Task Approach: {state.user.psychProfile.taskApproach or 'Not set'}
Difficulty Preference: {state.user.psychProfile.difficultyPreference or 'Not set'}"""

    # Create prompt template
    prompt = ChatPromptTemplate.from_messages([
        ('system', get_system_prompt('planning') + """

Respond with a structured output containing actions, reasoning, and a concise user-friendly response."""),
        MessagesPlaceholder(variable_name='conversation_history'),
        ('human', f"""User request: {{input}}

Task Context:
{task_context}

User Context:
{user_context}

Provide a structured response with actions to take in JSON format. For task breakdown, create subtasks that can be completed in 10-15 minutes each. For prioritization, consider deadlines, importance, and user preferences. Include a concise, helpful response to the user explaining your actions and plans.

{{format_instructions}}""")
    ])

    # Create the chain
    chain = prompt | llm | output_parser

    # Execute the chain
    result = await chain.ainvoke({
        'input': state.input,
        'conversation_history': conversation_history,
        'format_instructions': output_parser.get_format_instructions()
    })

    updates = {'messages': []}

    # Record the agent's thought process as a message
    if result.get('reasoning'):
        updates['messages'].append(AIMessage(
            content=result['reasoning'],
            additional_kwargs={
                'agentType': AgentType.PLANNING.value,
                'name': 'reasoning'
            }
        ))

    # Store the actions for execution
    actions = result.get('actions', [])
    if isinstance(actions, list):
        action_items = []
        for action in actions:
            # Skip if action is a string or not a dict
            if not isinstance(action, dict):
                continue

            action_type = action.get('type')
            if action_type and action_type != 'none':
                payload = action.get('payload')
                # Ensure payload is a dict or None
                if payload is not None and not isinstance(payload, dict):
                    payload = None
                action_items.append(ActionItem(type=action_type, payload=payload))

        updates['actionItems'] = action_items

    # Create response for the user
    if result.get('response'):
        updates['agentResponse'] = result['response']
        updates['messages'].append(AIMessage(
            content=result['response'],
            additional_kwargs={'agentType': AgentType.PLANNING.value}
        ))

    return updates
