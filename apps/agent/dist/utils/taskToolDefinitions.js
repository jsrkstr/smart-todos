"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.taskToolDefinitions = void 0;
const taskToolSchemas_1 = require("./taskToolSchemas");
const tools_1 = require("langchain/tools");
exports.taskToolDefinitions = [
    new tools_1.DynamicStructuredTool({
        name: "read_all_tasks",
        description: "Fetch all tasks for the user with optional filters",
        schema: taskToolSchemas_1.readAllTasksSchema,
        func: async function (params) {
            try {
                // Access the context from the tool instance
                const tool = this;
                const context = tool._context;
                if (!context) {
                    throw new Error('Context not provided to tool');
                }
                const { completed, priority, estimatedTimeMinutes } = params;
                const userId = context.userId;
                const where = { userId };
                if (completed !== undefined)
                    where.completed = completed;
                if (priority)
                    where.priority = priority;
                if (estimatedTimeMinutes) {
                    where.estimatedTimeMinutes = {};
                    if (estimatedTimeMinutes.lte !== undefined)
                        where.estimatedTimeMinutes.lte = estimatedTimeMinutes.lte;
                    if (estimatedTimeMinutes.gte !== undefined)
                        where.estimatedTimeMinutes.gte = estimatedTimeMinutes.gte;
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
            }
            catch (error) {
                return JSON.stringify({ error: error instanceof Error ? error.message : String(error) });
            }
        },
    }),
    new tools_1.DynamicStructuredTool({
        name: "read_user",
        description: "Fetch user details including preferences and settings",
        schema: taskToolSchemas_1.readUserSchema,
        func: async function (_params) {
            try {
                // Access the context from the tool instance
                const tool = this;
                const context = tool._context;
                if (!context) {
                    throw new Error('Context not provided to tool');
                }
                const user = await context.prisma.user.findUnique({
                    where: { id: context.userId },
                    include: { settings: true, psychProfile: true }
                });
                return JSON.stringify(user);
            }
            catch (error) {
                return JSON.stringify({ error: error instanceof Error ? error.message : String(error) });
            }
        },
    }),
    new tools_1.DynamicStructuredTool({
        name: "update_task",
        description: "Update a single task with new data",
        schema: taskToolSchemas_1.updateTaskSchema,
        func: async function (params) {
            try {
                // Access the context from the tool instance
                const tool = this;
                const context = tool._context;
                if (!context) {
                    throw new Error('Context not provided to tool');
                }
                const { taskId, data } = params;
                const result = await context.TaskService.updateTask(Object.assign({ id: taskId, userId: context.userId }, data));
                return JSON.stringify(result);
            }
            catch (error) {
                return JSON.stringify({ error: error instanceof Error ? error.message : String(error) });
            }
        },
    }),
    new tools_1.DynamicStructuredTool({
        name: "update_tasks_many",
        description: "Update many tasks with new data",
        schema: taskToolSchemas_1.updateTasksManySchema,
        func: async function (params) {
            try {
                // Access the context from the tool instance
                const tool = this;
                const context = tool._context;
                if (!context) {
                    throw new Error('Context not provided to tool');
                }
                const result = await context.TaskService.updateTasksMany({
                    userId: context.userId,
                    data: params.data
                });
                return JSON.stringify(result);
            }
            catch (error) {
                return JSON.stringify({ error: error instanceof Error ? error.message : String(error) });
            }
        },
    }),
    new tools_1.DynamicStructuredTool({
        name: "create_task",
        description: "Create a new task",
        schema: taskToolSchemas_1.createTaskSchema,
        func: async function (params) {
            try {
                // Access the context from the tool instance
                const tool = this;
                const context = tool._context;
                if (!context) {
                    throw new Error('Context not provided to tool');
                }
                const result = await context.TaskService.createTask(Object.assign({ userId: context.userId }, params));
                return JSON.stringify(result);
            }
            catch (error) {
                return JSON.stringify({ error: error instanceof Error ? error.message : String(error) });
            }
        },
    })
];
