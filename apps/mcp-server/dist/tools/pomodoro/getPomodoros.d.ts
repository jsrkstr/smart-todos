import { GetPomodorosInput } from '../../types';
export declare const getPomodorosToolDefinition: {
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
            startDate: {
                type: string;
                description: string;
            };
            endDate: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
};
export declare function getPomodoros(params: GetPomodorosInput): Promise<{
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
    }[];
    count: number;
}>;
//# sourceMappingURL=getPomodoros.d.ts.map