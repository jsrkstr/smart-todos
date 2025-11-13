/**
 * Code executor - orchestrates validation, sandboxing, and execution
 */
import { dockerSandbox } from './sandbox';
import { validateCode, validateCodeSize, sanitizeCode } from './validator';
/**
 * Audit logs for tracking executions
 */
const auditLogs = [];
/**
 * Main code executor class
 */
export class CodeExecutor {
    /**
     * Executes code in a secure sandbox
     * @param options - Execution options
     * @returns Execution result
     */
    async execute(options) {
        const startTime = Date.now();
        let containerId;
        try {
            // Step 1: Sanitize code
            const sanitized = sanitizeCode(options.code);
            // Step 2: Validate code size
            const sizeValidation = validateCodeSize(sanitized);
            if (!sizeValidation.valid) {
                return this.createErrorResult(sizeValidation.reason || 'Code size validation failed', Date.now() - startTime);
            }
            // Step 3: Security validation
            const validation = validateCode(sanitized, options.language);
            if (!validation.valid) {
                return this.createErrorResult(`Security validation failed: ${validation.reason}\n${validation.violations
                    ? 'Violations:\n' + validation.violations.map(v => `  - ${v}`).join('\n')
                    : ''}`, Date.now() - startTime);
            }
            // Step 4: Create sandbox container
            const sandbox = await dockerSandbox.createContainer(options.userId, {
                timeout: options.timeout || 30000,
                maxMemory: options.maxMemory || 512,
                maxCpus: options.maxCpus || 0.5
            });
            containerId = sandbox.containerId;
            // Step 5: Inject tool access setup
            const codeWithSetup = this.injectToolAccess(sanitized, options.token);
            // Step 6: Execute code
            const result = await dockerSandbox.executeCode(sandbox.containerId, codeWithSetup, options.language);
            // Step 7: Get resource usage
            const stats = await dockerSandbox.getContainerStats(sandbox.containerId);
            // Step 8: Cleanup
            await sandbox.cleanup();
            const executionTime = Date.now() - startTime;
            // Log execution
            this.logExecution({
                userId: options.userId,
                code: options.code,
                language: options.language,
                executionTime,
                success: !result.error,
                error: result.error,
                timestamp: new Date(),
                resourcesUsed: stats
            });
            // Return result
            if (result.error) {
                return {
                    success: false,
                    output: result.output,
                    error: result.error,
                    executionTime,
                    resourcesUsed: stats
                };
            }
            return {
                success: true,
                output: result.output,
                executionTime,
                resourcesUsed: stats
            };
        }
        catch (error) {
            const executionTime = Date.now() - startTime;
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            // Cleanup container if it was created
            if (containerId) {
                try {
                    await dockerSandbox.cleanupContainer(containerId);
                }
                catch (cleanupError) {
                    console.error('Failed to cleanup container:', cleanupError);
                }
            }
            // Log execution
            this.logExecution({
                userId: options.userId,
                code: options.code,
                language: options.language,
                executionTime,
                success: false,
                error: errorMessage,
                timestamp: new Date()
            });
            return this.createErrorResult(errorMessage, executionTime);
        }
    }
    /**
     * Injects tool access setup into user code
     * This wraps the code with necessary imports and authentication
     */
    injectToolAccess(code, token) {
        return `
// Injected tool access setup
const __TOKEN__ = '${token.replace(/'/g, "\\'")}';

// Create a simple callTool function that makes tools available
async function callInternalTool(toolName, params) {
  // In the container, we'll have a special tool caller available
  // For now, this is a placeholder - actual implementation will
  // communicate with the parent MCP server process
  throw new Error('Tool calling not yet implemented in sandbox');
}

// User code starts here
${code}
`;
    }
    /**
     * Creates an error result
     */
    createErrorResult(error, executionTime) {
        return {
            success: false,
            output: '',
            error,
            executionTime
        };
    }
    /**
     * Logs an execution for audit purposes
     */
    logExecution(log) {
        auditLogs.push(log);
        // Keep only last 1000 logs in memory
        if (auditLogs.length > 1000) {
            auditLogs.shift();
        }
        // Log to console for now (in production, send to database)
        console.error('[Execution Audit]', {
            userId: log.userId,
            success: log.success,
            executionTime: log.executionTime,
            error: log.error,
            timestamp: log.timestamp,
            codeLength: log.code.length
        });
    }
    /**
     * Gets audit logs for a specific user
     */
    getAuditLogs(userId) {
        return auditLogs.filter(log => log.userId === userId);
    }
    /**
     * Gets all audit logs (admin only)
     */
    getAllAuditLogs() {
        return [...auditLogs];
    }
}
// Singleton instance
export const codeExecutor = new CodeExecutor();
//# sourceMappingURL=code-executor.js.map