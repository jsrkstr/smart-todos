import { NextResponse } from 'next/server'
import { AuthenticatedApiRequest, withAuth } from '@/lib/api-middleware'
import { TaskService } from '@/lib/services/taskService'
import { Task, Prisma } from '@prisma/client'
import { ProcessTaskInput } from '@/lib/services/interfaces'

// Define a type for Task with expected relations
type TaskWithRelations = Prisma.TaskGetPayload<{
  include: {
    children: true,
    tags: {
      include: {
        category: true
      }
    },
    notifications: true
  }
}>

// PUT /api/tasks/prioritize
export const PUT = withAuth(async (req: AuthenticatedApiRequest): Promise<NextResponse> => {
  try {
    let taskData: ProcessTaskInput
    try {
      const payload = await req.json()
      if (!payload || !payload.id) {
        return NextResponse.json({ error: 'Missing task ID' }, { status: 400 })
      }

      taskData = {
        id: payload.id,
        userId: req.user.id,
      };
    } catch (jsonError) {
      const errorMessage: string = jsonError instanceof Error ? jsonError.message : 'Unknown error'
      console.error('Invalid JSON in request body:', errorMessage)
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 })
    }

    // TaskService.processTask will handle the breakdown logic based on the task's stage
    const tasks = await TaskService.prioritizeTasks({
      userId: taskData.userId,
    })

    return NextResponse.json({
      tasks,
    })
  } catch (error) {
    const errorMessage: string = error instanceof Error ? error.message : 'Unknown error'
    console.error('Failed to breakdown task:', error, errorMessage)
    return NextResponse.json({ error: 'Failed to breakdown task' }, { status: 500 })
  }
}) 