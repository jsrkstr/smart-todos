import { GetUserProfileInput } from '../../types';
export declare const getUserProfileToolDefinition: {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            token: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
};
export declare function getUserProfile(params: GetUserProfileInput): Promise<{
    success: boolean;
    data: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string | null;
        email: string | null;
        image: string | null;
    };
}>;
//# sourceMappingURL=getUserProfile.d.ts.map