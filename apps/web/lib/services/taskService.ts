import { Task, Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { LogService } from './logService'
import type { TaskPriority } from '@/types/task'

export interface CreateTaskInput {
  userId: string;
  title: string;
  description?: string;
  date: Date;
  time?: string;
  deadline?: Date;
  priority?: TaskPriority;
  stage?: "Refinement" | "Breakdown" | "Planning" | "Execution" | "Reflection";
  estimatedTimeMinutes?: number;
  location?: string;
  why?: string;
  tagIds?: string[];
  children?: {
    title: string;
  }[];
  notifications?: {
    type: string;
  }[];
}

export interface UpdateTaskInput {
  id: string;
  userId: string;
  title?: string;
  description?: string;
  date?: Date;
  time?: string;
  deadline?: Date;
  priority?: TaskPriority;
  stage?: "Refinement" | "Breakdown" | "Planning" | "Execution" | "Reflection";
  estimatedTimeMinutes?: number;
  location?: string;
  repeats?: string;
  why?: string;
  tagIds?: string[];
  completed?: boolean,
  children?: {
    title: string;
  }[];
  notifications?: {
    type: string;
  }[];
}

export class TaskService {
  static async createTask(input: CreateTaskInput): Promise<Task> {
    const { userId, children, tagIds, ...taskData } = input

    // Create the task with its children (subtasks) and tags
    const newTask = await prisma.task.create({
      data: {
        ...taskData,
        user: { connect: { id: userId } },
        children: children ? {
          create: children.map(child => ({
            ...child,
            userId: userId,
            date: taskData.date,
            priority: taskData.priority,
            stage: taskData.stage
          }))
        } : undefined,
        tags: tagIds && tagIds.length > 0 ? {
          connect: tagIds.map(id => ({ id }))
        } : undefined
      },
      include: {
        children: true,
        tags: {
          include: {
            category: true
          }
        }
      }
    })

    // Create a log entry for the new task
    LogService.createTaskLog({
      type: 'task_created',
      userId,
      taskId: newTask.id,
      data: {
        title: newTask.title,
        date: newTask.date,
        priority: newTask.priority,
        childrenCount: children?.length || 0
      }
    })

    return newTask;
  }

  static async updateTask(input: UpdateTaskInput): Promise<Task> {
    const { id, userId, children, tagIds, ...updates } = input

    // Update the task and create a log entry
    const task = await prisma.$transaction(async (tx) => {
      // If tagIds are provided, first disconnect all existing tags
      if (tagIds !== undefined) {
        await tx.task.update({
          where: {
            id,
            userId
          },
          data: {
            tags: {
              set: []
            }
          }
        });
      }

      const updatedTask = await tx.task.update({
        where: {
          id,
          userId
        },
        data: {
          ...updates,
          children: children ? {
            create: children.map(child => ({
              ...child,
              userId: userId,
              date: updates.date || new Date(),
              priority: updates.priority || 'medium',
              stage: updates.stage || 'Refinement'
            }))
          } : undefined,
          tags: tagIds && tagIds.length > 0 ? {
            connect: tagIds.map(id => ({ id }))
          } : undefined
        },
        include: {
          children: true,
          tags: {
            include: {
              category: true
            }
          }
        }
      })

      // Create a log entry for the task update
      await LogService.createTaskLog({
        type: 'task_updated',
        userId,
        taskId: id,
        data: {
          updatedFields: Object.keys(updates),
          newValues: updates,
          childrenAdded: children?.length || 0
        }
      })

      return updatedTask
    })

    return task
  }

  static async deleteTask(id: string, userId: string): Promise<void> {
    // Get task details before deletion for logging
    const task = await prisma.task.findUnique({
      where: { id },
      select: { title: true }
    })

    // Delete the task and create a log entry
    await prisma.$transaction(async (tx) => {
      await tx.task.delete({
        where: {
          id,
          userId
        }
      })

      // Create a log entry for the task deletion
      await LogService.createTaskLog({
        type: 'task_deleted',
        userId,
        taskId: id,
        data: {
          title: task?.title
        }
      })
    })
  }

  static async getTasks(userId: string): Promise<Task[]> {
    return prisma.task.findMany({
      where: {
        userId,
        parentId: null
      },
      include: {
        children: true,
        tags: {
          include: {
            category: true
          }
        }
      },
      orderBy: { dateAdded: 'desc' }
    })
  }

  static async getTask(id: string, userId: string): Promise<Task | null> {
    return prisma.task.findFirst({
      where: {
        id,
        userId
      },
      include: {
        children: true,
        tags: {
          include: {
            category: true
          }
        }
      }
    })
  }

  static async completeTask(id: string, userId: string): Promise<Task> {
    const task = await prisma.$transaction(async (tx) => {
      const updatedTask = await tx.task.update({
        where: {
          id,
          userId
        },
        data: {
          completed: true,
        },
        include: { children: true }
      })

      // Create a log entry for task completion
      await LogService.createTaskLog({
        type: 'task_completed',
        userId,
        taskId: id,
        data: {
          title: updatedTask.title,
          completedAt: new Date()
        }
      })

      return updatedTask
    })

    return task
  }

  static async reactivateTask(id: string, userId: string): Promise<Task> {
    const task = await prisma.$transaction(async (tx) => {
      const updatedTask = await tx.task.update({
        where: {
          id,
          userId
        },
        data: {
          completed: false,
        },
        include: { children: true }
      })

      // Create a log entry for task reactivation
      await LogService.createTaskLog({
        type: 'task_reactivated',
        userId,
        taskId: id,
        data: {
          title: updatedTask.title,
          reactivatedAt: new Date()
        }
      })

      return updatedTask
    })

    return task
  }
} 