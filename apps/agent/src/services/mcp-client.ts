import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';

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
export class MCPClient {
  private client: Client | null = null;
  private transport: StdioClientTransport | null = null;
  private serverProcess: ChildProcess | null = null;
  private isConnected = false;

  /**
   * Connect to the MCP server via stdio transport
   * Spawns the MCP server as a subprocess
   */
  async connect(): Promise<void> {
    if (this.isConnected) {
      console.log('[MCP] Already connected');
      return;
    }

    try {
      // Path to the MCP server (relative to agent directory)
      const mcpServerPath = path.resolve(__dirname, '../../../mcp-server/dist/index.js');

      console.log('[MCP] Spawning MCP server:', mcpServerPath);

      // Spawn the MCP server process
      this.serverProcess = spawn('node', [mcpServerPath], {
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
      this.transport = new StdioClientTransport({
        command: 'node',
        args: [mcpServerPath],
      });

      // Create MCP client
      this.client = new Client({
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
    } catch (error) {
      console.error('[MCP] Failed to connect:', error);
      throw new Error(`MCP connection failed: ${error}`);
    }
  }

  /**
   * Disconnect from the MCP server
   */
  async disconnect(): Promise<void> {
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
    } catch (error) {
      console.error('[MCP] Error during disconnect:', error);
    }
  }

  /**
   * Check if client is connected
   */
  isClientConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Call a traditional MCP tool
   * @param toolName Name of the tool (e.g., 'getTasks', 'createTask')
   * @param args Tool arguments
   * @param jwtToken JWT token for authentication
   */
  async callTool(toolName: string, args: any, jwtToken: string): Promise<any> {
    if (!this.isConnected || !this.client) {
      throw new Error('MCP client not connected. Call connect() first.');
    }

    try {
      console.log(`[MCP] Calling tool: ${toolName}`);

      const result = await this.client.callTool({
        name: toolName,
        arguments: {
          token: jwtToken,
          ...args,
        },
      });

      return result;
    } catch (error) {
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
  async executeCode(
    code: string,
    jwtToken: string,
    language: 'typescript' | 'javascript' = 'typescript',
    timeout: number = 30
  ): Promise<any> {
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
    } catch (error) {
      console.error('[MCP] Code execution failed:', error);
      throw error;
    }
  }

  /**
   * Get list of available tools from the server
   */
  async listTools(): Promise<any[]> {
    if (!this.isConnected || !this.client) {
      throw new Error('MCP client not connected. Call connect() first.');
    }

    try {
      const result = await this.client.listTools();
      return result.tools;
    } catch (error) {
      console.error('[MCP] Failed to list tools:', error);
      throw error;
    }
  }

  /**
   * Get list of available resources from the server
   */
  async listResources(): Promise<any[]> {
    if (!this.isConnected || !this.client) {
      throw new Error('MCP client not connected. Call connect() first.');
    }

    try {
      const result = await this.client.listResources();
      return result.resources;
    } catch (error) {
      console.error('[MCP] Failed to list resources:', error);
      throw error;
    }
  }
}

// Singleton instance for the agent
let mcpClientInstance: MCPClient | null = null;

/**
 * Get or create the MCP client instance
 * Ensures only one connection is maintained
 */
export async function getMCPClient(): Promise<MCPClient> {
  if (!mcpClientInstance) {
    mcpClientInstance = new MCPClient();
    await mcpClientInstance.connect();
  } else if (!mcpClientInstance.isClientConnected()) {
    await mcpClientInstance.connect();
  }

  return mcpClientInstance;
}

/**
 * Close the MCP client connection
 * Call this on agent shutdown
 */
export async function closeMCPClient(): Promise<void> {
  if (mcpClientInstance) {
    await mcpClientInstance.disconnect();
    mcpClientInstance = null;
  }
}
