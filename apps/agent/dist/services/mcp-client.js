"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.MCPClient = void 0;
exports.getMCPClient = getMCPClient;
exports.closeMCPClient = closeMCPClient;
const index_js_1 = require("@modelcontextprotocol/sdk/client/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/client/stdio.js");
const child_process_1 = require("child_process");
const path = __importStar(require("path"));
/**
 * MCP Client for SmartTodos Agent
 *
 * Provides interface to communicate with the MCP server for:
 * - Traditional tool calls (getTasks, createTask, etc.)
 * - Code execution for complex operations
 *
 * Architecture: Hybrid approach
 * - Use direct DB access for fast context loading
 * - Use MCP for agent-driven mutations and analytics
 */
class MCPClient {
    constructor() {
        this.client = null;
        this.transport = null;
        this.serverProcess = null;
        this.isConnected = false;
    }
    /**
     * Connect to the MCP server via stdio transport
     * Spawns the MCP server as a subprocess
     */
    async connect() {
        if (this.isConnected) {
            console.log('[MCP] Already connected');
            return;
        }
        try {
            // Path to the MCP server (relative to agent directory)
            const mcpServerPath = path.resolve(__dirname, '../../../mcp-server/dist/index.js');
            console.log('[MCP] Spawning MCP server:', mcpServerPath);
            // Spawn the MCP server process
            this.serverProcess = (0, child_process_1.spawn)('node', [mcpServerPath], {
                stdio: ['pipe', 'pipe', 'inherit'], // stdin, stdout, stderr
            });
            // Handle server process errors
            this.serverProcess.on('error', (error) => {
                console.error('[MCP] Server process error:', error);
                this.isConnected = false;
            });
            this.serverProcess.on('exit', (code) => {
                console.log('[MCP] Server process exited with code:', code);
                this.isConnected = false;
            });
            // Create stdio transport
            this.transport = new stdio_js_1.StdioClientTransport({
                command: 'node',
                args: [mcpServerPath],
            });
            // Create MCP client
            this.client = new index_js_1.Client({
                name: 'smart-todos-agent',
                version: '1.0.0',
            }, {
                capabilities: {
                    tools: {},
                    resources: {},
                },
            });
            // Connect to the server
            await this.client.connect(this.transport);
            this.isConnected = true;
            console.log('[MCP] Connected successfully');
        }
        catch (error) {
            console.error('[MCP] Failed to connect:', error);
            throw new Error(`MCP connection failed: ${error}`);
        }
    }
    /**
     * Disconnect from the MCP server
     */
    async disconnect() {
        if (!this.isConnected) {
            return;
        }
        try {
            if (this.client) {
                await this.client.close();
            }
            if (this.serverProcess) {
                this.serverProcess.kill();
            }
            this.isConnected = false;
            console.log('[MCP] Disconnected');
        }
        catch (error) {
            console.error('[MCP] Error during disconnect:', error);
        }
    }
    /**
     * Check if client is connected
     */
    isClientConnected() {
        return this.isConnected;
    }
    /**
     * Call a traditional MCP tool
     * @param toolName Name of the tool (e.g., 'getTasks', 'createTask')
     * @param args Tool arguments
     * @param jwtToken JWT token for authentication
     */
    async callTool(toolName, args, jwtToken) {
        if (!this.isConnected || !this.client) {
            throw new Error('MCP client not connected. Call connect() first.');
        }
        try {
            console.log(`[MCP] Calling tool: ${toolName}`);
            const result = await this.client.callTool({
                name: toolName,
                arguments: Object.assign({ token: jwtToken }, args),
            });
            return result;
        }
        catch (error) {
            console.error(`[MCP] Tool call failed for ${toolName}:`, error);
            throw error;
        }
    }
    /**
     * Execute code in the MCP server's sandbox
     * This is the "Code Execution Pattern" for complex operations
     *
     * @param code TypeScript/JavaScript code to execute
     * @param jwtToken JWT token for authentication
     * @param language Programming language (default: 'typescript')
     * @param timeout Execution timeout in seconds (default: 30, max: 60)
     */
    async executeCode(code, jwtToken, language = 'typescript', timeout = 30) {
        if (!this.isConnected || !this.client) {
            throw new Error('MCP client not connected. Call connect() first.');
        }
        try {
            console.log(`[MCP] Executing ${language} code (${code.length} chars)`);
            const result = await this.client.callTool({
                name: 'executeCode',
                arguments: {
                    token: jwtToken,
                    code,
                    language,
                    timeout,
                },
            });
            return result;
        }
        catch (error) {
            console.error('[MCP] Code execution failed:', error);
            throw error;
        }
    }
    /**
     * Get list of available tools from the server
     */
    async listTools() {
        if (!this.isConnected || !this.client) {
            throw new Error('MCP client not connected. Call connect() first.');
        }
        try {
            const result = await this.client.listTools();
            return result.tools;
        }
        catch (error) {
            console.error('[MCP] Failed to list tools:', error);
            throw error;
        }
    }
    /**
     * Get list of available resources from the server
     */
    async listResources() {
        if (!this.isConnected || !this.client) {
            throw new Error('MCP client not connected. Call connect() first.');
        }
        try {
            const result = await this.client.listResources();
            return result.resources;
        }
        catch (error) {
            console.error('[MCP] Failed to list resources:', error);
            throw error;
        }
    }
}
exports.MCPClient = MCPClient;
// Singleton instance for the agent
let mcpClientInstance = null;
/**
 * Get or create the MCP client instance
 * Ensures only one connection is maintained
 */
async function getMCPClient() {
    if (!mcpClientInstance) {
        mcpClientInstance = new MCPClient();
        await mcpClientInstance.connect();
    }
    else if (!mcpClientInstance.isClientConnected()) {
        await mcpClientInstance.connect();
    }
    return mcpClientInstance;
}
/**
 * Close the MCP client connection
 * Call this on agent shutdown
 */
async function closeMCPClient() {
    if (mcpClientInstance) {
        await mcpClientInstance.disconnect();
        mcpClientInstance = null;
    }
}
