export interface Log {
  id?: string
  userId: string
  taskId?: string
  metadata?: any
  createdBy: string // e.g., "App", "Bot", "User"
  type: string // e.g., "PomodoroFinished", "TaskCreated", etc.
} 