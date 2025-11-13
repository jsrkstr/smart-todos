import { z } from 'zod'

// Common schemas
export const AuthTokenSchema = z.object({
  token: z.string().describe('JWT authentication token')
})

// Task schemas
export const GetTasksSchema = z.object({
  token: z.string().describe('JWT authentication token'),
  completed: z.boolean().optional().describe('Filter by completion status'),
  priority: z.enum(['low', 'medium', 'high']).optional().describe('Filter by priority'),
  startDate: z.string().optional().describe('Filter tasks due after this date (ISO 8601)'),
  endDate: z.string().optional().describe('Filter tasks due before this date (ISO 8601)'),
  parentId: z.string().optional().nullable().describe('Filter by parent task ID (null for root tasks)')
})

export const GetTaskSchema = z.object({
  token: z.string().describe('JWT authentication token'),
  taskId: z.string().describe('Task ID to retrieve')
})

export const CreateTaskSchema = z.object({
  token: z.string().describe('JWT authentication token'),
  title: z.string().describe('Task title'),
  description: z.string().optional().describe('Task description'),
  priority: z.enum(['low', 'medium', 'high']).optional().describe('Task priority'),
  dueDate: z.string().optional().describe('Task due date (ISO 8601)'),
  parentId: z.string().optional().describe('Parent task ID for subtasks'),
  tags: z.array(z.string()).optional().describe('Array of tag IDs')
})

export const UpdateTaskSchema = z.object({
  token: z.string().describe('JWT authentication token'),
  taskId: z.string().describe('Task ID to update'),
  title: z.string().optional().describe('New task title'),
  description: z.string().optional().describe('New task description'),
  priority: z.enum(['low', 'medium', 'high']).optional().describe('New task priority'),
  dueDate: z.string().optional().nullable().describe('New task due date (ISO 8601)'),
  completed: z.boolean().optional().describe('Task completion status'),
  tags: z.array(z.string()).optional().describe('Array of tag IDs')
})

export const DeleteTaskSchema = z.object({
  token: z.string().describe('JWT authentication token'),
  taskId: z.string().describe('Task ID to delete')
})

export const GetSubtasksSchema = z.object({
  token: z.string().describe('JWT authentication token'),
  taskId: z.string().describe('Parent task ID')
})

// User schemas
export const GetUserProfileSchema = z.object({
  token: z.string().describe('JWT authentication token')
})

export const GetPsychProfileSchema = z.object({
  token: z.string().describe('JWT authentication token')
})

export const GetUserSettingsSchema = z.object({
  token: z.string().describe('JWT authentication token')
})

// Chat schemas
export const GetChatHistorySchema = z.object({
  token: z.string().describe('JWT authentication token'),
  limit: z.number().optional().default(50).describe('Number of messages to retrieve')
})

export const CreateChatMessageSchema = z.object({
  token: z.string().describe('JWT authentication token'),
  role: z.enum(['user', 'assistant', 'system']).describe('Message role'),
  content: z.string().describe('Message content')
})

// Pomodoro schemas
export const GetPomodorosSchema = z.object({
  token: z.string().describe('JWT authentication token'),
  taskId: z.string().optional().describe('Filter by task ID'),
  startDate: z.string().optional().describe('Filter sessions after this date (ISO 8601)'),
  endDate: z.string().optional().describe('Filter sessions before this date (ISO 8601)')
})

export const CreatePomodoroSchema = z.object({
  token: z.string().describe('JWT authentication token'),
  taskId: z.string().optional().describe('Associated task ID'),
  duration: z.number().describe('Session duration in minutes'),
  completed: z.boolean().describe('Whether the session was completed')
})

// Type exports
export type GetTasksInput = z.infer<typeof GetTasksSchema>
export type GetTaskInput = z.infer<typeof GetTaskSchema>
export type CreateTaskInput = z.infer<typeof CreateTaskSchema>
export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>
export type DeleteTaskInput = z.infer<typeof DeleteTaskSchema>
export type GetSubtasksInput = z.infer<typeof GetSubtasksSchema>

export type GetUserProfileInput = z.infer<typeof GetUserProfileSchema>
export type GetPsychProfileInput = z.infer<typeof GetPsychProfileSchema>
export type GetUserSettingsInput = z.infer<typeof GetUserSettingsSchema>

export type GetChatHistoryInput = z.infer<typeof GetChatHistorySchema>
export type CreateChatMessageInput = z.infer<typeof CreateChatMessageSchema>

export type GetPomodorosInput = z.infer<typeof GetPomodorosSchema>
export type CreatePomodoroInput = z.infer<typeof CreatePomodoroSchema>
