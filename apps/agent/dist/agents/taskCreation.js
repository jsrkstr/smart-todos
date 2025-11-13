"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processTaskCreation = void 0;
const prompts_1 = require("@langchain/core/prompts");
const agents_1 = require("langchain/agents");
const types_1 = require("../types");
const llm_1 = require("../utils/llm");
const messages_1 = require("@langchain/core/messages");
const taskToolDefinitions_1 = require("../utils/taskToolDefinitions");
const console_1 = require("@langchain/core/tracers/console");
// Main agent function with tool-calling using LangChain's native capabilities
const processTaskCreation = async (state, context) => {
    try {
        // Create LLM with tool-calling support
        const llm = (0, llm_1.createLLM)('gpt-4o', 0.2);
        // Add context to tools before use
        // We need to enrich tools with the context they need to execute
        const toolsWithContext = taskToolDefinitions_1.taskToolDefinitions.map(tool => {
            // Clone the tool
            const clonedTool = Object.create(Object.getPrototypeOf(tool));
            Object.assign(clonedTool, tool);
            // Add the context to the tool directly
            // This is necessary because LangChain's tool executor doesn't pass context to tools
            clonedTool._context = {
                userId: state.userId,
                prisma: context === null || context === void 0 ? void 0 : context.prisma,
                TaskService: context === null || context === void 0 ? void 0 : context.TaskService,
            };
            return clonedTool;
        });
        // Prepare the conversation history for the agent
        const conversationHistory = state.messages.filter((msg) => {
            var _a;
            return msg.getType() === 'human' ||
                (msg.getType() === 'ai' && ((_a = msg.additional_kwargs) === null || _a === void 0 ? void 0 : _a.agentType) === types_1.AgentType.TaskCreation);
        });
        // Create the prompt template for the agent
        const prompt = prompts_1.ChatPromptTemplate.fromMessages([
            [
                'system',
                (0, llm_1.getSystemPrompt)('taskCreation') +
                    `

You have access to tools for reading and modifying tasks. Use these tools to help manage the user's tasks.

After executing any necessary tools, provide a helpful response summarizing what you've done.`
            ],
            new prompts_1.MessagesPlaceholder('chat_history'),
            ['human', '{input}'],
            new prompts_1.MessagesPlaceholder('agent_scratchpad'),
        ]);
        // Create the tool-calling agent
        const agent = (0, agents_1.createToolCallingAgent)({
            llm,
            tools: toolsWithContext,
            prompt,
        });
        // Create the agent executor to run the agent with tools
        const agentExecutor = new agents_1.AgentExecutor({
            agent,
            tools: toolsWithContext,
            verbose: true, // Set to false in production
        });
        // Run the agent with the user's input and conversation history
        const result = await agentExecutor.invoke({
            input: state.input,
            chat_history: conversationHistory,
        }, {
            callbacks: [new console_1.ConsoleCallbackHandler()],
        });
        console.log('result---', result);
        // Extract the agent's response
        const agentResponse = result.output;
        // Save the response to the state
        state.agentResponse = agentResponse;
        // Update message history with the agent's response
        state.messages.push(new messages_1.AIMessage({
            content: agentResponse,
            additional_kwargs: {
                agentType: types_1.AgentType.TaskCreation,
            },
        }));
        return state;
    }
    catch (error) {
        console.error('Error in task creation agent:', error);
        // Handle error gracefully
        state.error = `Task creation error: ${error instanceof Error ? error.message : String(error)}`;
        state.agentResponse = 'I apologize, but I encountered an error processing your task request.';
        // Add error message to conversation
        state.messages.push(new messages_1.AIMessage({
            content: state.agentResponse,
            additional_kwargs: {
                agentType: types_1.AgentType.TaskCreation,
                error: true,
            },
        }));
        return state;
    }
};
exports.processTaskCreation = processTaskCreation;
