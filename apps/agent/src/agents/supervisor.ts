import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { AgentType } from '../types';
import { createLLM, getSystemPrompt } from '../utils/llm';
import { StateAnnotation } from '../types';

/**
 * The supervisor agent has two functions:
 * 1. Determine which specialized agent should handle the initial request
 * 2. After a specialized agent returns, determine if further actions are needed or if we can complete
 * 
 * This function manages the flow between specialized agents and completion of the conversation.
 */
export const determineAgent = async (state: typeof StateAnnotation.State): Promise<Partial<typeof StateAnnotation.State>> => {
  // If an agent has already processed the request and provided a response,
  // we're done and can exit the routing loop
  if (state.agentResponse) {
    console.log('[Supervisor] Agent response exists, completing workflow');
    // Set activeAgentType to null to signal completion
    // DO NOT clear agentResponse - it needs to be returned to the user
    return { activeAgentType: null };
  }

  // This is a new request or we need to route to a different agent
  // Prepare context for the supervisor agent
  const context = {
    task: state.task,
    user: state.user,
    input: state.input,
    message_count: state.messages.length,
    // Add information about what agents have already been involved
    previous_agents: state.messages
      .filter(msg => msg.additional_kwargs?.agentType)
      .map(msg => msg.additional_kwargs?.agentType)
  };

  // Create LLM
  const llm = createLLM('gpt-4o', 0.2);

  // Create a prompt template for agent classification
  const prompt = ChatPromptTemplate.fromMessages([
    ['system', getSystemPrompt('supervisor') + `

Based on the user's request, determine which specialized agent should handle it. Respond with only one of: "taskCreation", "planning", "executionCoach", "adaptation", or "analytics".

Here's when to choose each agent:

1. TaskCreation: For creating new tasks or refining existing tasks with metadata (description, tags, priority, due date).
   Examples: "Create a task to do yoga", "Refine 'apply OCI card' task"

2. Planning: For breaking down tasks, creating subtasks, or implementing specific coaching methodologies like "tiny experiments".
   Examples: "Break down this project", "How do I approach this task?"

3. ExecutionCoach: For motivation, emotional support, coaching advice, or wellbeing concerns.
   Examples: "I feel anxious, what to do?", "Help me stay motivated"

4. Adaptation: For modifying existing tasks' schedules, timelines, or parameters.
   Examples: "Reschedule 'buy fruits' task to tomorrow", "Change the priority of task X"

5. Analytics: For insights, metrics, or questions about task status, urgency, or patterns.
   Examples: "Which is my most urgent task?", "What tasks have I completed this week?"  
`],
    ['human', `User request: {input}

Context: {context}`],
  ]);

  // Format messages
  const formattedPrompt = await prompt.formatMessages({
    input: state.input,
    context: JSON.stringify(context, null, 2),
  });

  try {
    // Get response from LLM
    const response = await llm.invoke(formattedPrompt);
    const agentType = (response.content as string).toLowerCase().trim();

    console.log('=== SUPERVISOR ===');
    console.log('Routing to agent:', agentType);

    // Map text response to enum and update state
    let activeAgentType = AgentType.TaskCreation; // Default

    if (agentType.includes('taskcreation')) activeAgentType = AgentType.TaskCreation;
    else if (agentType.includes('planning')) activeAgentType = AgentType.Planning;
    else if (agentType.includes('execution') || agentType.includes('coach')) activeAgentType = AgentType.ExecutionCoach;
    else if (agentType.includes('adaptation')) activeAgentType = AgentType.Adaptation;
    else if (agentType.includes('analytics')) activeAgentType = AgentType.Analytics;

    console.log('Mapped to AgentType:', activeAgentType);

    // Return updated state with the active agent type
    return { activeAgentType };
  } catch (error) {
    console.error('Error in supervisor agent:', error);
    return { error: `Supervisor error: ${error instanceof Error ? error.message : String(error)}` };
  }
};

// The generateResponse function has been removed since specialized agents now return responses directly
