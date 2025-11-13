/**
 * Types for code execution infrastructure
 */

export interface CodeExecutionOptions {
  /** The code to execute */
  code: string
  /** Programming language */
  language: 'typescript' | 'javascript'
  /** User ID for authentication and resource isolation */
  userId: string
  /** JWT token for tool authentication */
  token: string
  /** Execution timeout in milliseconds (default: 30000) */
  timeout?: number
  /** Maximum memory in MB (default: 512) */
  maxMemory?: number
  /** Maximum CPU cores (default: 0.5) */
  maxCpus?: number
}

export interface CodeExecutionResult {
  /** Whether execution succeeded */
  success: boolean
  /** Output from the code (stdout) */
  output: string
  /** Error message if execution failed */
  error?: string
  /** Artifacts created during execution (files, charts, etc.) */
  artifacts?: Array<{
    name: string
    content: string
    mimeType: string
  }>
  /** Execution time in milliseconds */
  executionTime: number
  /** Resource usage during execution */
  resourcesUsed?: {
    cpu: number
    memory: number
    diskIO: number
  }
}

export interface CodeValidationResult {
  /** Whether the code is valid/safe */
  valid: boolean
  /** Reason for rejection if invalid */
  reason?: string
  /** List of dangerous patterns found */
  violations?: string[]
}

export interface SandboxEnvironment {
  /** Container ID */
  containerId: string
  /** User ID this container belongs to */
  userId: string
  /** Creation timestamp */
  createdAt: Date
  /** Whether container is still running */
  isRunning: boolean
  /** Cleanup function */
  cleanup: () => Promise<void>
}

export interface ExecutionAuditLog {
  /** User who executed the code */
  userId: string
  /** Code that was executed */
  code: string
  /** Language */
  language: string
  /** Execution time */
  executionTime: number
  /** Whether execution succeeded */
  success: boolean
  /** Error message if failed */
  error?: string
  /** Timestamp */
  timestamp: Date
  /** Resources used */
  resourcesUsed?: {
    cpu: number
    memory: number
    diskIO: number
  }
}
