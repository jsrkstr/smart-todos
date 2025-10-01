from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from typing import Dict, Any
from ..types import State, AgentType
from ..utils.llm import create_llm, get_system_prompt


async def determine_agent(state: State) -> Dict[str, Any]:
    """
    Determine which specialized agent should handle the user's request.

    Args:
        state: Current state

    Returns:
        Dictionary with activeAgentType update
    """
    # Create LLM
    llm = create_llm('gpt-4o', 0.2)

    # Get the user's input
    user_input = state.input

    # Check if we already have a response (agent completed its work)
    if state.agentResponse:
        return {'activeAgentType': None}

    # Create prompt for agent classification
    prompt = ChatPromptTemplate.from_messages([
        ('system', get_system_prompt('supervisor')),
        ('human', """Based on the user's request below, determine which specialized agent should handle it.

User request: {input}

Available agents:
- TaskCreation: For creating new tasks from natural language
- Planning: For breaking down tasks into subtasks or prioritizing tasks
- ExecutionCoach: For motivation, progress tracking, and guidance during task execution
- Adaptation: For adjusting plans or strategies when things change
- Analytics: For analyzing patterns and providing insights about productivity

Respond with ONLY the agent name (TaskCreation, Planning, ExecutionCoach, Adaptation, or Analytics).""")
    ])

    # Create chain
    chain = prompt | llm | StrOutputParser()

    # Invoke the chain
    result = await chain.ainvoke({'input': user_input})

    # Map result to AgentType
    agent_mapping = {
        'TaskCreation': AgentType.TASK_CREATION,
        'Planning': AgentType.PLANNING,
        'ExecutionCoach': AgentType.EXECUTION_COACH,
        'Adaptation': AgentType.ADAPTATION,
        'Analytics': AgentType.ANALYTICS,
    }

    agent_type = agent_mapping.get(result.strip(), AgentType.TASK_CREATION)

    return {'activeAgentType': agent_type}
