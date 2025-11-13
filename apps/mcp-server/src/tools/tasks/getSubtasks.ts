import { JWTAuth } from '../../auth/jwt'
import { TaskService } from '../../services/database'
import { GetSubtasksInput, GetSubtasksSchema } from '../../types'

export const getSubtasksToolDefinition = {
  name: 'getSubtasks',
  description: 'Get all subtasks for a parent task',
  inputSchema: {
    type: 'object',
    properties: {
      token: {
        type: 'string',
        description: 'JWT authentication token'
      },
      taskId: {
        type: 'string',
        description: 'Parent task ID'
      }
    },
    required: ['token', 'taskId']
  }
}

export async function getSubtasks(params: GetSubtasksInput) {
  // Validate input
  const validated = GetSubtasksSchema.parse(params)

  // Authenticate and get userId
  const { userId } = await JWTAuth.verify(validated.token)

  // Fetch subtasks
  const subtasks = await TaskService.getSubtasks(validated.taskId, userId)

  return {
    success: true,
    data: subtasks,
    count: subtasks.length
  }
}
