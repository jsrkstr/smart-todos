import { JWTAuth } from '../../auth/jwt';
import { TaskService } from '../../services/database';
import { GetTaskSchema } from '../../types';
export const getTaskToolDefinition = {
    name: 'getTask',
    description: 'Get a single task by ID with full details including tags, subtasks, notifications, and pomodoros',
    inputSchema: {
        type: 'object',
        properties: {
            token: {
                type: 'string',
                description: 'JWT authentication token'
            },
            taskId: {
                type: 'string',
                description: 'Task ID to retrieve'
            }
        },
        required: ['token', 'taskId']
    }
};
export async function getTask(params) {
    // Validate input
    const validated = GetTaskSchema.parse(params);
    // Authenticate and get userId
    const { userId } = await JWTAuth.verify(validated.token);
    // Fetch task
    const task = await TaskService.getTask(validated.taskId, userId);
    if (!task) {
        throw new Error('Task not found or access denied');
    }
    return {
        success: true,
        data: task
    };
}
//# sourceMappingURL=getTask.js.map