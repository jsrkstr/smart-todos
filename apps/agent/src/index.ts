import { StateAnnotation, AgentType } from './types';
import { createSupervisorGraph } from './graph';
import { HumanMessage } from '@langchain/core/messages';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Export types and graph for external use
export { StateAnnotation, AgentType } from './types';
export { createSupervisorGraph } from './graph';

/**
 * Process a user request through the SmartTodos multi-agent system
 * @param userId - The ID of the user making the request
 * @param input - The user's input message
 * @param context - Additional context (optional taskId, jwtToken, databaseUrl, etc.)
 * @returns Promise with the final state including agent response
 */
export async function processRequest(
  userId: string,
  input: string,
  context?: { taskId?: string; jwtToken?: string; modelName?: string; databaseUrl?: string }
): Promise<typeof StateAnnotation.State> {
  // Initialize state with user input and context
  const initialState: typeof StateAnnotation.State = {
    userId,
    jwtToken: context?.jwtToken || null,
    input,
    user: null,
    task: null,
    tasks: null,
    activeAgentType: AgentType.TaskCreation,
    context,
    messages: [new HumanMessage({ content: input })],
    summary: null,
    agentResponse: null,
    actionItems: [],
    error: null,
  };

  // Use userId + taskId as thread ID for conversation continuity
  // This ensures each task has its own conversation thread, and general chat has its own
  const threadId = context?.taskId ? `${userId}-${context.taskId}` : userId;
  const config = { configurable: { thread_id: threadId } };

  console.log('[Agent] Using thread_id:', threadId);

  // Create graph and process request
  const graph = await createSupervisorGraph(context?.databaseUrl);
  return await graph.invoke(initialState, config);
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
