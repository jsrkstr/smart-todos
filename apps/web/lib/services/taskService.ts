import { Task, Prisma, TaskStatus } from '@prisma/client'
import { prisma } from '@/lib/db'
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
  subTasks?: {
    title: string;
    status?: TaskStatus;
    position?: number;
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
  why?: string;
  subTasks?: {
    title: string;
    status?: TaskStatus;
    position?: number;
  }[];
}

export class TaskService {
  static async createTask(input: CreateTaskInput): Promise<Task> {
    const { userId, subTasks, ...taskData } = input

    // Create the task with its subtasks
    const newTask = await prisma.task.create({
      data: {
        ...taskData,
        user: { connect: { id: userId } },
        subTasks: subTasks ? {
          create: subTasks.map(st => ({
            ...st,
          }))
        } : undefined
      },
      include: { subTasks: true }
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
        subTasksCount: subTasks?.length || 0
      }
    })

    return newTask;
  }

  static async updateTask(input: UpdateTaskInput): Promise<Task> {
    const { id, userId, subTasks, ...updates } = input

    // Update the task and create a log entry
    const task = await prisma.$transaction(async (tx) => {
      const updatedTask = await tx.task.update({
        where: { 
          id,
          userId // Ensure user can only update their own tasks
        },
        data: {
          ...updates,
          subTasks: subTasks ? {
            deleteMany: {},
            create: subTasks.map(st => ({
              ...st,
            }))
          } : undefined
        },
        include: { subTasks: true }
      })

      // Create a log entry for the task update
      await LogService.createTaskLog({
        type: 'task_updated',
        userId,
        taskId: id,
        data: {
          updatedFields: Object.keys(updates),
          newValues: updates
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
          userId // Ensure user can only delete their own tasks
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
      where: { userId },
      include: { subTasks: true },
      orderBy: { dateAdded: 'desc' }
    })
  }

  static async getTask(id: string, userId: string): Promise<Task | null> {
    return prisma.task.findFirst({
      where: { 
        id,
        userId
      },
      include: { subTasks: true }
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
        include: { subTasks: true }
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
          completed: false
        },
        include: { subTasks: true }
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