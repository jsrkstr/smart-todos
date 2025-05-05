import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import { AgentType, ActionItem, ActionType, GraphState, Message } from '../types';
import { createLLM, getSystemPrompt } from '../utils/llm';
import { StructuredOutputParser } from 'langchain/output_parsers';
import { z } from 'zod';

// Process the user input with Planning agent
export const processPlanning = async (state: GraphState): Promise<ActionItem[]> => {
  // Create LLM
  const llm = createLLM('gpt-4o', 0.2);

  // Create parser for structured output
  const outputParser = StructuredOutputParser.fromZodSchema(
    z.object({
      actions: z.array(
        z.object({
          type: z.enum([
            'createSubtasks',
            'updateTask',
            'updateManyTasks',
            'none'
          ]),
          payload: z.any()
        })
      ),
      reasoning: z.string().describe('Your explanation of the breakdown or prioritization strategy')
    })
  );

  // Prepare the conversation history
  const conversationHistory = state.messages.filter(msg => 
    msg.role === 'user' || 
    (msg.role === 'assistant' && msg.agentType === AgentType.Planning)
  );

  // Task and user context
  const taskContext = state.task ? 
    `Task: ${state.task.title}\nDescription: ${state.task.description || 'None'}\nPriority: ${state.task.priority}\nDeadline: ${state.task.deadline ? new Date(state.task.deadline).toISOString() : 'None'}` : 
    'No task provided';

  const userContext = state.user?.psychProfile ? 
    `Productivity Time: ${state.user.psychProfile.productivityTime}\nTask Approach: ${state.user.psychProfile.taskApproach}\nDifficulty Preference: ${state.user.psychProfile.difficultyPreference}` :
    'No user profile available';

  // Create a prompt template
  const prompt = ChatPromptTemplate.fromMessages([
    ['system', getSystemPrompt('planning') + `\n\nRespond with a structured output containing actions and reasoning.`],
    new MessagesPlaceholder('conversation_history'),
    ['human', `User request: {input}\n\nTask Context:\n${taskContext}\n\nUser Context:\n${userContext}\n\nProvide a structured response with actions to take in JSON format. For task breakdown, create subtasks that can be completed in 10-15 minutes each. For prioritization, consider deadlines, importance, and user preferences. {format_instructions}`],
  ]);

  // Create the chain
  const chain = RunnableSequence.from([
    {
      input: (state: GraphState) => state.input,
      conversation_history: (state: GraphState) => conversationHistory,
      format_instructions: async () => outputParser.getFormatInstructions()
    },
    prompt,
    llm,
    outputParser
  ]);

  // Execute the chain
  const result = await chain.invoke(state);

  // Record the agent's thought process as a message
  if (result.reasoning) {
    state.messages.push({
      role: 'assistant',
      content: result.reasoning,
      agentType: AgentType.Planning,
      name: 'reasoning'
    });
  }

  return result.actions.filter((action: ActionItem) => action.type !== 'none');
};
