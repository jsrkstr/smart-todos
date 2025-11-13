/**
 * Task tools as code APIs
 * These functions can be imported and called from agent-generated code
 */
/**
 * Task object structure
 */
export interface Task {
    id: string;
    title: string;
    description: string | null;
    completed: boolean;
    priority: 'low' | 'medium' | 'high';
    dueDate: string | null;
    createdAt: string;
    updatedAt: string;
    userId: string;
    parentId: string | null;
    tags: Array<{
        id: string;
        name: string;
    }>;
    subtasks?: Task[];
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
export declare function getTasks(filters?: {
    completed?: boolean;
    priority?: 'low' | 'medium' | 'high';
    startDate?: string;
    endDate?: string;
    parentId?: string | null;
}): Promise<Task[]>;
/**
 * Get a single task by ID
 *
 * @example
 * ```typescript
 * const task = await getTask('task-id-123')
 * console.log(task.title)
 * ```
 */
export declare function getTask(taskId: string): Promise<Task>;
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
export declare function createTask(params: {
    title: string;
    description?: string;
    priority?: 'low' | 'medium' | 'high';
    dueDate?: string;
    parentId?: string;
    tags?: string[];
}): Promise<Task>;
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
export declare function updateTask(taskId: string, updates: {
    title?: string;
    description?: string;
    priority?: 'low' | 'medium' | 'high';
    dueDate?: string | null;
    completed?: boolean;
    tags?: string[];
}): Promise<Task>;
/**
 * Delete a task
 *
 * @example
 * ```typescript
 * await deleteTask('task-id-123')
 * ```
 */
export declare function deleteTask(taskId: string): Promise<{
    success: boolean;
}>;
/**
 * Get subtasks of a parent task
 *
 * @example
 * ```typescript
 * const subtasks = await getSubtasks('parent-task-id')
 * console.log(`Found ${subtasks.length} subtasks`)
 * ```
 */
export declare function getSubtasks(taskId: string): Promise<Task[]>;
//# sourceMappingURL=index.d.ts.map