import { Task, Prisma, ChatMessageRole } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { LogService } from './logService'
import type { TaskPriority } from '@/types/task'
import { ChatCompletionSystemMessageParam, ChatCompletionUserMessageParam } from 'openai/resources/index.mjs'
import OpenAI from 'openai'
import { Tag } from '@/types/tag'
import { TagService } from './tagService'
import { ChatMessageService } from './chatMessageService'

// Notification enum types from Prisma schema
type NotificationType = 'Reminder' | 'Question' | 'Info'
type NotificationMode = 'Push' | 'Email' | 'Chat'
type NotificationTrigger = 'FixedTime' | 'RelativeTime' | 'Location'
type NotificationRelativeTimeUnit = 'Minutes' | 'Hours' | 'Days'
type NotificationAuthor = 'User' | 'Bot' | 'Model'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface TaskRefinedData {
  title: string;
  description: string;
  priority: string;
  deadline: string;
  estimatedTimeMinutes: number;
  why: string;
  location: string
  tags: { name: string, category: string }[];
}


export interface NotificationCreateinput {
  mode: NotificationMode;
  type: NotificationType;
  trigger?: NotificationTrigger;
  message: string;
  relativeTimeValue?: number;
  relativeTimeUnit?: NotificationRelativeTimeUnit;
  fixedTime?: Date;
  author: NotificationAuthor;
}

export interface ChildrenCreateinput {
  title: string;
  description?: string;
}

export interface ChildrenUpdateInput {
  id: string;
  title: string;
  description?: string;
}

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
    priority?: string;
    stage?: string;
  }[];
  notifications?: NotificationCreateinput[];
}

export interface NotificationUpdateInput {
  id: string;
  mode?: NotificationMode;
  type?: NotificationType;
  trigger?: NotificationTrigger;
  message?: string;
  relativeTimeValue?: number;
  relativeTimeUnit?: NotificationRelativeTimeUnit;
  fixedTime?: Date;
  author?: NotificationAuthor;
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
  stageStatus?: "NotStarted" | "InProgress" | "QuestionAsked" | "Completed";
  estimatedTimeMinutes?: number;
  location?: string;
  repeats?: string;
  why?: string;
  tagIds?: string[];
  completed?: boolean,
  children?: {
    create: ChildrenCreateinput[],
    update: ChildrenUpdateInput[],
    removeIds: string[],
  }
  notifications?: {
    create: NotificationCreateinput[],
    update: NotificationUpdateInput[],
    removeIds: string[],
  }
}

export interface ProcessTaskInput {
  id: string;
  userId: string;
}

export interface ProcessTaskResponse {
  response_type: "message_to_user" | "task_details";
  task: Task | null;
  message: string;
}

