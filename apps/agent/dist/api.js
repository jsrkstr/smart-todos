"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = void 0;
exports.processAgentRequest = processAgentRequest;
const server_1 = require("next/server");
const client_1 = require("@prisma/client");
const index_1 = require("./index");
const database_1 = require("./services/database");
/**
 * API route handler for multi-agent chat processing
 * This can be integrated with the web app or called directly
 */
async function processAgentRequest(req) {
    try {
        // Extract request data
        const { messages, taskId, userId } = await req.json();
        if (!userId) {
            return server_1.NextResponse.json({ error: "User ID is required" }, { status: 400 });
        }
        // Store the user message to the database
        const lastUserMessage = messages.findLast((m) => m.role === 'user');
        if (lastUserMessage) {
            await database_1.ChatMessageService.createMessage({
                userId,
                taskId: taskId || undefined,
                content: lastUserMessage.content,
                role: client_1.ChatMessageRole.user
            });
        }
        // Process the request through our multi-agent system
        const result = await (0, index_1.processRequest)(userId, (lastUserMessage === null || lastUserMessage === void 0 ? void 0 : lastUserMessage.content) || '', { taskId });
        // Store the assistant's response in the database
        if (result.agentResponse) {
            await database_1.ChatMessageService.createMessage({
                userId,
                taskId: taskId || undefined,
                content: result.agentResponse,
                role: client_1.ChatMessageRole.assistant,
                metadata: {
                    agentType: result.activeAgentType,
                    actionItems: result.actionItems
                }
            });
        }
        // Return the response
        return server_1.NextResponse.json({
            messages: [...messages, { role: 'assistant', content: result.agentResponse }],
            agentType: result.activeAgentType,
            actionItems: result.actionItems,
            task: result.task,
            error: result.error
        });
    }
    catch (error) {
        console.error('Error in agent API:', error);
        return server_1.NextResponse.json({ error: 'Failed to process agent request' }, { status: 500 });
    }
}
/**
 * Example of how to integrate this with a Next.js API route
 * Implementation might vary depending on your framework
 */
const POST = async (req) => {
    return processAgentRequest(req);
};
exports.POST = POST;
