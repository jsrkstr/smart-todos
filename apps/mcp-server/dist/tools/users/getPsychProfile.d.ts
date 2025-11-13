import { GetPsychProfileInput } from '../../types';
export declare const getPsychProfileToolDefinition: {
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
export declare function getPsychProfile(params: GetPsychProfileInput): Promise<{
    success: boolean;
    data: null;
    message: string;
} | {
    success: boolean;
    data: {
        userId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        productivityTime: string;
        communicationPref: string;
        taskApproach: string;
        difficultyPreference: string;
        coachId: string | null;
    };
    message?: undefined;
}>;
//# sourceMappingURL=getPsychProfile.d.ts.map