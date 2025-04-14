import { useCallback } from "react"
import { useChatMessageStore } from "@/lib/store/useChatMessageStore"
import type { ChatMessage, ChatMessageCreateInput } from "@/types/chat-message"

export function useChatMessages(taskId?: string) {
  const {
    messages: allMessages,
    loading,
    initialized,
    fetchMessages,
    addMessage: storeAddMessage,
    deleteMessage,
  } = useChatMessageStore()

  // Filter messages by taskId if provided
  const messages = taskId 
    ? allMessages.filter(msg => msg.taskId === taskId)
    : allMessages

  // Get question messages only
  const questionMessages = messages.filter(msg => 
    msg.metadata && typeof msg.metadata === 'object' && msg.metadata.type === 'question'
  )

  // Get refinement messages only
  const refinementMessages = messages.filter(msg => 
    msg.metadata && typeof msg.metadata === 'object' && msg.metadata.refinement === true
  )

  // Add a message with proper taskId if specified
  const addMessage = useCallback(async (message: Omit<ChatMessageCreateInput, "taskId">): Promise<ChatMessage | null> => {
    return storeAddMessage({
      ...message,
      taskId
    })
  }, [storeAddMessage, taskId])

  // Load messages for the current taskId
  const loadMessages = useCallback(async (): Promise<void> => {
    await fetchMessages(taskId)
  }, [fetchMessages, taskId])

  return {
    messages,
    questionMessages,
    refinementMessages,
    loading,
    initialized,
    addMessage,
    deleteMessage,
    loadMessages
  }
} 