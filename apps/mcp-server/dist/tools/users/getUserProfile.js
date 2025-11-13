import { JWTAuth } from '../../auth/jwt';
import { UserService } from '../../services/database';
import { GetUserProfileSchema } from '../../types';
export const getUserProfileToolDefinition = {
    name: 'getUserProfile',
    description: 'Get the authenticated user\'s profile information',
    inputSchema: {
        type: 'object',
        properties: {
            token: {
                type: 'string',
                description: 'JWT authentication token'
            }
        },
        required: ['token']
    }
};
export async function getUserProfile(params) {
    // Validate input
    const validated = GetUserProfileSchema.parse(params);
    // Authenticate and get userId
    const { userId } = await JWTAuth.verify(validated.token);
    // Fetch user profile
    const profile = await UserService.getUserProfile(userId);
    if (!profile) {
        throw new Error('User profile not found');
    }
    return {
        success: true,
        data: profile
    };
}
//# sourceMappingURL=getUserProfile.js.map