"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processAdaptation = void 0;
const prompts_1 = require("@langchain/core/prompts");
const runnables_1 = require("@langchain/core/runnables");
const types_1 = require("../types");
const llm_1 = require("../utils/llm");
const output_parsers_1 = require("langchain/output_parsers");
const zod_1 = require("zod");
const messages_1 = require("@langchain/core/messages");
const actionPayloadSchemas_js_1 = require("../utils/actionPayloadSchemas.js");
// Process the user input with Adaptation agent
const processAdaptation = async (state) => {
    var _a;
    // Create LLM
    const llm = (0, llm_1.createLLM)('gpt-4o', 0.4); // Higher temperature for creative adaptations
    // Create parser for structured output with strongly-typed action payloads
    const outputParser = output_parsers_1.StructuredOutputParser.fromZodSchema(zod_1.z.object({
        actions: zod_1.z.array(zod_1.z.discriminatedUnion('type', [
            zod_1.z.object({
                type: zod_1.z.literal('updateTask'),
                payload: actionPayloadSchemas_js_1.updateTaskPayloadSchema
            }),
            zod_1.z.object({
                type: zod_1.z.literal('updateManyTasks'),
                payload: actionPayloadSchemas_js_1.updateManyTasksPayloadSchema
            }),
            zod_1.z.object({
                type: zod_1.z.literal('logActivity'),
                payload: actionPayloadSchemas_js_1.logActivityPayloadSchema
            }),
            zod_1.z.object({
                type: zod_1.z.literal('none'),
                payload: actionPayloadSchemas_js_1.nonePayloadSchema
            })
        ])),
        adaptationStrategy: zod_1.z.string().describe('The strategy you recommend for adapting the task or plan'),
        reasoning: zod_1.z.string().describe('Your explanation of why adaptation is needed and how it will help'),
        response: zod_1.z.string().describe('A concise, helpful response to the user explaining the adaptation strategy and changes')
    }));
    // Prepare the conversation history
    const conversationHistory = state.messages.filter(msg => msg.getType() === 'human' ||
        (msg.getType() === 'ai' && msg.additional_kwargs.agentType === types_1.AgentType.Adaptation));
    // Task and user context
    const taskContext = state.task ?
        `Task: ${state.task.title}\nDescription: ${state.task.description || 'None'}\nPriority: ${state.task.priority}\nStage: ${state.task.stage}\nStatus: ${state.task.stageStatus}\nDeadline: ${state.task.deadline ? new Date(state.task.deadline).toISOString() : 'None'}` :
        'No task provided';
    // External context (calendar) for smart rescheduling
    const externalInfo = ((_a = state.externalContext) === null || _a === void 0 ? void 0 : _a.hasCalendarConnected) ?
        `\n\n=== CALENDAR CONTEXT FOR RESCHEDULING ===
Events Today: ${state.externalContext.eventsToday.length}
${state.externalContext.eventsToday.length > 0 ?
            `Scheduled: ${state.externalContext.eventsToday.map(e => `"${e.title}" ${new Date(e.startTime).toISOString()}-${new Date(e.endTime).toISOString()}`).join(', ')}` :
            'No events scheduled'}

Free Time Blocks Available:
${state.externalContext.freeTimeBlocks.length > 0 ?
            state.externalContext.freeTimeBlocks.map(block => `- ${block.durationMinutes} min: ${new Date(block.start).toISOString()} - ${new Date(block.end).toISOString()}`).join('\n') :
            'No significant free blocks available'}

IMPORTANT Calendar-Aware Adaptation:
- When rescheduling tasks, suggest specific free time blocks
- Consider task duration vs available free time
- Avoid scheduling during or right before meetings
- Propose realistic deadlines based on available calendar space
${state.externalContext.freeTimeBlocks.length === 0 ?
            '⚠️ Schedule is packed - may need to reschedule lower-priority tasks or suggest tomorrow' : ''}
` : '';
    // Create a prompt template
    const prompt = prompts_1.ChatPromptTemplate.fromMessages([
        ['system', (0, llm_1.getSystemPrompt)('adaptation') + `\n\nRespond with a structured output containing actions, an adaptation strategy, reasoning, and a concise user-friendly response. IMPORTANT: Output ONLY raw JSON, NO markdown code fences or formatting.`],
        new prompts_1.MessagesPlaceholder('conversation_history'),
        ['human', `User request: {input}\n\nTask Context:\n${taskContext}${externalInfo}\n\nAnalyze if the current task/plan needs adaptation. Consider if the approach should be modified, if timelines need adjustment, or if goals need to be recalibrated. Provide a structured response with actions to take in JSON format. Include a concise, helpful response to the user explaining the adaptation strategy and changes.

IMPORTANT for updateTask actions: Only include fields that are actually changing. Do NOT include fields with empty strings, null values, or unchanged values. For example, if only updating the date field, only send: {{"date": "2026-01-27T17:49:43.462Z"}}

{format_instructions}`],
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
    // Record the agent's adaptation strategy as a message
    if (result.adaptationStrategy) {
        state.messages.push(new messages_1.AIMessage({
            content: result.adaptationStrategy,
            additional_kwargs: {
                agentType: types_1.AgentType.Adaptation,
                name: 'adaptation'
            }
        }));
    }
    // Record the agent's thought process as a message
    if (result.reasoning) {
        state.messages.push(new messages_1.AIMessage({
            content: result.reasoning,
            additional_kwargs: {
                agentType: types_1.AgentType.Adaptation,
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
                agentType: types_1.AgentType.Adaptation,
            },
        }));
    }
    return state;
};
exports.processAdaptation = processAdaptation;
