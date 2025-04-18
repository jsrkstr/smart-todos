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
    // TaskService.processTask will handle the breakdown logic based on the task's stage
    const tasks = await TaskService.prioritizeTasks({
      userId: req.user.id,
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