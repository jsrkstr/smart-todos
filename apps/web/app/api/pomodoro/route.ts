import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
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
  settings: z.record(z.any()).optional()
})

/**
 * GET /api/pomodoro
 * Get the current active pomodoro session
 */
export const GET = withAuth(async (req: AuthenticatedApiRequest) => {
  try {
    // Find active pomodoro session using the service
    const activePomodoro = await PomodoroService.getActivePomodoro(req.user.id)

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
    
    // Format task for response
    const task = activePomodoro.task ? {
      id: activePomodoro.task.id,
      title: activePomodoro.task.title
    } : null

    return NextResponse.json({
      active: true,
      id: activePomodoro.id,
      type: activePomodoro.type,
      taskMode: activePomodoro.taskMode || "single",
      startTime: activePomodoro.startTime,
      endTime: activePomodoro.endTime,
      status: activePomodoro.status,
      remainingTime,
      task,
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

    // Close any existing active sessions if creating a new active pomodoro
    if (validatedData.status === "active") {
      const activePomodoro = await PomodoroService.getActivePomodoro(req.user.id)
      
      if (activePomodoro) {
        await PomodoroService.updatePomodoro(activePomodoro.id, {
          status: "cancelled",
          endTime: new Date(),
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
        taskId: validatedData.taskIds && validatedData.taskIds.length > 0 
          ? validatedData.taskIds[0] // For single task mode
          : null,
        tasks: (validatedData.taskMode === 'multi' && validatedData.taskIds) 
          ? validatedData.taskIds 
          : []
      })

      return NextResponse.json({
        success: true,
        id: pomodoro.id
      })
    } else {
      // Update the status of the most recent pomodoro
      const recentPomodoro = await PomodoroService.getActivePomodoro(req.user.id)

      if (recentPomodoro) {
        const updatedPomodoro = await PomodoroService.updatePomodoro(recentPomodoro.id, {
          status: validatedData.status,
          endTime: validatedData.endTime ? new Date(validatedData.endTime) : new Date(),
          userId: req.user.id
        })

        return NextResponse.json({
          success: true,
          id: updatedPomodoro.id
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