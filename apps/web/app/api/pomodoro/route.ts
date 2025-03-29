import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { PomodoroStatus, PomodoroType } from "@/types/pomodoro"
import { AuthenticatedApiRequest, withAuth } from '@/lib/api-middleware'
import { z } from "zod"

// Validation schema for creating/updating a pomodoro
const pomodoroSchema = z.object({
  type: z.enum(["focus", "shortBreak", "longBreak"]),
  status: z.enum(["active", "finished", "cancelled"]),
  taskMode: z.enum(["single", "multi", "free"]),
  taskIds: z.array(z.string()).optional(),
  startTime: z.string().optional(), // ISO string for start time
  endTime: z.string().optional(),   // ISO string for end time
  settings: z.record(z.any()).optional()
})

/**
 * GET /api/pomodoro
 * Get the current active pomodoro session
 */
export const GET = withAuth(async (req: AuthenticatedApiRequest) => {
  try {
    // Find active pomodoro session
    const activePomodoro = await prisma.pomodoro.findFirst({
      where: {
        userId: req.user.id,
        status: "active",
      },
      include: {
        pomodoroTasks: {
          include: {
            task: true,
          },
          orderBy: {
            position: "asc",
          },
        },
      },
    })

    if (!activePomodoro) {
      return NextResponse.json({ 
        active: false
      })
    }

    // Calculate remaining time
    const startTime = new Date(activePomodoro.startTime)
    const now = new Date()
    const elapsedSeconds = Math.floor((now.getTime() - startTime.getTime()) / 1000)
    
    // Parse settings if available
    const settings = activePomodoro.settings as Record<string, any> || {}
    const duration = activePomodoro.type === "focus" 
      ? (settings.pomodoroDuration || 25) * 60
      : activePomodoro.type === "shortBreak"
      ? (settings.shortBreakDuration || 5) * 60
      : (settings.longBreakDuration || 15) * 60
    
    // Calculate remaining time (don't go below 0)
    const remainingTime = Math.max(0, duration - elapsedSeconds)
    
    // Format tasks for response
    const tasks = activePomodoro.pomodoroTasks.map((pt: any) => ({
      id: pt.task.id,
      title: pt.task.title,
      completed: pt.completed,
      position: pt.position
    }))

    return NextResponse.json({
      active: true,
      id: activePomodoro.id,
      type: activePomodoro.type,
      taskMode: activePomodoro.taskMode || "single",
      startTime: activePomodoro.startTime,
      endTime: activePomodoro.endTime,
      status: activePomodoro.status,
      remainingTime,
      tasks,
      settings: activePomodoro.settings,
    })
  } catch (error) {
    console.error("Error fetching pomodoro:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
})

/**
 * POST /api/pomodoro
 * Create or update a pomodoro session
 */
export const POST = withAuth(async (req: AuthenticatedApiRequest) => {
  try {
    // Parse request body
    const body = await req.json()
    const validatedData = pomodoroSchema.parse(body)

    // Get user settings
    const userSettings = await prisma.settings.findUnique({
      where: { userId: req.user.id }
    })

    // Close any existing active sessions
    await prisma.pomodoro.updateMany({
      where: {
        userId: req.user.id,
        status: "active"
      },
      data: {
        status: "cancelled",
        endTime: new Date()
      }
    })

    // If status is active, create a new pomodoro
    if (validatedData.status === "active") {
      // Create the pomodoro
      const pomodoro = await prisma.pomodoro.create({
        data: {
          type: validatedData.type,
          status: validatedData.status,
          startTime: validatedData.startTime ? new Date(validatedData.startTime) : new Date(),
          taskMode: validatedData.taskMode,
          settings: userSettings || undefined,
          userId: req.user.id,
        }
      })

      // Add task associations if provided
      if (validatedData.taskIds && validatedData.taskIds.length > 0) {
        // Create pomodoro task entries
        await Promise.all(validatedData.taskIds.map(async (taskId, index) => {
          await prisma.pomodoroTask.create({
            data: {
              pomodoroId: pomodoro.id,
              taskId,
              position: index
            }
          })
        }))
      }

      // Log pomodoro creation
      await prisma.log.create({
        data: {
          type: 'pomodoro_started',
          userId: req.user.id,
          data: {
            pomodoroId: pomodoro.id,
            type: validatedData.type,
            taskMode: validatedData.taskMode,
            taskCount: validatedData.taskIds?.length || 0
          }
        }
      })

      return NextResponse.json({
        success: true,
        id: pomodoro.id
      })
    } else {
      // Update the status of the most recent pomodoro
      const recentPomodoro = await prisma.pomodoro.findFirst({
        where: {
          userId: req.user.id,
        },
        orderBy: {
          startTime: "desc"
        }
      })

      if (recentPomodoro) {
        await prisma.pomodoro.update({
          where: {
            id: recentPomodoro.id
          },
          data: {
            status: validatedData.status,
            endTime: validatedData.endTime ? new Date(validatedData.endTime) : new Date()
          }
        })

        // Log pomodoro status change
        await prisma.log.create({
          data: {
            type: validatedData.status === 'completed' ? 'pomodoro_completed' : 
                  validatedData.status === 'cancelled' ? 'pomodoro_cancelled' : 
                  'pomodoro_updated',
            userId: req.user.id,
            data: {
              pomodoroId: recentPomodoro.id,
              status: validatedData.status,
              type: recentPomodoro.type
            }
          }
        })

        return NextResponse.json({
          success: true,
          id: recentPomodoro.id
        })
      }

      return NextResponse.json({
        success: false,
        message: "No recent pomodoro found to update"
      })
    }
  } catch (error) {
    console.error("Error creating/updating pomodoro:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data", details: error.format() }, { status: 400 })
    }
    
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
})