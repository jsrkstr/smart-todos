import { Task, Prisma, ChatMessageRole, TaskPriority } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { LogService } from './logService'
import { ChatCompletionSystemMessageParam, ChatCompletionUserMessageParam } from 'openai/resources/index.mjs'
import OpenAI from 'openai'
import { Tag } from '@/types/tag'
import { TagService } from './tagService'
import { ChatMessageService } from './chatMessageService'
import { JsonObject } from '@prisma/client/runtime/library'
import { metadata } from '@/app/layout'
import { CreateTaskInput, PrioritizeTasksInput, ProcessTaskInput, ProcessTaskResponse, TaskRefinedData, UpdateTaskInput, ContinuePrioritizeTasksInput } from './interfaces'
import { breakdownTaskInstruction, prioritizationInstructions, refineTaskInstruction } from './consts'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export class TaskService {
  static async createTask(input: CreateTaskInput): Promise<Task> {
    const { userId, children, tagIds, notifications, parentId, ...taskData } = input

    // Create the task with its children (subtasks) and tags first
    const newTask = await prisma.task.create({
      data: {
        ...taskData,
        user: { connect: { id: userId } },
        parent: parentId ? {
          connect: {
            id: parentId,
          }
        }: undefined,
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
    // Delete the task and create a log entry
    await prisma.task.delete({
      where: {
        id,
        userId
      }
    })

    // Create a log entry for the task deletion
    await LogService.createLog({
      type: 'task_deleted',
      userId,
    })
  }

  static async processTask(input: ProcessTaskInput): Promise<ProcessTaskResponse> {
    const { id, userId, nextStage } = input

    // Fetch the original task with all its details
    const originalTask = await TaskService.getTask(id, userId)

    if (!originalTask) {
      return {
        response_type: "message_to_user",
        task: null,
        message: "Task not found"
      };
    }

    const taskStage = nextStage || originalTask.stage;
    const taskStageStatus = nextStage ? 'NotStarted' : originalTask.stageStatus;

    if (taskStage === 'Planning' || taskStage === 'Refinement') {
      if (taskStageStatus === 'NotStarted' || taskStageStatus === 'InProgress') {
        console.log('startRefinement');
        const result = await TaskService.startRefinement(originalTask);
        return result;
      }

      if (taskStageStatus === 'QuestionAsked' || taskStageStatus === 'Completed') {
        console.log('continueRefinement');
        const result = await TaskService.continueRefinement(originalTask);
        return result;
      }
    }

    // If refinement is done, start breakdown
    if (taskStage === 'Refinement' && taskStageStatus === 'Completed') {
      console.log('startBreakdown');
      const result = await TaskService.startBreakdown(originalTask);
      return result;
    }

    // If already in breakdown stage, continue
    if (taskStage === 'Breakdown') {
      if (taskStageStatus === 'NotStarted' || taskStageStatus === 'InProgress') {
        console.log('startBreakdown (continuing existing)'); // Or restart if needed?
        const result = await TaskService.startBreakdown(originalTask);
        return result;
      }
      if (taskStageStatus === 'QuestionAsked' || taskStageStatus === 'Completed') {
        // Completed might mean we need to check if user wants further breakdown or move to execution
        // For now, assume Completed means ready for execution, or continue if QuestionAsked
        console.log('continueBreakdown');
        const result = await TaskService.continueBreakdown(originalTask);
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
      orderBy: { createdAt: 'desc' }
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
        content: `
          ${refineTaskInstruction}
          Task:\n${JSON.stringify(taskForAI, null, 2)}
          Today is ${(new Date()).toISOString()}
        `
      },
      {
        role: "user",
        content: `Please refine this task by providing a more detailed description, better tags, and more accurate time estimates and deadlines if needed`
      }
    ];

    // store the sent messages
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
    console.log('AI response', JSON.stringify(responseData));

    if (responseData.action === 'ask_question') {
      return TaskService.askQuestion(task, {
        question: responseData.question,
        metadata: {
          understand_percentage: responseData.understand_percentage || 0,
        }
      });
    }

    const refinedData = responseData.task_updates;
    const updatedTaskWithRefinements = await TaskService.updateRefinedTask(task, refinedData);

    return {
      response_type: "task_details",
      task: updatedTaskWithRefinements,
      message: "Task has been successfully refined with AI assistance."
    };
  }

  static async continueRefinement(task: Task): Promise<ProcessTaskResponse> {
    const storedMessages = await ChatMessageService.getMessages(task.userId, task.id);
    const latestMessage = storedMessages[storedMessages.length - 1];
    console.log('latest message', latestMessage);
    
    if (latestMessage && latestMessage.role === 'user') {
      const taskDetailsMessage = {
        role: "system",
        content: `
          Task:\n${JSON.stringify(task, null, 2)}
          Today is ${(new Date()).toISOString()}
        `
      };

      const messagesToSend = [
        ...storedMessages,
        taskDetailsMessage
      ] as Array<ChatCompletionUserMessageParam | ChatCompletionSystemMessageParam>;

      // Send data to OpenAI for refinement
      const aiResponse = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: messagesToSend,
        response_format: { type: "json_object" }
      })

      // Parse the AI response
      const responseData = JSON.parse(aiResponse.choices[0].message.content || '{}')
      console.log('AI response', responseData);
      console.log('AI response', JSON.stringify(responseData));

      if (responseData.action === 'ask_question') {
        return TaskService.askQuestion(task, {
          question: responseData.question,
          metadata: {
            understand_percentage: responseData.understand_percentage || 0,
          }
        });
      }

      const refinedData = responseData.task_updates;
      const updatedTask = await TaskService.updateRefinedTask(task, refinedData);

      return {
        response_type: "task_details",
        task: updatedTask,
        message: "Task has been updated."
      };
    }

    return {
      response_type: "message_to_user",
      task: task,
      message: "No user message found to continue refinement."
    };
  }

  static async startBreakdown(task: Task): Promise<ProcessTaskResponse> {
    // Update the task status
    const updatedTask = await TaskService.updateTask({
      id: task.id,
      userId: task.userId,
      stage: 'Breakdown',
      stageStatus: 'InProgress',
    });

    const breakdownTaskInstructionMessages: Array<ChatCompletionUserMessageParam | ChatCompletionSystemMessageParam> = [
      {
        role: "system",
        content: `
          ${breakdownTaskInstruction}
          Task:\n${JSON.stringify(task, null, 2)}
          Today is ${(new Date()).toISOString()}
        `
      },
      {
        role: "user",
        content: `Please break down this task into smaller sub-tasks using the 10-minute strategy where appropriate`
      }
    ];

    // Save initial system/user messages for context if needed, similar to refinement
    await prisma.chatMessage.createMany({
      data: breakdownTaskInstructionMessages.map(({ role, content }) => ({
        role: role as ChatMessageRole,
        content: content as string,
        userId: task.userId,
        taskId: task.id,
      }))
    });

    // Send data to OpenAI for breakdown
    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: breakdownTaskInstructionMessages,
      response_format: { type: "json_object" }
    })

    // Parse the AI response
    const responseData = JSON.parse(aiResponse.choices[0].message.content || '{}')
    console.log('AI breakdown response', responseData);

    if (responseData.action === 'ask_question') {
      return TaskService.askQuestion(task, {
        question: responseData.question,
        metadata: {
          type: "question",
          stage: "Breakdown" // Add stage context
        }
      });
    }

    // Assuming response_type is 'update_tasks'
    const updatedTaskWithSubtasks = await TaskService.updateRefinedTask(task, responseData.task_updates);

    return {
      response_type: "task_details",
      task: updatedTaskWithSubtasks,
      message: "Task has been successfully broken down into sub-tasks."
    };
  }

  static async continueBreakdown(task: Task): Promise<ProcessTaskResponse> {
    const storedMessages = await ChatMessageService.getMessages(task.userId, task.id);
    const latestMessage = storedMessages[storedMessages.length - 1];
    console.log('latest message for breakdown', latestMessage);

    // Ensure the last message is from the user to continue processing
    if (latestMessage && latestMessage.role === 'user') {
      // Add the system prompt again for context in the continuation?
      // Or assume the context is sufficient from history.
      // For simplicity, let's send the whole history.
      const taskDetailsMessage = {
        role: "system",
        content: `
          Task:\n${JSON.stringify(task, null, 2)}
          Today: ${(new Date()).toISOString()}
        `
      };

      const messagesToSend = [
        ...storedMessages.map(msg => ({ role: msg.role, content: msg.content })),
        taskDetailsMessage
      ] as Array<ChatCompletionUserMessageParam | ChatCompletionSystemMessageParam>;

      // Send data to OpenAI for refinement
      const aiResponse = await openai.chat.completions.create({
        model: "gpt-4o",
        // Provide the full message history
        messages: messagesToSend,
        response_format: { type: "json_object" }
      })

      // Parse the AI response
      const responseData = JSON.parse(aiResponse.choices[0].message.content || '{}')
      console.log('AI continue breakdown response', responseData);

      if (responseData.action === 'ask_question') {
        return TaskService.askQuestion(task, {
          question: responseData.question,
          metadata: {
            type: "question",
            stage: "Breakdown" // Add stage context
          }
        });
      }

      // Assuming response_type is 'sub_tasks'
      const updatedTaskWithSubtasks = await TaskService.updateRefinedTask(task, responseData.task_updates);

      return {
        response_type: "task_details",
        task: updatedTaskWithSubtasks,
        message: "Task has been successfully broken down with further information."
      };
    }

    // If last message wasn't from user, or no messages, can't continue automatically
    return {
      response_type: "message_to_user",
      task: task,
      message: "Cannot continue breakdown without a user response to the last question."
    };
  }

  static async askQuestion(task: Task, data: { question: string, metadata: JsonObject}) {
    // Save the question directly using prisma
    const storedMessage = await ChatMessageService.createMessage({
      userId: task.userId,
      taskId: task.id,
      content: data.question,
      role: 'assistant',
      metadata: metadata,
    })

    // Update the task status
    const updatedTask = await TaskService.updateTask({
      id: task.id,
      userId: task.userId,
      stageStatus: 'QuestionAsked',
    });

    return {
      response_type: "message_to_user" as ProcessTaskResponse['response_type'],
      task: updatedTask,
      message: data.question
    };
  }

  static async updateRefinedTask(task: Task, refinedData: TaskRefinedData): Promise<Task> {

    // Prepare the update data with proper type validation
    const {priority, date, deadline, estimatedTimeMinutes, tags, notifications, sub_tasks, ...taskUpdates} = refinedData;
    const updates: UpdateTaskInput = {
      id: task.id,
      userId: task.userId,
      ...taskUpdates,
      ...(refinedData.priority ? {
        priority: ['low', 'medium', 'high'].includes(refinedData.priority?.toLowerCase())
        ? refinedData.priority.toLowerCase() as TaskPriority
        : undefined,
      } : {}),
      ...(refinedData.date ? {
        deadline: refinedData.date ? new Date(refinedData.date) : undefined,
      } : {}),
      ...(refinedData.deadline ? {
        deadline: refinedData.deadline ? new Date(refinedData.deadline) : undefined,
      } : {}),
      ...(refinedData.estimatedTimeMinutes ? {
        estimatedTimeMinutes: typeof refinedData.estimatedTimeMinutes === 'number'
        ? refinedData.estimatedTimeMinutes
        : undefined,
      } : {}),
      ...(refinedData.sub_tasks ? {
        children: {
          create: refinedData.sub_tasks.create?.map(sub => ({
            title: sub.title,
            description: sub.description,
            estimatedTimeMinutes: sub.estimatedTimeMinutes || 10, // Default to 10 mins
            userId: task.userId,
            date: sub.date, // Assign same date as parent initially
            priority: sub.priority, // Assign same priority as parent initially
            stage: 'Execution' // Sub-tasks start in Execution stage
          })) || [],
          update: refinedData.sub_tasks.update?.map(sub => ({
            id: sub.id,
            title: sub.title,
            description: sub.description,
            estimatedTimeMinutes: sub.estimatedTimeMinutes || 10, // Default to 10 mins
            date: sub.date, // Assign same date as parent initially
            priority: sub.priority, // Assign same priority as parent initially
          })) || [],
          removeIds: refinedData.sub_tasks.removeIds || [],
        }
      }: {}),
      ...(notifications ? {
        notifications: {
          create: notifications.create?.map(notification => ({
            message: notification.message,
            type: 'Reminder', // notification.type,
            trigger: notification.trigger,
            mode: 'Push', // notification.mode,
            relativeTimeValue: notification.relativeTimeValue,
            relativeTimeUnit: notification.relativeTimeUnit,
            fixedTime: notification.fixedTime,
            author: notification.author,
          })),
          update: notifications.update?.map(notification => ({
            id: notification.id,
            message: notification.message,
            type: 'Reminder', // notification.type,
            trigger: notification.trigger,
            mode: 'Push', // notification.mode,
            relativeTimeValue: notification.relativeTimeValue,
            relativeTimeUnit: notification.relativeTimeUnit,
            fixedTime: notification.fixedTime,
            author: notification.author,
          })),
          removeIds: [],
        }
      } : {}),
      stageStatus: 'Completed',
    }

    console.log('task updates- ', updates)

    // Handle tags from AI response
    if (tags && Array.isArray(tags)) {
      const [allTags, allCategories] = await Promise.all([
        TagService.getTags(),
        TagService.getTagCategories()
      ])

      const tagIds: string[] = []

      for (const tagData of tags) {
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
      await ChatMessageService.createMessage({
        userId: task.userId,
        taskId: task.id,
        content: "Task has been updated.",
        role: ChatMessageRole.assistant,
        metadata: {
          type: "info",
          refinement: true
        }
      })
    }

    return updatedTask;
  }

  // Helper function to fetch all active tasks for a user
  private static async fetchUserTasks(userId: string): Promise<Task[]> {
    return prisma.task.findMany({
      where: {
        userId,
        completed: false
      },
      include: {
        children: true,
        tags: {
          include: {
            category: true
          }
        },
        parent: {
          select: {
            id: true,
            title: true,
            priority: true,
            deadline: true
          }
        }
      },
      orderBy: [
        { deadline: 'asc' },
        { priority: 'desc' }
      ]
    });
  }

  // Helper function to prepare task data for AI prioritization
  private static prepareTasksForAI(tasks: any[]): any[] {
    return tasks.map(task => ({
      id: task.id,
      title: task.title,
      description: task.description || '',
      stage: task.stage,
      stageStatus: task.stageStatus,
      priority: task.priority,
      deadline: task.deadline,
      estimatedTimeMinutes: task.estimatedTimeMinutes,
      hasChildren: task.children?.length > 0,
      isSubtask: !!task.parentId,
      parentInfo: task.parent ? {
        id: task.parent.id,
        title: task.parent.title
      } : null,
      tags: Array.isArray(task.tags) 
        ? task.tags.map((tag: any) => ({
            name: tag.name,
            category: tag.category?.name || ''
          }))
        : []
    }));
  }

  static async prioritizeTasks(input: PrioritizeTasksInput): Promise<Task[]> {
    const { userId } = input;

    console.log('prioritize', userId);
    
    // 1. Fetch all tasks and subtasks for the user
    const userTasks = await TaskService.fetchUserTasks(userId);

    // If no tasks, return empty array
    if (userTasks.length === 0) {
      return [];
    }

    // 2. Get previous messages for context
    const previousMessages = await ChatMessageService.getMessages(userId);

    // Check if previous messages contain a message about starting prioritization
    const hasPrioritizationStart = previousMessages.some(msg => 
      msg.role === 'user' && 
      msg.content.toLowerCase().includes('Please prioritize these tasks')
    );

    // If no prioritization start found, call prioritizeTasks instead
    if (hasPrioritizationStart) {
      return TaskService.continuePrioritizeTasks({ userId });
    }

    // 2. Prepare task data for AI prioritization
    const tasksForAI = TaskService.prepareTasksForAI(userTasks);

    // 3. Create system message with prioritization instruction  
    const messagesForAI = [
      {
        role: "system" as const,
        content: prioritizationInstructions
      },
      {
        role: "user" as const,
        content: `Please prioritize these tasks in the optimal order:\n${JSON.stringify(tasksForAI, null, 2)}`
      }
    ];

    // Store the sent messages
    for (const msg of messagesForAI) {
      await ChatMessageService.createMessage({
        role: msg.role as ChatMessageRole,
        content: msg.content as string,
        userId: userId,
      });
    }

    // 4. Send to OpenAI for prioritization
    try {
      const aiResponse = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: messagesForAI,
        response_format: { type: "json_object" }
      });

      // 5. Parse the AI response
      const responseData = JSON.parse(aiResponse.choices[0].message.content || '{}');
      
      // Store AI response
      await ChatMessageService.createMessage({
        role: ChatMessageRole.assistant,
        content: aiResponse.choices[0].message.content || '',
        userId: userId,
      });

      console.log('response from AI', responseData);
      
      if (!responseData.prioritized_tasks || !Array.isArray(responseData.prioritized_tasks)) {
        throw new Error("Invalid AI response format. Expected prioritized_tasks array.");
      }

      // 6. Update tasks with the AI prioritization
      const updatedTasks = await Promise.all(
        responseData.prioritized_tasks.map(async (prioritizedTask: any, index: number) => {
          // Find the corresponding task
          const originalTask = userTasks.find(t => t.id === prioritizedTask.id);
          
          if (!originalTask) {
            console.error(`Task not found: ${prioritizedTask.id}`);
            return null;
          }

          // Create or update the description with the prioritization reason
          let updatedDescription = originalTask.description || '';
          const priorityReasonText = `\n\nPriority Reason: ${prioritizedTask.reason}`;
          
          // Check if description already has a priority reason
          if (updatedDescription.includes('Priority Reason:')) {
            // Replace existing priority reason
            updatedDescription = updatedDescription.replace(/\n\nPriority Reason:.*$/, priorityReasonText);
          } else {
            // Add new priority reason
            updatedDescription += priorityReasonText;
          }

          // Update the task with new priority information
          return prisma.task.update({
            where: {
              id: prioritizedTask.id,
              userId
            },
            data: {
              // Update position for ordering (if not already set by user)
              position: index + 1,
              
              // Only update priority if AI suggests a change and it's valid
              ...(prioritizedTask.priority && 
                  ['low', 'medium', 'high'].includes(prioritizedTask.priority.toLowerCase()) && 
                  prioritizedTask.priority.toLowerCase() !== originalTask.priority
                ? { priority: prioritizedTask.priority.toLowerCase() as TaskPriority }
                : {}),
              
              // Update estimated time only if not already set
              ...(originalTask.estimatedTimeMinutes === 0 && prioritizedTask.estimated_time_minutes
                ? { estimatedTimeMinutes: prioritizedTask.estimated_time_minutes }
                : {}),
              
              // Store the reason for priority in the description
              description: updatedDescription
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
        })
      );

      // Create a log entry for task prioritization
      await LogService.createLog({
        type: 'tasks_prioritized' as any, // Using type assertion to avoid type error
        userId,
        data: {
          taskCount: updatedTasks.length,
          timestamp: new Date()
        },
        author: 'App'
      });

      // Filter out null results and return the updated tasks
      return updatedTasks.filter(task => task !== null) as Task[];
      
    } catch (error) {
      console.error("Error prioritizing tasks:", error);
      // If AI fails, return the original tasks sorted by deadline and priority
      return userTasks;
    }
  }

  static async continuePrioritizeTasks(input: ContinuePrioritizeTasksInput): Promise<Task[]> {
    const { userId } = input;
    
    // 1. Fetch all tasks and subtasks for the user
    const userTasks = await TaskService.fetchUserTasks(userId);

    // If no tasks, return empty array
    if (userTasks.length === 0) {
      return [];
    }

    // 2. Get previous messages for context
    const previousMessages = await ChatMessageService.getMessages(userId);

    // Check if previous messages contain a message about starting prioritization
    const hasPrioritizationStart = previousMessages.some(msg => 
      msg.role === 'user' && 
      msg.content.toLowerCase().includes('Please prioritize these tasks')
    );

    // If no prioritization start found, call prioritizeTasks instead
    if (!hasPrioritizationStart) {
      return TaskService.prioritizeTasks({ userId });
    }

    const latestMessage = previousMessages[previousMessages.length - 1];
    
    // Check if the latest message is from the user to continue processing
    if (!latestMessage || latestMessage.role !== 'user') {
      console.error("Cannot continue prioritization without a user message");
      return userTasks;
    }

    // 3. Prepare task data for AI prioritization
    const tasksForAI = TaskService.prepareTasksForAI(userTasks);

    // 4. Prepare system message with current task context
    const taskContextMessage = {
      role: "system" as const,
      content: `Updated tasks:\n${JSON.stringify(tasksForAI, null, 2)}\nToday is ${(new Date()).toISOString()}`
    };

    // 5. Combine previous messages with current context for continuity
    const messagesToSend = [
      ...previousMessages.map(msg => ({ 
        role: msg.role as "system" | "user" | "assistant", 
        content: msg.content 
      })),
      taskContextMessage
    ] as Array<ChatCompletionUserMessageParam | ChatCompletionSystemMessageParam>;

    // // Save the system context message
    // await ChatMessageService.createMessage({
    //   role: taskContextMessage.role as ChatMessageRole,
    //   content: taskContextMessage.content,
    //   userId: userId,
    //   taskId: '',
    // });

    // 6. Send to OpenAI for continued prioritization
    try {
      const aiResponse = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: messagesToSend,
        response_format: { type: "json_object" }
      });

      // 7. Parse the AI response
      const responseContent = aiResponse.choices[0].message.content || '{}';
      const responseData = JSON.parse(responseContent);
      
      // Save AI response
      await ChatMessageService.createMessage({
        role: ChatMessageRole.assistant,
        content: responseContent,
        userId: userId,
      });

      console.log('AI continued prioritization response', responseData);
      
      if (!responseData.prioritized_tasks || !Array.isArray(responseData.prioritized_tasks)) {
        throw new Error("Invalid AI response format. Expected prioritized_tasks array.");
      }

      // 8. Update tasks with the AI prioritization (same as in prioritizeTasks)
      const updatedTasks = await Promise.all(
        responseData.prioritized_tasks.map(async (prioritizedTask: any, index: number) => {
          const originalTask = userTasks.find(t => t.id === prioritizedTask.id);
          
          if (!originalTask) {
            console.error(`Task not found: ${prioritizedTask.id}`);
            return null;
          }

          let updatedDescription = originalTask.description || '';
          const priorityReasonText = `\n\nPriority Reason: ${prioritizedTask.reason}`;
          
          if (updatedDescription.includes('Priority Reason:')) {
            updatedDescription = updatedDescription.replace(/\n\nPriority Reason:.*$/, priorityReasonText);
          } else {
            updatedDescription += priorityReasonText;
          }

          return prisma.task.update({
            where: {
              id: prioritizedTask.id,
              userId
            },
            data: {
              position: index + 1,
              
              ...(prioritizedTask.priority && 
                  ['low', 'medium', 'high'].includes(prioritizedTask.priority.toLowerCase()) && 
                  prioritizedTask.priority.toLowerCase() !== originalTask.priority
                ? { priority: prioritizedTask.priority.toLowerCase() as TaskPriority }
                : {}),
              
              ...(originalTask.estimatedTimeMinutes === 0 && prioritizedTask.estimated_time_minutes
                ? { estimatedTimeMinutes: prioritizedTask.estimated_time_minutes }
                : {}),
              
              description: updatedDescription
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
        })
      );

      // Create a log entry for task prioritization
      await LogService.createLog({
        type: 'tasks_prioritized' as any, // Using type assertion to avoid type error
        userId,
        data: {
          taskCount: updatedTasks.length,
          timestamp: new Date(),
          continued: true
        },
        author: 'App'
      });

      // Filter out null results and return the updated tasks
      return updatedTasks.filter(task => task !== null) as Task[];
      
    } catch (error) {
      console.error("Error continuing task prioritization:", error);
      return userTasks;
    }
  }
} 