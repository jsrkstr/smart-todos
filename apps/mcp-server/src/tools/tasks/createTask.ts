import { JWTAuth } from '../../auth/jwt'
import { TaskService } from '../../services/database'
import { CreateTaskInput, CreateTaskSchema } from '../../types'

export const createTaskToolDefinition = {
  name: 'createTask',
  description: 'Create a new task for the authenticated user',
  inputSchema: {
    type: 'object',
    properties: {
      token: {
        type: 'string',
        description: 'JWT authentication token'
      },
      title: {
        type: 'string',
        description: 'Task title'
      },
      description: {
        type: 'string',
        description: 'Task description'
      },
      priority: {
        type: 'string',
        enum: ['low', 'medium', 'high'],
        description: 'Task priority'
      },
      dueDate: {
        type: 'string',
        description: 'Task due date (ISO 8601)'
      },
      parentId: {
        type: 'string',
        description: 'Parent task ID for subtasks'
      },
      tags: {
        type: 'array',
        items: { type: 'string' },
        description: 'Array of tag IDs'
      }
    },
    required: ['token', 'title']
  }
}

export async function createTask(params: CreateTaskInput) {
  // Validate input
  const validated = CreateTaskSchema.parse(params)

  // Authenticate and get userId
  const { userId } = await JWTAuth.verify(validated.token)

  // Prepare task data
  const taskData: any = {
    title: validated.title,
    description: validated.description,
    priority: validated.priority,
    parentId: validated.parentId,
    tags: validated.tags
  }

  if (validated.dueDate) {
    taskData.dueDate = new Date(validated.dueDate)
  }

  // Create task
  const task = await TaskService.createTask(userId, taskData)

  return {
    success: true,
    data: task,
    message: 'Task created successfully'
  }
}
