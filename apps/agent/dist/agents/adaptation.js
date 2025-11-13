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
// Process the user input with Adaptation agent
const processAdaptation = async (state) => {
    // Create LLM
    const llm = (0, llm_1.createLLM)('gpt-4o', 0.4); // Higher temperature for creative adaptations
    // Create parser for structured output
    const outputParser = output_parsers_1.StructuredOutputParser.fromZodSchema(zod_1.z.object({
        actions: zod_1.z.array(zod_1.z.object({
            type: zod_1.z.enum([
                'updateTask',
                'updateManyTasks',
                'logActivity',
                'none'
            ]),
            payload: zod_1.z.any()
        })),
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
    // Create a prompt template
    const prompt = prompts_1.ChatPromptTemplate.fromMessages([
        ['system', (0, llm_1.getSystemPrompt)('adaptation') + `\n\nRespond with a structured output containing actions, an adaptation strategy, reasoning, and a concise user-friendly response.`],
        new prompts_1.MessagesPlaceholder('conversation_history'),
        ['human', `User request: {input}\n\nTask Context:\n${taskContext}\n\nAnalyze if the current task/plan needs adaptation. Consider if the approach should be modified, if timelines need adjustment, or if goals need to be recalibrated. Provide a structured response with actions to take in JSON format. Include a concise, helpful response to the user explaining the adaptation strategy and changes. {format_instructions}`],
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
