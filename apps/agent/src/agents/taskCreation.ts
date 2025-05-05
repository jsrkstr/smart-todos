import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import { AgentType, ActionItem, ActionType, GraphState, Message } from '../types';
import { createLLM, getSystemPrompt } from '../utils/llm';
import { StructuredOutputParser } from 'langchain/output_parsers';
import { z } from 'zod';

// Process the user input with Task Creation agent
export const processTaskCreation = async (state: GraphState): Promise<ActionItem[]> => {
  // Create LLM
  const llm = createLLM('gpt-4o', 0.2);

  // Create parser for structured output
  const outputParser = StructuredOutputParser.fromZodSchema(
    z.object({
      actions: z.array(
        z.object({
          type: z.enum([
            'createTask',
            'updateTask',
            'searchTasks',
            'none'
          ]),
          payload: z.any()
        })
      ),
      reasoning: z.string().describe('Your explanation of the analysis and actions')
    })
  );

  // Prepare the conversation history
  const conversationHistory = state.messages.filter(msg => 
    msg.role === 'user' || 
    (msg.role === 'assistant' && msg.agentType === AgentType.TaskCreation)
  );

  // Create a prompt template 
  const prompt = ChatPromptTemplate.fromMessages([
    ['system', getSystemPrompt('taskCreation') + `\n\nRespond with a structured output containing actions and reasoning.`],
    new MessagesPlaceholder('conversation_history'),
    ['human', 'User request: {input}\n\nProvide a structured response with actions to take in JSON format. For task creation, include title, description, priority, and other relevant fields. {format_instructions}'],
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
      agentType: AgentType.TaskCreation,
      name: 'reasoning'
    });
  }

  return result.actions.filter((action: ActionItem) => action.type !== 'none');
};
