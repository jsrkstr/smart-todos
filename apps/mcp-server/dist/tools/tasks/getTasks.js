import { JWTAuth } from '../../auth/jwt';
import { TaskService } from '../../services/database';
import { GetTasksSchema } from '../../types';
export const getTasksToolDefinition = {
    name: 'getTasks',
    description: 'Get all tasks for the authenticated user with optional filtering by completion status, priority, date range, or parent task',
    inputSchema: {
        type: 'object',
        properties: {
            token: {
                type: 'string',
                description: 'JWT authentication token'
            },
            completed: {
                type: 'boolean',
                description: 'Filter by completion status'
            },
            priority: {
                type: 'string',
                enum: ['low', 'medium', 'high'],
                description: 'Filter by priority'
            },
            startDate: {
                type: 'string',
                description: 'Filter tasks due after this date (ISO 8601)'
            },
            endDate: {
                type: 'string',
                description: 'Filter tasks due before this date (ISO 8601)'
            },
            parentId: {
                type: 'string',
                description: 'Filter by parent task ID (null for root tasks)'
            }
        },
        required: ['token']
    }
};
export async function getTasks(params) {
    // Validate input
    const validated = GetTasksSchema.parse(params);
    // Authenticate and get userId
    const { userId } = await JWTAuth.verify(validated.token);
    // Build filters
    const filters = {};
    if (validated.completed !== undefined) {
        filters.completed = validated.completed;
    }
    if (validated.priority) {
        filters.priority = validated.priority;
    }
    if (validated.startDate) {
        filters.startDate = new Date(validated.startDate);
    }
    if (validated.endDate) {
        filters.endDate = new Date(validated.endDate);
    }
    if (validated.parentId !== undefined) {
        filters.parentId = validated.parentId;
    }
    // Fetch tasks
    const tasks = await TaskService.getTasks(userId, filters);
    return {
        success: true,
        data: tasks,
        count: tasks.length
    };
}
//# sourceMappingURL=getTasks.js.map