from typing import Dict, Any
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import AIMessage
from langchain.output_parsers import StructuredOutputParser, ResponseSchema
from ..types import State, AgentType, ActionItem
from ..utils.llm import create_llm, get_system_prompt


async def process_execution_coach(state: State) -> Dict[str, Any]:
    """
    Process the user input with Execution Coach agent.

    Args:
        state: Current state

    Returns:
        Dictionary of state updates
    """
    # Create LLM with slightly higher temperature for creative coaching
    llm = create_llm('gpt-4o', 0.3)

    # Create parser for structured output
    response_schemas = [
        ResponseSchema(
            name="actions",
            description="Array of actions: updateTask, logActivity, scheduleReminder, provideMotivation, giveAdvice, askQuestion, none"
        ),
        ResponseSchema(
            name="motivationalMessage",
            description="A motivational message tailored to the user's current task and preferences"
        ),
        ResponseSchema(
            name="reasoning",
            description="Your explanation of the coaching approach"
        ),
        ResponseSchema(
            name="response",
            description="A concise, helpful response to the user that incorporates coaching elements and addresses their query"
        )
    ]
    output_parser = StructuredOutputParser.from_response_schemas(response_schemas)

    # Prepare conversation history
    conversation_history = [
        msg for msg in state.messages
        if msg.type == 'human' or (
            msg.type == 'ai' and
            hasattr(msg, 'additional_kwargs') and
            msg.additional_kwargs.get('agentType') == AgentType.EXECUTION_COACH.value
        )
    ]

    # Task context
    all_tasks = [state.task] if state.task else (state.tasks or [])
    task_context = "\n\nTasks:\n" + "\n".join([
        f"\n- TaskId: {task.id}\nTask: {task.title}\nDescription: {task.description or 'None'}\nPriority: {task.priority}\nStage: {task.stage or 'None'}\nStatus: {task.stageStatus or 'None'}\nDeadline: {task.deadline or 'None'}"
        for task in all_tasks
    ]) if all_tasks else "No tasks available"

    # Get coach info
    coach_info = "No coach assigned"
    if state.user and state.user.psychProfile and state.user.psychProfile.coach:
        coach = state.user.psychProfile.coach
        coach_info = f"""Coach: {coach.name}
Coaching Style: {coach.coachingStyle or 'balanced'}
Directness: {coach.directness or 50}/100
Encouragement Level: {coach.encouragementLevel or 70}/100"""

    # Create prompt template
    prompt = ChatPromptTemplate.from_messages([
        ('system', get_system_prompt('executionCoach') + """

Respond with a structured output containing actions, a motivational message, reasoning, and a concise user-friendly response."""),
        MessagesPlaceholder(variable_name='conversation_history'),
        ('human', f"""User request: {{input}}

Task Context:
{task_context}

Coach Information:
{coach_info}

Provide a structured response with actions to take in JSON format. Include a motivational message that matches the assigned coach's style and the user's preferences. Also include a complete response to the user addressing their query with coaching elements.

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

    # Record motivational message
    if result.get('motivationalMessage'):
        updates['messages'].append(AIMessage(
            content=result['motivationalMessage'],
            additional_kwargs={
                'agentType': AgentType.EXECUTION_COACH.value,
                'name': 'motivation'
            }
        ))

    # Record reasoning
    if result.get('reasoning'):
        updates['messages'].append(AIMessage(
            content=result['reasoning'],
            additional_kwargs={
                'agentType': AgentType.EXECUTION_COACH.value,
                'name': 'reasoning'
            }
        ))

    # Store the actions
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

    # Create response
    if result.get('response'):
        updates['agentResponse'] = result['response']
        updates['messages'].append(AIMessage(
            content=result['response'],
            additional_kwargs={'agentType': AgentType.EXECUTION_COACH.value}
        ))

    return updates
