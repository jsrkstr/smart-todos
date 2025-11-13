import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ErrorCode,
  McpError
} from '@modelcontextprotocol/sdk/types.js'

// Import tool definitions and handlers
import {
  getTasksToolDefinition,
  getTasks,
  getTaskToolDefinition,
  getTask,
  createTaskToolDefinition,
  createTask,
  updateTaskToolDefinition,
  updateTask,
  deleteTaskToolDefinition,
  deleteTask,
  getSubtasksToolDefinition,
  getSubtasks
} from './tools/tasks'

import {
  getUserProfileToolDefinition,
  getUserProfile,
  getPsychProfileToolDefinition,
  getPsychProfile,
  getUserSettingsToolDefinition,
  getUserSettings
} from './tools/users'

import {
  getChatHistoryToolDefinition,
  getChatHistory,
  createChatMessageToolDefinition,
  createChatMessage
} from './tools/chat'

import {
  getPomodorosToolDefinition,
  getPomodoros,
  createPomodoroToolDefinition,
  createPomodoro
} from './tools/pomodoro'

import { disconnectDatabase } from './services/database'
import { listToolResources, readToolResource } from './resources'
import { codeExecutor } from './execution/code-executor'
import { z } from 'zod'

// Code execution tool definition
const executeCodeToolDefinition = {
  name: 'executeCode',
  description: 'Execute TypeScript/JavaScript code in a secure sandbox with access to Smart Todos tools. Use this to write custom logic, filter large datasets, or perform complex operations.',
  inputSchema: {
    type: 'object',
    properties: {
      token: {
        type: 'string',
        description: 'JWT authentication token'
      },
      code: {
        type: 'string',
        description: 'TypeScript or JavaScript code to execute. Can import tools from /servers/* paths.'
      },
      language: {
        type: 'string',
        enum: ['typescript', 'javascript'],
        description: 'Programming language (default: typescript)',
        default: 'typescript'
      },
      timeout: {
        type: 'number',
        description: 'Execution timeout in milliseconds (default: 30000, max: 60000)',
        default: 30000
      }
    },
    required: ['token', 'code']
  }
}

// Tool registry
const tools = [
  // Code execution tool
  executeCodeToolDefinition,
  // Task tools
  getTasksToolDefinition,
  getTaskToolDefinition,
  createTaskToolDefinition,
  updateTaskToolDefinition,
  deleteTaskToolDefinition,
  getSubtasksToolDefinition,
  // User tools
  getUserProfileToolDefinition,
  getPsychProfileToolDefinition,
  getUserSettingsToolDefinition,
  // Chat tools
  getChatHistoryToolDefinition,
  createChatMessageToolDefinition,
  // Pomodoro tools
  getPomodorosToolDefinition,
  createPomodoroToolDefinition
]

// Code execution handler
async function executeCode(params: any) {
  const schema = z.object({
    token: z.string(),
    code: z.string(),
    language: z.enum(['typescript', 'javascript']).default('typescript'),
    timeout: z.number().max(60000).default(30000)
  })

  const validated = schema.parse(params)

  // Extract userId from token (will be done by code executor)
  // For now, we'll use a simpler approach
  const result = await codeExecutor.execute({
    code: validated.code,
    language: validated.language,
    userId: 'extracted-from-token', // TODO: Extract from JWT
    token: validated.token,
    timeout: validated.timeout
  })

  return {
    success: result.success,
    output: result.output,
    error: result.error,
    executionTime: result.executionTime,
    resourcesUsed: result.resourcesUsed
  }
}

// Tool handlers
const toolHandlers: { [key: string]: (params: any) => Promise<any> } = {
  // Code execution
  executeCode,
  // Tasks
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  getSubtasks,
  // Users
  getUserProfile,
  getPsychProfile,
  getUserSettings,
  // Chat
  getChatHistory,
  createChatMessage,
  // Pomodoro
  getPomodoros,
  createPomodoro
}

export class SmartTodosMCPServer {
  private server: Server

  constructor() {
    this.server = new Server(
      {
        name: 'smart-todos-mcp-server',
        version: '1.0.0'
      },
      {
        capabilities: {
          tools: {},
          resources: {}
        }
      }
    )

    this.setupHandlers()
    this.setupErrorHandling()
  }

  private setupHandlers() {
    // List available resources (tool files for discovery)
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      const resources = listToolResources()
      return {
        resources
      }
    })

    // Read resource content
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      try {
        const content = readToolResource(request.params.uri)
        return {
          contents: [
            {
              uri: request.params.uri,
              mimeType: request.params.uri.endsWith('.md') ? 'text/markdown' : 'text/typescript',
              text: content
            }
          ]
        }
      } catch (error) {
        throw new McpError(
          ErrorCode.InvalidRequest,
          error instanceof Error ? error.message : 'Failed to read resource'
        )
      }
    })

    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools
      }
    })

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params

      try {
        const handler = toolHandlers[name]

        if (!handler) {
          throw new McpError(
            ErrorCode.MethodNotFound,
            `Tool not found: ${name}`
          )
        }

        const result = await handler(args || {})

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        }
      } catch (error) {
        if (error instanceof McpError) {
          throw error
        }

        // Handle validation errors
        if (error instanceof Error) {
          if (error.message.includes('JWT verification failed')) {
            throw new McpError(
              ErrorCode.InvalidRequest,
              `Authentication failed: ${error.message}`
            )
          }

          if (error.message.includes('not found') || error.message.includes('access denied')) {
            throw new McpError(
              ErrorCode.InvalidRequest,
              error.message
            )
          }

          // Zod validation errors
          if (error.name === 'ZodError') {
            throw new McpError(
              ErrorCode.InvalidParams,
              `Validation error: ${error.message}`
            )
          }

          throw new McpError(
            ErrorCode.InternalError,
            `Tool execution failed: ${error.message}`
          )
        }

        throw new McpError(
          ErrorCode.InternalError,
          'An unknown error occurred'
        )
      }
    })
  }

  private setupErrorHandling() {
    this.server.onerror = (error) => {
      console.error('[MCP Server Error]', error)
    }

    process.on('SIGINT', async () => {
      await this.cleanup()
      process.exit(0)
    })

    process.on('SIGTERM', async () => {
      await this.cleanup()
      process.exit(0)
    })
  }

  private async cleanup() {
    console.error('Shutting down MCP server...')
    await disconnectDatabase()
    console.error('MCP server shut down successfully')
  }

  async start() {
    const transport = new StdioServerTransport()
    await this.server.connect(transport)
    console.error('Smart Todos MCP Server running on stdio')
  }
}
