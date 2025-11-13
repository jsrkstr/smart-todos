import { GetTasksInput } from '../../types';
export declare const getTasksToolDefinition: {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            token: {
                type: string;
                description: string;
            };
            completed: {
                type: string;
                description: string;
            };
            priority: {
                type: string;
                enum: string[];
                description: string;
            };
            startDate: {
                type: string;
                description: string;
            };
            endDate: {
                type: string;
                description: string;
            };
            parentId: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
};
export declare function getTasks(params: GetTasksInput): Promise<{
    success: boolean;
    data: {
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
    count: number;
}>;
//# sourceMappingURL=getTasks.d.ts.map