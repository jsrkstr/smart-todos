import { create } from 'zustand'
import type { ChatMessage, ChatMessageCreateInput } from '@/types/chat-message'

interface ChatMessageStore {
  messages: ChatMessage[]
  loading: boolean
  initialized: boolean
  error: string | null
  
  // Actions
  fetchMessages: (taskId?: string) => Promise<void>
  addMessage: (message: ChatMessageCreateInput) => Promise<ChatMessage | null>
  deleteMessage: (messageId: string) => Promise<void>
}

export const useChatMessageStore = create<ChatMessageStore>((set, get) => ({
  messages: [],
  loading: false,
  initialized: false,
  error: null,

  fetchMessages: async (taskId?: string): Promise<void> => {
    set({ loading: true, error: null })
    try {
      const url = taskId 
        ? `/api/chat-messages?taskId=${encodeURIComponent(taskId)}`
        : '/api/chat-messages'
        
      const response: Response = await fetch(url)
      if (!response.ok) {
        throw new Error('Failed to load messages')
      }
      
      const data: ChatMessage[] = await response.json()
      
      // Ensure metadata is properly parsed
      const processedData = data.map(msg => ({
        ...msg,
        metadata: msg.metadata ? msg.metadata : undefined
      }))
      
      set({ messages: processedData, loading: false, initialized: true })
    } catch (error) {
      console.error("Failed to load messages:", error)
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load messages', 
        loading: false
      })
    }
  },

  addMessage: async (message: ChatMessageCreateInput): Promise<ChatMessage | null> => {
    try {
      const response: Response = await fetch('/api/chat-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message),
      })
      
      if (!response.ok) {
        const errorData: { error: string } = await response.json()
        throw new Error(errorData.error || 'Failed to add message')
      }
      
      const newMessage: ChatMessage = await response.json()
      set(state => ({ messages: [...state.messages, newMessage] }))
      return newMessage
    } catch (error) {
      console.error("Failed to add message:", error)
      set({ error: error instanceof Error ? error.message : 'Failed to add message' })
      return null
    }
  },

  deleteMessage: async (messageId: string): Promise<void> => {
    try {
      const response: Response = await fetch('/api/chat-messages', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: messageId }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete message')
      }
      
      set(state => ({
        messages: state.messages.filter(message => message.id !== messageId)
      }))
    } catch (error) {
      console.error("Failed to delete message:", error)
      set({ error: error instanceof Error ? error.message : 'Failed to delete message' })
    }
  },
})) 