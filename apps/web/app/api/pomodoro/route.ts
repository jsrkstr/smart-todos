import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { PomodoroStatus, PomodoroType } from "@/types/pomodoro"
import { AuthenticatedApiRequest, withAuth } from '@/lib/api-middleware'
import { z } from "zod"
import { PomodoroService } from "@/lib/services/pomodoroService"

// Validation schema for creating/updating a pomodoro
const pomodoroSchema = z.object({
  type: z.enum(["focus", "shortBreak", "longBreak"]),
  status: z.enum(["active", "finished", "cancelled", "paused", "resumed"]),
  taskMode: z.enum(["single", "multi", "free"]),
  taskIds: z.array(z.string()).optional(),
  startTime: z.string().optional(), // ISO string for start time
  endTime: z.string().optional(),   // ISO string for end time
  settings: z.record(z.any()).optional(),
  duration: z.number().optional(),
})

const getCompletedPomodoros = async (userId: string) => {
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const allUserPomodoros = await PomodoroService.getUserPomodoros(userId, {
    status: 'finished',
    type: 'focus',
    startDate: todayStart
  });
  return allUserPomodoros.length;
}

/**
 * GET /api/pomodoro
 * Get the current active pomodoro session
 */
export const GET = withAuth(async (req: AuthenticatedApiRequest) => {
  try {
    // Find active pomodoro session using the service
    const latestPomodoro = await PomodoroService.getLatestPomodoro(req.user.id)
    const completedPomodoros = await getCompletedPomodoros(req.user.id)

    if (!latestPomodoro || latestPomodoro.status !== 'active') {
      return NextResponse.json({
        active: false,
        completedPomodoros,
        lastMode: latestPomodoro?.type,
      })
    }

    // const isActiveNow = latestPomodoro
    //   ? (new Date().getTime() - new Date(latestPomodoro.startTime).getTime()) / 1000 < latestPomodoro.duration
    //   : false

    // if (!isActiveNow) {
    //   if (latestPomodoro.status === 'active') {
    //     await PomodoroService.updatePomodoro(latestPomodoro.id, {
    //       status: 'finished',
    //       userId: req.user.id
    //     })
    //   }

    //   return NextResponse.json({
    //     active: false,
    //     completedPomodoros,
    //     lastMode: latestPomodoro?.type,
    //   })
    // }

    return NextResponse.json({
      active: true,
      id: latestPomodoro.id,
      type: latestPomodoro.type,
      taskMode: latestPomodoro.taskMode || "single",
      startTime: latestPomodoro.startTime,
      endTime: latestPomodoro.endTime,
      status: latestPomodoro.status,
      tasks: latestPomodoro.tasks ? latestPomodoro.tasks.map(task => ({
        id: task.id,
        title: task.title
      })) : null,
      settings: latestPomodoro.settings,
      duration: latestPomodoro.duration,
      completedPomodoros,
      lastMode: latestPomodoro.type,
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

    // Close any existing active sessions if creating a new active pomodoro
    if (validatedData.status === "active") {
      const activePomodoro = await PomodoroService.getActivePomodoro(req.user.id)

      if (activePomodoro) {
        const isActiveNow = activePomodoro
          ? (new Date().getTime() - new Date(activePomodoro.startTime).getTime()) / 1000 < activePomodoro.duration
          : false

        await PomodoroService.updatePomodoro(activePomodoro.id, {
          status: isActiveNow ? "cancelled" : "finished",
          endTime: isActiveNow ? new Date() : undefined,
          userId: req.user.id
        })
      }

      // Create a new pomodoro using the service
      const pomodoro = await PomodoroService.createPomodoro({
        type: validatedData.type,
        status: validatedData.status,
        startTime: validatedData.startTime ? new Date(validatedData.startTime) : new Date(),
        taskMode: validatedData.taskMode,
        settings: userSettings || undefined,
        userId: req.user.id,
        tasks: validatedData.taskIds || [],
        duration: validatedData.duration
      })

      return NextResponse.json({
        success: true,
        id: pomodoro.id,
        completedPomodoros: await getCompletedPomodoros(req.user.id),
        lastMode: validatedData.type
      })
    } else {
      // Update the status of the most recent pomodoro
      const recentPomodoro = await PomodoroService.getActivePomodoro(req.user.id)

      if (recentPomodoro) {
        const updatedPomodoro = await PomodoroService.updatePomodoro(recentPomodoro.id, {
          status: validatedData.status,
          endTime: validatedData.endTime ? new Date(validatedData.endTime) : new Date(),
          userId: req.user.id,
        })

        return NextResponse.json({
          success: true,
          id: updatedPomodoro.id,
          completedPomodoros: await getCompletedPomodoros(req.user.id),
          lastMode: recentPomodoro.type
        })
      }

      return NextResponse.json({
        success: false,
        message: "No active pomodoro found to update"
      }, { status: 404 })
    }
  } catch (error) {
    console.error("Error creating/updating pomodoro:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data", details: error.format() }, { status: 400 })
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
})

/**
 * DELETE /api/pomodoro/:id
 * Delete a pomodoro
 */
export const DELETE = withAuth(async (req: AuthenticatedApiRequest) => {
  try {
    // Get pomodoro ID from URL
    const url = new URL(req.url)
    const id = url.searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: "Pomodoro ID is required" }, { status: 400 })
    }

    // Delete the pomodoro using the service
    await PomodoroService.deletePomodoro(id, req.user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting pomodoro:", error)

    if (error instanceof Error && error.message === 'Pomodoro not found') {
      return NextResponse.json({ error: "Pomodoro not found" }, { status: 404 })
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
})