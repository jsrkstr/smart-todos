import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import { AgentType, ActionItem, ActionType, GraphState, Message } from '../types';
import { createLLM, getSystemPrompt } from '../utils/llm';
import { StructuredOutputParser } from 'langchain/output_parsers';
import { z } from 'zod';
import { AIMessage } from '@langchain/core/messages';

// Process the user input with Execution Coach agent
export const processExecutionCoach = async (state: GraphState): Promise<ActionItem[]> => {
  // Create LLM
  const llm = createLLM('gpt-4o', 0.3); // Slightly higher temperature for more creative coaching

  // Create parser for structured output
  const outputParser = StructuredOutputParser.fromZodSchema(
    z.object({
      actions: z.array(
        z.object({
          type: z.enum([
            'updateTask',
            'logActivity',
            'scheduleReminder',
            'provideMotivation',
            'giveAdvice',
            'askQuestion',
            'none'
          ]),
          payload: z.any()
        })
      ),
      motivationalMessage: z.string().describe('A motivational message tailored to the user\'s current task and preferences'),
      reasoning: z.string().describe('Your explanation of the coaching approach')
    })
  );

  // Prepare the conversation history
  const conversationHistory = state.messages.filter(msg => 
    msg.getType() === 'human' || 
    (msg.getType() === 'ai' && msg.additional_kwargs.agentType === AgentType.ExecutionCoach)
  );

  // Task and user context
  const allTasks = state.task ? [state.task] : state.tasks || []
  const taskContext = `\n\nTasks:\n${allTasks.map((task: any) => `\n- TaskId: ${task.id}\nTask: ${task.title}\nDescription: ${task.description || 'None'}\nPriority: ${task.priority}\nStage: ${task.stage}\nStatus: ${task.stageStatus}\nDeadline: ${task.deadline ? new Date(task.deadline).toISOString() : 'None'}`).join('')}`;

  // Get coach info and preferences if available
  const coach = state.user?.psychProfile?.coach;
  const coachInfo = coach ? 
    `Coach: ${coach.name}\nCoaching Style: ${coach.coachingStyle || 'balanced'}\nDirectness: ${coach.directness || 50}/100\nEncouragement Level: ${coach.encouragementLevel || 70}/100` :
    'No coach assigned';

  // Create a prompt template
  const prompt = ChatPromptTemplate.fromMessages([
    ['system', getSystemPrompt('executionCoach') + `\n\nRespond with a structured output containing actions, a motivational message, and reasoning.`],
    new MessagesPlaceholder('conversation_history'),
    ['human', `User request: {input}\n\nTask Context:\n${taskContext}\n\nCoach Information:\n${coachInfo}\n\nProvide a structured response with actions to take in JSON format. Include a motivational message that matches the assigned coach's style and the user's preferences. {format_instructions}`],
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

  // Record the agent's motivational message as a message
  if (result.motivationalMessage) {
    state.messages.push(new AIMessage({
      content: result.motivationalMessage,
      additional_kwargs: {
        agentType: AgentType.ExecutionCoach,
        name: 'motivation'
      }
    }));
  }

  // Record the agent's thought process as a message
  if (result.reasoning) {
    state.messages.push(new AIMessage({
      content: result.reasoning,
      additional_kwargs: {
        agentType: AgentType.ExecutionCoach,
        name: 'reasoning'
      }
    }));
  }

  return result.actions.filter((action) => action.type !== 'none') as ActionItem[];
};
