import { z } from 'zod';

export const readAllTasksSchema = z.object({
  completed: z.boolean().optional().describe("Filter by completion status"),
  priority: z.enum(["low", "medium", "high"]).optional().describe("Filter by priority"),
  estimatedTimeMinutes: z.object({
    lte: z.number().optional().describe("Less than or equal to this time in minutes"),
    gte: z.number().optional().describe("Greater than or equal to this time in minutes"),
  }).optional().describe("Filter by estimated time")
});

export const readUserSchema = z.object({});

export const updateTaskSchema = z.object({
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
    location: z.string().optional().describe("Location for the task"),
    repeats: z.string().optional().describe("Recurrence rule for repetitive tasks in RRULE format"),
    why: z.string().optional().describe("Why of the task"),
    points: z.number().optional().describe("Points allotted to user when he completes the task, is based on the estimatedTimeMinutes and priority of task"),
    tags: z.array(z.object({
      name: z.string().describe('name of tag'),
      category: z.string().describe('category of tag'),
    })).optional().describe('list of tags (max 1)'),
    notifications: z.object({
      create: z.array(z.object({
        trigger: z.enum(["RelativeTime", "FixedTime", "Location"]).describe('When the notification triggered'),
        message: z.string().describe('Message shown to user'),
        relativeTimeValue: z.number().optional().describe('Time before scheduled time of task, if trigger=RelativeTime'),
        relativeTimeUnit: z.enum(["Minutes", "Hours", "Days"]).optional().describe('Unit of time before scheduled time of task'),
        fixedTime: z.string().optional().describe("Time of notification delivery, if trigger=FixedTime (ISO string)"),
        author: z.enum(["User", "Model", "Bot"]),
      })).optional().describe('List of notifications to add'),
      update: z.array(z.object({
        id: z.string().describe('Id of notification to update'),
        read: z.boolean().optional().describe('status of notification'),
        trigger: z.enum(["RelativeTime", "FixedTime", "Location"]).optional().describe('When the notification triggered'),
        message: z.string().optional().describe('Message shown to user'),
        relativeTimeValue: z.number().optional().describe('Time before scheduled time of task, if trigger=RelativeTime'),
        relativeTimeUnit: z.enum(["Minutes", "Hours", "Days"]).optional().describe('Unit of time before scheduled time of task'),
        fixedTime: z.string().optional().describe("Time of notification delivery, if trigger=FixedTime (ISO string)"),
      })).optional().describe('List of notifications to update'),
      removeIds: z.array(z.string()).optional().describe('List of notification ids to remove'),
    }).optional().describe('Notifications data'),
  }).describe("The task data to update")
});

export const updateTasksManySchema = z.object({
  data: z.array(
    z.object({
      id: z.string(),
      priority: z.enum(["low", "medium", "high"]).optional().describe("New priority level"),
      position: z.number().optional().describe("Position of task in the list"),
      estimatedTimeMinutes: z.number().optional().describe("New estimated time"),
      priorityReason: z.string().optional().describe("Clear explanation of why this task has this priority and position"),
      deadline: z.string().optional().describe("New deadline (ISO string)"),
      date: z.string().optional().describe("New planned date (ISO string)"),
    }).describe("The task data to update")
  ),
});

export const createTaskSchema = z.object({
  title: z.string().describe("Title of the task"),
  description: z.string().optional().describe("Description of the task"),
  priority: z.enum(["low", "medium", "high"]).optional().describe("Priority level"),
  deadline: z.string().optional().describe("Deadline (ISO string)"),
  date: z.string().optional().describe("Planned date (ISO string)"),
  estimatedTimeMinutes: z.number().optional().describe("Estimated time in minutes"),
  parentId: z.string().optional().describe("Parent task ID if this is a subtask")
});

export default {
  readAllTasksSchema,
  readUserSchema,
  updateTaskSchema,
  updateTasksManySchema,
  createTaskSchema,
};
