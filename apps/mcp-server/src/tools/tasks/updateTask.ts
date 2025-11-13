import { JWTAuth } from '../../auth/jwt'
import { TaskService } from '../../services/database'
import { UpdateTaskInput, UpdateTaskSchema } from '../../types'

export const updateTaskToolDefinition = {
  name: 'updateTask',
  description: 'Update an existing task',
  inputSchema: {
    type: 'object',
    properties: {
      token: {
        type: 'string',
        description: 'JWT authentication token'
      },
      taskId: {
        type: 'string',
        description: 'Task ID to update'
      },
      title: {
        type: 'string',
        description: 'New task title'
      },
      description: {
        type: 'string',
        description: 'New task description'
      },
      priority: {
        type: 'string',
        enum: ['low', 'medium', 'high'],
        description: 'New task priority'
      },
      dueDate: {
        type: 'string',
        description: 'New task due date (ISO 8601)'
      },
      completed: {
        type: 'boolean',
        description: 'Task completion status'
      },
      tags: {
        type: 'array',
        items: { type: 'string' },
        description: 'Array of tag IDs'
      }
    },
    required: ['token', 'taskId']
  }
}

export async function updateTask(params: UpdateTaskInput) {
  // Validate input
  const validated = UpdateTaskSchema.parse(params)

  // Authenticate and get userId
  const { userId } = await JWTAuth.verify(validated.token)

  // Prepare update data
  const updateData: any = {}

  if (validated.title !== undefined) {
    updateData.title = validated.title
  }

  if (validated.description !== undefined) {
    updateData.description = validated.description
  }

  if (validated.priority !== undefined) {
    updateData.priority = validated.priority
  }

  if (validated.dueDate !== undefined) {
    updateData.dueDate = validated.dueDate ? new Date(validated.dueDate) : null
  }

  if (validated.completed !== undefined) {
    updateData.completed = validated.completed
  }

  if (validated.tags !== undefined) {
    updateData.tags = validated.tags
  }

  // Update task
  const task = await TaskService.updateTask(validated.taskId, userId, updateData)

  return {
    success: true,
    data: task,
    message: 'Task updated successfully'
  }
}
