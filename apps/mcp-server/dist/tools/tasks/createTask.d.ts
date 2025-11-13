import { CreateTaskInput } from '../../types';
export declare const createTaskToolDefinition: {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            token: {
                type: string;
                description: string;
            };
            title: {
                type: string;
                description: string;
            };
            description: {
                type: string;
                description: string;
            };
            priority: {
                type: string;
                enum: string[];
                description: string;
            };
            dueDate: {
                type: string;
                description: string;
            };
            parentId: {
                type: string;
                description: string;
            };
            tags: {
                type: string;
                items: {
                    type: string;
                };
                description: string;
            };
        };
        required: string[];
    };
};
export declare function createTask(params: CreateTaskInput): Promise<{
    success: boolean;
    data: {
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
    };
    message: string;
}>;
//# sourceMappingURL=createTask.d.ts.map