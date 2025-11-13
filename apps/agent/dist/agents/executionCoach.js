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
    var _a, _b, _c, _d, _e;
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
    // Create a prompt template
    const prompt = prompts_1.ChatPromptTemplate.fromMessages([
        ['system', (0, llm_1.getSystemPrompt)('executionCoach') + `\n\nRespond with a structured output containing actions, a motivational message, reasoning, and a concise user-friendly response.`],
        new prompts_1.MessagesPlaceholder('conversation_history'),
        ['human', `User request: {input}\n\nTask Context:\n${taskContext}\n\nCoach Information:\n${coachInfo}\n\nProvide a structured response with actions to take in JSON format. Include a motivational message that matches the assigned coach's style and the user's preferences. Also include a complete response to the user addressing their query with coaching elements. {format_instructions}`],
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
