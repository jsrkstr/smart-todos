/**
 * User tools as code APIs
 * These functions can be imported and called from agent-generated code
 */
import { callInternalTool, getToken } from '../internal';
/**
 * Get the current user's profile
 *
 * @example
 * ```typescript
 * const profile = await getUserProfile()
 * console.log(`Hello, ${profile.name}!`)
 * ```
 */
export async function getUserProfile() {
    const token = getToken();
    return await callInternalTool('getUserProfile', {}, token);
}
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
export async function getPsychProfile() {
    const token = getToken();
    return await callInternalTool('getPsychProfile', {}, token);
}
/**
 * Get the current user's settings
 *
 * @example
 * ```typescript
 * const settings = await getUserSettings()
 * console.log(`Pomodoro length: ${settings.pomodoroLength} minutes`)
 * ```
 */
export async function getUserSettings() {
    const token = getToken();
    return await callInternalTool('getUserSettings', {}, token);
}
//# sourceMappingURL=index.js.map