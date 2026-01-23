import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import { AgentType, ActionItem } from '../types';
import { createLLM, getSystemPrompt } from '../utils/llm';
import { StructuredOutputParser } from 'langchain/output_parsers';
import { z } from 'zod';
import { AIMessage } from '@langchain/core/messages';
import { StateAnnotation } from '../types';

// Process the user input with Execution Coach agent
export const processExecutionCoach = async (state: typeof StateAnnotation.State): Promise<typeof StateAnnotation.State> => {
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
      reasoning: z.string().describe('Your explanation of the coaching approach'),
      response: z.string().describe('A concise, helpful response to the user that incorporates coaching elements and addresses their query')
    })
  );

  // Prepare the conversation history
  const conversationHistory = state.messages.filter(msg => 
    msg.getType() === 'human' || 
    (msg.getType() === 'ai' && msg.additional_kwargs.agentType === AgentType.ExecutionCoach)
  );

  // Task and user context
  console.log('=== EXECUTION COACH ===');
  console.log('state.task:', state.task?.id, state.task?.title);
  console.log('state.tasks count:', state.tasks?.length);
  const allTasks = state.task ? [state.task] : state.tasks || []
  console.log('allTasks count:', allTasks.length);
  const taskContext = `\n\nTasks:\n${allTasks.map((task: any) => `\n- TaskId: ${task.id}\nTask: ${task.title}\nDescription: ${task.description || 'None'}\nPriority: ${task.priority}\nStage: ${task.stage}\nStatus: ${task.stageStatus}\nDeadline: ${task.deadline ? new Date(task.deadline).toISOString() : 'None'}`).join('')}`;
  console.log('taskContext:', taskContext);

  // Get coach info and preferences if available
  const coach = state.user?.psychProfile?.coach;
  const coachInfo = coach ?
    `Coach: ${coach.name}\nCoaching Style: ${coach.coachingStyle || 'balanced'}\nDirectness: ${coach.directness || 50}/100\nEncouragement Level: ${coach.encouragementLevel || 70}/100` :
    'No coach assigned';

  // Get historical context
  const historicalContext = state.historicalContext;
  const physicalContext = state.physicalContext;

  const historyInfo = historicalContext ?
    `\n\n=== HISTORICAL CONTEXT ===
Recent Activity:
- App opened today: ${historicalContext.appOpenedToday ? 'Yes' : 'No'}
- Sessions this week: ${historicalContext.sessionCountThisWeek}
- Tasks completed today: ${historicalContext.tasksCompletedToday}
- Tasks completed this week: ${historicalContext.tasksCompletedThisWeek}
- Current streak: ${historicalContext.currentDailyStreak} days
- Longest streak: ${historicalContext.longestStreak} days

Notifications Sent:
- Today: ${historicalContext.notificationsSentToday}
- Last sent: ${historicalContext.lastNotificationSent ? new Date(historicalContext.lastNotificationSent).toLocaleString() : 'Never'}
${Object.keys(historicalContext.notificationsThisWeekByType).length > 0 ? `- This week by type: ${JSON.stringify(historicalContext.notificationsThisWeekByType)}` : ''}

Focus & Energy:
- Pomodoros completed today: ${historicalContext.pomodorosCompletedToday}
- Total focus time today: ${historicalContext.totalFocusMinutesToday} minutes
${historicalContext.averageMoodThisWeek ? `- Average mood this week: ${historicalContext.averageMoodThisWeek.toFixed(1)}/5` : ''}

IMPORTANT: Use this context to:
1. Avoid redundant coaching if user already received similar intervention today
2. Reference their progress positively (e.g., "Nice streak of ${historicalContext.currentDailyStreak} days!")
3. Adjust your approach based on their mood and energy levels
4. Be aware of notification fatigue if many notifications sent today
` : '';

  const physicalInfo = physicalContext ?
    `\n\n=== PHYSICAL CONTEXT (Real-time) ===
Current Activity: ${physicalContext.currentActivity} (${physicalContext.activityDurationMinutes} min, confidence: ${(physicalContext.activityConfidence * 100).toFixed(0)}%)
Location: ${physicalContext.locationType}${physicalContext.savedLocationName ? ` (${physicalContext.savedLocationName})` : ''}
Device: Battery ${physicalContext.batteryLevel}%${physicalContext.doNotDisturb ? ', DND ON' : ''}${!physicalContext.screenOn ? ', Screen OFF' : ''}
Time: ${physicalContext.localTime}${physicalContext.isWeekend ? ' (Weekend)' : ''}${!physicalContext.isWorkingHours ? ' (Outside work hours)' : ''}

IMPORTANT Context-Aware Coaching:
- User is ${physicalContext.currentActivity} (consider energy level)
- ${physicalContext.locationType === 'home' ? 'At home - can suggest home-based tasks' : physicalContext.locationType === 'work' ? 'At work - focus on work tasks' : physicalContext.locationType === 'commuting' ? 'Commuting - suggest light tasks or mental preparation' : 'Location unknown'}
- ${physicalContext.doNotDisturb ? 'DND is ON - user wants minimal interruptions' : 'Available for engagement'}
- ${physicalContext.batteryLevel < 20 ? 'Low battery - suggest quick tasks' : 'Battery okay'}
- ${physicalContext.isWeekend && !physicalContext.isWorkingHours ? 'Weekend leisure time - balance productivity with rest' : ''}
` : '';

  // Create a prompt template
  const prompt = ChatPromptTemplate.fromMessages([
    ['system', getSystemPrompt('executionCoach') + `\n\nRespond with a structured output containing actions, a motivational message, reasoning, and a concise user-friendly response.`],
    new MessagesPlaceholder('conversation_history'),
    ['human', `User request: {input}\n\nTask Context:\n${taskContext}\n\nCoach Information:\n${coachInfo}${historyInfo}${physicalInfo}\n\nProvide a structured response with actions to take in JSON format. Include a motivational message that matches the assigned coach's style and the user's preferences. Also include a complete response to the user addressing their query with coaching elements. {format_instructions}`],
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

  // Store the actions for execution
  state.actionItems = result.actions.filter((action) => action.type !== 'none') as ActionItem[];
  
  // Create response for the user
  if (result.response) {
    state.agentResponse = result.response;
    
    // Push the agent's response to the message history
    state.messages.push(
      new AIMessage({
        content: state.agentResponse,
        additional_kwargs: {
          agentType: AgentType.ExecutionCoach,
        },
      })
    );
  }
  
  return state;
};
