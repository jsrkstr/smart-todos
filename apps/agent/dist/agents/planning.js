"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processPlanning = void 0;
const prompts_1 = require("@langchain/core/prompts");
const runnables_1 = require("@langchain/core/runnables");
const types_1 = require("../types");
const llm_1 = require("../utils/llm");
const output_parsers_1 = require("langchain/output_parsers");
const zod_1 = require("zod");
const messages_1 = require("@langchain/core/messages");
// Process the user input with Planning agent
const processPlanning = async (state) => {
    var _a;
    // Create LLM
    const llm = (0, llm_1.createLLM)('gpt-4o', 0.2);
    // Create parser for structured output
    const outputParser = output_parsers_1.StructuredOutputParser.fromZodSchema(zod_1.z.object({
        actions: zod_1.z.array(zod_1.z.object({
            type: zod_1.z.enum([
                'createSubtasks',
                'updateTask',
                'updateManyTasks',
                'none'
            ]),
            payload: zod_1.z.any()
        })),
        reasoning: zod_1.z.string().describe('Your explanation of the breakdown or prioritization strategy'),
        response: zod_1.z.string().describe('A concise, helpful response to the user explaining your actions and plans')
    }));
    // Prepare the conversation history
    const conversationHistory = state.messages.filter(msg => msg.getType() === 'human' ||
        (msg.getType() === 'ai' && msg.additional_kwargs.agentType === types_1.AgentType.Planning));
    // Task and user context
    const taskContext = state.task ?
        `Task: ${state.task.title}\nDescription: ${state.task.description || 'None'}\nPriority: ${state.task.priority}\nDeadline: ${state.task.deadline ? new Date(state.task.deadline).toISOString() : 'None'}` :
        'No task provided';
    const userContext = ((_a = state.user) === null || _a === void 0 ? void 0 : _a.psychProfile) ?
        `Productivity Time: ${state.user.psychProfile.productivityTime}\nTask Approach: ${state.user.psychProfile.taskApproach}\nDifficulty Preference: ${state.user.psychProfile.difficultyPreference}` :
        'No user profile available';
    // Create a prompt template
    const prompt = prompts_1.ChatPromptTemplate.fromMessages([
        ['system', (0, llm_1.getSystemPrompt)('planning') + `\n\nRespond with a structured output containing actions, reasoning, and a concise user-friendly response.`],
        new prompts_1.MessagesPlaceholder('conversation_history'),
        ['human', `User request: {input}\n\nTask Context:\n${taskContext}\n\nUser Context:\n${userContext}\n\nProvide a structured response with actions to take in JSON format. For task breakdown, create subtasks that can be completed in 10-15 minutes each. For prioritization, consider deadlines, importance, and user preferences. Include a concise, helpful response to the user explaining your actions and plans. {format_instructions}`],
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
    // Record the agent's thought process as a message
    if (result.reasoning) {
        state.messages.push(new messages_1.AIMessage({
            content: result.reasoning,
            additional_kwargs: {
                agentType: types_1.AgentType.Planning,
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
                agentType: types_1.AgentType.Planning,
            },
        }));
    }
    return state;
};
exports.processPlanning = processPlanning;
