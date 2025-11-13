# Smart Todos MCP Server

Model Context Protocol (MCP) server for Smart Todos that exposes database operations as tools for AI agents.

## Overview

This MCP server provides a standardized interface for AI agents to interact with the Smart Todos database. It implements the [Model Context Protocol](https://modelcontextprotocol.io/) specification from Anthropic, enabling:

- **🚀 Code Execution** - Write TypeScript/JavaScript code that runs in a secure sandbox (NEW!)
- **📦 Progressive tool discovery** - Load only the tools you need via MCP Resources
- **🔒 JWT authentication** - Secure access with user-specific operations
- **✅ Type-safe operations** - Zod schema validation
- **📊 Comprehensive coverage** - Tasks, Users, Chat, Pomodoro operations

## 🆕 Code Execution Pattern

Following Anthropic's [Code Execution with MCP](https://www.anthropic.com/engineering/code-execution-with-mcp) approach, agents can now write code that gets executed in a secure Docker sandbox:

```typescript
// Instead of multiple tool calls, write code
import { getTasks, updateTask } from '/servers/tasks'

const tasks = await getTasks({ completed: false, priority: 'high' })

for (const task of tasks) {
  await updateTask(task.id, { priority: 'urgent' })
}

return { updated: tasks.length }
```

**Benefits:**
- **98%+ token reduction** - Process large datasets in sandbox, return summaries
- **Complex logic** - Use loops, conditionals, error handling naturally
- **Better performance** - 1 tool call instead of N+1
- **Privacy** - Sensitive data stays in sandbox

📖 **See [CODE_EXECUTION.md](./CODE_EXECUTION.md) for complete documentation and examples.**

## Architecture

```
apps/mcp-server/
├── src/
│   ├── auth/
│   │   └── jwt.ts              # JWT verification
│   ├── execution/              # 🆕 Code execution
│   │   ├── types.ts            #   Execution types
│   │   ├── validator.ts        #   Security validation
│   │   ├── sandbox.ts          #   Docker container management
│   │   └── code-executor.ts    #   Orchestration
│   ├── resources/              # 🆕 MCP Resources
│   │   ├── filesystem.ts       #   Tool file discovery
│   │   └── index.ts            #   Resource handlers
│   ├── tools-as-code/          # 🆕 Tools as Code APIs
│   │   ├── tasks/              #   Task tools
│   │   ├── users/              #   User tools
│   │   ├── chat/               #   Chat tools
│   │   ├── pomodoro/           #   Pomodoro tools
│   │   ├── internal.ts         #   Tool caller bridge
│   │   └── index.ts            #   Main exports
│   ├── services/
│   │   └── database.ts         # Prisma service layer
│   ├── tools/                  # Traditional MCP tools
│   │   ├── tasks/              # Task CRUD operations
│   │   ├── users/              # User profile operations
│   │   ├── chat/               # Chat message operations
│   │   ├── pomodoro/           # Pomodoro session operations
│   │   └── index.ts            # Tool registry
│   ├── types/
│   │   └── index.ts            # Zod schemas and types
│   ├── server.ts               # MCP server implementation
│   └── index.ts                # Entry point
├── Dockerfile.sandbox          # 🆕 Sandbox container image
├── build-sandbox.sh            # 🆕 Image build script
├── CODE_EXECUTION.md           # 🆕 Code execution docs
├── package.json
├── tsconfig.json
└── README.md
```

## Installation

### 1. Install dependencies

```bash
cd apps/mcp-server
pnpm install
```

### 2. Configure environment variables

Create `.env` file:

```bash
DATABASE_URL="postgresql://user:password@localhost:5432/smart_todos"
JWT_SECRET="your-jwt-secret-key"
```

**Important:** The `JWT_SECRET` must match the secret used in `apps/web`.

### 3. Generate Prisma client

The MCP server uses the Prisma schema from `apps/web`:

```bash
pnpm prisma:generate
```

### 4. Build the server

```bash
pnpm build
```

### 5. (Optional) Set up code execution

To enable the code execution feature, build the Docker sandbox image:

```bash
./build-sandbox.sh
```

This requires Docker to be installed. If Docker is not available, the server will still work but the `executeCode` tool will not be available.

**Requirements:**
- Docker Desktop (macOS/Windows) or Docker Engine (Linux)
- 512MB+ available RAM for containers
- ~200MB disk space for sandbox image

## Usage

### Running the server

The MCP server communicates via stdio (standard input/output):

```bash
pnpm start
```

For development with auto-reload:

```bash
pnpm dev
```

### Using with Claude Desktop

Add to your Claude Desktop configuration (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "smart-todos": {
      "command": "node",
      "args": ["/path/to/smart-todos/apps/mcp-server/dist/index.js"],
      "env": {
        "DATABASE_URL": "postgresql://user:password@localhost:5432/smart_todos",
        "JWT_SECRET": "your-jwt-secret"
      }
    }
  }
}
```

### Using with Python agents

See [apps/agent-python/MCP_INTEGRATION.md](../agent-python/MCP_INTEGRATION.md) for detailed integration guide.

```python
from services.mcp_client import get_mcp_client

