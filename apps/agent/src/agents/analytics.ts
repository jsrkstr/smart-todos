import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import { AgentType, ActionItem } from '../types';
import { createLLM, getSystemPrompt } from '../utils/llm';
import { StructuredOutputParser } from 'langchain/output_parsers';
import { z } from 'zod';
import { AIMessage } from '@langchain/core/messages';
import { StateAnnotation } from '../types';

// Process the user input with Analytics agent
export const processAnalytics = async (state: typeof StateAnnotation.State): Promise<ActionItem[]> => {
  // Create LLM
  const llm = createLLM('gpt-4o', 0.2);

  // Create parser for structured output
  const outputParser = StructuredOutputParser.fromZodSchema(
    z.object({
      actions: z.array(
        z.object({
          type: z.enum([
            'logActivity',
            'none'
          ]),
          payload: z.any()
        })
      ),
      insights: z.array(z.string()).describe('Key insights derived from analyzing task patterns and performance'),
      recommendations: z.array(z.string()).describe('Specific recommendations for improving productivity or task management'),
      reasoning: z.string().describe('Your analytical process and methodology')
    })
  );

  // Prepare the conversation history
  const conversationHistory = state.messages.filter(msg => 
    msg.getType() === 'human' || 
    (msg.getType() === 'ai' && msg.additional_kwargs.agentType === AgentType.Analytics)
  );

  // Task and user context
  const tasksContext = state.tasks && state.tasks.length > 0 ? 
    `User has ${state.tasks.length} tasks.\n` + 
    state.tasks.map((task, index) => 
      `Task ${index+1}: ${task.title}\nStatus: ${task.completed ? 'Completed' : 'Not Completed'}\nPriority: ${task.priority}\nStage: ${task.stage}`
    ).join('\n\n') : 
    'No tasks available';

  // Create a prompt template
  const prompt = ChatPromptTemplate.fromMessages([
    ['system', getSystemPrompt('analytics') + `\n\nRespond with a structured output containing actions, insights, recommendations, and reasoning.`],
    new MessagesPlaceholder('conversation_history'),
    ['human', `User request: {input}\n\nTasks Context:\n${tasksContext}\n\nAnalyze the user's task patterns and performance. Look for trends in completion rates, task types, and productivity patterns. Provide a structured response with insights, recommendations, and any actions to take in JSON format. {format_instructions}`],
  ]);

  // Create the chain
  const chain = RunnableSequence.from([
    {
      input: (state: typeof StateAnnotation.State) => state.input,
      conversation_history: (state: typeof StateAnnotation.State) => conversationHistory,
      format_instructions: async () => outputParser.getFormatInstructions()
    },
    prompt,
    llm,
    outputParser
  ]);

  // Execute the chain
  const result = await chain.invoke(state);

  // Record the agent's insights as a message
  if (result.insights && result.insights.length > 0) {
    state.messages.push(new AIMessage({
      content: `Key Insights:\n${result.insights.map(insight => `- ${insight}`).join('\n')}`,
      additional_kwargs: {
        agentType: AgentType.Analytics,
        name: 'insights'
      }
    }));
  }

  // Record the agent's recommendations as a message
  if (result.recommendations && result.recommendations.length > 0) {
    state.messages.push(new AIMessage({
      content: `Recommendations:\n${result.recommendations.map(rec => `- ${rec}`).join('\n')}`,
      additional_kwargs: {
        agentType: AgentType.Analytics,
        name: 'recommendations'
      }
    }));
  }

  // Record the agent's thought process as a message
  if (result.reasoning) {
    state.messages.push(new AIMessage({
      content: result.reasoning,
      additional_kwargs: {
        agentType: AgentType.Analytics,
        name: 'reasoning'
      }
    }));
  }

  return result.actions.filter((action) => action.type !== 'none') as ActionItem[];
};
