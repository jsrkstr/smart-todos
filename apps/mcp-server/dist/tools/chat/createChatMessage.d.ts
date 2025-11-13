import { CreateChatMessageInput } from '../../types';
export declare const createChatMessageToolDefinition: {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            token: {
                type: string;
                description: string;
            };
            role: {
                type: string;
                enum: string[];
                description: string;
            };
            content: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
};
export declare function createChatMessage(params: CreateChatMessageInput): Promise<{
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
    };
    message: string;
}>;
//# sourceMappingURL=createChatMessage.d.ts.map