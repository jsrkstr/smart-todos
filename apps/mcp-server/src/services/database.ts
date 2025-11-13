import { PrismaClient } from '@prisma/client'

// Singleton Prisma client
const prisma = new PrismaClient()

export { prisma }

// Task Service
export const TaskService = {
  /**
   * Get all tasks for a user with optional filtering
   */
  async getTasks(userId: string, filters?: {
    completed?: boolean
    priority?: 'low' | 'medium' | 'high'
    startDate?: Date
    endDate?: Date
    parentId?: string | null
  }) {
    const where: any = {
      userId,
      deletedAt: null
    }

    if (filters?.completed !== undefined) {
      where.completed = filters.completed
    }

    if (filters?.priority) {
      where.priority = filters.priority
    }

    if (filters?.startDate || filters?.endDate) {
      where.dueDate = {}
      if (filters.startDate) {
        where.dueDate.gte = filters.startDate
      }
      if (filters.endDate) {
        where.dueDate.lte = filters.endDate
      }
    }

    if (filters?.parentId !== undefined) {
      where.parentId = filters.parentId
    }

    return prisma.task.findMany({
      where,
      include: {
        tags: true,
        children: true,
        notifications: true
      },
      orderBy: [
        { completed: 'asc' },
        { priority: 'desc' },
        { dueDate: 'asc' }
      ]
    })
  },

  /**
   * Get a single task by ID
   */
  async getTask(taskId: string, userId: string) {
    return prisma.task.findFirst({
      where: {
        id: taskId,
        userId,
        deletedAt: null
      },
      include: {
        tags: true,
        children: true,
        parent: true,
        notifications: true,
        pomodoros: true
      }
    })
  },

  /**
   * Create a new task
   */
  async createTask(userId: string, data: {
    title: string
    description?: string
    priority?: 'low' | 'medium' | 'high'
    dueDate?: Date
    parentId?: string
    tags?: string[]
  }) {
    const { tags, ...taskData } = data

    return prisma.task.create({
      data: {
        ...taskData,
        userId,
        completed: false,
        tags: tags ? {
          connect: tags.map(tagId => ({ id: tagId }))
        } : undefined
      },
      include: {
        tags: true,
        children: true
      }
    })
  },

  /**
   * Update a task
   */
  async updateTask(taskId: string, userId: string, data: {
    title?: string
    description?: string
    priority?: 'low' | 'medium' | 'high'
    dueDate?: Date | null
    completed?: boolean
    tags?: string[]
  }) {
    const { tags, ...taskData } = data

    // First verify the task belongs to the user
    const task = await prisma.task.findFirst({
      where: { id: taskId, userId, deletedAt: null }
    })

    if (!task) {
      throw new Error('Task not found or access denied')
    }

    return prisma.task.update({
      where: { id: taskId },
      data: {
        ...taskData,
        tags: tags ? {
          set: tags.map(tagId => ({ id: tagId }))
        } : undefined
      },
      include: {
        tags: true,
        children: true
      }
    })
  },

  /**
   * Delete a task (soft delete)
   */
  async deleteTask(taskId: string, userId: string) {
    // First verify the task belongs to the user
    const task = await prisma.task.findFirst({
      where: { id: taskId, userId, deletedAt: null }
    })

    if (!task) {
      throw new Error('Task not found or access denied')
    }

    return prisma.task.update({
      where: { id: taskId },
      data: { deletedAt: new Date() }
    })
  },

  /**
   * Get subtasks for a task
   */
  async getSubtasks(taskId: string, userId: string) {
    // First verify the parent task belongs to the user
    const parentTask = await prisma.task.findFirst({
      where: { id: taskId, userId, deletedAt: null }
    })

    if (!parentTask) {
      throw new Error('Task not found or access denied')
    }

    return prisma.task.findMany({
      where: {
        parentId: taskId,
        userId,
        deletedAt: null
      },
      include: {
        tags: true
      },
      orderBy: { createdAt: 'asc' }
    })
  }
}

// User Service
export const UserService = {
  /**
   * Get user profile
   */
  async getUserProfile(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        createdAt: true,
        updatedAt: true
      }
    })
  },

  /**
   * Get user's psychological profile
   */
  async getPsychProfile(userId: string) {
    return prisma.psychProfile.findUnique({
      where: { userId },
      include: {
        matchedCoach: true
      }
    })
  },

  /**
   * Get user settings
   */
  async getUserSettings(userId: string) {
    return prisma.settings.findUnique({
      where: { userId }
    })
  }
}

// Chat Service
export const ChatService = {
  /**
   * Get chat history for a user
   */
  async getChatHistory(userId: string, limit: number = 50) {
    return prisma.chatMessage.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit
    })
  },

  /**
   * Create a new chat message
   */
  async createChatMessage(userId: string, data: {
    role: 'user' | 'assistant' | 'system'
    content: string
  }) {
    return prisma.chatMessage.create({
      data: {
        ...data,
        userId
      }
    })
  }
}

// Pomodoro Service
export const PomodoroService = {
  /**
   * Get pomodoro sessions for a user
   */
  async getPomodoros(userId: string, filters?: {
    taskId?: string
    startDate?: Date
    endDate?: Date
  }) {
    const where: any = { userId }

    if (filters?.taskId) {
      where.taskId = filters.taskId
    }

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {}
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate
      }
    }

    return prisma.pomodoro.findMany({
      where,
      include: {
        task: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
  },

  /**
   * Create a new pomodoro session
   */
  async createPomodoro(userId: string, data: {
    taskId?: string
    duration: number
    completed: boolean
  }) {
    return prisma.pomodoro.create({
      data: {
        ...data,
        userId
      },
      include: {
        task: {
          select: {
            id: true,
            title: true
          }
        }
      }
    })
  }
}

// Cleanup function
export const disconnectDatabase = async () => {
  await prisma.$disconnect()
}