# Initialize with JWT token
mcp = get_mcp_client(jwt_token="user-jwt-token")

# Get tasks
tasks = mcp.get_tasks(completed=False)

# Create task
task = mcp.create_task(title="Finish report", priority="high")
```

## Available Tools

### Code Execution Tool (NEW!)

#### executeCode
Execute TypeScript/JavaScript code in a secure Docker sandbox with access to Smart Todos tools.

**Parameters:**
- `token` (string, required) - JWT authentication token
- `code` (string, required) - TypeScript or JavaScript code to execute
- `language` (string, optional) - 'typescript' or 'javascript' (default: 'typescript')
- `timeout` (number, optional) - Execution timeout in milliseconds (default: 30000, max: 60000)

**Returns:**
```json
{
  "success": true,
  "output": "Code execution output",
  "executionTime": 1234,
  "resourcesUsed": {
    "cpu": 10,
    "memory": 128,
    "diskIO": 5
  }
}
```

**Example:**
```typescript
// Code that gets executed
import { getTasks, updateTask } from '/servers/tasks'

const tasks = await getTasks({ priority: 'high' })
const updated = []

for (const task of tasks) {
  await updateTask(task.id, { completed: true })
  updated.push(task.id)
}

return { updated: updated.length }
```

See [CODE_EXECUTION.md](./CODE_EXECUTION.md) for detailed examples and patterns.

### Task Tools

#### getTasks
Get all tasks for the authenticated user with optional filtering.

**Parameters:**
- `token` (string, required) - JWT authentication token
- `completed` (boolean, optional) - Filter by completion status
- `priority` (string, optional) - Filter by priority: 'low', 'medium', 'high'
- `startDate` (string, optional) - Filter tasks due after this date (ISO 8601)
- `endDate` (string, optional) - Filter tasks due before this date (ISO 8601)
- `parentId` (string, optional) - Filter by parent task ID (null for root tasks)

**Returns:**
```json
{
  "success": true,
  "data": [...],
  "count": 5
}
```

#### getTask
Get a single task by ID with full details.

**Parameters:**
- `token` (string, required)
- `taskId` (string, required)

#### createTask
Create a new task.

**Parameters:**
- `token` (string, required)
- `title` (string, required)
- `description` (string, optional)
- `priority` (string, optional) - 'low', 'medium', 'high'
- `dueDate` (string, optional) - ISO 8601 date
- `parentId` (string, optional) - For subtasks
- `tags` (array, optional) - Array of tag IDs

#### updateTask
Update an existing task.

**Parameters:**
- `token` (string, required)
- `taskId` (string, required)
- `title` (string, optional)
- `description` (string, optional)
- `priority` (string, optional)
- `dueDate` (string, optional)
- `completed` (boolean, optional)
- `tags` (array, optional)

#### deleteTask
Delete a task (soft delete).

**Parameters:**
- `token` (string, required)
- `taskId` (string, required)

#### getSubtasks
Get all subtasks for a parent task.

**Parameters:**
- `token` (string, required)
- `taskId` (string, required) - Parent task ID

### User Tools

#### getUserProfile
Get the authenticated user's profile.

**Parameters:**
- `token` (string, required)

#### getPsychProfile
Get the user's psychological profile including matched coach.

**Parameters:**
- `token` (string, required)

#### getUserSettings
Get user settings including pomodoro preferences.

**Parameters:**
- `token` (string, required)

### Chat Tools

#### getChatHistory
Get chat message history.

**Parameters:**
- `token` (string, required)
- `limit` (number, optional) - Default: 50

#### createChatMessage
Create a new chat message.

**Parameters:**
- `token` (string, required)
- `role` (string, required) - 'user', 'assistant', 'system'
- `content` (string, required)

### Pomodoro Tools

#### getPomodoros
Get pomodoro sessions with optional filtering.

**Parameters:**
- `token` (string, required)
- `taskId` (string, optional)
- `startDate` (string, optional)
- `endDate` (string, optional)

#### createPomodoro
Create a new pomodoro session.

**Parameters:**
- `token` (string, required)
- `duration` (number, required) - Duration in minutes
- `completed` (boolean, required)
- `taskId` (string, optional)

## Authentication

All tools require JWT authentication via the `token` parameter. The token is verified using the `JWT_SECRET` environment variable.

### Token Format

The JWT token should contain:
```json
{
  "userId": "user-id-here",
  "exp": 1234567890
}
```

### Getting a Token

Users authenticate through the Next.js API:

```typescript
// POST /api/auth/credentials
const response = await fetch('/api/auth/credentials', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
})

