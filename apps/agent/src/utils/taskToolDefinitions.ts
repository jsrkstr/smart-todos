import {
  readAllTasksSchema,
  readUserSchema,
  updateTaskSchema,
  updateTasksManySchema,
  createTaskSchema
} from './taskToolSchemas';

import { DynamicStructuredTool } from 'langchain/tools';

// Define the context type expected by all tools
export type AgentToolContext = {
  userId: string;
  prisma: any;
  TaskService: any;
};

export const taskToolDefinitions = [
  new DynamicStructuredTool({
    name: "read_all_tasks",
    description: "Fetch all tasks for the user with optional filters",
    schema: readAllTasksSchema,
    func: async function(params: any) {
      try {
        // Access the context from the tool instance
        const tool = this as any;
        const context = tool._context as AgentToolContext;
        if (!context) {
          throw new Error('Context not provided to tool');
        }

        const { completed, priority, estimatedTimeMinutes } = params;
        const userId = context.userId;
        const where: any = { userId };
        if (completed !== undefined) where.completed = completed;
        if (priority) where.priority = priority;
        if (estimatedTimeMinutes) {
          where.estimatedTimeMinutes = {};
          if (estimatedTimeMinutes.lte !== undefined) where.estimatedTimeMinutes.lte = estimatedTimeMinutes.lte;
          if (estimatedTimeMinutes.gte !== undefined) where.estimatedTimeMinutes.gte = estimatedTimeMinutes.gte;
        }
        const tasks = await context.prisma.task.findMany({
          where,
          include: {
            children: true,
            tags: true,
            notifications: true
          }
        });
        return JSON.stringify(tasks);
      } catch (error) {
        return JSON.stringify({ error: error instanceof Error ? error.message : String(error) });
      }
    },
  }),
  new DynamicStructuredTool({
    name: "read_user",
    description: "Fetch user details including preferences and settings",
    schema: readUserSchema,
    func: async function(_params: any) {
      try {
        // Access the context from the tool instance
        const tool = this as any;
        const context = tool._context as AgentToolContext;
        if (!context) {
          throw new Error('Context not provided to tool');
        }

        const user = await context.prisma.user.findUnique({
          where: { id: context.userId },
          include: { settings: true, psychProfile: true }
        });
        return JSON.stringify(user);
      } catch (error) {
        return JSON.stringify({ error: error instanceof Error ? error.message : String(error) });
      }
    },
  }),
  new DynamicStructuredTool({
    name: "update_task",
    description: "Update a single task with new data",
    schema: updateTaskSchema,
    func: async function(params: any) {
      try {
        // Access the context from the tool instance
        const tool = this as any;
        const context = tool._context as AgentToolContext;
        if (!context) {
          throw new Error('Context not provided to tool');
        }

        const { taskId, data } = params;
        const result = await context.TaskService.updateTask({
          id: taskId,
          userId: context.userId,
          ...data
        });
        return JSON.stringify(result);
      } catch (error) {
        return JSON.stringify({ error: error instanceof Error ? error.message : String(error) });
      }
    },
  }),
  new DynamicStructuredTool({
    name: "update_tasks_many",
    description: "Update many tasks with new data",
    schema: updateTasksManySchema,
    func: async function(params: any) {
      try {
        // Access the context from the tool instance
        const tool = this as any;
        const context = tool._context as AgentToolContext;
        if (!context) {
          throw new Error('Context not provided to tool');
        }

        const result = await context.TaskService.updateTasksMany({
          userId: context.userId,
          data: params.data
        });
        return JSON.stringify(result);
      } catch (error) {
        return JSON.stringify({ error: error instanceof Error ? error.message : String(error) });
      }
    },
  }),
  new DynamicStructuredTool({
    name: "create_task",
    description: "Create a new task",
    schema: createTaskSchema,
    func: async function(params: any) {
      try {
        // Access the context from the tool instance
        const tool = this as any;
        const context = tool._context as AgentToolContext;
        if (!context) {
          throw new Error('Context not provided to tool');
        }

        const result = await context.TaskService.createTask({
          userId: context.userId,
          ...params
        });
        return JSON.stringify(result);
      } catch (error) {
        return JSON.stringify({ error: error instanceof Error ? error.message : String(error) });
      }
    },
  })
];
