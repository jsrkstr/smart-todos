import { JWTAuth } from '../../auth/jwt';
import { PomodoroService } from '../../services/database';
import { GetPomodorosSchema } from '../../types';
export const getPomodorosToolDefinition = {
    name: 'getPomodoros',
    description: 'Get pomodoro sessions for the authenticated user with optional filtering',
    inputSchema: {
        type: 'object',
        properties: {
            token: {
                type: 'string',
                description: 'JWT authentication token'
            },
            taskId: {
                type: 'string',
                description: 'Filter by task ID'
            },
            startDate: {
                type: 'string',
                description: 'Filter sessions after this date (ISO 8601)'
            },
            endDate: {
                type: 'string',
                description: 'Filter sessions before this date (ISO 8601)'
            }
        },
        required: ['token']
    }
};
export async function getPomodoros(params) {
    // Validate input
    const validated = GetPomodorosSchema.parse(params);
    // Authenticate and get userId
    const { userId } = await JWTAuth.verify(validated.token);
    // Build filters
    const filters = {};
    if (validated.taskId) {
        filters.taskId = validated.taskId;
    }
    if (validated.startDate) {
        filters.startDate = new Date(validated.startDate);
    }
    if (validated.endDate) {
        filters.endDate = new Date(validated.endDate);
    }
    // Fetch pomodoros
    const pomodoros = await PomodoroService.getPomodoros(userId, filters);
    return {
        success: true,
        data: pomodoros,
        count: pomodoros.length
    };
}
//# sourceMappingURL=getPomodoros.js.map