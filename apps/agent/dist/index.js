"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSupervisorGraph = exports.AgentType = exports.StateAnnotation = void 0;
exports.processRequest = processRequest;
const types_1 = require("./types");
const graph_1 = require("./graph");
const messages_1 = require("@langchain/core/messages");
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config();
// Export types and graph for external use
var types_2 = require("./types");
Object.defineProperty(exports, "StateAnnotation", { enumerable: true, get: function () { return types_2.StateAnnotation; } });
Object.defineProperty(exports, "AgentType", { enumerable: true, get: function () { return types_2.AgentType; } });
var graph_2 = require("./graph");
Object.defineProperty(exports, "createSupervisorGraph", { enumerable: true, get: function () { return graph_2.createSupervisorGraph; } });
/**
 * Process a user request through the SmartTodos multi-agent system
 * @param userId - The ID of the user making the request
 * @param input - The user's input message
 * @param context - Additional context (optional taskId, jwtToken, databaseUrl, etc.)
 * @returns Promise with the final state including agent response
 */
async function processRequest(userId, input, context) {
    // Initialize state with user input and context
    const initialState = {
        userId,
        jwtToken: (context === null || context === void 0 ? void 0 : context.jwtToken) || null,
        input,
        user: null,
        task: null,
        tasks: null,
        activeAgentType: types_1.AgentType.TaskCreation,
        context,
        messages: [new messages_1.HumanMessage({ content: input })],
        summary: null,
        agentResponse: null,
        actionItems: [],
        error: null,
    };
    // Use userId + taskId as thread ID for conversation continuity
    // This ensures each task has its own conversation thread, and general chat has its own
    const threadId = (context === null || context === void 0 ? void 0 : context.taskId) ? `${userId}-${context.taskId}` : userId;
    const config = { configurable: { thread_id: threadId } };
    console.log('[Agent] Using thread_id:', threadId);
    // Create graph and process request
    const graph = await (0, graph_1.createSupervisorGraph)(context === null || context === void 0 ? void 0 : context.databaseUrl);
    return await graph.invoke(initialState, config);
}
/**
 * Main function to demonstrate usage (for development/testing)
 */
async function main() {
    if (require.main !== module)
        return;
    // Example usage - substitute with actual values for testing
    const result = await processRequest('cm9cmam9t0000tg5ibyifmfxi', 'what is this task about?', 
    // 'I need to create a task for finishing my presentation by Friday',
    { taskId: 'cm9u6cat20014tgi9fdotptt3' }
    // { modelName: 'gpt-4o' }
    );
    console.log('Response:', result.agentResponse);
    console.log('State:', JSON.stringify(result, null, 2));
}
// Run main function if this file is executed directly
main().catch(console.error);
