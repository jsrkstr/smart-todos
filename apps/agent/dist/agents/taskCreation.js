"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processTaskCreation = void 0;
const prompts_1 = require("@langchain/core/prompts");
const agents_1 = require("langchain/agents");
const types_1 = require("../types");
const llm_1 = require("../utils/llm");
const messages_1 = require("@langchain/core/messages");
const taskToolDefinitions_1 = require("../utils/taskToolDefinitions");
const tools_1 = require("langchain/tools");
const console_1 = require("@langchain/core/tracers/console");
// Main agent function with tool-calling using LangChain's native capabilities
const processTaskCreation = async (state, context) => {
    try {
        // Create LLM with tool-calling support
        const llm = (0, llm_1.createLLM)('gpt-4o', 0.2);
        // Add context to tools before use
        // We need to enrich tools with the context they need to execute
        const toolContext = {
            userId: state.userId,
            prisma: context === null || context === void 0 ? void 0 : context.prisma,
            TaskService: context === null || context === void 0 ? void 0 : context.TaskService,
        };
        const toolsWithContext = taskToolDefinitions_1.taskToolDefinitions.map(tool => {
            // Create a new tool instance with bound context
            const boundFunc = tool.func.bind({ _context: toolContext });
            return new tools_1.DynamicStructuredTool({
                name: tool.name,
                description: tool.description,
                schema: tool.schema,
                func: boundFunc,
            });
        });
        // Prepare the conversation history for the agent
        const conversationHistory = state.messages
            .filter((msg) => {
            var _a;
            return msg.getType() === 'human' ||
                (msg.getType() === 'ai' && ((_a = msg.additional_kwargs) === null || _a === void 0 ? void 0 : _a.agentType) === types_1.AgentType.TaskCreation);
        })
            .map((msg) => {
            // Normalize message content to ensure it's a string
            // LangChain's checkpointer might serialize content as an array or object
            let content = msg.content;
            if (Array.isArray(content)) {
                // If content is an array, extract text from content parts
                content = content
                    .map((part) => (typeof part === 'string' ? part : part.text || ''))
                    .join('');
            }
            else if (typeof content === 'object' && content !== null) {
                // If content is an object, try to extract text
                content = content.text || JSON.stringify(content);
            }
            // Create a new message with normalized content
            if (msg.getType() === 'human') {
                return new messages_1.HumanMessage({ content: String(content) });
            }
            else {
                return new messages_1.AIMessage({
                    content: String(content),
                    additional_kwargs: msg.additional_kwargs || {},
                });
            }
        });
        // Build context-aware system message
        let systemMessage = (0, llm_1.getSystemPrompt)('taskCreation') + `

You have access to tools for reading and modifying tasks. Use these tools to help manage the user's tasks.

After executing any necessary tools, provide a helpful response summarizing what you've done.`;
        // If we're in a task context, add that information
        if (state.task) {
            systemMessage += `

**CURRENT TASK CONTEXT:**
You are currently assisting with the following task:
- Task ID: ${state.task.id}
- Title: ${state.task.title}
- Description: ${state.task.description || 'No description'}
- Priority: ${state.task.priority || 'Not set'}
- Status: ${state.task.completed ? 'Completed' : 'Not completed'}
- Deadline: ${state.task.deadline || 'Not set'}

When the user asks to update something without specifying which task, they are referring to THIS task (ID: ${state.task.id}).`;
        }
        // Create the prompt template for the agent
        const prompt = prompts_1.ChatPromptTemplate.fromMessages([
            ['system', systemMessage],
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
        // Debug: Log the conversation history to verify normalization
        console.log('[TaskCreation] Conversation history:', JSON.stringify(conversationHistory.map(m => ({
            type: m.getType(),
            content: m.content,
            contentType: typeof m.content,
            isArray: Array.isArray(m.content)
        })), null, 2));
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
