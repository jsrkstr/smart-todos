import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { LogService } from './logService'
import { LogType } from '@prisma/client'

export class PomodoroService {
  static async createPomodoro(params: {
    type: string;
    status?: string;
    startTime: Date;
    endTime?: Date | null;
    taskMode?: string;
    settings?: any;
    userId: string;
    tasks?: string[];
    duration?: number;
  }) {
    const { 
      type, 
      status = 'active', 
      startTime, 
      endTime = null, 
      taskMode = 'single', 
      settings = null, 
      userId,
      tasks = [],
      duration = 0
    } = params

    // Create pomodoro
    const pomodoro = await prisma.pomodoro.create({
      data: {
        type,
        status,
        startTime,
        endTime,
        taskMode,
        settings: settings ? (settings as Prisma.JsonObject) : undefined,
        userId,
        duration,
        ...(tasks.length > 0 && {
          tasks: {
            connect: tasks.map(id => ({ id }))
          }
        })
      },
      include: {
        tasks: true
      }
    })

    // Log pomodoro creation
    await LogService.createLog({
      type: LogType.pomodoro_started,
      userId,
      data: {
        pomodoroId: pomodoro.id,
        type,
        taskMode,
        ...(tasks.length > 0 && { tasks })
      }
    })

    return pomodoro
  }

  static async updatePomodoro(id: string, params: {
    status?: string;
    endTime?: Date;
    settings?: any;
    userId: string; // Required for logging
    duration?: number;
  }) {
    const { status, endTime, settings, userId, duration } = params

    const pomodoro = await prisma.pomodoro.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(endTime && { endTime }),
        ...(settings && { settings: settings as Prisma.JsonObject }),
        ...(typeof duration === 'number' && { duration })
      },
      include: {
        tasks: true
      }
    })

    // Determine the appropriate log type based on the status
    let logType: LogType;
    switch (status) {
      case 'paused':
        logType = LogType.pomodoro_paused;
        break;
      case 'resumed':
        logType = LogType.pomodoro_resumed;
        break;
      case 'cancelled':
        logType = LogType.pomodoro_cancelled;
        break;
      case 'completed':
        logType = LogType.pomodoro_completed;
        break;
      default:
        logType = LogType.task_updated; // Fallback to general update
    }

    // Log pomodoro update
    await LogService.createLog({
      type: logType,
      userId,
      data: {
        pomodoroId: pomodoro.id,
        status,
        ...(endTime && { endTime: endTime.toISOString() })
      }
    })

    return pomodoro
  }

  static async deletePomodoro(id: string, userId: string) {
    // Get pomodoro before deletion for logging
    const pomodoro = await prisma.pomodoro.findUnique({
      where: { id },
      include: {
        tasks: true
      }
    })

    if (!pomodoro) {
      throw new Error('Pomodoro not found')
    }

    // Delete pomodoro
    await prisma.pomodoro.delete({
      where: { id }
    })

    // Log pomodoro deletion
    await LogService.createLog({
      type: LogType.pomodoro_cancelled,
      userId,
      data: {
        pomodoroId: id,
        type: pomodoro.type,
        taskMode: pomodoro.taskMode
      }
    })

    return pomodoro
  }

  static async getPomodoroById(id: string) {
    return prisma.pomodoro.findUnique({
      where: { id },
      include: {
        tasks: true
      }
    })
  }

  static async getUserPomodoros(userId: string, options?: {
    limit?: number;
    offset?: number;
    status?: string;
    type?: string;
    taskId?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const { 
      limit = 50, 
      offset = 0, 
      status, 
      type, 
      taskId,
      startDate,
      endDate
    } = options || {}

    return prisma.pomodoro.findMany({
      where: {
        userId,
        ...(status && { status }),
        ...(type && { type }),
        ...(startDate && { startTime: { gte: startDate } }),
        ...(endDate && { startTime: { lte: endDate } })
      },
      include: {
        tasks: true
      },
      orderBy: {
        startTime: 'desc'
      },
      skip: offset,
      take: limit
    })
  }

  static async getActivePomodoro(userId: string) {
    return prisma.pomodoro.findFirst({
      where: {
        userId,
        status: 'active'
      },
      include: {
        tasks: true
      },
      orderBy: {
        startTime: 'desc'
      }
    })
  }

  static async getTaskPomodoros(taskId: string) {
    return prisma.pomodoro.findMany({
      where: {
        tasks: { some: { id: taskId } }
      },
      include: {
        tasks: true
      },
      orderBy: {
        startTime: 'desc'
      }
    })
  }
} 