/**
 * Task tools as code APIs
 * These functions can be imported and called from agent-generated code
 */

import { callInternalTool, getToken } from '../internal'

/**
 * Task object structure
 */
export interface Task {
  id: string
  title: string
  description: string | null
  completed: boolean
  priority: 'low' | 'medium' | 'high'
  dueDate: string | null
  createdAt: string
  updatedAt: string
  userId: string
  parentId: string | null
  tags: Array<{ id: string; name: string }>
  subtasks?: Task[]
}

/**
 * Get all tasks with optional filtering
 *
 * @example
 * ```typescript
 * // Get all incomplete high-priority tasks
 * const tasks = await getTasks({ completed: false, priority: 'high' })
 *
 * // Get tasks due this week
 * const now = new Date()
 * const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
 * const tasks = await getTasks({
 *   startDate: now.toISOString(),
 *   endDate: weekFromNow.toISOString()
 * })
 * ```
 */
export async function getTasks(filters?: {
  completed?: boolean
  priority?: 'low' | 'medium' | 'high'
  startDate?: string
  endDate?: string
  parentId?: string | null
}): Promise<Task[]> {
  const token = getToken()
  return await callInternalTool<Task[]>('getTasks', filters || {}, token)
}

/**
 * Get a single task by ID
 *
 * @example
 * ```typescript
 * const task = await getTask('task-id-123')
 * console.log(task.title)
 * ```
 */
export async function getTask(taskId: string): Promise<Task> {
  const token = getToken()
  return await callInternalTool<Task>('getTask', { taskId }, token)
}

/**
 * Create a new task
 *
 * @example
 * ```typescript
 * const newTask = await createTask({
 *   title: 'Complete project proposal',
 *   description: 'Write and submit the Q1 project proposal',
 *   priority: 'high',
 *   dueDate: new Date('2025-01-15').toISOString()
 * })
 * ```
 */
export async function createTask(params: {
  title: string
  description?: string
  priority?: 'low' | 'medium' | 'high'
  dueDate?: string
  parentId?: string
  tags?: string[]
}): Promise<Task> {
  const token = getToken()
  return await callInternalTool<Task>('createTask', params, token)
}

/**
 * Update an existing task
 *
 * @example
 * ```typescript
 * // Mark task as completed
 * const updated = await updateTask('task-id-123', { completed: true })
 *
 * // Change priority and due date
 * const updated = await updateTask('task-id-123', {
 *   priority: 'high',
 *   dueDate: new Date('2025-01-20').toISOString()
 * })
 * ```
 */
export async function updateTask(
  taskId: string,
  updates: {
    title?: string
    description?: string
    priority?: 'low' | 'medium' | 'high'
    dueDate?: string | null
    completed?: boolean
    tags?: string[]
  }
): Promise<Task> {
  const token = getToken()
  return await callInternalTool<Task>('updateTask', { taskId, ...updates }, token)
}

/**
 * Delete a task
 *
 * @example
 * ```typescript
 * await deleteTask('task-id-123')
 * ```
 */
export async function deleteTask(taskId: string): Promise<{ success: boolean }> {
  const token = getToken()
  return await callInternalTool<{ success: boolean }>('deleteTask', { taskId }, token)
}

/**
 * Get subtasks of a parent task
 *
 * @example
 * ```typescript
 * const subtasks = await getSubtasks('parent-task-id')
 * console.log(`Found ${subtasks.length} subtasks`)
 * ```
 */
export async function getSubtasks(taskId: string): Promise<Task[]> {
  const token = getToken()
  return await callInternalTool<Task[]>('getSubtasks', { taskId }, token)
}
