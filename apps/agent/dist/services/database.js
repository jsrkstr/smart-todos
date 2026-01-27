"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatMessageService = exports.LogService = exports.TaskService = exports.UserService = exports.prisma = void 0;
const client_1 = require("@prisma/client");
// Initialize Prisma client - this will look for the schema at ../../web/prisma/schema.prisma
exports.prisma = new client_1.PrismaClient();
// Service for user-related database operations
exports.UserService = {
    // Get user with psychological profile and coach information
    async getUserWithProfile(userId) {
        return exports.prisma.user.findUnique({
            where: { id: userId },
            include: {
                psychProfile: {
                    include: {
                        coach: true
                    }
                },
                settings: true
            }
        });
    },
};
// Service for task-related database operations
exports.TaskService = {
    // Get a specific task by ID
    async getTask(taskId, userId) {
        return exports.prisma.task.findFirst({
            where: {
                id: taskId,
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
        });
    },
    // Get all tasks (with optional filters)
    async getTasks(userId, filters) {
        return exports.prisma.task.findMany({
            where: Object.assign({ userId, parentId: null }, filters),
            include: {
                children: true,
                tags: {
                    include: {
                        category: true
                    }
                }
            },
            orderBy: [
                { position: 'asc' },
                { deadline: 'asc' },
                { priority: 'desc' }
            ]
        });
    },
    // Create a new task
    async createTask(data) {
        return exports.prisma.task.create({
            data
        });
    },
    // Update a task
    async updateTask(data) {
        const { id, userId, tagIds } = data, updateData = __rest(data, ["id", "userId", "tagIds"]);
        // Define valid Task fields according to Prisma schema
        const validTaskFields = [
            'title', 'description', 'date', 'deadline', 'completed', 'stage',
            'stageStatus', 'priority', 'priorityReason', 'position', 'estimatedTimeMinutes',
            'repeats', 'reminderTime', 'location', 'why', 'points', 'estimatedPomodoros',
            'isCalendarEvent', 'externalEventId', 'createdAt', 'updatedAt', 'tags',
            'notifications', 'pomodoroTasks', 'reward', 'excuses', 'moods', 'flashcards',
            'logs', 'quiz', 'calendarEvents', 'parent', 'children', 'chatMessages'
        ];
        // Common field name mappings for LLM-generated payloads
        const fieldMappings = {
            'task': 'title', // LLMs often use 'task' instead of 'title'
            'name': 'title',
            'dueDate': 'deadline',
            'due': 'deadline',
            'scheduledTime': 'date',
            'scheduledDate': 'date',
            'isDone': 'completed',
            'done': 'completed',
            'status': 'stageStatus',
            'estimate': 'estimatedTimeMinutes',
            'duration': 'estimatedTimeMinutes', // LLMs sometimes use 'duration'
            'durationMinutes': 'estimatedTimeMinutes',
            'estimatedMinutes': 'estimatedTimeMinutes',
            'reason': 'why'
        };
        // Filter and map fields to valid Prisma fields
        const update = {};
        for (const [key, value] of Object.entries(updateData)) {
            // Map the field name if needed
            const mappedKey = fieldMappings[key] || key;
            // Only include valid fields
            if (validTaskFields.includes(mappedKey)) {
                update[mappedKey] = value;
            }
            else {
                console.warn(`Ignoring invalid field in updateTask: ${key} (mapped to: ${mappedKey})`);
            }
        }
        // Handle tag connection/disconnection if tagIds are provided
        if (tagIds) {
            update.tags = {
                set: [],
                connect: tagIds.map((tagId) => ({ id: tagId }))
            };
        }
        return exports.prisma.task.update({
            where: { id },
            data: update
        });
    },
    // Update many tasks
    async updateManyTasks(updates) {
        const transactions = updates.map(update => {
            const { id } = update, updateData = __rest(update, ["id"]);
            return exports.prisma.task.update({
                where: { id },
                data: updateData
            });
        });
        return exports.prisma.$transaction(transactions);
    },
    // Create multiple subtasks
    async createSubtasks(parentTaskId, userId, subtasks) {
        const transactions = subtasks.map(subtask => {
            return exports.prisma.task.create({
                data: Object.assign(Object.assign({}, subtask), { userId, parentId: parentTaskId })
            });
        });
        return exports.prisma.$transaction(transactions);
    }
};
// Service for logging activities
exports.LogService = {
    async createLog(data) {
        return exports.prisma.log.create({
            data
        });
    }
};
// Service for chat messages
exports.ChatMessageService = {
    async createMessage(data) {
        return exports.prisma.chatMessage.create({
            data
        });
    },
    async getMessages(userId, taskId) {
        return exports.prisma.chatMessage.findMany({
            where: Object.assign({ userId }, (taskId ? { taskId } : {})),
            orderBy: { createdAt: 'asc' }
        });
    }
};
