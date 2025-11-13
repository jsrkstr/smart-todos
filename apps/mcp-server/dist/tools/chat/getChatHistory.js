import { JWTAuth } from '../../auth/jwt';
import { ChatService } from '../../services/database';
import { GetChatHistorySchema } from '../../types';
export const getChatHistoryToolDefinition = {
    name: 'getChatHistory',
    description: 'Get chat message history for the authenticated user',
    inputSchema: {
        type: 'object',
        properties: {
            token: {
                type: 'string',
                description: 'JWT authentication token'
            },
            limit: {
                type: 'number',
                description: 'Number of messages to retrieve (default: 50)'
            }
        },
        required: ['token']
    }
};
export async function getChatHistory(params) {
    // Validate input
    const validated = GetChatHistorySchema.parse(params);
    // Authenticate and get userId
    const { userId } = await JWTAuth.verify(validated.token);
    // Fetch chat history
    const messages = await ChatService.getChatHistory(userId, validated.limit);
    return {
        success: true,
        data: messages,
        count: messages.length
    };
}
//# sourceMappingURL=getChatHistory.js.map