import {
  readAllTasksSchema,
  readUserSchema,
  updateTaskSchema,
  updateTasksManySchema,
  createTaskSchema
} from './taskToolSchemas';

import { DynamicStructuredTool } from 'langchain/tools';
import {
  readAllTasksSchema,
  readUserSchema,
  updateTaskSchema,
  updateTasksManySchema,
  createTaskSchema
} from './taskToolSchemas';

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
    func: async (params: any) => {
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
        return await context.prisma.task.findMany({
          where,
          include: {
            children: true,
            tags: true,
            notifications: true
          }
        });
      } catch (error) {
        return { error: error instanceof Error ? error.message : String(error) };
      }
    },
  }),
  new DynamicStructuredTool({
    name: "read_user",
    description: "Fetch user details including preferences and settings",
    schema: readUserSchema,
    func: async (_params: any) => {
      try {
        // Access the context from the tool instance
        const tool = this as any;
        const context = tool._context as AgentToolContext;
        if (!context) {
          throw new Error('Context not provided to tool');
        }

        return await context.prisma.user.findUnique({
          where: { id: context.userId },
          include: { settings: true, psychProfile: true }
        });
      } catch (error) {
        return { error: error instanceof Error ? error.message : String(error) };
      }
    },
  }),
  new DynamicStructuredTool({
    name: "update_task",
    description: "Update a single task with new data",
    schema: updateTaskSchema,
    func: async (params: any) => {
      try {
        // Access the context from the tool instance
        const tool = this as any;
        const context = tool._context as AgentToolContext;
        if (!context) {
          throw new Error('Context not provided to tool');
        }

        const { taskId, data } = params;
        return await context.TaskService.updateTask({
          id: taskId,
          userId: context.userId,
          ...data
        });
      } catch (error) {
        return { error: error instanceof Error ? error.message : String(error) };
      }
    },
  }),
  new DynamicStructuredTool({
    name: "update_tasks_many",
    description: "Update many tasks with new data",
    schema: updateTasksManySchema,
    func: async (params: any) => {
      try {
        // Access the context from the tool instance
        const tool = this as any;
        const context = tool._context as AgentToolContext;
        if (!context) {
          throw new Error('Context not provided to tool');
        }

        return await context.TaskService.updateTasksMany({
          userId: context.userId,
          data: params.data
        });
      } catch (error) {
        return { error: error instanceof Error ? error.message : String(error) };
      }
    },
  }),
  new DynamicStructuredTool({
    name: "create_task",
    description: "Create a new task",
    schema: createTaskSchema,
    func: async (params: any) => {
      try {
        // Access the context from the tool instance
        const tool = this as any;
        const context = tool._context as AgentToolContext;
        if (!context) {
          throw new Error('Context not provided to tool');
        }

        return await context.TaskService.createTask({
          userId: context.userId,
          ...params
        });
      } catch (error) {
        return { error: error instanceof Error ? error.message : String(error) };
      }
    },
  })
];
