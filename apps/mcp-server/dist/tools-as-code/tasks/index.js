/**
 * Task tools as code APIs
 * These functions can be imported and called from agent-generated code
 */
import { callInternalTool, getToken } from '../internal';
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
export async function getTasks(filters) {
    const token = getToken();
    return await callInternalTool('getTasks', filters || {}, token);
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
export async function getTask(taskId) {
    const token = getToken();
    return await callInternalTool('getTask', { taskId }, token);
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
export async function createTask(params) {
    const token = getToken();
    return await callInternalTool('createTask', params, token);
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
export async function updateTask(taskId, updates) {
    const token = getToken();
    return await callInternalTool('updateTask', { taskId, ...updates }, token);
}
/**
 * Delete a task
 *
 * @example
 * ```typescript
 * await deleteTask('task-id-123')
 * ```
 */
export async function deleteTask(taskId) {
    const token = getToken();
    return await callInternalTool('deleteTask', { taskId }, token);
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
export async function getSubtasks(taskId) {
    const token = getToken();
    return await callInternalTool('getSubtasks', { taskId }, token);
}
//# sourceMappingURL=index.js.map