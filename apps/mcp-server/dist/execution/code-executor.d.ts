/**
 * Code executor - orchestrates validation, sandboxing, and execution
 */
import { CodeExecutionOptions, CodeExecutionResult, ExecutionAuditLog } from './types';
/**
 * Main code executor class
 */
export declare class CodeExecutor {
    /**
     * Executes code in a secure sandbox
     * @param options - Execution options
     * @returns Execution result
     */
    execute(options: CodeExecutionOptions): Promise<CodeExecutionResult>;
    /**
     * Injects tool access setup into user code
     * This wraps the code with necessary imports and authentication
     */
    private injectToolAccess;
    /**
     * Creates an error result
     */
    private createErrorResult;
    /**
     * Logs an execution for audit purposes
     */
    private logExecution;
    /**
     * Gets audit logs for a specific user
     */
    getAuditLogs(userId: string): ExecutionAuditLog[];
    /**
     * Gets all audit logs (admin only)
     */
    getAllAuditLogs(): ExecutionAuditLog[];
}
export declare const codeExecutor: CodeExecutor;
//# sourceMappingURL=code-executor.d.ts.map