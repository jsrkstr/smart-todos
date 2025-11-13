/**
 * Internal tool caller - bridges code-as-tools to existing MCP tool infrastructure
 * This is used internally by tool functions to call the actual implementations
 */
/**
 * Calls an internal tool with authentication
 * This function is available in the code execution environment
 *
 * @param toolName - Name of the tool to call
 * @param params - Parameters for the tool (without token)
 * @param token - JWT authentication token
 * @returns Tool execution result
 */
export declare function callInternalTool<T = any>(toolName: string, params: Record<string, any>, token: string): Promise<T>;
/**
 * Gets the authentication token from the execution environment
 * The token is injected by the code executor as __TOKEN__
 */
export declare function getToken(): string;
//# sourceMappingURL=internal.d.ts.map