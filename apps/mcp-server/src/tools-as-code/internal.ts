/**
 * Internal tool caller - bridges code-as-tools to existing MCP tool infrastructure
 * This is used internally by tool functions to call the actual implementations
 */

import * as taskTools from '../tools/tasks'
import * as userTools from '../tools/users'
import * as chatTools from '../tools/chat'
import * as pomodoroTools from '../tools/pomodoro'

// Map of tool names to their handlers
const toolHandlers: Record<string, (params: any) => Promise<any>> = {
  // Tasks
  getTasks: taskTools.getTasks,
  getTask: taskTools.getTask,
  createTask: taskTools.createTask,
  updateTask: taskTools.updateTask,
  deleteTask: taskTools.deleteTask,
  getSubtasks: taskTools.getSubtasks,

  // Users
  getUserProfile: userTools.getUserProfile,
  getPsychProfile: userTools.getPsychProfile,
  getUserSettings: userTools.getUserSettings,

  // Chat
  getChatHistory: chatTools.getChatHistory,
  createChatMessage: chatTools.createChatMessage,

  // Pomodoro
  getPomodoros: pomodoroTools.getPomodoros,
  createPomodoro: pomodoroTools.createPomodoro
}

/**
 * Calls an internal tool with authentication
 * This function is available in the code execution environment
 *
 * @param toolName - Name of the tool to call
 * @param params - Parameters for the tool (without token)
 * @param token - JWT authentication token
 * @returns Tool execution result
 */
export async function callInternalTool<T = any>(
  toolName: string,
  params: Record<string, any>,
  token: string
): Promise<T> {
  const handler = toolHandlers[toolName]

  if (!handler) {
    throw new Error(`Tool not found: ${toolName}`)
  }

  // Add token to params
  const paramsWithToken = {
    ...params,
    token
  }

  // Call the handler
  const result = await handler(paramsWithToken)

  // Return the data portion (unwrap success wrapper)
  if (result && typeof result === 'object' && 'data' in result) {
    return result.data as T
  }

  return result as T
}

/**
 * Gets the authentication token from the execution environment
 * The token is injected by the code executor as __TOKEN__
 */
export function getToken(): string {
  // @ts-ignore - __TOKEN__ is injected by executor
  if (typeof __TOKEN__ === 'undefined') {
    throw new Error('Authentication token not available. Code must be executed in sandbox.')
  }

  // @ts-ignore
  return __TOKEN__
}
