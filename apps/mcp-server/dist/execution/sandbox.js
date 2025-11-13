/**
 * Docker-based sandbox for secure code execution
 * Provides isolated environments with resource limits and security controls
 */
import Docker from 'dockerode';
const docker = new Docker();
// Default security configuration
const DEFAULT_MEMORY_LIMIT = 512 * 1024 * 1024; // 512MB in bytes
const DEFAULT_CPU_QUOTA = 50000; // 0.5 CPUs (50% of 100000)
const DEFAULT_TIMEOUT = 30000; // 30 seconds
/**
 * Creates a secure Docker sandbox for code execution
 */
export class DockerSandbox {
    containers = new Map();
    /**
     * Creates a new sandboxed container
     * @param userId - User ID for isolation
     * @param options - Container configuration options
     * @returns Sandbox environment
     */
    async createContainer(userId, options = {}) {
        const memoryLimit = (options.maxMemory || 512) * 1024 * 1024; // Convert MB to bytes
        const cpuQuota = Math.floor((options.maxCpus || 0.5) * 100000);
        try {
            // Create container with security restrictions
            const container = await docker.createContainer({
                Image: 'smart-todos-sandbox:latest',
                Cmd: ['/bin/sh', '-c', 'sleep infinity'], // Keep container alive
                User: 'sandbox:sandbox', // Non-root user
                WorkingDir: '/workspace',
                // Security options
                HostConfig: {
                    // Resource limits
                    Memory: memoryLimit,
                    MemorySwap: memoryLimit, // Prevent swap usage
                    CpuQuota: cpuQuota,
                    CpuPeriod: 100000,
                    // Network isolation
                    NetworkMode: 'none', // No network access
                    // Filesystem
                    ReadonlyRootfs: true, // Read-only root filesystem
                    Tmpfs: {
                        '/tmp': 'rw,noexec,nosuid,size=100m',
                        '/workspace': 'rw,noexec,nosuid,size=50m'
                    },
                    // Security options
                    SecurityOpt: ['no-new-privileges'],
                    CapDrop: ['ALL'], // Drop all capabilities
                    // Prevent resource exhaustion
                    PidsLimit: 100, // Max 100 processes
                    // Auto-cleanup
                    AutoRemove: false // We'll handle cleanup manually for better control
                },
                // Environment variables
                Env: [
                    `USER_ID=${userId}`,
                    'NODE_ENV=production'
                ],
                // Labels for identification
                Labels: {
                    'app': 'smart-todos-mcp',
                    'userId': userId,
                    'createdAt': new Date().toISOString()
                }
            });
            // Start the container
            await container.start();
            const environment = {
                containerId: container.id,
                userId,
                createdAt: new Date(),
                isRunning: true,
                cleanup: async () => {
                    await this.cleanupContainer(container.id);
                }
            };
            this.containers.set(container.id, environment);
            // Set up auto-cleanup timeout
            const timeout = options.timeout || DEFAULT_TIMEOUT;
            setTimeout(() => {
                this.cleanupContainer(container.id).catch(err => {
                    console.error(`Failed to cleanup container ${container.id}:`, err);
                });
            }, timeout);
            return environment;
        }
        catch (error) {
            throw new Error(`Failed to create sandbox container: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Executes code in a container
     * @param containerId - Container ID
     * @param code - Code to execute
     * @param language - Programming language
     * @returns Execution output
     */
    async executeCode(containerId, code, language) {
        const environment = this.containers.get(containerId);
        if (!environment || !environment.isRunning) {
            throw new Error('Container not found or not running');
        }
        try {
            const container = docker.getContainer(containerId);
            // Write code to a file in the container
            const codeFileName = language === 'typescript' ? 'code.ts' : 'code.js';
            const writeCodeExec = await container.exec({
                Cmd: ['/bin/sh', '-c', `cat > /workspace/${codeFileName} << 'EOFCODE'\n${code}\nEOFCODE`],
                AttachStdout: true,
                AttachStderr: true,
                User: 'sandbox:sandbox'
            });
            await writeCodeExec.start({});
            // Execute the code
            const command = language === 'typescript'
                ? ['npx', 'tsx', `/workspace/${codeFileName}`]
                : ['node', `/workspace/${codeFileName}`];
            const exec = await container.exec({
                Cmd: command,
                AttachStdout: true,
                AttachStderr: true,
                User: 'sandbox:sandbox',
                WorkingDir: '/workspace'
            });
            const stream = await exec.start({});
            // Collect output
            let output = '';
            let error = '';
            return new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('Execution timeout exceeded'));
                }, 30000);
                stream.on('data', (chunk) => {
                    const data = chunk.toString();
                    // Docker multiplexes stdout/stderr in the stream
                    // First byte indicates stream type (1=stdout, 2=stderr)
                    const streamType = chunk[0];
                    const content = chunk.slice(8).toString();
                    if (streamType === 1) {
                        output += content;
                    }
                    else if (streamType === 2) {
                        error += content;
                    }
                });
                stream.on('end', () => {
                    clearTimeout(timeout);
                    resolve({
                        output: output.trim(),
                        error: error.trim() || undefined
                    });
                });
                stream.on('error', (err) => {
                    clearTimeout(timeout);
                    reject(err);
                });
            });
        }
        catch (error) {
            return {
                output: '',
                error: error instanceof Error ? error.message : 'Unknown execution error'
            };
        }
    }
    /**
     * Cleans up a container
     * @param containerId - Container ID to cleanup
     */
    async cleanupContainer(containerId) {
        const environment = this.containers.get(containerId);
        if (!environment) {
            return;
        }
        try {
            const container = docker.getContainer(containerId);
            // Stop the container if still running
            try {
                await container.stop({ t: 5 }); // 5 second grace period
            }
            catch (err) {
                // Container might already be stopped
            }
            // Remove the container
            await container.remove({ force: true });
            environment.isRunning = false;
            this.containers.delete(containerId);
        }
        catch (error) {
            console.error(`Error cleaning up container ${containerId}:`, error);
            throw error;
        }
    }
    /**
     * Cleans up all containers for a specific user
     * @param userId - User ID
     */
    async cleanupUserContainers(userId) {
        const userContainers = Array.from(this.containers.values())
            .filter(env => env.userId === userId);
        await Promise.all(userContainers.map(env => this.cleanupContainer(env.containerId)));
    }
    /**
     * Cleans up all containers
     */
    async cleanupAll() {
        const containerIds = Array.from(this.containers.keys());
        await Promise.all(containerIds.map(id => this.cleanupContainer(id)));
    }
    /**
     * Gets container stats (CPU, memory usage)
     * @param containerId - Container ID
     * @returns Resource usage stats
     */
    async getContainerStats(containerId) {
        try {
            const container = docker.getContainer(containerId);
            const stats = await container.stats({ stream: false });
            // Calculate CPU percentage
            const cpuDelta = stats.cpu_stats.cpu_usage.total_usage -
                stats.precpu_stats.cpu_usage.total_usage;
            const systemDelta = stats.cpu_stats.system_cpu_usage -
                stats.precpu_stats.system_cpu_usage;
            const cpuPercent = (cpuDelta / systemDelta) * 100;
            // Memory in MB
            const memoryMB = stats.memory_stats.usage / (1024 * 1024);
            // Disk I/O in MB
            const diskIO = stats.blkio_stats?.io_service_bytes_recursive
                ? stats.blkio_stats.io_service_bytes_recursive.reduce((acc, curr) => acc + curr.value, 0) / (1024 * 1024)
                : 0;
            return {
                cpu: cpuPercent,
                memory: memoryMB,
                diskIO
            };
        }
        catch (error) {
            console.error(`Error getting container stats:`, error);
            return { cpu: 0, memory: 0, diskIO: 0 };
        }
    }
}
// Singleton instance
export const dockerSandbox = new DockerSandbox();
//# sourceMappingURL=sandbox.js.map