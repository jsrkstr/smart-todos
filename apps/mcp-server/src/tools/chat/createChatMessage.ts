import { JWTAuth } from '../../auth/jwt'
import { ChatService } from '../../services/database'
import { CreateChatMessageInput, CreateChatMessageSchema } from '../../types'

export const createChatMessageToolDefinition = {
  name: 'createChatMessage',
  description: 'Create a new chat message for the authenticated user',
  inputSchema: {
    type: 'object',
    properties: {
      token: {
        type: 'string',
        description: 'JWT authentication token'
      },
      role: {
        type: 'string',
        enum: ['user', 'assistant', 'system'],
        description: 'Message role'
      },
      content: {
        type: 'string',
        description: 'Message content'
      }
    },
    required: ['token', 'role', 'content']
  }
}

export async function createChatMessage(params: CreateChatMessageInput) {
  // Validate input
  const validated = CreateChatMessageSchema.parse(params)

  // Authenticate and get userId
  const { userId } = await JWTAuth.verify(validated.token)

  // Create chat message
  const message = await ChatService.createChatMessage(userId, {
    role: validated.role,
    content: validated.content
  })

  return {
    success: true,
    data: message,
    message: 'Chat message created successfully'
  }
}
