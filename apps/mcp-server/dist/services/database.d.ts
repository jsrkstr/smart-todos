import { PrismaClient } from '@prisma/client';
declare const prisma: PrismaClient<import("@prisma/client").Prisma.PrismaClientOptions, never, import("@prisma/client/runtime/library").DefaultArgs>;
export { prisma };
export declare const TaskService: {
    /**
     * Get all tasks for a user with optional filtering
     */
    getTasks(userId: string, filters?: {
        completed?: boolean;
        priority?: "low" | "medium" | "high";
        startDate?: Date;
        endDate?: Date;
        parentId?: string | null;
    }): Promise<{
        userId: string;
        id: string;
        title: string;
        description: string | null;
        date: Date | null;
        deadline: Date | null;
        completed: boolean;
        stage: import("@prisma/client").$Enums.TaskStage;
        stageStatus: import("@prisma/client").$Enums.TaskStageStatus;
        priority: import("@prisma/client").$Enums.TaskPriority;
        priorityReason: string | null;
        position: number | null;
        estimatedTimeMinutes: number;
        repeats: string | null;
        reminderTime: import("@prisma/client").$Enums.ReminderTimeOption | null;
        location: string | null;
        why: string | null;
        createdAt: Date;
        updatedAt: Date;
        points: number;
        estimatedPomodoros: number;
        isCalendarEvent: boolean;
        externalEventId: string | null;
        parentId: string | null;
    }[]>;
    /**
     * Get a single task by ID
     */
    getTask(taskId: string, userId: string): Promise<{
        userId: string;
        id: string;
        title: string;
        description: string | null;
        date: Date | null;
        deadline: Date | null;
        completed: boolean;
        stage: import("@prisma/client").$Enums.TaskStage;
        stageStatus: import("@prisma/client").$Enums.TaskStageStatus;
        priority: import("@prisma/client").$Enums.TaskPriority;
        priorityReason: string | null;
        position: number | null;
        estimatedTimeMinutes: number;
        repeats: string | null;
        reminderTime: import("@prisma/client").$Enums.ReminderTimeOption | null;
        location: string | null;
        why: string | null;
        createdAt: Date;
        updatedAt: Date;
        points: number;
        estimatedPomodoros: number;
        isCalendarEvent: boolean;
        externalEventId: string | null;
        parentId: string | null;
    } | null>;
    /**
     * Create a new task
     */
    createTask(userId: string, data: {
        title: string;
        description?: string;
        priority?: "low" | "medium" | "high";
        dueDate?: Date;
        parentId?: string;
        tags?: string[];
    }): Promise<{
        tags: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            color: string;
            categoryId: string | null;
        }[];
        children: {
            userId: string;
            id: string;
            title: string;
            description: string | null;
            date: Date | null;
            deadline: Date | null;
            completed: boolean;
            stage: import("@prisma/client").$Enums.TaskStage;
            stageStatus: import("@prisma/client").$Enums.TaskStageStatus;
            priority: import("@prisma/client").$Enums.TaskPriority;
            priorityReason: string | null;
            position: number | null;
            estimatedTimeMinutes: number;
            repeats: string | null;
            reminderTime: import("@prisma/client").$Enums.ReminderTimeOption | null;
            location: string | null;
            why: string | null;
            createdAt: Date;
            updatedAt: Date;
            points: number;
            estimatedPomodoros: number;
            isCalendarEvent: boolean;
            externalEventId: string | null;
            parentId: string | null;
        }[];
    } & {
        userId: string;
        id: string;
        title: string;
        description: string | null;
        date: Date | null;
        deadline: Date | null;
        completed: boolean;
        stage: import("@prisma/client").$Enums.TaskStage;
        stageStatus: import("@prisma/client").$Enums.TaskStageStatus;
        priority: import("@prisma/client").$Enums.TaskPriority;
        priorityReason: string | null;
        position: number | null;
        estimatedTimeMinutes: number;
        repeats: string | null;
        reminderTime: import("@prisma/client").$Enums.ReminderTimeOption | null;
        location: string | null;
        why: string | null;
        createdAt: Date;
        updatedAt: Date;
        points: number;
        estimatedPomodoros: number;
        isCalendarEvent: boolean;
        externalEventId: string | null;
        parentId: string | null;
    }>;
    /**
     * Update a task
     */
    updateTask(taskId: string, userId: string, data: {
        title?: string;
        description?: string;
        priority?: "low" | "medium" | "high";
        dueDate?: Date | null;
        completed?: boolean;
        tags?: string[];
    }): Promise<{
        tags: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            color: string;
            categoryId: string | null;
        }[];
        children: {
            userId: string;
            id: string;
            title: string;
            description: string | null;
            date: Date | null;
            deadline: Date | null;
            completed: boolean;
            stage: import("@prisma/client").$Enums.TaskStage;
            stageStatus: import("@prisma/client").$Enums.TaskStageStatus;
            priority: import("@prisma/client").$Enums.TaskPriority;
            priorityReason: string | null;
            position: number | null;
            estimatedTimeMinutes: number;
            repeats: string | null;
            reminderTime: import("@prisma/client").$Enums.ReminderTimeOption | null;
            location: string | null;
            why: string | null;
            createdAt: Date;
            updatedAt: Date;
            points: number;
            estimatedPomodoros: number;
            isCalendarEvent: boolean;
            externalEventId: string | null;
            parentId: string | null;
        }[];
    } & {
        userId: string;
        id: string;
        title: string;
        description: string | null;
        date: Date | null;
        deadline: Date | null;
        completed: boolean;
        stage: import("@prisma/client").$Enums.TaskStage;
        stageStatus: import("@prisma/client").$Enums.TaskStageStatus;
        priority: import("@prisma/client").$Enums.TaskPriority;
        priorityReason: string | null;
        position: number | null;
        estimatedTimeMinutes: number;
        repeats: string | null;
        reminderTime: import("@prisma/client").$Enums.ReminderTimeOption | null;
        location: string | null;
        why: string | null;
        createdAt: Date;
        updatedAt: Date;
        points: number;
        estimatedPomodoros: number;
        isCalendarEvent: boolean;
        externalEventId: string | null;
        parentId: string | null;
    }>;
    /**
     * Delete a task (soft delete)
     */
    deleteTask(taskId: string, userId: string): Promise<{
        userId: string;
        id: string;
        title: string;
        description: string | null;
        date: Date | null;
        deadline: Date | null;
        completed: boolean;
        stage: import("@prisma/client").$Enums.TaskStage;
        stageStatus: import("@prisma/client").$Enums.TaskStageStatus;
        priority: import("@prisma/client").$Enums.TaskPriority;
        priorityReason: string | null;
        position: number | null;
        estimatedTimeMinutes: number;
        repeats: string | null;
        reminderTime: import("@prisma/client").$Enums.ReminderTimeOption | null;
        location: string | null;
        why: string | null;
        createdAt: Date;
        updatedAt: Date;
        points: number;
        estimatedPomodoros: number;
        isCalendarEvent: boolean;
        externalEventId: string | null;
        parentId: string | null;
    }>;
    /**
     * Get subtasks for a task
     */
    getSubtasks(taskId: string, userId: string): Promise<{
        userId: string;
        id: string;
        title: string;
        description: string | null;
        date: Date | null;
        deadline: Date | null;
        completed: boolean;
        stage: import("@prisma/client").$Enums.TaskStage;
        stageStatus: import("@prisma/client").$Enums.TaskStageStatus;
        priority: import("@prisma/client").$Enums.TaskPriority;
        priorityReason: string | null;
        position: number | null;
        estimatedTimeMinutes: number;
        repeats: string | null;
        reminderTime: import("@prisma/client").$Enums.ReminderTimeOption | null;
        location: string | null;
        why: string | null;
        createdAt: Date;
        updatedAt: Date;
        points: number;
        estimatedPomodoros: number;
        isCalendarEvent: boolean;
        externalEventId: string | null;
        parentId: string | null;
    }[]>;
};
export declare const UserService: {
    /**
     * Get user profile
     */
    getUserProfile(userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string | null;
        email: string | null;
        image: string | null;
    } | null>;
    /**
     * Get user's psychological profile
     */
    getPsychProfile(userId: string): Promise<{
        userId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        productivityTime: string;
        communicationPref: string;
        taskApproach: string;
        difficultyPreference: string;
        coachId: string | null;
    } | null>;
    /**
     * Get user settings
     */
    getUserSettings(userId: string): Promise<{
        userId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        notifications: boolean;
        theme: string;
        emailNotifications: boolean;
        timezone: string;
        language: string;
        pomodoroDuration: number;
        shortBreakDuration: number;
        longBreakDuration: number;
        soundEnabled: boolean;
        notificationsEnabled: boolean;
        defaultReminderTime: number;
    } | null>;
};
export declare const ChatService: {
    /**
     * Get chat history for a user
     */
    getChatHistory(userId: string, limit?: number): Promise<{
        userId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        externalId: string | null;
        content: string;
        role: import("@prisma/client").$Enums.ChatMessageRole;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        taskId: string | null;
    }[]>;
    /**
     * Create a new chat message
     */
    createChatMessage(userId: string, data: {
        role: "user" | "assistant" | "system";
        content: string;
    }): Promise<{
        userId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        externalId: string | null;
        content: string;
        role: import("@prisma/client").$Enums.ChatMessageRole;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        taskId: string | null;
    }>;
};
export declare const PomodoroService: {
    /**
     * Get pomodoro sessions for a user
     */
    getPomodoros(userId: string, filters?: {
        taskId?: string;
        startDate?: Date;
        endDate?: Date;
    }): Promise<{
        userId: string;
        id: string;
        createdAt: Date;
        settings: import("@prisma/client/runtime/library").JsonValue | null;
        type: import("@prisma/client").$Enums.PomodoroType;
        status: import("@prisma/client").$Enums.PomodoroStatus;
        startTime: Date;
        endTime: Date | null;
        taskMode: import("@prisma/client").$Enums.PomodoroTaskMode;
        duration: number;
    }[]>;
    /**
     * Create a new pomodoro session
     */
    createPomodoro(userId: string, data: {
        taskId?: string;
        duration: number;
        completed: boolean;
    }): Promise<{
        userId: string;
        id: string;
        createdAt: Date;
        settings: import("@prisma/client/runtime/library").JsonValue | null;
        type: import("@prisma/client").$Enums.PomodoroType;
        status: import("@prisma/client").$Enums.PomodoroStatus;
        startTime: Date;
        endTime: Date | null;
        taskMode: import("@prisma/client").$Enums.PomodoroTaskMode;
        duration: number;
    }>;
};
export declare const disconnectDatabase: () => Promise<void>;
//# sourceMappingURL=database.d.ts.map