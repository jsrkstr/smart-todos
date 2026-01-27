import { z } from 'zod';

/**
 * Shared schemas for action payloads used across all agents.
 * These provide strong typing and validation for LLM-generated actions.
 */

// UpdateTask action payload
export const updateTaskPayloadSchema = z.object({
  title: z.string().optional().describe('Task title'),
  description: z.string().optional().describe('Task description'),
  date: z.string().optional().describe('Scheduled date in ISO-8601 format (e.g., "2024-01-27T22:54:56.000Z"). NEVER use formats like "10:54 PM" or "3pm". Calculate full datetime from natural language.'),
  deadline: z.string().optional().describe('Deadline in ISO-8601 format (e.g., "2024-01-27T23:59:59.000Z"). NEVER use formats like "tomorrow" or "next Monday". Calculate full datetime.'),
  priority: z.enum(['low', 'medium', 'high']).optional().describe('Task priority'),
  estimatedTimeMinutes: z.number().optional().describe('Estimated duration in minutes. Use this field, NOT "duration" or "durationMinutes".'),
  stage: z.enum(['Refinement', 'Breakdown', 'Planning', 'Execution', 'Reflection']).optional().describe('Task stage'),
  stageStatus: z.enum(['NotStarted', 'InProgress', 'QuestionAsked', 'Completed']).optional().describe('Stage status'),
  completed: z.boolean().optional().describe('Completion status'),
  location: z.string().optional().describe('Task location'),
  why: z.string().optional().describe('Why this task matters'),
  points: z.number().optional().describe('Points awarded for completion'),
}).describe('Payload for updating a task');

// ScheduleReminder action payload
export const scheduleReminderPayloadSchema = z.object({
  message: z.string().describe('Reminder message to show user'),
  trigger: z.enum(['RelativeTime', 'FixedTime', 'Location']).describe('When to trigger the reminder'),
  fixedTime: z.string().optional().describe('ISO-8601 datetime when trigger=FixedTime (e.g., "2024-01-27T22:54:56.000Z"). NEVER use "10:54 PM" or similar formats.'),
  relativeTimeValue: z.number().optional().describe('Time value when trigger=RelativeTime (e.g., 30 for "30 minutes before")'),
  relativeTimeUnit: z.enum(['Minutes', 'Hours', 'Days']).optional().describe('Time unit when trigger=RelativeTime'),
  mode: z.enum(['Push', 'InApp', 'Email']).optional().describe('Delivery mode for the reminder'),
  type: z.string().optional().describe('Type of reminder (e.g., "Reminder", "Encouragement", "Warning")'),
}).describe('Payload for scheduling a reminder/notification');

// LogActivity action payload
export const logActivityPayloadSchema = z.object({
  content: z.string().describe('Activity log content'),
  type: z.string().optional().describe('Type of log entry'),
}).describe('Payload for logging an activity');

// CreateTask action payload
export const createTaskPayloadSchema = z.object({
  title: z.string().describe('Task title'),
  description: z.string().optional().describe('Task description'),
  date: z.string().optional().describe('Scheduled date in ISO-8601 format (e.g., "2024-01-27T22:54:56.000Z")'),
  deadline: z.string().optional().describe('Deadline in ISO-8601 format (e.g., "2024-01-27T23:59:59.000Z")'),
  priority: z.enum(['low', 'medium', 'high']).optional().describe('Task priority'),
  estimatedTimeMinutes: z.number().optional().describe('Estimated duration in minutes'),
  parentId: z.string().optional().describe('Parent task ID if this is a subtask'),
}).describe('Payload for creating a new task');

// CreateSubtasks action payload
export const createSubtasksPayloadSchema = z.object({
  subtasks: z.array(z.object({
    title: z.string().describe('Subtask title'),
    description: z.string().optional().describe('Subtask description'),
    estimatedTimeMinutes: z.number().optional().describe('Estimated duration in minutes'),
    priority: z.enum(['low', 'medium', 'high']).optional().describe('Subtask priority'),
  })).describe('Array of subtasks to create'),
}).describe('Payload for creating multiple subtasks');

// SearchTasks action payload
export const searchTasksPayloadSchema = z.object({
  completed: z.boolean().optional().describe('Filter by completion status'),
  priority: z.enum(['low', 'medium', 'high']).optional().describe('Filter by priority'),
  stage: z.enum(['Refinement', 'Breakdown', 'Planning', 'Execution', 'Reflection']).optional().describe('Filter by stage'),
}).describe('Payload for searching tasks');

// UpdateManyTasks action payload
export const updateManyTasksPayloadSchema = z.array(z.object({
  id: z.string().describe('Task ID to update'),
  priority: z.enum(['low', 'medium', 'high']).optional().describe('New priority'),
  position: z.number().optional().describe('New position in list'),
  estimatedTimeMinutes: z.number().optional().describe('New estimated time'),
  priorityReason: z.string().optional().describe('Explanation for priority/position'),
  deadline: z.string().optional().describe('New deadline in ISO-8601 format'),
  date: z.string().optional().describe('New scheduled date in ISO-8601 format'),
})).describe('Payload for updating multiple tasks');

// ProvideMotivation/GiveAdvice/AskQuestion action payload
export const communicationPayloadSchema = z.object({
  content: z.string().describe('Message content to show user'),
}).describe('Payload for communication actions (motivation, advice, questions)');

// None action (no payload needed)
export const nonePayloadSchema = z.object({}).describe('No payload needed');
