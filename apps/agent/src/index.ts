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
): Promise<GraphState> {
  // Initialize state with user input and context
  const initialState: GraphState = {
    userId,
    input,
    context,
    messages: [],
  };

  // Process the user request through the graph
  const { values } = await supervisorGraph.invoke(initialState);
  return values;
}

/**
 * Main function to demonstrate usage (for development/testing)
 */
async function main() {
  if (require.main !== module) return;

  // Example usage - substitute with actual values for testing
  const result = await processRequest(
    'cm9cmam9t0000tg5ibyifmfxi',
    'I need to create a task for finishing my presentation by Friday',
    { modelName: 'gpt-4o' }
  );

  console.log('Response:', result.agentResponse);
  console.log('State:', JSON.stringify(result, null, 2));
}

// Run main function if this file is executed directly
main().catch(console.error);
