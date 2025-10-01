from typing import Dict, Any
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import AIMessage
from langchain.output_parsers import StructuredOutputParser, ResponseSchema
from ..types import State, AgentType, ActionItem
from ..utils.llm import create_llm, get_system_prompt


async def process_adaptation(state: State) -> Dict[str, Any]:
    """
    Process the user input with Adaptation agent.

    Args:
        state: Current state

    Returns:
        Dictionary of state updates
    """
    # Create LLM with higher temperature for creative adaptations
    llm = create_llm('gpt-4o', 0.4)

    # Create parser for structured output
    response_schemas = [
        ResponseSchema(
            name="actions",
            description="Array of actions: updateTask, updateManyTasks, logActivity, none"
        ),
        ResponseSchema(
            name="adaptationStrategy",
            description="The strategy you recommend for adapting the task or plan"
        ),
        ResponseSchema(
            name="reasoning",
            description="Your explanation of why adaptation is needed and how it will help"
        ),
        ResponseSchema(
            name="response",
            description="A concise, helpful response to the user explaining the adaptation strategy and changes"
        )
    ]
    output_parser = StructuredOutputParser.from_response_schemas(response_schemas)

    # Prepare conversation history
    conversation_history = [
        msg for msg in state.messages
        if msg.type == 'human' or (
            msg.type == 'ai' and
            hasattr(msg, 'additional_kwargs') and
            msg.additional_kwargs.get('agentType') == AgentType.ADAPTATION.value
        )
    ]

    # Task context
    task_context = "No task provided"
    if state.task:
        task_context = f"""Task: {state.task.title}
Description: {state.task.description or 'None'}
Priority: {state.task.priority}
Stage: {state.task.stage or 'None'}
Status: {state.task.stageStatus or 'None'}
Deadline: {state.task.deadline or 'None'}"""

    # Create prompt template
    prompt = ChatPromptTemplate.from_messages([
        ('system', get_system_prompt('adaptation') + """

Respond with a structured output containing actions, an adaptation strategy, reasoning, and a concise user-friendly response."""),
        MessagesPlaceholder(variable_name='conversation_history'),
        ('human', f"""User request: {{input}}

Task Context:
{task_context}

Analyze if the current task/plan needs adaptation. Consider if the approach should be modified, if timelines need adjustment, or if goals need to be recalibrated. Provide a structured response with actions to take in JSON format. Include a concise, helpful response to the user explaining the adaptation strategy and changes.

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

    # Record adaptation strategy
    if result.get('adaptationStrategy'):
        updates['messages'].append(AIMessage(
            content=result['adaptationStrategy'],
            additional_kwargs={
                'agentType': AgentType.ADAPTATION.value,
                'name': 'adaptation'
            }
        ))

    # Record reasoning
    if result.get('reasoning'):
        updates['messages'].append(AIMessage(
            content=result['reasoning'],
            additional_kwargs={
                'agentType': AgentType.ADAPTATION.value,
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
            additional_kwargs={'agentType': AgentType.ADAPTATION.value}
        ))

    return updates
