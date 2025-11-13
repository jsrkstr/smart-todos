/**
 * Chat tools as code APIs
 * These functions can be imported and called from agent-generated code
 */

import { callInternalTool, getToken } from '../internal'

/**
 * Chat message structure
 */
export interface ChatMessage {
  id: string
  userId: string
  role: 'user' | 'assistant' | 'system'
  content: string
  createdAt: string
}

/**
 * Get chat history with optional limit
 *
 * @example
 * ```typescript
 * // Get last 20 messages
 * const messages = await getChatHistory(20)
 *
 * // Get all recent messages (default 50)
 * const messages = await getChatHistory()
 *
 * // Analyze conversation sentiment
 * const userMessages = messages.filter(m => m.role === 'user')
 * console.log(`User sent ${userMessages.length} messages`)
 * ```
 */
export async function getChatHistory(limit?: number): Promise<ChatMessage[]> {
  const token = getToken()
  return await callInternalTool<ChatMessage[]>(
    'getChatHistory',
    { limit: limit || 50 },
    token
  )
}

/**
 * Create a new chat message
 *
 * @example
 * ```typescript
 * // Send a user message
 * const message = await createChatMessage('user', 'What tasks should I focus on today?')
 *
 * // Send an assistant response
 * const response = await createChatMessage('assistant', 'Based on your priorities...')
 * ```
 */
export async function createChatMessage(
  role: 'user' | 'assistant' | 'system',
  content: string
): Promise<ChatMessage> {
  const token = getToken()
  return await callInternalTool<ChatMessage>(
    'createChatMessage',
    { role, content },
    token
  )
}
