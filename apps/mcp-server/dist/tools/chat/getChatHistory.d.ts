import { GetChatHistoryInput } from '../../types';
export declare const getChatHistoryToolDefinition: {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            token: {
                type: string;
                description: string;
            };
            limit: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
};
export declare function getChatHistory(params: GetChatHistoryInput): Promise<{
    success: boolean;
    data: {
        userId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        externalId: string | null;
        content: string;
        role: import("@prisma/client").$Enums.ChatMessageRole;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        taskId: string | null;
    }[];
    count: number;
}>;
//# sourceMappingURL=getChatHistory.d.ts.map