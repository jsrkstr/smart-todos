import { JWTAuth } from '../../auth/jwt'
import { UserService } from '../../services/database'
import { GetUserSettingsInput, GetUserSettingsSchema } from '../../types'

export const getUserSettingsToolDefinition = {
  name: 'getUserSettings',
  description: 'Get the authenticated user\'s settings including pomodoro preferences and notification settings',
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
}

export async function getUserSettings(params: GetUserSettingsInput) {
  // Validate input
  const validated = GetUserSettingsSchema.parse(params)

  // Authenticate and get userId
  const { userId } = await JWTAuth.verify(validated.token)

  // Fetch user settings
  const settings = await UserService.getUserSettings(userId)

  if (!settings) {
    return {
      success: true,
      data: null,
      message: 'Settings not yet configured'
    }
  }

  return {
    success: true,
    data: settings
  }
}
