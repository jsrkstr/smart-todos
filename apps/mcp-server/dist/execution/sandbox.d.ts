/**
 * Docker-based sandbox for secure code execution
 * Provides isolated environments with resource limits and security controls
 */
import { SandboxEnvironment } from './types';
/**
 * Creates a secure Docker sandbox for code execution
 */
export declare class DockerSandbox {
    private containers;
    /**
     * Creates a new sandboxed container
     * @param userId - User ID for isolation
     * @param options - Container configuration options
     * @returns Sandbox environment
     */
    createContainer(userId: string, options?: {
        timeout?: number;
        maxMemory?: number;
        maxCpus?: number;
    }): Promise<SandboxEnvironment>;
    /**
     * Executes code in a container
     * @param containerId - Container ID
     * @param code - Code to execute
     * @param language - Programming language
     * @returns Execution output
     */
    executeCode(containerId: string, code: string, language: 'typescript' | 'javascript'): Promise<{
        output: string;
        error?: string;
    }>;
    /**
     * Cleans up a container
     * @param containerId - Container ID to cleanup
     */
    cleanupContainer(containerId: string): Promise<void>;
    /**
     * Cleans up all containers for a specific user
     * @param userId - User ID
     */
    cleanupUserContainers(userId: string): Promise<void>;
    /**
     * Cleans up all containers
     */
    cleanupAll(): Promise<void>;
    /**
     * Gets container stats (CPU, memory usage)
     * @param containerId - Container ID
     * @returns Resource usage stats
     */
    getContainerStats(containerId: string): Promise<{
        cpu: number;
        memory: number;
        diskIO: number;
    }>;
}
export declare const dockerSandbox: DockerSandbox;
//# sourceMappingURL=sandbox.d.ts.map