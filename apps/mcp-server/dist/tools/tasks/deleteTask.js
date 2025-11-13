import { JWTAuth } from '../../auth/jwt';
import { TaskService } from '../../services/database';
import { DeleteTaskSchema } from '../../types';
export const deleteTaskToolDefinition = {
    name: 'deleteTask',
    description: 'Delete a task (soft delete - marks as deleted without permanently removing)',
    inputSchema: {
        type: 'object',
        properties: {
            token: {
                type: 'string',
                description: 'JWT authentication token'
            },
            taskId: {
                type: 'string',
                description: 'Task ID to delete'
            }
        },
        required: ['token', 'taskId']
    }
};
export async function deleteTask(params) {
    // Validate input
    const validated = DeleteTaskSchema.parse(params);
    // Authenticate and get userId
    const { userId } = await JWTAuth.verify(validated.token);
    // Delete task
    await TaskService.deleteTask(validated.taskId, userId);
    return {
        success: true,
        message: 'Task deleted successfully'
    };
}
//# sourceMappingURL=deleteTask.js.map