"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToolCallLLMChain = exports.ToolExecutor = void 0;
const messages_1 = require("@langchain/core/messages");
/**
 * A class that executes tools based on their definitions
 */
class ToolExecutor {
    constructor(tools, context) {
        this.tools = tools;
        this.context = context;
    }
    /**
     * Find a tool by name
     */
    findTool(name) {
        return this.tools.find(tool => tool.name === name);
    }
    /**
     * Execute a tool with the given name and parameters
     */
    async executeTool(toolName, toolParams) {
        const tool = this.findTool(toolName);
        if (!tool) {
            throw new Error(`Tool '${toolName}' not found`);
        }
        try {
            // Pass context through the tool's custom implementation
            // Store the context on 'this' for the tool to access
            tool._context = this.context;
            // Execute the tool with the provided params
            const result = await tool.invoke(Object.assign({}, toolParams));
            return result;
        }
        catch (error) {
            console.error(`Error executing tool ${toolName}:`, error);
            return { error: error instanceof Error ? error.message : String(error) };
        }
    }
}
exports.ToolExecutor = ToolExecutor;
/**
 * A class that manages the tool-calling loop with the LLM
 */
class ToolCallLLMChain {
    constructor({ llm, prompt, toolExecutor, conversationHistory, input, agentType, maxIterations = 5 }) {
        this.llm = llm;
        this.prompt = prompt;
        this.toolExecutor = toolExecutor;
        this.conversationHistory = conversationHistory;
        this.input = input;
        this.agentType = agentType;
        this.maxIterations = maxIterations;
    }
    /**
     * Invoke the tool-calling chain
     */
    async invoke() {
        var _a;
        // Format the prompt with the input
        const formattedPrompt = await this.prompt.formatMessages({
            input: this.input,
            conversation_history: this.conversationHistory,
        });
        // Initialize tracking for the tool-calling loop
        let currentMessages = formattedPrompt;
        let iterations = 0;
        let finalReasoning = '';
        let finalResponse = '';
        // Start the tool-calling loop
        while (iterations < this.maxIterations) {
            iterations += 1;
            console.log(`Tool calling iteration ${iterations}`);
            // Get response from LLM
            const response = await this.llm.invoke(currentMessages);
            const aiMessage = response;
            // Check if there are tool calls
            const toolCalls = ((_a = aiMessage.additional_kwargs) === null || _a === void 0 ? void 0 : _a.tool_calls) || [];
            // If no tool calls, extract reasoning and response
            if (toolCalls.length === 0) {
                const content = aiMessage.content;
                // Try to extract reasoning and final response if content has patterns indicating both
                if (content.includes('Reasoning:') && (content.includes('Final Response:') || content.includes('Response:'))) {
                    const parts = content.split(/\n*(?:Final Response:|Response:)\n*/i);
                    if (parts.length > 1) {
                        finalReasoning = parts[0].replace(/^\s*Reasoning:\s*/i, '').trim();
                        finalResponse = parts[1].trim();
                    }
                    else {
                        finalResponse = content;
                    }
                }
                else {
                    // If no clear separation, use the whole content as the response
                    finalResponse = content;
                }
                // Return the final reasoning and response
                return {
                    reasoning: finalReasoning || undefined,
                    finalResponse: finalResponse || undefined,
                    response: finalResponse || undefined
                };
            }
            // Process and execute each tool call
            const toolResponses = [];
            for (const toolCall of toolCalls) {
                try {
                    // Extract tool name and arguments
                    const { name, arguments: argsString } = toolCall.function;
                    const args = JSON.parse(argsString);
                    console.log(`Executing tool: ${name} with args:`, args);
                    // Execute the tool
                    const toolResult = await this.toolExecutor.executeTool(name, args);
                    // Create a tool response message
                    const toolResponseMessage = new messages_1.AIMessage({
                        content: JSON.stringify(toolResult),
                        additional_kwargs: {
                            tool_call_id: toolCall.id,
                            name: toolCall.function.name,
                        },
                        name: toolCall.function.name,
                    });
                    toolResponses.push(toolResponseMessage);
                }
                catch (error) {
                    console.error('Error executing tool call:', error);
                    // Create an error response message
                    const errorResponseMessage = new messages_1.AIMessage({
                        content: JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
                        additional_kwargs: {
                            tool_call_id: toolCall.id,
                            name: toolCall.function.name,
                        },
                        name: toolCall.function.name,
                    });
                    toolResponses.push(errorResponseMessage);
                }
            }
            // Add the AI message and tool responses to the messages
            currentMessages = [...currentMessages, aiMessage, ...toolResponses];
        }
        // If we've reached the max iterations, return the current state
        return {
            reasoning: finalReasoning || undefined,
            finalResponse: finalResponse || 'I have reached the maximum number of tool calls without a final response.'
        };
    }
}
exports.ToolCallLLMChain = ToolCallLLMChain;
