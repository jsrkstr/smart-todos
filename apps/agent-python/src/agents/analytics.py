from typing import Dict, Any
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import AIMessage
from langchain.output_parsers import StructuredOutputParser, ResponseSchema
from ..types import State, AgentType, ActionItem
from ..utils.llm import create_llm, get_system_prompt


async def process_analytics(state: State) -> Dict[str, Any]:
    """
    Process the user input with Analytics agent.

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
            description="Array of actions: logActivity, none"
        ),
        ResponseSchema(
            name="insights",
            description="Array of key insights derived from analyzing task patterns and performance"
        ),
        ResponseSchema(
            name="recommendations",
            description="Array of specific recommendations for improving productivity or task management"
        ),
        ResponseSchema(
            name="reasoning",
            description="Your analytical process and methodology"
        ),
        ResponseSchema(
            name="response",
            description="A concise, helpful response to the user summarizing the key insights and recommendations"
        )
    ]
    output_parser = StructuredOutputParser.from_response_schemas(response_schemas)

    # Prepare conversation history
    conversation_history = [
        msg for msg in state.messages
        if msg.type == 'human' or (
            msg.type == 'ai' and
            hasattr(msg, 'additional_kwargs') and
            msg.additional_kwargs.get('agentType') == AgentType.ANALYTICS.value
        )
    ]

    # Tasks context
    tasks_context = "No tasks available"
    if state.tasks and len(state.tasks) > 0:
        tasks_context = f"User has {len(state.tasks)} tasks.\n" + "\n\n".join([
            f"Task {idx+1}: {task.title}\nStatus: {'Completed' if task.completed else 'Not Completed'}\nPriority: {task.priority}\nStage: {task.stage or 'None'}"
            for idx, task in enumerate(state.tasks)
        ])

    # Create prompt template
    prompt = ChatPromptTemplate.from_messages([
        ('system', get_system_prompt('analytics') + """

Respond with a structured output containing actions, insights, recommendations, reasoning, and a concise user-friendly response."""),
        MessagesPlaceholder(variable_name='conversation_history'),
        ('human', f"""User request: {{input}}

Tasks Context:
{tasks_context}

Analyze the user's task patterns and performance. Look for trends in completion rates, task types, and productivity patterns. Provide a structured response with insights, recommendations, and any actions to take in JSON format. Include a concise user-friendly response summarizing the key insights and recommendations.

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

    # Record insights
    if result.get('insights') and len(result['insights']) > 0:
        insights_text = "Key Insights:\n" + "\n".join([f"- {insight}" for insight in result['insights']])
        updates['messages'].append(AIMessage(
            content=insights_text,
            additional_kwargs={
                'agentType': AgentType.ANALYTICS.value,
                'name': 'insights'
            }
        ))

    # Record recommendations
    if result.get('recommendations') and len(result['recommendations']) > 0:
        recommendations_text = "Recommendations:\n" + "\n".join([f"- {rec}" for rec in result['recommendations']])
        updates['messages'].append(AIMessage(
            content=recommendations_text,
            additional_kwargs={
                'agentType': AgentType.ANALYTICS.value,
                'name': 'recommendations'
            }
        ))

    # Record reasoning
    if result.get('reasoning'):
        updates['messages'].append(AIMessage(
            content=result['reasoning'],
            additional_kwargs={
                'agentType': AgentType.ANALYTICS.value,
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
            additional_kwargs={'agentType': AgentType.ANALYTICS.value}
        ))

    return updates
