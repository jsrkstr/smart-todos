import { NextResponse } from 'next/server'
import { TaskStatus, ReminderTimeOption } from '@prisma/client'
import { AuthenticatedApiRequest, withAuth } from '@/lib/api-middleware'
import { TaskService } from '@/lib/services/taskService'
import type { CreateTaskInput, UpdateTaskInput } from '@/lib/services/taskService'

interface SubTaskPayload {
  title: string
  status?: TaskStatus
  position?: number
}

// GET /api/tasks
export const GET = withAuth(async (req: AuthenticatedApiRequest): Promise<NextResponse> => {
  try {
    const tasks = await TaskService.getTasks(req.user.id)

    return NextResponse.json(tasks.map(task => ({
      ...task,
      date: task.date.toISOString(),
      deadline: task.deadline?.toISOString() || null,
      dateAdded: task.dateAdded.toISOString(),
    })))
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
        date: new Date(payload.date),
        time: payload.time,
        deadline: payload.deadline ? new Date(payload.deadline) : undefined,
        priority: payload.priority || 'medium',
        stage: payload.stage || 'Refinement',
        estimatedTimeMinutes: payload.estimatedTimeMinutes,
        location: payload.location,
        why: payload.why,
        subTasks: payload.subTasks?.map((st: SubTaskPayload) => ({
          title: st.title,
          status: st.status || TaskStatus.new,
          position: st.position
        }))
      }
    } catch (jsonError) {
      const errorMessage: string = jsonError instanceof Error ? jsonError.message : 'Unknown error'
      console.error('Invalid JSON in request body:', errorMessage)
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 })
    }
    
    if (!taskData || !taskData.title) {
      console.error('Invalid task data received:', taskData)
      return NextResponse.json({ error: 'Invalid task data' }, { status: 400 })
    }

    const newTask = await TaskService.createTask(taskData)

    return NextResponse.json({
      ...newTask,
      date: newTask.date.toISOString(),
      deadline: newTask.deadline?.toISOString() || null,
      dateAdded: newTask.dateAdded.toISOString(),
    })
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
        why: payload.why,
        subTasks: payload.subTasks?.map((st: SubTaskPayload) => ({
          title: st.title,
          status: st.status || TaskStatus.new,
          position: st.position
        }))
      }
    } catch (jsonError) {
      const errorMessage: string = jsonError instanceof Error ? jsonError.message : 'Unknown error'
      console.error('Invalid JSON in request body:', errorMessage)
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 })
    }

    const task = await TaskService.updateTask(taskData)

    return NextResponse.json({
      ...task,
      date: task.date.toISOString(),
      deadline: task.deadline?.toISOString() || null,
      dateAdded: task.dateAdded.toISOString(),
    })
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