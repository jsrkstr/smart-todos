"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTaskSchema = exports.updateTasksManySchema = exports.updateTaskSchema = exports.readUserSchema = exports.readAllTasksSchema = void 0;
const zod_1 = require("zod");
exports.readAllTasksSchema = zod_1.z.object({
    completed: zod_1.z.boolean().optional().describe("Filter by completion status"),
    priority: zod_1.z.enum(["low", "medium", "high"]).optional().describe("Filter by priority"),
    estimatedTimeMinutes: zod_1.z.object({
        lte: zod_1.z.number().optional().describe("Less than or equal to this time in minutes"),
        gte: zod_1.z.number().optional().describe("Greater than or equal to this time in minutes"),
    }).optional().describe("Filter by estimated time")
});
exports.readUserSchema = zod_1.z.object({});
exports.updateTaskSchema = zod_1.z.object({
    taskId: zod_1.z.string().describe("The ID of the task to update"),
    data: zod_1.z.object({
        title: zod_1.z.string().optional().describe("New title for the task"),
        description: zod_1.z.string().optional().describe("New description for the task"),
        priority: zod_1.z.enum(["low", "medium", "high"]).optional().describe("New priority level"),
        deadline: zod_1.z.string().optional().describe("New deadline (ISO string)"),
        date: zod_1.z.string().optional().describe("New planned date (ISO string)"),
        estimatedTimeMinutes: zod_1.z.number().optional().describe("New estimated time in minutes"),
        stage: zod_1.z.enum(["Refinement", "Breakdown", "Planning", "Execution", "Reflection"]).optional().describe("New task stage"),
        stageStatus: zod_1.z.enum(["NotStarted", "InProgress", "QuestionAsked", "Completed"]).optional().describe("New stage status"),
        completed: zod_1.z.boolean().optional().describe("Mark as completed"),
        location: zod_1.z.string().optional().describe("Location for the task"),
        repeats: zod_1.z.string().optional().describe("Recurrence rule for repetitive tasks in RRULE format"),
        why: zod_1.z.string().optional().describe("Why of the task"),
        points: zod_1.z.number().optional().describe("Points allotted to user when he completes the task, is based on the estimatedTimeMinutes and priority of task"),
        tags: zod_1.z.array(zod_1.z.object({
            name: zod_1.z.string().describe('name of tag'),
            category: zod_1.z.string().describe('category of tag'),
        })).optional().describe('list of tags (max 1)'),
        notifications: zod_1.z.object({
            create: zod_1.z.array(zod_1.z.object({
                trigger: zod_1.z.enum(["RelativeTime", "FixedTime", "Location"]).describe('When the notification triggered'),
                message: zod_1.z.string().describe('Message shown to user'),
                relativeTimeValue: zod_1.z.number().optional().describe('Time before scheduled time of task, if trigger=RelativeTime'),
                relativeTimeUnit: zod_1.z.enum(["Minutes", "Hours", "Days"]).optional().describe('Unit of time before scheduled time of task'),
                fixedTime: zod_1.z.string().optional().describe("Time of notification delivery, if trigger=FixedTime (ISO string)"),
                author: zod_1.z.enum(["User", "Model", "Bot"]),
            })).optional().describe('List of notifications to add'),
            update: zod_1.z.array(zod_1.z.object({
                id: zod_1.z.string().describe('Id of notification to update'),
                read: zod_1.z.boolean().optional().describe('status of notification'),
                trigger: zod_1.z.enum(["RelativeTime", "FixedTime", "Location"]).optional().describe('When the notification triggered'),
                message: zod_1.z.string().optional().describe('Message shown to user'),
                relativeTimeValue: zod_1.z.number().optional().describe('Time before scheduled time of task, if trigger=RelativeTime'),
                relativeTimeUnit: zod_1.z.enum(["Minutes", "Hours", "Days"]).optional().describe('Unit of time before scheduled time of task'),
                fixedTime: zod_1.z.string().optional().describe("Time of notification delivery, if trigger=FixedTime (ISO string)"),
            })).optional().describe('List of notifications to update'),
            removeIds: zod_1.z.array(zod_1.z.string()).optional().describe('List of notification ids to remove'),
        }).optional().describe('Notifications data'),
    }).describe("The task data to update")
});
exports.updateTasksManySchema = zod_1.z.object({
    data: zod_1.z.array(zod_1.z.object({
        id: zod_1.z.string(),
        priority: zod_1.z.enum(["low", "medium", "high"]).optional().describe("New priority level"),
        position: zod_1.z.number().optional().describe("Position of task in the list"),
        estimatedTimeMinutes: zod_1.z.number().optional().describe("New estimated time"),
        priorityReason: zod_1.z.string().optional().describe("Clear explanation of why this task has this priority and position"),
        deadline: zod_1.z.string().optional().describe("New deadline (ISO string)"),
        date: zod_1.z.string().optional().describe("New planned date (ISO string)"),
    }).describe("The task data to update")),
});
exports.createTaskSchema = zod_1.z.object({
    title: zod_1.z.string().describe("Title of the task"),
    description: zod_1.z.string().optional().describe("Description of the task"),
    priority: zod_1.z.enum(["low", "medium", "high"]).optional().describe("Priority level"),
    deadline: zod_1.z.string().optional().describe("Deadline (ISO string)"),
    date: zod_1.z.string().optional().describe("Planned date (ISO string)"),
    estimatedTimeMinutes: zod_1.z.number().optional().describe("Estimated time in minutes"),
    parentId: zod_1.z.string().optional().describe("Parent task ID if this is a subtask")
});
exports.default = {
    readAllTasksSchema: exports.readAllTasksSchema,
    readUserSchema: exports.readUserSchema,
    updateTaskSchema: exports.updateTaskSchema,
    updateTasksManySchema: exports.updateTasksManySchema,
    createTaskSchema: exports.createTaskSchema,
};