const { token } = await response.json()
```

## Error Handling

The MCP server returns standard MCP error codes:

- `InvalidRequest` - Authentication failed
- `InvalidParams` - Validation error (Zod schema)
- `MethodNotFound` - Tool not found
- `InternalError` - Server error

Example error response:
```json
{
  "error": {
    "code": "InvalidRequest",
    "message": "Authentication failed: JWT verification failed"
  }
}
```

## Development

### Project Structure

- **auth/** - JWT verification and authentication
- **services/** - Database service layer with Prisma
- **tools/** - MCP tool implementations organized by domain
- **types/** - Zod schemas and TypeScript types
- **server.ts** - MCP server setup and request handling
- **index.ts** - Entry point

### Adding New Tools

1. Create tool file in appropriate domain folder (e.g., `src/tools/tasks/newTool.ts`)
2. Define tool schema and handler function
3. Export from domain index file
4. Register in `src/server.ts` tool registry

Example:

```typescript
// src/tools/tasks/archiveTask.ts
import { JWTAuth } from '../../auth/jwt'
import { TaskService } from '../../services/database'
import { z } from 'zod'

export const ArchiveTaskSchema = z.object({
  token: z.string(),
  taskId: z.string()
})

export const archiveTaskToolDefinition = {
  name: 'archiveTask',
  description: 'Archive a completed task',
  inputSchema: {
    type: 'object',
    properties: {
      token: { type: 'string' },
      taskId: { type: 'string' }
    },
    required: ['token', 'taskId']
  }
}

export async function archiveTask(params: z.infer<typeof ArchiveTaskSchema>) {
  const validated = ArchiveTaskSchema.parse(params)
  const { userId } = await JWTAuth.verify(validated.token)

  // Implementation...

  return { success: true }
}
```

### Testing

```bash
# Run the server
pnpm dev

# In another terminal, test with MCP client
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node dist/index.js
```

## Database Schema

The MCP server uses the Prisma schema from `apps/web/prisma/schema.prisma`. Key models:

- **User** - User accounts and profiles
- **Task** - Tasks with subtasks, tags, notifications
- **PsychProfile** - Psychological profiles for coaching
- **ChatMessage** - Conversation history
- **Settings** - User preferences
- **Pomodoro** - Focus sessions

## Performance

- **Connection Pooling** - Prisma handles connection pooling automatically
- **Query Optimization** - Uses Prisma's `select` and `include` for efficient queries
- **Soft Deletes** - Tasks use `deletedAt` field instead of hard deletes
- **Indexing** - Database indexes on foreign keys and frequently queried fields

## Security

- **JWT Verification** - All requests require valid JWT token
- **User Isolation** - All queries filtered by userId from token
- **Input Validation** - Zod schemas validate all input parameters
- **SQL Injection Protection** - Prisma ORM prevents SQL injection
- **Rate Limiting** - Recommended to implement at proxy/gateway level

## Troubleshooting

### Server won't start

- Check `DATABASE_URL` is correct
- Ensure PostgreSQL is running
- Verify Prisma client is generated: `pnpm prisma:generate`

### Authentication errors

- Verify `JWT_SECRET` matches `apps/web`
- Check token expiration
- Ensure token format is correct

### Database errors

- Check Prisma schema is up to date
- Run migrations: `cd ../web && pnpm prisma:push`
- Verify database permissions

### Connection issues

- Check PostgreSQL connection string
- Ensure database allows connections
- Verify SSL settings if required

## Production Deployment

### Environment Variables

Set in production:
```bash
DATABASE_URL="postgresql://..."
JWT_SECRET="production-secret"
NODE_ENV="production"
```

### Running as Service

Use a process manager like PM2:

```bash
pm2 start dist/index.js --name smart-todos-mcp
pm2 save
pm2 startup
```

Or systemd:

```ini
[Unit]
Description=Smart Todos MCP Server
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/smart-todos/apps/mcp-server
ExecStart=/usr/bin/node /path/to/smart-todos/apps/mcp-server/dist/index.js
Restart=on-failure
Environment=DATABASE_URL=postgresql://...
Environment=JWT_SECRET=...

[Install]
WantedBy=multi-user.target
```

### Monitoring

- Monitor stderr for errors and warnings
- Set up logging aggregation
- Monitor database connection pool
- Track tool call latency

## Contributing

1. Follow existing code structure
2. Add tests for new tools
3. Update documentation
4. Use TypeScript strict mode
5. Validate inputs with Zod schemas

## Resources

- [Model Context Protocol Docs](https://modelcontextprotocol.io/)
- [MCP SDK on GitHub](https://github.com/modelcontextprotocol/sdk)
- [Anthropic Engineering Blog](https://www.anthropic.com/engineering/code-execution-with-mcp)
- [Smart Todos Documentation](../../README.md)

## License

Part of the Smart Todos monorepo.
