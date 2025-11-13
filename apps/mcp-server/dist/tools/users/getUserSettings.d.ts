import { GetUserSettingsInput } from '../../types';
export declare const getUserSettingsToolDefinition: {
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
export declare function getUserSettings(params: GetUserSettingsInput): Promise<{
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
        notifications: boolean;
        theme: string;
        emailNotifications: boolean;
        timezone: string;
        language: string;
        pomodoroDuration: number;
        shortBreakDuration: number;
        longBreakDuration: number;
        soundEnabled: boolean;
        notificationsEnabled: boolean;
        defaultReminderTime: number;
    };
    message?: undefined;
}>;
//# sourceMappingURL=getUserSettings.d.ts.map