import { NextResponse } from 'next/server'
import { AuthenticatedApiRequest, withAuth } from '@/lib/api-middleware'
import { TaskService } from '@/lib/services/taskService'
import type { ProcessTaskInput } from '@/lib/services/taskService'
import { Task, Prisma } from '@prisma/client'

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

// PUT /api/tasks/breakdown
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
    const response = await TaskService.processTask({
      id: taskData.id,
      userId: taskData.userId,
      nextStage: 'Breakdown',
    })

    // Use the specific type here
    const updatedTask = response.task as TaskWithRelations | null;

    // Return the updated task if successful, otherwise indicate processing (e.g., question asked)
    if (response.response_type === 'task_details' && updatedTask) {
      // Ensure dates are serialized correctly
      return NextResponse.json({
        task: {
          ...updatedTask,
          date: updatedTask.date.toISOString(),
          deadline: updatedTask.deadline?.toISOString() || null,
          // Include children if they were added/updated
          children: updatedTask.children?.map((child: Task) => ({
            ...child,
            date: child.date.toISOString(),
            deadline: child.deadline?.toISOString() || null,
          })) || [],
        }
      })
    } else {
      // Indicate that processing is ongoing (e.g., a question was asked)
      // The client-side useTasks hook will handle polling or checking messages
      return NextResponse.json({
        task: null,
        message: response.message // Forward the message (e.g., the question)
      })
    }
  } catch (error) {
    const errorMessage: string = error instanceof Error ? error.message : 'Unknown error'
    console.error('Failed to breakdown task:', error, errorMessage)
    return NextResponse.json({ error: 'Failed to breakdown task' }, { status: 500 })
  }
}) 