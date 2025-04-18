import { NextResponse } from 'next/server'
import { ReminderTimeOption } from '@prisma/client'
import { AuthenticatedApiRequest, withAuth } from '@/lib/api-middleware'
import { TaskService } from '@/lib/services/taskService'
import type { CreateTaskInput, UpdateTaskInput } from '@/lib/services/taskService'
import { Tag } from '@/types/tag'

// Interface for notification data coming from the client
interface NotificationPayload {
  id?: string
  mode: "Push" | "Chat" | "Email";
  type: "Info" | "Question" | "Reminder"
  trigger?: "FixedTime" | "RelativeTime" | "Location"
  message: string; // Required message field
  relativeTimeValue?: number;
  relativeTimeUnit?: "Minutes" | "Hours" | "Days"
  fixedTime?: string; // ISO string for fixed time notifications
  author: "User" | "Bot" | "Model"
}

// Interface for child task data coming from the client
interface ChildTaskPayload {
  title: string
  priority?: string
  stage?: string
  position?: number
}

// GET /api/tasks
export const GET = withAuth(async (req: AuthenticatedApiRequest): Promise<NextResponse> => {
  try {
    const tasks = await TaskService.getTasks(req.user.id)

    return NextResponse.json(tasks)
  } catch (error) {
    const errorMessage: string = error instanceof Error ? error.message : 'Unknown error'
    console.error('Failed to get tasks:', errorMessage)
    return NextResponse.json({ error: 'Failed to get tasks' }, { status: 500 })
  }
})

// POST /api/tasks
export const POST = withAuth(async (req: AuthenticatedApiRequest): Promise<NextResponse> => {
  try {
    let taskData: CreateTaskInput
    try {
      const payload = await req.json()
      taskData = {
        userId: req.user.id,
        title: payload.title,
        description: payload.description,
        date: payload.date ? new Date(payload.date) : undefined,
        deadline: payload.deadline ? new Date(payload.deadline) : undefined,
        priority: payload.priority || 'medium',
        stage: payload.stage || 'Refinement',
        estimatedTimeMinutes: payload.estimatedTimeMinutes,
        location: payload.location,
        why: payload.why,
        parentId: payload.parentId,
        notifications: payload.notifications?.map((notification: NotificationPayload) => ({
          mode: notification.mode,
          type: notification.type,
          trigger: notification.trigger,
          message: notification.message || `Reminder for: ${payload.title}`,
          relativeTimeValue: notification.relativeTimeValue,
          relativeTimeUnit: notification.relativeTimeUnit,
          fixedTime: notification.fixedTime ? new Date(notification.fixedTime) : undefined,
          author: notification.author,
        })),
        children: payload.children?.map((child: ChildTaskPayload) => ({
          title: child.title,
          priority: child.priority || 'medium',
        }))
      }
    } catch (jsonError) {
      const errorMessage: string = jsonError instanceof Error ? jsonError.message : 'Unknown error'
      console.error('Invalid JSON in request body:', errorMessage)
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 })
    }
    
    if (!taskData) {
      console.error('Invalid task data received:', taskData)
      return NextResponse.json({ error: 'Invalid task data' }, { status: 400 })
    }

    const newTask = await TaskService.createTask(taskData)

    return NextResponse.json(newTask)
  } catch (error) {
    const errorMessage: string = error instanceof Error ? error.message : 'Unknown error'
    console.error('Failed to create task:', errorMessage)
    return NextResponse.json({ 
      error: 'Failed to create task', 
      details: errorMessage
    }, { status: 500 })
  }
})

// PUT /api/tasks
export const PUT = withAuth(async (req: AuthenticatedApiRequest): Promise<NextResponse> => {
  try {
    let taskData: UpdateTaskInput
    try {
      const payload = await req.json()
      if (!payload || !payload.id) {
        return NextResponse.json({ error: 'Missing task ID' }, { status: 400 })
      }

      taskData = {
        id: payload.id,
        userId: req.user.id,
        title: payload.title,
        description: payload.description,
        date: payload.date ? new Date(payload.date) : undefined,
        time: payload.time,
        deadline: payload.deadline ? new Date(payload.deadline) : undefined,
        priority: payload.priority,
        stage: payload.stage,
        estimatedTimeMinutes: payload.estimatedTimeMinutes,
        location: payload.location,
        repeats: payload.repeats,
        why: payload.why,
        tagIds: payload.tags ? payload.tags.map((t: Tag) => t.id) : undefined,
        completed: payload.completed,
        notifications: payload.notifications,
        children: payload.children,
      }
    } catch (jsonError) {
      const errorMessage: string = jsonError instanceof Error ? jsonError.message : 'Unknown error'
      console.error('Invalid JSON in request body:', errorMessage)
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 })
    }

    const task = await TaskService.updateTask(taskData)

    return NextResponse.json(task)
  } catch (error) {
    const errorMessage: string = error instanceof Error ? error.message : 'Unknown error'
    console.error('Failed to update task:', errorMessage)
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 })
  }
})

// DELETE /api/tasks
export const DELETE = withAuth(async (req: AuthenticatedApiRequest): Promise<NextResponse> => {
  try {
    let payload: { id: string }
    try {
      payload = await req.json()
    } catch (jsonError) {
      const errorMessage: string = jsonError instanceof Error ? jsonError.message : 'Unknown error'
      console.error('Invalid JSON in request body:', errorMessage)
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 })
    }
    
    if (!payload || !payload.id) {
      return NextResponse.json({ error: 'Missing task ID' }, { status: 400 })
    }

    await TaskService.deleteTask(payload.id, req.user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    const errorMessage: string = error instanceof Error ? error.message : 'Unknown error'
    console.error('Failed to delete task:', errorMessage)
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 })
  }
}) 