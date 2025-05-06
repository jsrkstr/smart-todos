import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { AgentExecutor, createStructuredChatAgent } from 'langchain/agents';
import { GraphState, AgentType, Message } from '../types';
import { createLLM, getSystemPrompt } from '../utils/llm';

// Determine which agent should handle the user request
export const determineAgent = async (state: GraphState): Promise<AgentType> => {
  // Prepare context for the supervisor agent
  const context = {
    task: state.task,
    user: state.user,
    input: state.input,
  };

  // Create LLM
  const llm = createLLM('gpt-4o', 0.2);

  // Create a prompt template for agent classification
  const prompt = ChatPromptTemplate.fromMessages([
    ['system', getSystemPrompt('supervisor') + `\n\nBased on the user's request, determine which specialized agent should handle it. Respond with only one of: "taskCreation", "planning", "executionCoach", "adaptation", or "analytics".`],
    ['human', `User request: {input}\n\nContext: {context}`],
  ]);

  // Format messages
  const formattedPrompt = await prompt.formatMessages({
    input: state.input,
    context: JSON.stringify(context, null, 2),
  });

  // Get response from LLM
  const response = await llm.invoke(formattedPrompt);
  const agentType = (response.content as string).toLowerCase().trim();

  // Map text response to enum
  if (agentType.includes('taskcreation')) return AgentType.TaskCreation;
  if (agentType.includes('planning')) return AgentType.Planning;
  if (agentType.includes('execution') || agentType.includes('coach')) return AgentType.ExecutionCoach;
  if (agentType.includes('adaptation')) return AgentType.Adaptation;
  if (agentType.includes('analytics')) return AgentType.Analytics;

  // Default to TaskCreation if no clear match
  return AgentType.TaskCreation;
};

// Generate a final response with the Supervisor agent
export const generateResponse = async (state: GraphState): Promise<string> => {
  // Create LLM
  const llm = createLLM('gpt-4o', 0.7);
  
  // Prepare the conversation history
  const conversationHistory = state.messages.map((msg) => {
    return {
      role: msg.role as any,
      content: msg.content
    };
  });

  // Add any relevant context about the task and user
  const userContext = state.user ? 
    `User: ${state.user.name || 'Unknown'}, ${state.user.psychProfile?.coach ? `Coach: ${state.user.psychProfile.coach.name}` : 'No coach assigned'}` : 
    'No user context available';

  const taskContext = state.task ? 
    `Current task: ${state.task.title}, Priority: ${state.task.priority}, Stage: ${state.task.stage}` : 
    'No specific task in context';

  // Create a prompt template for generating the final response
  const prompt = ChatPromptTemplate.fromMessages([
    ['system', getSystemPrompt('supervisor') + `\n\nYou are generating the final response to the user. Make it helpful, supportive, and actionable. Maintain a consistent tone aligned with the user's coach and preferences.\n\nUser Context: ${userContext}\nTask Context: ${taskContext}`],
    new MessagesPlaceholder('conversation_history'),
    ['human', 'Generate a final response based on the conversation history and the completed actions.']
  ]);

  // Format messages
  const formattedPrompt = await prompt.formatMessages({
    conversation_history: conversationHistory
  });

  // Get response from LLM
  const response = await llm.invoke(formattedPrompt);
  
  return response.content as string;
};
