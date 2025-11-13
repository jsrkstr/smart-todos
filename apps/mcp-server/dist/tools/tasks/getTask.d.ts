import { GetTaskInput } from '../../types';
export declare const getTaskToolDefinition: {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            token: {
                type: string;
                description: string;
            };
            taskId: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
};
export declare function getTask(params: GetTaskInput): Promise<{
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
    };
}>;
//# sourceMappingURL=getTask.d.ts.map