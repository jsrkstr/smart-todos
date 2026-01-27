"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nonePayloadSchema = exports.communicationPayloadSchema = exports.updateManyTasksPayloadSchema = exports.searchTasksPayloadSchema = exports.createSubtasksPayloadSchema = exports.createTaskPayloadSchema = exports.logActivityPayloadSchema = exports.scheduleReminderPayloadSchema = exports.updateTaskPayloadSchema = void 0;
const zod_1 = require("zod");
/**
 * Shared schemas for action payloads used across all agents.
 * These provide strong typing and validation for LLM-generated actions.
 */
// UpdateTask action payload
exports.updateTaskPayloadSchema = zod_1.z.object({
    title: zod_1.z.string().optional().describe('Task title'),
    description: zod_1.z.string().optional().describe('Task description'),
    date: zod_1.z.string().optional().describe('Scheduled date in ISO-8601 format (e.g., "2024-01-27T22:54:56.000Z"). NEVER use formats like "10:54 PM" or "3pm". Calculate full datetime from natural language.'),
    deadline: zod_1.z.string().optional().describe('Deadline in ISO-8601 format (e.g., "2024-01-27T23:59:59.000Z"). NEVER use formats like "tomorrow" or "next Monday". Calculate full datetime.'),
    priority: zod_1.z.enum(['low', 'medium', 'high']).optional().describe('Task priority'),
    estimatedTimeMinutes: zod_1.z.number().optional().describe('Estimated duration in minutes. Use this field, NOT "duration" or "durationMinutes".'),
    stage: zod_1.z.enum(['Refinement', 'Breakdown', 'Planning', 'Execution', 'Reflection']).optional().describe('Task stage'),
    stageStatus: zod_1.z.enum(['NotStarted', 'InProgress', 'QuestionAsked', 'Completed']).optional().describe('Stage status'),
    completed: zod_1.z.boolean().optional().describe('Completion status'),
    location: zod_1.z.string().optional().describe('Task location'),
    why: zod_1.z.string().optional().describe('Why this task matters'),
    points: zod_1.z.number().optional().describe('Points awarded for completion'),
}).describe('Payload for updating a task');
// ScheduleReminder action payload
exports.scheduleReminderPayloadSchema = zod_1.z.object({
    message: zod_1.z.string().describe('Reminder message to show user'),
    trigger: zod_1.z.enum(['RelativeTime', 'FixedTime', 'Location']).describe('When to trigger the reminder'),
    fixedTime: zod_1.z.string().optional().describe('ISO-8601 datetime when trigger=FixedTime (e.g., "2024-01-27T22:54:56.000Z"). NEVER use "10:54 PM" or similar formats.'),
    relativeTimeValue: zod_1.z.number().optional().describe('Time value when trigger=RelativeTime (e.g., 30 for "30 minutes before")'),
    relativeTimeUnit: zod_1.z.enum(['Minutes', 'Hours', 'Days']).optional().describe('Time unit when trigger=RelativeTime'),
    mode: zod_1.z.enum(['Push', 'InApp', 'Email']).optional().describe('Delivery mode for the reminder'),
    type: zod_1.z.string().optional().describe('Type of reminder (e.g., "Reminder", "Encouragement", "Warning")'),
}).describe('Payload for scheduling a reminder/notification');
// LogActivity action payload
exports.logActivityPayloadSchema = zod_1.z.object({
    content: zod_1.z.string().describe('Activity log content'),
    type: zod_1.z.string().optional().describe('Type of log entry'),
}).describe('Payload for logging an activity');
// CreateTask action payload
exports.createTaskPayloadSchema = zod_1.z.object({
    title: zod_1.z.string().describe('Task title'),
    description: zod_1.z.string().optional().describe('Task description'),
    date: zod_1.z.string().optional().describe('Scheduled date in ISO-8601 format (e.g., "2024-01-27T22:54:56.000Z")'),
    deadline: zod_1.z.string().optional().describe('Deadline in ISO-8601 format (e.g., "2024-01-27T23:59:59.000Z")'),
    priority: zod_1.z.enum(['low', 'medium', 'high']).optional().describe('Task priority'),
    estimatedTimeMinutes: zod_1.z.number().optional().describe('Estimated duration in minutes'),
    parentId: zod_1.z.string().optional().describe('Parent task ID if this is a subtask'),
}).describe('Payload for creating a new task');
// CreateSubtasks action payload
exports.createSubtasksPayloadSchema = zod_1.z.object({
    subtasks: zod_1.z.array(zod_1.z.object({
        title: zod_1.z.string().describe('Subtask title'),
        description: zod_1.z.string().optional().describe('Subtask description'),
        estimatedTimeMinutes: zod_1.z.number().optional().describe('Estimated duration in minutes'),
        priority: zod_1.z.enum(['low', 'medium', 'high']).optional().describe('Subtask priority'),
    })).describe('Array of subtasks to create'),
}).describe('Payload for creating multiple subtasks');
// SearchTasks action payload
exports.searchTasksPayloadSchema = zod_1.z.object({
    completed: zod_1.z.boolean().optional().describe('Filter by completion status'),
    priority: zod_1.z.enum(['low', 'medium', 'high']).optional().describe('Filter by priority'),
    stage: zod_1.z.enum(['Refinement', 'Breakdown', 'Planning', 'Execution', 'Reflection']).optional().describe('Filter by stage'),
}).describe('Payload for searching tasks');
// UpdateManyTasks action payload
exports.updateManyTasksPayloadSchema = zod_1.z.array(zod_1.z.object({
    id: zod_1.z.string().describe('Task ID to update'),
    priority: zod_1.z.enum(['low', 'medium', 'high']).optional().describe('New priority'),
    position: zod_1.z.number().optional().describe('New position in list'),
    estimatedTimeMinutes: zod_1.z.number().optional().describe('New estimated time'),
    priorityReason: zod_1.z.string().optional().describe('Explanation for priority/position'),
    deadline: zod_1.z.string().optional().describe('New deadline in ISO-8601 format'),
    date: zod_1.z.string().optional().describe('New scheduled date in ISO-8601 format'),
})).describe('Payload for updating multiple tasks');
// ProvideMotivation/GiveAdvice/AskQuestion action payload
exports.communicationPayloadSchema = zod_1.z.object({
    content: zod_1.z.string().describe('Message content to show user'),
}).describe('Payload for communication actions (motivation, advice, questions)');
// None action (no payload needed)
exports.nonePayloadSchema = zod_1.z.object({}).describe('No payload needed');
