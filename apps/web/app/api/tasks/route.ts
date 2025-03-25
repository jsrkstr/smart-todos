import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/tasks
export async function GET() {
  try {
    const user = await prisma.user.findFirst()
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const tasks = await prisma.task.findMany({
      where: { userId: user.id },
      include: { subTasks: true },
      orderBy: { dateAdded: 'desc' }
    })

    return NextResponse.json(tasks.map(task => ({
      ...task,
      date: task.date.toISOString(),
      deadline: task.deadline?.toISOString() || null,
      dateAdded: task.dateAdded.toISOString(),
      reminderTime: task.reminderTime?.toISOString() || null,
    })))
  } catch (error) {
    console.error('Failed to get tasks:', error)
    return NextResponse.json({ error: 'Failed to get tasks' }, { status: 500 })
  }
}

// POST /api/tasks
export async function POST(request: Request) {
  try {
    const taskData = await request.json()
    const user = await prisma.user.findFirst()
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { subTasks, ...taskWithoutSubTasks } = taskData
    const newTask = await prisma.task.create({
      data: {
        ...taskWithoutSubTasks,
        date: new Date(taskData.date),
        deadline: taskData.deadline ? new Date(taskData.deadline) : null,
        dateAdded: new Date(taskData.dateAdded),
        reminderTime: taskData.reminderTime ? new Date(taskData.reminderTime) : null,
        userId: user.id,
        subTasks: {
          create: subTasks || []
        }
      },
      include: { subTasks: true }
    })

    return NextResponse.json({
      ...newTask,
      date: newTask.date.toISOString(),
      deadline: newTask.deadline?.toISOString() || null,
      dateAdded: newTask.dateAdded.toISOString(),
      reminderTime: newTask.reminderTime?.toISOString() || null,
    })
  } catch (error) {
    console.error('Failed to create task:', error)
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
  }
}

// PUT /api/tasks
export async function PUT(request: Request) {
  try {
    const { id, ...updates } = await request.json()
    const task = await prisma.task.update({
      where: { id },
      data: {
        ...updates,
        date: updates.date ? new Date(updates.date) : undefined,
        deadline: updates.deadline ? new Date(updates.deadline) : undefined,
        reminderTime: updates.reminderTime ? new Date(updates.reminderTime) : undefined,
        subTasks: updates.subTasks ? {
          deleteMany: {},
          create: updates.subTasks
        } : undefined
      },
      include: { subTasks: true }
    })

    return NextResponse.json({
      ...task,
      date: task.date.toISOString(),
      deadline: task.deadline?.toISOString() || null,
      dateAdded: task.dateAdded.toISOString(),
      reminderTime: task.reminderTime?.toISOString() || null,
    })
  } catch (error) {
    console.error('Failed to update task:', error)
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 })
  }
}

// DELETE /api/tasks
export async function DELETE(request: Request) {
  try {
    const { id } = await request.json()
    await prisma.task.delete({
      where: { id }
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete task:', error)
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 })
  }
} 