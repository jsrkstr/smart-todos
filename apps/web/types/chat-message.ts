export interface ChatMessage {
  id: string
  taskId?: string
  content: string
  role: "user" | "assistant" | "system"
  createdAt: string
  metadata?: Record<string, any>
}

export interface ChatMessageCreateInput {
  taskId?: string
  content: string
  role: "user" | "assistant" | "system"
  metadata?: Record<string, any>
} 