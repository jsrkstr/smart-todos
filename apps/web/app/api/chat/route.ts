import { AuthenticatedApiRequest, withAuth } from "@/lib/api-middleware";
import { NextResponse } from "next/server";
import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { TaskService } from "@/lib/services/taskService";
import { LogService } from "@/lib/services/logService";
import { prisma } from "@/lib/prisma";
import { Task, TaskPriority, TaskStage, User, PsychProfile, Settings, ChatMessageRole } from "@prisma/client";
import { ChatMessageService } from "@/lib/services/chatMessageService";

export const POST = withAuth(async (req: AuthenticatedApiRequest): Promise<Response> => {
  try {
    const { messages, taskId } = await req.json();
    const userId = req.user.id;

    // Store the user message to the database
    const lastUserMessage = messages.findLast((m: any) => m.role === 'user');
    if (lastUserMessage) {
      await ChatMessageService.createMessage({
        userId,
        taskId: taskId || undefined,
        content: lastUserMessage.content,
        role: ChatMessageRole.user
      });
    }

    const storedMessages = await ChatMessageService.getMessages(userId, taskId);

    const isSystemPromptSend = storedMessages.some(m => m.role === 'system');

    // Modify the system prompt to ensure tool calls are always followed by a user-visible message
    const systemPrompt = `
      You are an AI assistant specializing in task management, helping users organize and complete their to-do list.
      You have access to the user's tasks, profile information, and activity logs.

      Your capabilities include:
      1. Refining tasks - improving titles, descriptions, and adding details like priority, deadlines, etc.
      2. Breaking down tasks into smaller logical units (subtasks)
      3. Prioritizing tasks based on deadlines, complexity, and the user's preferences
      4. Answering questions about the user's tasks and productivity

      Workflow Rules:
      1. Understand the user request.
      2. If necessary, use ONE tool to gather information (like read_task) or perform an action (like update_task).
      3. **CRITICAL:** After a tool runs and provides you information, your *very next step* MUST be to generate a user-facing text response. Explain what you found, ask clarifying questions, or state what you did.
      4. NEVER stop generating after a tool call. Always follow up with text for the user.
      5. If you need to update a task after reading it, do it in a separate step after confirming with the user or getting clarification.
      6. Use the save_chat_message tool ONLY for your final user-facing text responses.

      When helping users, always consider:
      - Their psychological profile and preferences to personalize your assistance
      - Recent activity and task completion patterns
      - Task deadlines and priorities

      Use a supportive, motivational tone that encourages productivity.
      Be very concise and direct in your assistance.

      User is talking in context of  ${taskId ? `Task with id: ${taskId}` : `all his tasks`}
      
      Today is ${(new Date()).toISOString()}
    `;

    // Define the tools
    const tools = {
      read_task: {
        description: "Fetch a specific task by ID with all its details including subtasks and notifications",
        parameters: z.object({
          taskId: z.string().describe("The ID of the task to fetch"),
        }),
        execute: async ({ taskId }: { taskId: string }) => {
          const task = await TaskService.getTask(taskId, userId);
          return task;
        },
      },
      read_all_tasks: {
        description: "Fetch all tasks for the user with optional filters",
        parameters: z.object({
          completed: z.boolean().optional().describe("Filter by completion status"),
          priority: z.enum(["low", "medium", "high"]).optional().describe("Filter by priority"),
          estimatedTimeMinutes: z.object({
            lte: z.number().optional().describe("Less than or equal to this time in minutes"),
            gte: z.number().optional().describe("Greater than or equal to this time in minutes"),
          }).optional().describe("Filter by estimated time")
        }),
        execute: async ({ completed, priority, estimatedTimeMinutes }: { 
          completed?: boolean, 
          priority?: TaskPriority,
          estimatedTimeMinutes?: { lte?: number, gte?: number }
        }) => {
          // Use prisma to fetch tasks with filters
          const tasks = await prisma.task.findMany({
            where: {
              userId,
              ...(completed !== undefined ? { completed } : {}),
              ...(priority ? { priority } : {}),
              ...(estimatedTimeMinutes?.lte ? { estimatedTimeMinutes: { lte: estimatedTimeMinutes.lte } } : {}),
              ...(estimatedTimeMinutes?.gte ? { estimatedTimeMinutes: { gte: estimatedTimeMinutes.gte } } : {})
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
            orderBy: [
              { position: 'asc' },
              { deadline: 'asc' },
              { priority: 'desc' }
            ]
          });
          return tasks;
        },
      },
      read_user: {
        description: "Fetch user details including preferences and settings",
        parameters: z.object({}),
        execute: async () => {
          const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
              settings: true,
              psychProfile: {
                include: {
                  coach: true
                }
              }
            }
          });
          return user;
        },
      },
      update_task: {
        description: "Update a task with new data",
        parameters: z.object({
          taskId: z.string().describe("The ID of the task to update"),
          data: z.object({
            title: z.string().optional().describe("New title for the task"),
            description: z.string().optional().describe("New description for the task"),
            priority: z.enum(["low", "medium", "high"]).optional().describe("New priority level"),
            deadline: z.string().optional().describe("New deadline (ISO string)"),
            date: z.string().optional().describe("New planned date (ISO string)"),
            estimatedTimeMinutes: z.number().optional().describe("New estimated time in minutes"),
            stage: z.enum(["Refinement", "Breakdown", "Planning", "Execution", "Reflection"]).optional().describe("New task stage"),
            stageStatus: z.enum(["NotStarted", "InProgress", "QuestionAsked", "Completed"]).optional().describe("New stage status"),
            completed: z.boolean().optional().describe("Mark as completed"),
          }).describe("The task data to update")
        }),
        execute: async ({ taskId, data }: { taskId: string, data: any }) => {
          // Format date fields if they exist
          const formattedData = {
            ...data,
            ...(data.deadline ? { deadline: new Date(data.deadline) } : {}),
            ...(data.date ? { date: new Date(data.date) } : {})
          };
          
          const task = await TaskService.updateTask({
            id: taskId,
            userId,
            ...formattedData
          });
          
          // Log the update
          await LogService.createTaskLog({
            type: 'task_updated',
            userId,
            taskId,
            author: 'Bot',
            data: { 
              updatedFields: Object.keys(data),
              title: task.title
            }
          });
          
          return task;
        },
      },
      read_logs: {
        description: "Fetch user activity logs",
        parameters: z.object({
          limit: z.number().optional().describe("Number of logs to fetch"),
          type: z.string().optional().describe("Type of log to filter by"),
          taskId: z.string().optional().describe("Filter logs by task ID")
        }),
        execute: async ({ limit = 20, type, taskId }: { limit?: number, type?: string, taskId?: string }) => {
          const logs = await prisma.log.findMany({
            where: {
              userId,
              ...(type ? { type: type as any } : {}),
              ...(taskId ? { taskId } : {})
            },
            orderBy: { createdAt: 'desc' },
            take: limit
          });
          return logs;
        }
      },
      create_task: {
        description: "Create a new task",
        parameters: z.object({
          title: z.string().describe("Title of the task"),
          description: z.string().optional().describe("Description of the task"),
          priority: z.enum(["low", "medium", "high"]).optional().describe("Priority level"),
          deadline: z.string().optional().describe("Deadline (ISO string)"),
          date: z.string().optional().describe("Planned date (ISO string)"),
          estimatedTimeMinutes: z.number().optional().describe("Estimated time in minutes"),
          parentId: z.string().optional().describe("Parent task ID if this is a subtask")
        }),
        execute: async ({ title, description, priority, deadline, date, estimatedTimeMinutes, parentId }: { 
          title: string, 
          description?: string, 
          priority?: TaskPriority, 
          deadline?: string, 
          date?: string, 
          estimatedTimeMinutes?: number,
          parentId?: string
        }) => {
          const newTask = await TaskService.createTask({
            title,
            description,
            priority: priority || "medium",
            deadline: deadline ? new Date(deadline) : undefined,
            date: date ? new Date(date) : undefined,
            estimatedTimeMinutes: estimatedTimeMinutes || 0,
            userId,
            parentId
          });
          
          return newTask;
        }
      },
      create_subtasks: {
        description: "Create multiple subtasks for a parent task",
        parameters: z.object({
          parentTaskId: z.string().describe("Parent task ID"),
          subtasks: z.array(z.object({
            title: z.string().describe("Subtask title"),
            description: z.string().optional().describe("Subtask description"),
            estimatedTimeMinutes: z.number().optional().describe("Estimated time in minutes"),
          })).describe("List of subtasks to create")
        }),
        execute: async ({ parentTaskId, subtasks }: { 
          parentTaskId: string, 
          subtasks: Array<{ title: string, description?: string, estimatedTimeMinutes?: number }>
        }) => {
          // Verify parent task exists and belongs to user
          const parentTask = await TaskService.getTask(parentTaskId, userId);
          if (!parentTask) {
            throw new Error("Parent task not found");
          }
          
          // Create subtasks
          const createdSubtasks = [];
          for (const subtask of subtasks) {
            const newTask = await TaskService.createTask({
              ...subtask,
              userId,
              parentId: parentTaskId,
              priority: parentTask.priority,
              date: parentTask.date || undefined,
              deadline: parentTask.deadline || undefined,
              stage: "Breakdown" as TaskStage
            });
            createdSubtasks.push(newTask);
          }
          
          // Update parent task stage if it's in refinement
          if (parentTask.stage === "Refinement") {
            await TaskService.updateTask({
              id: parentTaskId,
              userId,
              stage: "Breakdown" as TaskStage,
              stageStatus: "Completed"
            });
          }
          
          return createdSubtasks;
        }
      },
      search_tasks: {
        description: "Search for tasks by text in title or description",
        parameters: z.object({
          query: z.string().describe("Text to search for in task titles and descriptions"),
          completed: z.boolean().optional().describe("Filter by completion status")
        }),
        execute: async ({ query, completed }: { query: string, completed?: boolean }) => {
          // Use Prisma to search tasks (basic implementation)
          const tasks = await prisma.task.findMany({
            where: {
              userId,
              ...(completed !== undefined ? { completed } : {}),
              OR: [
                { title: { contains: query, mode: "insensitive" } },
                { description: { contains: query, mode: "insensitive" } }
              ]
            },
            include: {
              children: true,
              tags: {
                include: {
                  category: true
                }
              }
            }
          });
          
          return tasks;
        }
      },
      save_chat_message: {
        description: "Save a message to the chat history",
        parameters: z.object({
          content: z.string().describe("Content of the message"),
          role: z.enum(["assistant", "system"]).describe("Role of the message sender"),
          taskId: z.string().optional().describe("ID of the task this message is related to"),
          metadata: z.record(z.any()).optional().describe("Additional metadata for the message")
        }),
        execute: async ({ content, role, taskId, metadata }: {
          content: string,
          role: "assistant" | "system",
          taskId?: string,
          metadata?: Record<string, any>
        }) => {
          // First create the chat message
          const chatMessage = await ChatMessageService.createMessage({
            userId,
            taskId,
            content,
            role: role as ChatMessageRole,
            metadata
          });

          return chatMessage;
        }
      }
    };

    // Stream the response
    const result = await streamText({
      model: openai("gpt-4o"),
      system: isSystemPromptSend ? undefined : systemPrompt,
      messages,
      tools,
      maxSteps: 5,
    });

    // Return the streaming response
    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Error in chat API:", error);
    return NextResponse.json(
      { error: "Failed to process chat request" },
      { status: 500 }
    );
  }
});

