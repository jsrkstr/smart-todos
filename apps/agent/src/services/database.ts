import { PrismaClient } from '@prisma/client';

// Initialize Prisma client - this will look for the schema at ../../web/prisma/schema.prisma
export const prisma = new PrismaClient();

// Service for user-related database operations
export const UserService = {
  // Get user with psychological profile and coach information
  async getUserWithProfile(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      include: {
        psychProfile: {
          include: {
            coach: true
          }
        },
        settings: true
      }
    });
  },
};

// Service for task-related database operations
export const TaskService = {
  // Get a specific task by ID
  async getTask(taskId: string, userId: string) {
    return prisma.task.findFirst({
      where: {
        id: taskId,
        userId
      },
      include: {
        children: true,
        tags: {
          include: {
            category: true
          }
        },
        notifications: true
      }
    });
  },

  // Get all tasks (with optional filters)
  async getTasks(userId: string, filters?: any) {
    return prisma.task.findMany({
      where: {
        userId,
        parentId: null, // Top-level tasks only
        ...filters
      },
      include: {
        children: true,
        tags: {
          include: {
            category: true
          }
        }
      },
      orderBy: [
        { position: 'asc' },
        { deadline: 'asc' },
        { priority: 'desc' }
      ]
    });
  },

  // Create a new task
  async createTask(data: any) {
    return prisma.task.create({
      data
    });
  },

  // Update a task
  async updateTask(data: any) {
    const { id, userId, tagIds, ...updateData } = data;
    
    const update: any = {
      ...updateData
    };

    // Handle tag connection/disconnection if tagIds are provided
    if (tagIds) {
      update.tags = {
        set: [],
        connect: tagIds.map((tagId: string) => ({ id: tagId }))
      };
    }

    return prisma.task.update({
      where: { id },
      data: update
    });
  },

  // Update many tasks
  async updateManyTasks(updates: any[]) {
    const transactions = updates.map(update => {
      const { id, ...updateData } = update;
      return prisma.task.update({
        where: { id },
        data: updateData
      });
    });

    return prisma.$transaction(transactions);
  },

  // Create multiple subtasks
  async createSubtasks(parentTaskId: string, userId: string, subtasks: any[]) {
    const transactions = subtasks.map(subtask => {
      return prisma.task.create({
        data: {
          ...subtask,
          userId,
          parentId: parentTaskId
        }
      });
    });

    return prisma.$transaction(transactions);
  }
};

// Service for logging activities
export const LogService = {
  async createLog(data: any) {
    return null
    // return prisma.log.create({
    //   data
    // });
  }
};

// Service for chat messages
export const ChatMessageService = {
  async createMessage(data: any) {
    return prisma.chatMessage.create({
      data
    });
  },

  async getMessages(userId: string, taskId?: string) {
    return prisma.chatMessage.findMany({
      where: {
        userId,
        ...(taskId ? { taskId } : {})
      },
      orderBy: { createdAt: 'asc' }
    });
  }
};
