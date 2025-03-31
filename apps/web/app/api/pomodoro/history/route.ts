import { NextResponse } from "next/server"
import { AuthenticatedApiRequest, withAuth } from '@/lib/api-middleware'
import { PomodoroService } from "@/lib/services/pomodoroService"

/**
 * GET /api/pomodoro/history
 * Get user's pomodoro history
 */
export const GET = withAuth(async (req: AuthenticatedApiRequest) => {
  try {
    const url = new URL(req.url)
    const limit = parseInt(url.searchParams.get('limit') || '10')
    const offset = parseInt(url.searchParams.get('offset') || '0')
    const status = url.searchParams.get('status')
    const type = url.searchParams.get('type')
    const taskId = url.searchParams.get('taskId')
    
    // Parse date filters
    const startDate = url.searchParams.get('startDate') 
      ? new Date(url.searchParams.get('startDate')!)
      : undefined
    
    const endDate = url.searchParams.get('endDate')
      ? new Date(url.searchParams.get('endDate')!)
      : undefined

    // Get pomodoro history using the service
    const pomodoros = await PomodoroService.getUserPomodoros(req.user.id, {
      limit,
      offset,
      status: status || undefined,
      type: type || undefined,
      taskId: taskId || undefined,
      startDate,
      endDate
    })
    
    // Calculate stats
    const stats = {
      totalPomodoros: pomodoros.length,
      completedPomodoros: pomodoros.filter(p => p.status === 'finished' || p.status === 'completed').length,
      cancelledPomodoros: pomodoros.filter(p => p.status === 'cancelled').length,
      focusPomodoros: pomodoros.filter(p => p.type === 'focus').length,
      breakPomodoros: pomodoros.filter(p => p.type === 'shortBreak' || p.type === 'longBreak').length,
      totalFocusTimeMinutes: pomodoros
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
    }
    
    return NextResponse.json({
      pomodoros,
      count: pomodoros.length,
      offset,
      limit,
      stats
    })
  } catch (error) {
    console.error("Error fetching pomodoro history:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}) 