export class TaskService {
  static async createTask(input: CreateTaskInput): Promise<Task> {
    const { userId, children, tagIds, notifications, ...taskData } = input

    // Create the task with its children (subtasks) and tags first
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
        notifications: notifications ? {
          create: notifications.map(notification => ({
            message: notification.message,
            mode: notification.mode,
            type: notification.type,
            trigger: notification.trigger || 'RelativeTime',
            relativeTimeValue: notification.relativeTimeValue,
            relativeTimeUnit: notification.relativeTimeUnit,
            fixedTime: notification.fixedTime,
            author: notification.author,
            userId: userId,
            // taskId: newTask.id
          })),
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
        },
        notifications: true
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
        childrenCount: children?.length || 0,
        notificationsCount: notifications?.length || 0
      }
    })

    return newTask;
  }

  static async updateTask(input: UpdateTaskInput): Promise<Task> {
    const { id, userId, children, tagIds, notifications, ...updates } = input

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
            create: children?.create?.map(child => ({
              ...child,
              userId: userId,
              date: updates.date || new Date(),
            })),
            update: children?.update?.map(child => ({
              where: {
                id: child.id,
              },
              data: {
                ...child,
                userId: userId,
                date: updates.date || new Date(),
              },
            })),
            deleteMany: children?.removeIds.map(id => ({ id })),
          } : undefined,
          tags: tagIds && tagIds.length > 0 ? {
            connect: tagIds.map(id => ({ id }))
          } : undefined,
          notifications: {
            create: notifications?.create?.map(notification => ({
              ...notification,
              userId: userId,
            })),
            update: notifications?.update?.map(notification => ({
              where: {
                id: notification.id,
              },
              data: {
                ...notification,
              }
            })),
            deleteMany: notifications?.removeIds.map(id => ({ id })),
          }
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
      })

      // Create a log entry for the task update
      await LogService.createTaskLog({
        type: 'task_updated',
        userId,
        taskId: id,
        data: {
          updatedFields: Object.keys(updates),
          newValues: updates,
          childrenAdded: children?.create?.length || 0,
          notificationsUpdated: notifications?.create?.length || 0
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

  static async processTask(input: ProcessTaskInput): Promise<ProcessTaskResponse> {
    const { id, userId } = input

    // Fetch the original task with all its details
    const originalTask = await TaskService.getTask(id, userId)

    if (!originalTask) {
      return {
        response_type: "message_to_user",
        task: null,
        message: "Task not found"
      };
    }

    if (originalTask.stage === 'Planning' || originalTask.stage === 'Refinement') {
      if (originalTask.stageStatus === 'NotStarted' || originalTask.stageStatus === 'InProgress') {
        console.log('startRefinement');
        const result = await TaskService.startRefinement(originalTask);
        return result;
      }

      if (originalTask.stageStatus === 'QuestionAsked') {
        console.log('continueRefinement');
        const result = await TaskService.continueRefinement(originalTask);
        return result;
      }
    }

    return {
      response_type: "message_to_user",
      task: originalTask,
      message: "No processing needed for current task stage"
    };
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
        },
        notifications: true
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
        },
        notifications: true
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
        include: {
          children: true,
          notifications: true
        }
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
        include: {
          children: true,
          notifications: true
        }
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

  static async startRefinement(task: Task): Promise<ProcessTaskResponse> {
    // Update the task status
    const updatedTask = await TaskService.updateTask({
      id: task.id,
      userId: task.userId,
      stage: 'Refinement',
      stageStatus: 'InProgress',
    });

    // Prepare task data for OpenAI
    const taskForAI = {
      id: task.id,
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      stage: task.stage,
      deadline: task.deadline,
      estimatedTimeMinutes: task.estimatedTimeMinutes,
      location: task.location || '',
      why: task.why || '',
      tags: Array.isArray((task as any).tags)
        ? (task as any).tags.map((tag: Tag) => ({
          name: tag.name,
          category: tag.category?.name || ''
        }))
        : []
    }

    const refineTaskInstructionMessages: Array<ChatCompletionUserMessageParam | ChatCompletionSystemMessageParam> = [
      {
        role: "system",
        content: `You are a task optimization assistant.
          Your job is to improve task descriptions, suggest appropriate tags, refine deadlines, and estimate time better.
          Start by understanding the task, if you less than 90% sure about the task, ask a question to the user.
          Provide output in JSON format only with these fields: response_type (must be 'task_details', 'question'), question (if response_type=question), understand_percentage (if response_type=question), task_details (if response_type=task_details, nested fields: title, description, priority (must be 'low', 'medium', or 'high'), deadline (ISO string or null), estimatedTimeMinutes (number), location (string), why (string), tags (max 2, object with fields name (string) and category (string))).
        `
      },
      {
        role: "user",
        content: `Please refine this task by providing a more detailed description, better tags, and more accurate time estimates and deadlines if needed:\n${JSON.stringify(taskForAI, null, 2)}`
      }
    ];

    const createdMessages = await prisma.chatMessage.createMany({
      data: refineTaskInstructionMessages.map(({ role, content }) => ({
        role: role as ChatMessageRole,
        content: content as string,
        userId: task.userId,
        taskId: task.id,
      }))
    })

    // Send data to OpenAI for refinement
    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: refineTaskInstructionMessages,
      response_format: { type: "json_object" }
    })

    // Parse the AI response
    const responseData = JSON.parse(aiResponse.choices[0].message.content || '{}')
    console.log('AI response', responseData);

    if (responseData.response_type === 'question') {
      // Save the question directly using prisma
      const storedMessage = await prisma.chatMessage.create({
        data: {
          userId: task.userId,
          taskId: task.id,
          content: responseData.question,
          role: 'assistant',
          metadata: {
            understand_percentage: responseData.understand_percentage || 0,
            type: "question"
          }
        }
      })

      // Update the task status
      const updatedTask = await TaskService.updateTask({
        id: task.id,
        userId: task.userId,
        stageStatus: 'QuestionAsked',
      });

      return {
        response_type: "message_to_user",
        task: updatedTask,
        message: responseData.question
      };
    }

    const refinedData = responseData.task_details;
    const updatedTaskWithRefinements = await TaskService.updateRefinedTask(task, refinedData);

    return {
      response_type: "task_details",
      task: updatedTaskWithRefinements,
      message: "Task has been successfully refined with AI assistance."
    };
  }

  static async continueRefinement(task: Task): Promise<ProcessTaskResponse> {
    const storedMessages = await ChatMessageService.getMessages(task.id);
    const latestMessage = storedMessages[storedMessages.length - 1];
    console.log('latest message', latestMessage);
    
    if (latestMessage && latestMessage.role === 'user') {
      // Send data to OpenAI for refinement
      const aiResponse = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: storedMessages,
        response_format: { type: "json_object" }
      })

      // Parse the AI response
      const responseData = JSON.parse(aiResponse.choices[0].message.content || '{}')
      console.log('AI response', responseData);

      if (responseData.response_type === 'question') {
        // Save the question directly using prisma
        const storedMessage = await prisma.chatMessage.create({
          data: {
            userId: task.userId,
            taskId: task.id,
            content: responseData.question,
            role: 'assistant',
            metadata: {
              understand_percentage: responseData.understand_percentage || 0,
              type: "question"
            }
          }
        })

        return {
          response_type: "message_to_user",
          task: task,
          message: responseData.question
        };
      }

      const refinedData = responseData.task_details;
      const updatedTask = await TaskService.updateRefinedTask(task, refinedData);

      return {
        response_type: "task_details",
        task: updatedTask,
        message: "Task has been successfully refined with AI assistance."
      };
    }

    return {
      response_type: "message_to_user",
      task: task,
      message: "No user message found to continue refinement."
    };
  }

  static async updateRefinedTask(task: Task, refinedData: TaskRefinedData): Promise<Task> {
    // Prepare the update data with proper type validation
    const updates: UpdateTaskInput = {
      id: task.id,
      userId: task.userId,
      title: refinedData.title,
      description: refinedData.description,
      priority: ['low', 'medium', 'high'].includes(refinedData.priority?.toLowerCase())
        ? refinedData.priority.toLowerCase() as TaskPriority
        : undefined,
      deadline: refinedData.deadline ? new Date(refinedData.deadline) : undefined,
      estimatedTimeMinutes: typeof refinedData.estimatedTimeMinutes === 'number'
        ? refinedData.estimatedTimeMinutes
        : undefined,
      why: refinedData.why,
      location: refinedData.location,
      stageStatus: 'Completed',
    }

    // Handle tags from AI response
    if (refinedData.tags && Array.isArray(refinedData.tags)) {
      const [allTags, allCategories] = await Promise.all([
        TagService.getTags(),
        TagService.getTagCategories()
      ])

      const tagIds: string[] = []

      for (const tagData of refinedData.tags) {
        let existingTag = allTags.find((t) => t.name.toLowerCase() === tagData.name.toLowerCase())

        if (!existingTag) {
          console.log('creating tag', tagData);
          let categoryId: string | undefined

          if (tagData.category) {
            let category = allCategories.find((c) => c.name.toLowerCase() === tagData.category.toLowerCase())

            if (!category) {
              console.log('creating category', tagData);
              category = await TagService.createTagCategory({ name: tagData.category })
              allCategories.push(category)
            }

            categoryId = category.id
          }

          existingTag = await TagService.createTag({
            name: tagData.name,
            color: '#808080',
            categoryId
          })
          allTags.push(existingTag)
        }

        tagIds.push(existingTag.id)
      }

      updates.tagIds = tagIds
    }

    const updatedTask = await TaskService.updateTask(updates)

    if (updatedTask) {
      await prisma.chatMessage.create({
        data: {
          userId: task.userId,
          taskId: task.id,
          content: "Task has been successfully refined with AI assistance.",
          role: ChatMessageRole.system,
          metadata: {
            type: "info",
            refinement: true
          }
        }
      })
    }

    return updatedTask;
  }
} 