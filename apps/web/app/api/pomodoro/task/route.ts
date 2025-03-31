import { NextResponse } from "next/server"
import { AuthenticatedApiRequest, withAuth } from '@/lib/api-middleware'
import { PomodoroService } from "@/lib/services/pomodoroService"

/**
 * GET /api/pomodoro/task?taskId=<taskId>
 * Get pomodoros for a specific task
 */
export const GET = withAuth(async (req: AuthenticatedApiRequest) => {
  try {
    const url = new URL(req.url)
    const taskId = url.searchParams.get('taskId')
    
    if (!taskId) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 })
    }
    
    // Get pomodoros for the task using the service
    const pomodoros = await PomodoroService.getTaskPomodoros(taskId)
    
    // Calculate total focus time
    const totalFocusTimeMinutes = pomodoros
      .filter(p => p.type === 'focus' && (p.status === 'finished' || p.status === 'completed'))
      .reduce((total, p) => {
        if (p.startTime && p.endTime) {
          const durationMinutes = Math.floor(
            (new Date(p.endTime).getTime() - new Date(p.startTime).getTime()) / (1000 * 60)
          )
          return total + durationMinutes
        }
        return total
      }, 0)
    
    return NextResponse.json({
      pomodoros,
      count: pomodoros.length,
      totalFocusTimeMinutes,
      totalPomodoros: pomodoros.filter(p => p.type === 'focus').length
    })
  } catch (error) {
    console.error("Error fetching task pomodoros:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}) 