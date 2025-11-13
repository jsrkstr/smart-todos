/**
 * Pomodoro tools as code APIs
 * These functions can be imported and called from agent-generated code
 */
/**
 * Pomodoro session structure
 */
export interface PomodoroSession {
    id: string;
    userId: string;
    taskId: string | null;
    duration: number;
    completed: boolean;
    startedAt: string;
    createdAt: string;
}
/**
 * Get pomodoro sessions with optional filtering
 *
 * @example
 * ```typescript
 * // Get all pomodoro sessions
 * const sessions = await getPomodoros()
 *
 * // Get sessions for a specific task
 * const taskSessions = await getPomodoros({ taskId: 'task-123' })
 *
 * // Get sessions from last week
 * const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
 * const recentSessions = await getPomodoros({
 *   startDate: lastWeek.toISOString()
 * })
 *
 * // Calculate total focus time
 * const totalMinutes = sessions
 *   .filter(s => s.completed)
 *   .reduce((sum, s) => sum + s.duration, 0)
 * ```
 */
export declare function getPomodoros(filters?: {
    taskId?: string;
    startDate?: string;
    endDate?: string;
}): Promise<PomodoroSession[]>;
/**
 * Create a new pomodoro session
 *
 * @example
 * ```typescript
 * // Log a completed 25-minute pomodoro
 * const session = await createPomodoro({
 *   duration: 25,
 *   completed: true,
 *   taskId: 'task-123'
 * })
 *
 * // Log an incomplete session
 * const session = await createPomodoro({
 *   duration: 15,
 *   completed: false
 * })
 * ```
 */
export declare function createPomodoro(params: {
    taskId?: string;
    duration: number;
    completed: boolean;
}): Promise<PomodoroSession>;
//# sourceMappingURL=index.d.ts.map