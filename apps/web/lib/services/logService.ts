import { LogType, LogAuthor, Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

export class LogService {
  static async createLog(params: {
    type: LogType;
    userId: string;
    taskId?: string;
    data?: any;
    author?: LogAuthor;
  }) {
    const { type, userId, taskId, data, author = LogAuthor.App } = params
    console.log('log creation', params);
    return prisma.log.create({
      data: {
        type,
        userId,
        taskId,
        data: data ? (data as Prisma.JsonObject) : undefined,
        author
      }
    })
  }

  static async createTaskLog(params: {
    type: LogType;
    userId: string;
    taskId: string;
    data?: any;
    author?: LogAuthor;
  }) {
    return this.createLog({
      ...params,
      author: params.author || LogAuthor.User
    })
  }

  static async getTaskLogs(taskId: string) {
    return prisma.log.findMany({
      where: { taskId },
      orderBy: { createdAt: 'desc' }
    })
  }

  static async getUserLogs(userId: string) {
    return prisma.log.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    })
  }
} 