import { DeleteTaskInput } from '../../types';
export declare const deleteTaskToolDefinition: {
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
export declare function deleteTask(params: DeleteTaskInput): Promise<{
    success: boolean;
    message: string;
}>;
//# sourceMappingURL=deleteTask.d.ts.map