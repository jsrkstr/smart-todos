import { CreatePomodoroInput } from '../../types';
export declare const createPomodoroToolDefinition: {
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
            duration: {
                type: string;
                description: string;
            };
            completed: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
};
export declare function createPomodoro(params: CreatePomodoroInput): Promise<{
    success: boolean;
    data: {
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
    };
    message: string;
}>;
//# sourceMappingURL=createPomodoro.d.ts.map