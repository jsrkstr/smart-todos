import { JWTAuth } from '../../auth/jwt'
import { UserService } from '../../services/database'
import { GetPsychProfileInput, GetPsychProfileSchema } from '../../types'

export const getPsychProfileToolDefinition = {
  name: 'getPsychProfile',
  description: 'Get the authenticated user\'s psychological profile including matched coach information',
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

export async function getPsychProfile(params: GetPsychProfileInput) {
  // Validate input
  const validated = GetPsychProfileSchema.parse(params)

  // Authenticate and get userId
  const { userId } = await JWTAuth.verify(validated.token)

  // Fetch psychological profile
  const profile = await UserService.getPsychProfile(userId)

  if (!profile) {
    return {
      success: true,
      data: null,
      message: 'Psychological profile not yet created'
    }
  }

  return {
    success: true,
    data: profile
  }
}
