import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import { AgentType, ActionItem, ActionType, GraphState, Message } from '../types';
import { createLLM, getSystemPrompt } from '../utils/llm';
import { StructuredOutputParser } from 'langchain/output_parsers';
import { z } from 'zod';
import { AIMessage } from '@langchain/core/messages';

// Process the user input with Adaptation agent
export const processAdaptation = async (state: GraphState): Promise<ActionItem[]> => {
  // Create LLM
  const llm = createLLM('gpt-4o', 0.4); // Higher temperature for creative adaptations

  // Create parser for structured output
  const outputParser = StructuredOutputParser.fromZodSchema(
    z.object({
      actions: z.array(
        z.object({
          type: z.enum([
            'updateTask',
            'updateManyTasks',
            'logActivity',
            'none'
          ]),
          payload: z.any()
        })
      ),
      adaptationStrategy: z.string().describe('The strategy you recommend for adapting the task or plan'),
      reasoning: z.string().describe('Your explanation of why adaptation is needed and how it will help')
    })
  );

  // Prepare the conversation history
  const conversationHistory = state.messages.filter(msg => 
    msg.getType() === 'human' ||
    (msg.getType() === 'ai' && msg.additional_kwargs.agentType === AgentType.Adaptation)
  );

  // Task and user context
  const taskContext = state.task ? 
    `Task: ${state.task.title}\nDescription: ${state.task.description || 'None'}\nPriority: ${state.task.priority}\nStage: ${state.task.stage}\nStatus: ${state.task.stageStatus}\nDeadline: ${state.task.deadline ? new Date(state.task.deadline).toISOString() : 'None'}` : 
    'No task provided';

  // Create a prompt template
  const prompt = ChatPromptTemplate.fromMessages([
    ['system', getSystemPrompt('adaptation') + `\n\nRespond with a structured output containing actions, an adaptation strategy, and reasoning.`],
    new MessagesPlaceholder('conversation_history'),
    ['human', `User request: {input}\n\nTask Context:\n${taskContext}\n\nAnalyze if the current task/plan needs adaptation. Consider if the approach should be modified, if timelines need adjustment, or if goals need to be recalibrated. Provide a structured response with actions to take in JSON format. {format_instructions}`],
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

  // Record the agent's adaptation strategy as a message
  if (result.adaptationStrategy) {
    state.messages.push(new AIMessage({
      content: result.adaptationStrategy,
      additional_kwargs: {
        agentType: AgentType.Adaptation,
        name: 'adaptation'
      }
    }));
  }

  // Record the agent's thought process as a message
  if (result.reasoning) {
    state.messages.push(new AIMessage({
      content: result.reasoning,
      additional_kwargs: {
        agentType: AgentType.Adaptation,
        name: 'reasoning'
      }
    }));
  }

  return result.actions.filter((action) => action.type !== 'none') as ActionItem[];
};
