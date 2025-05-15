import { StateAnnotation } from './consts';
import { createSupervisorGraph } from './graph';
import { GraphState, AgentType } from './types';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create and export the supervisor graph
export const supervisorGraph = createSupervisorGraph();

/**
 * Process a user request through the SmartTodos multi-agent system
 * @param userId - The ID of the user making the request
 * @param input - The user's input message
 * @param context - Additional context (optional taskId, etc.)
 * @returns Promise with the final state including agent response
 */
export async function processRequest(
  userId: string,
  input: string,
  context?: { taskId?: string; modelName?: string }
): Promise<typeof StateAnnotation.State> {
  // Initialize state with user input and context
  const initialState: typeof StateAnnotation.State = {
    userId,
    input,
    user: null,
    task: null,
    tasks: null,
    activeAgentType: AgentType.TaskCreation,
    context,
    messages: [],
    summary: null,
    agentResponse: null,
    actionItems: [],
    error: null,
  };

  const config = { configurable: { thread_id: "2" } };

  // await graph.invoke({
  //   messages: [{
  //     role: "user",
  //     content: "what's the weather in sf"
  //   }],
  // }, config);

  // Process the user request through the graph
  return await (await supervisorGraph).invoke(initialState, config);
}

/**
 * Main function to demonstrate usage (for development/testing)
 */
async function main() {
  if (require.main !== module) return;

  // Example usage - substitute with actual values for testing
  const result = await processRequest(
    'cm9cmam9t0000tg5ibyifmfxi',
    'what is this task about?',
    // 'I need to create a task for finishing my presentation by Friday',
    { taskId: 'cm9u6cat20014tgi9fdotptt3' }
    // { modelName: 'gpt-4o' }
  );

  console.log('Response:', result.agentResponse);
  console.log('State:', JSON.stringify(result, null, 2));
}

// Run main function if this file is executed directly
main().catch(console.error);
