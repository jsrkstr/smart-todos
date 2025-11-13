/**
 * User tools as code APIs
 * These functions can be imported and called from agent-generated code
 */
/**
 * User profile structure
 */
export interface UserProfile {
    id: string;
    email: string;
    name: string | null;
    createdAt: string;
    updatedAt: string;
}
/**
 * Psychological profile structure
 */
export interface PsychProfile {
    id: string;
    userId: string;
    personalityType: string | null;
    motivationStyle: string | null;
    stressLevel: number | null;
    preferredWorkTime: string | null;
    cognitiveStyle: string | null;
    createdAt: string;
    updatedAt: string;
}
/**
 * User settings structure
 */
export interface UserSettings {
    id: string;
    userId: string;
    theme: 'light' | 'dark' | 'system';
    notifications: boolean;
    pomodoroLength: number;
    shortBreakLength: number;
    longBreakLength: number;
    createdAt: string;
    updatedAt: string;
}
/**
 * Get the current user's profile
 *
 * @example
 * ```typescript
 * const profile = await getUserProfile()
 * console.log(`Hello, ${profile.name}!`)
 * ```
 */
export declare function getUserProfile(): Promise<UserProfile>;
/**
 * Get the current user's psychological profile
 *
 * @example
 * ```typescript
 * const psychProfile = await getPsychProfile()
 * if (psychProfile.stressLevel && psychProfile.stressLevel > 7) {
 *   console.log('High stress detected - consider taking a break')
 * }
 * ```
 */
export declare function getPsychProfile(): Promise<PsychProfile>;
/**
 * Get the current user's settings
 *
 * @example
 * ```typescript
 * const settings = await getUserSettings()
 * console.log(`Pomodoro length: ${settings.pomodoroLength} minutes`)
 * ```
 */
export declare function getUserSettings(): Promise<UserSettings>;
//# sourceMappingURL=index.d.ts.map