import { PrismaClient } from '@prisma/client';
// Singleton Prisma client
const prisma = new PrismaClient();
export { prisma };
// Task Service
export const TaskService = {
    /**
     * Get all tasks for a user with optional filtering
     */
    async getTasks(userId, filters) {
        const where = {
            userId,
            deletedAt: null
        };
        if (filters?.completed !== undefined) {
            where.completed = filters.completed;
        }
        if (filters?.priority) {
            where.priority = filters.priority;
        }
        if (filters?.startDate || filters?.endDate) {
            where.dueDate = {};
            if (filters.startDate) {
                where.dueDate.gte = filters.startDate;
            }
            if (filters.endDate) {
                where.dueDate.lte = filters.endDate;
            }
        }
        if (filters?.parentId !== undefined) {
            where.parentId = filters.parentId;
        }
        return prisma.task.findMany({
            where,
            include: {
                tags: true,
                children: true,
                notifications: true
            },
            orderBy: [
                { completed: 'asc' },
                { priority: 'desc' },
                { dueDate: 'asc' }
            ]
        });
    },
    /**
     * Get a single task by ID
     */
    async getTask(taskId, userId) {
        return prisma.task.findFirst({
            where: {
                id: taskId,
                userId,
                deletedAt: null
            },
            include: {
                tags: true,
                children: true,
                parent: true,
                notifications: true,
                pomodoros: true
            }
        });
    },
    /**
     * Create a new task
     */
    async createTask(userId, data) {
        const { tags, ...taskData } = data;
        return prisma.task.create({
            data: {
                ...taskData,
                userId,
                completed: false,
                tags: tags ? {
                    connect: tags.map(tagId => ({ id: tagId }))
                } : undefined
            },
            include: {
                tags: true,
                children: true
            }
        });
    },
    /**
     * Update a task
     */
    async updateTask(taskId, userId, data) {
        const { tags, ...taskData } = data;
        // First verify the task belongs to the user
        const task = await prisma.task.findFirst({
            where: { id: taskId, userId, deletedAt: null }
        });
        if (!task) {
            throw new Error('Task not found or access denied');
        }
        return prisma.task.update({
            where: { id: taskId },
            data: {
                ...taskData,
                tags: tags ? {
                    set: tags.map(tagId => ({ id: tagId }))
                } : undefined
            },
            include: {
                tags: true,
                children: true
            }
        });
    },
    /**
     * Delete a task (soft delete)
     */
    async deleteTask(taskId, userId) {
        // First verify the task belongs to the user
        const task = await prisma.task.findFirst({
            where: { id: taskId, userId, deletedAt: null }
        });
        if (!task) {
            throw new Error('Task not found or access denied');
        }
        return prisma.task.update({
            where: { id: taskId },
            data: { deletedAt: new Date() }
        });
    },
    /**
     * Get subtasks for a task
     */
    async getSubtasks(taskId, userId) {
        // First verify the parent task belongs to the user
        const parentTask = await prisma.task.findFirst({
            where: { id: taskId, userId, deletedAt: null }
        });
        if (!parentTask) {
            throw new Error('Task not found or access denied');
        }
        return prisma.task.findMany({
            where: {
                parentId: taskId,
                userId,
                deletedAt: null
            },
            include: {
                tags: true
            },
            orderBy: { createdAt: 'asc' }
        });
    }
};
// User Service
export const UserService = {
    /**
     * Get user profile
     */
    async getUserProfile(userId) {
        return prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                image: true,
                createdAt: true,
                updatedAt: true
            }
        });
    },
    /**
     * Get user's psychological profile
     */
    async getPsychProfile(userId) {
        return prisma.psychProfile.findUnique({
            where: { userId },
            include: {
                matchedCoach: true
            }
        });
    },
    /**
     * Get user settings
     */
    async getUserSettings(userId) {
        return prisma.settings.findUnique({
            where: { userId }
        });
    }
};
// Chat Service
export const ChatService = {
    /**
     * Get chat history for a user
     */
    async getChatHistory(userId, limit = 50) {
        return prisma.chatMessage.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: limit
        });
    },
    /**
     * Create a new chat message
     */
    async createChatMessage(userId, data) {
        return prisma.chatMessage.create({
            data: {
                ...data,
                userId
            }
        });
    }
};
// Pomodoro Service
export const PomodoroService = {
    /**
     * Get pomodoro sessions for a user
     */
    async getPomodoros(userId, filters) {
        const where = { userId };
        if (filters?.taskId) {
            where.taskId = filters.taskId;
        }
        if (filters?.startDate || filters?.endDate) {
            where.createdAt = {};
            if (filters.startDate) {
                where.createdAt.gte = filters.startDate;
            }
            if (filters.endDate) {
                where.createdAt.lte = filters.endDate;
            }
        }
        return prisma.pomodoro.findMany({
            where,
            include: {
                task: {
                    select: {
                        id: true,
                        title: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    },
    /**
     * Create a new pomodoro session
     */
    async createPomodoro(userId, data) {
        return prisma.pomodoro.create({
            data: {
                ...data,
                userId
            },
            include: {
                task: {
                    select: {
                        id: true,
                        title: true
                    }
                }
            }
        });
    }
};
// Cleanup function
export const disconnectDatabase = async () => {
    await prisma.$disconnect();
};
//# sourceMappingURL=database.js.map