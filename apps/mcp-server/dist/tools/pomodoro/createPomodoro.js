import { JWTAuth } from '../../auth/jwt';
import { PomodoroService } from '../../services/database';
import { CreatePomodoroSchema } from '../../types';
export const createPomodoroToolDefinition = {
    name: 'createPomodoro',
    description: 'Create a new pomodoro session for the authenticated user',
    inputSchema: {
        type: 'object',
        properties: {
            token: {
                type: 'string',
                description: 'JWT authentication token'
            },
            taskId: {
                type: 'string',
                description: 'Associated task ID'
            },
            duration: {
                type: 'number',
                description: 'Session duration in minutes'
            },
            completed: {
                type: 'boolean',
                description: 'Whether the session was completed'
            }
        },
        required: ['token', 'duration', 'completed']
    }
};
export async function createPomodoro(params) {
    // Validate input
    const validated = CreatePomodoroSchema.parse(params);
    // Authenticate and get userId
    const { userId } = await JWTAuth.verify(validated.token);
    // Create pomodoro session
    const pomodoro = await PomodoroService.createPomodoro(userId, {
        taskId: validated.taskId,
        duration: validated.duration,
        completed: validated.completed
    });
    return {
        success: true,
        data: pomodoro,
        message: 'Pomodoro session created successfully'
    };
}
//# sourceMappingURL=createPomodoro.js.map