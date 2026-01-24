"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processExecutionCoach = void 0;
const prompts_1 = require("@langchain/core/prompts");
const runnables_1 = require("@langchain/core/runnables");
const types_1 = require("../types");
const llm_1 = require("../utils/llm");
const output_parsers_1 = require("langchain/output_parsers");
const zod_1 = require("zod");
const messages_1 = require("@langchain/core/messages");
// Process the user input with Execution Coach agent
const processExecutionCoach = async (state) => {
    var _a, _b, _c, _d, _e, _f;
    // Create LLM
    const llm = (0, llm_1.createLLM)('gpt-4o', 0.3); // Slightly higher temperature for more creative coaching
    // Create parser for structured output
    const outputParser = output_parsers_1.StructuredOutputParser.fromZodSchema(zod_1.z.object({
        actions: zod_1.z.array(zod_1.z.object({
            type: zod_1.z.enum([
                'updateTask',
                'logActivity',
                'scheduleReminder',
                'provideMotivation',
                'giveAdvice',
                'askQuestion',
                'none'
            ]),
            payload: zod_1.z.any()
        })),
        motivationalMessage: zod_1.z.string().describe('A motivational message tailored to the user\'s current task and preferences'),
        reasoning: zod_1.z.string().describe('Your explanation of the coaching approach'),
        response: zod_1.z.string().describe('A concise, helpful response to the user that incorporates coaching elements and addresses their query')
    }));
    // Prepare the conversation history
    const conversationHistory = state.messages.filter(msg => msg.getType() === 'human' ||
        (msg.getType() === 'ai' && msg.additional_kwargs.agentType === types_1.AgentType.ExecutionCoach));
    // Task and user context
    console.log('=== EXECUTION COACH ===');
    console.log('state.task:', (_a = state.task) === null || _a === void 0 ? void 0 : _a.id, (_b = state.task) === null || _b === void 0 ? void 0 : _b.title);
    console.log('state.tasks count:', (_c = state.tasks) === null || _c === void 0 ? void 0 : _c.length);
    const allTasks = state.task ? [state.task] : state.tasks || [];
    console.log('allTasks count:', allTasks.length);
    const taskContext = `\n\nTasks:\n${allTasks.map((task) => `\n- TaskId: ${task.id}\nTask: ${task.title}\nDescription: ${task.description || 'None'}\nPriority: ${task.priority}\nStage: ${task.stage}\nStatus: ${task.stageStatus}\nDeadline: ${task.deadline ? new Date(task.deadline).toISOString() : 'None'}`).join('')}`;
    console.log('taskContext:', taskContext);
    // Get coach info and preferences if available
    const coach = (_e = (_d = state.user) === null || _d === void 0 ? void 0 : _d.psychProfile) === null || _e === void 0 ? void 0 : _e.coach;
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
${Object.keys(historicalContext.notificationsThisWeekByType).length > 0 ? `- This week by type: ${Object.entries(historicalContext.notificationsThisWeekByType).map(([type, count]) => `${type}=${count}`).join(', ')}` : ''}

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
    // External context (calendar)
    const externalInfo = ((_f = state.externalContext) === null || _f === void 0 ? void 0 : _f.hasCalendarConnected) ?
        `\n\n=== CALENDAR CONTEXT ===
Events Today: ${state.externalContext.eventsToday.length} scheduled
${state.externalContext.nextEvent ?
            `⏰ Next Event: "${state.externalContext.nextEvent.title}" in ${state.externalContext.nextEvent.startsInMinutes} minutes` :
            'No upcoming events in the next 4 hours'}
${state.externalContext.freeTimeBlocks.length > 0 ?
            `\nNext Free Block: ${state.externalContext.freeTimeBlocks[0].durationMinutes} min (${new Date(state.externalContext.freeTimeBlocks[0].start).toLocaleTimeString()})` :
            '\nNo significant free time - schedule is packed'}

IMPORTANT Calendar-Aware Coaching:
${state.externalContext.nextEvent && state.externalContext.nextEvent.startsInMinutes < 30 ?
            `⚠️ CRITICAL: Only ${state.externalContext.nextEvent.startsInMinutes} minutes until "${state.externalContext.nextEvent.title}"! Suggest wrapping up current task or taking a brief break before the meeting.` :
            state.externalContext.nextEvent && state.externalContext.nextEvent.startsInMinutes < 60 ?
                `⏳ Heads up: "${state.externalContext.nextEvent.title}" starts in ${state.externalContext.nextEvent.startsInMinutes} minutes. Good time for a quick task or preparation.` :
                state.externalContext.freeTimeBlocks.length > 0 && state.externalContext.freeTimeBlocks[0].durationMinutes >= 90 ?
                    `✓ You have ${state.externalContext.freeTimeBlocks[0].durationMinutes} minutes of uninterrupted time - perfect for deep work!` :
                    'Schedule looks flexible for task work'}
` : '';
    // Behavioral patterns (learned habits)
    const patternsInfo = state.behavioralPatterns ?
        `\n\n=== BEHAVIORAL PATTERNS (Learned from ${state.behavioralPatterns.confidence.overall}% confidence) ===
Productivity Patterns:
- Most productive hours: ${state.behavioralPatterns.mostProductiveHours.map((h) => `${h}:00`).join(', ')}
- Peak day: ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][state.behavioralPatterns.peakProductivityDayOfWeek]}
- Averages ${state.behavioralPatterns.averageTasksCompletedPerDay.toFixed(1)} tasks/day

Work Style:
- Preferred task duration: ${state.behavioralPatterns.preferredTaskDuration} min
- ${state.behavioralPatterns.takesBreaksRegularly ? 'Takes regular breaks' : 'Works in longer stretches'}
- ${state.behavioralPatterns.respondsBetterToUrgency ? 'Responds well to urgency/deadlines' : 'Steady pace worker'}
- ${state.behavioralPatterns.worksInBursts ? 'Works in bursts of activity' : 'Consistent work pattern'}

Completion Patterns:
- ${state.behavioralPatterns.completesTasksEarly ? 'Completes tasks early ✓' : state.behavioralPatterns.procrastinatesThenRushes ? '⚠️ Tends to procrastinate then rush' : 'On-time completer'}
- ${state.behavioralPatterns.underestimatesTime ? '⚠️ Underestimates time needed' : state.behavioralPatterns.overestimatesTime ? 'Overestimates time (builds in buffer)' : 'Accurate time estimation'}

Focus Capacity:
- Max deep work: ${state.behavioralPatterns.maxDeepWorkMinutes} min
- Optimal session: ${state.behavioralPatterns.optimalSessionLength} min
- Needs breaks every ${state.behavioralPatterns.breakFrequencyNeeded} min

Preferences:
- Excels at: ${state.behavioralPatterns.excellsAt.length > 0 ? state.behavioralPatterns.excellsAt.join(', ') : 'various tasks'}
- Avoids: ${state.behavioralPatterns.avoidsCertainTaskTypes.length > 0 ? state.behavioralPatterns.avoidsCertainTaskTypes.join(', ') : 'none identified'}
- Prefers creative work: ${state.behavioralPatterns.prefersCreativeWork}
- Prefers admin work: ${state.behavioralPatterns.prefersAdminWork}

IMPORTANT Pattern-Based Coaching:
- Suggest tasks that match current energy level and time of day
- Respect learned work style (bursts vs steady, early vs deadline-driven)
- Reference patterns positively ("You usually crush tasks at this hour!")
- Warn about known challenges ("You tend to underestimate time - add buffer")
- Suggest optimal session lengths based on learned focus capacity
` : '';
    // Get conversation continuity notes
    const conversationContinuity = conversationHistory.length > 1 ? `
\n=== CONVERSATION CONTINUITY ===
You have access to the conversation history above. IMPORTANT:
- Reference previous messages when relevant (e.g., "Earlier you mentioned...", "Following up on what we discussed...")
- Acknowledge progress since last conversation (e.g., "Last time you were worried about X, how did that go?")
- Build on previous coaching advice (e.g., "Remember when we talked about breaking tasks down?")
- Show you remember their concerns and patterns
- Make the conversation feel continuous, not like starting fresh each time

This creates trust and shows you're paying attention to their journey.
` : '';
    // Create a prompt template
    const prompt = prompts_1.ChatPromptTemplate.fromMessages([
        ['system', (0, llm_1.getSystemPrompt)('executionCoach') + `\n\nRespond with a structured output containing actions, a motivational message, reasoning, and a concise user-friendly response.`],
        new prompts_1.MessagesPlaceholder('conversation_history'),
        ['human', `User request: {input}\n\nTask Context:\n${taskContext}\n\nCoach Information:\n${coachInfo}${historyInfo}${physicalInfo}${externalInfo}${patternsInfo}${conversationContinuity}\n\nProvide a structured response with actions to take in JSON format. Include a motivational message that matches the assigned coach's style and the user's preferences. Also include a complete response to the user addressing their query with coaching elements. {format_instructions}`],
    ]);
    // Create the chain
    const chain = runnables_1.RunnableSequence.from([
        {
            input: (state) => state.input,
            conversation_history: (state) => conversationHistory,
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
        state.messages.push(new messages_1.AIMessage({
            content: result.motivationalMessage,
            additional_kwargs: {
                agentType: types_1.AgentType.ExecutionCoach,
                name: 'motivation'
            }
        }));
    }
    // Record the agent's thought process as a message
    if (result.reasoning) {
        state.messages.push(new messages_1.AIMessage({
            content: result.reasoning,
            additional_kwargs: {
                agentType: types_1.AgentType.ExecutionCoach,
                name: 'reasoning'
            }
        }));
    }
    // Store the actions for execution
    state.actionItems = result.actions.filter((action) => action.type !== 'none');
    // Create response for the user
    if (result.response) {
        state.agentResponse = result.response;
        // Push the agent's response to the message history
        state.messages.push(new messages_1.AIMessage({
            content: state.agentResponse,
            additional_kwargs: {
                agentType: types_1.AgentType.ExecutionCoach,
            },
        }));
    }
    return state;
};
exports.processExecutionCoach = processExecutionCoach;
