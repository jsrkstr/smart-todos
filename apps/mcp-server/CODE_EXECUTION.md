# Code Execution with MCP - Implementation Guide

This document describes the code execution pattern implemented in the Smart Todos MCP server, following Anthropic's approach from their article: [Code Execution with MCP](https://www.anthropic.com/engineering/code-execution-with-mcp)

## Architecture Overview

The Smart Todos MCP server now supports **two patterns**:

1. **Traditional Tool Calls** (Legacy): Direct JSON-RPC tool invocations
2. **Code Execution** (New): Agents write TypeScript/JavaScript code that gets executed in a secure sandbox

## Pattern Comparison

### Traditional Tool Calls
```python
# Agent calls predefined tool
result = mcp.call_tool('getTasks', {
    'token': jwt_token,
    'completed': False,
    'priority': 'high'
})
```

### Code Execution Pattern
```typescript
// Agent writes code that's executed in sandbox
const code = `
import { getTasks } from '/servers/tasks'

const tasks = await getTasks({
  completed: false,
  priority: 'high'
})

// Filter large dataset in execution environment
const urgent = tasks.filter(t =>
  t.dueDate && new Date(t.dueDate) < new Date(Date.now() + 86400000)
)

// Return summary (not full data)
return {
  urgentCount: urgent.length,
  taskIds: urgent.map(t => t.id)
}
`

mcp.execute_code(code, 'typescript')
```

## Key Benefits

1. **Token Efficiency (98%+ reduction)**
   - Process large datasets in sandbox
   - Return only summaries to model
   - Example: 10,000 tasks → 50 token summary

2. **Complex Logic**
   - Use loops, conditionals, error handling naturally
   - No need to chain multiple tool calls
   - State persistence via filesystem

3. **Privacy**
   - Sensitive data stays in sandbox
   - Only filtered results enter model context

4. **Flexibility**
   - Unlimited combinations of operations
   - Custom data transformations
   - Reusable code patterns

## Implementation Components

### 1. Docker Sandbox (`src/execution/sandbox.ts`)

Secure, isolated execution environment:

```typescript
const sandbox = await dockerSandbox.createContainer(userId, {
  timeout: 30000,
  maxMemory: 512,  // MB
  maxCpus: 0.5
})
```

**Security Features:**
- Read-only root filesystem
- No network access
- Memory and CPU limits
- Non-root user execution
- Process isolation
- Auto-cleanup on timeout

### 2. Code Validator (`src/execution/validator.ts`)

Pre-execution security scanning:

**Blocked Patterns:**
- Process manipulation (`process.exit`, `process.kill`)
- Network access (`http`, `https`, `net`)
- Filesystem access (except virtual `/tmp`)
- Dynamic code execution (`eval`, `Function()`)
- Unauthorized module imports

**Example:**
```typescript
const validation = validateCode(code, 'typescript')
if (!validation.valid) {
  throw new Error(validation.reason)
}
```

### 3. Code Executor (`src/execution/code-executor.ts`)

Orchestrates execution workflow:

1. Sanitize and validate code
2. Create sandbox container
3. Inject tool access setup
4. Execute code
5. Collect output and stats
6. Cleanup container
7. Log execution for audit

### 4. Tools as Code (`src/tools-as-code/`)

Tools exposed as importable TypeScript functions:

```typescript
// Instead of JSON-RPC, agents import and call
import { getTasks, createTask, updateTask } from '/servers/tasks'
import { getUserProfile } from '/servers/users'

const profile = await getUserProfile()
const tasks = await getTasks({ priority: 'high' })

for (const task of tasks) {
  await updateTask(task.id, {
    title: `${profile.name}: ${task.title}`
  })
}
```

### 5. MCP Resources (`src/resources/filesystem.ts`)

Filesystem-based tool discovery:

**Progressive Disclosure:**
1. Agent lists resources: `file:///servers/`
2. Discovers available tools
3. Reads specific tool files on-demand
4. Writes code using discovered APIs

**Example Resources:**
- `file:///servers/README.md` - Documentation
- `file:///servers/tasks/index.ts` - Task tools
- `file:///servers/users/index.ts` - User tools
- `file:///servers/chat/index.ts` - Chat tools
- `file:///servers/pomodoro/index.ts` - Pomodoro tools

## Setup Instructions

### 1. Build Docker Sandbox Image

```bash
cd apps/mcp-server
chmod +x build-sandbox.sh
./build-sandbox.sh
```

This creates the `smart-todos-sandbox:latest` image with:
- Node.js 20 Alpine
- TypeScript execution tools (tsx)
- Non-root sandbox user
- Workspace directory

### 2. Verify Installation

```bash
# Check image exists
docker images | grep smart-todos-sandbox

# Test image
docker run --rm smart-todos-sandbox:latest node --version
```

### 3. Start MCP Server

```bash
pnpm build
pnpm start
```

## Usage Examples

### Example 1: Filter Large Dataset

```typescript
import { getTasks } from '/servers/tasks'

// Get all tasks (could be thousands)
const allTasks = await getTasks()

// Process in execution environment
const summary = {
  total: allTasks.length,
  byPriority: {
    high: allTasks.filter(t => t.priority === 'high').length,
    medium: allTasks.filter(t => t.priority === 'medium').length,
    low: allTasks.filter(t => t.priority === 'low').length
  },
  overdue: allTasks.filter(t =>
    t.dueDate && new Date(t.dueDate) < new Date()
  ).length
}

// Model only sees summary (not 10,000 tasks)
return summary
```

### Example 2: Batch Operations

```typescript
import { getTasks, updateTask } from '/servers/tasks'

// Get high-priority incomplete tasks
const tasks = await getTasks({
  completed: false,
  priority: 'high'
})

// Update all in bulk
const results = []
for (const task of tasks) {
  const updated = await updateTask(task.id, {
    description: `[URGENT] ${task.description || ''}`
  })
  results.push(updated.id)
}

return {
  updated: results.length,
  taskIds: results
}
```

### Example 3: State Persistence

```typescript
import { writeFile, readFile } from 'fs/promises'
import { getTasks } from '/servers/tasks'

// Load previous analysis
let previous = {}
try {
  const data = await readFile('/tmp/analysis.json', 'utf-8')
  previous = JSON.parse(data)
} catch (e) {
  // First run
}

// Current tasks
const tasks = await getTasks()

// Compare with previous
const analysis = {
  timestamp: new Date().toISOString(),
  newTasks: tasks.filter(t =>
    !previous.taskIds?.includes(t.id)
  ).length,
  taskIds: tasks.map(t => t.id)
}

// Save for next run
await writeFile('/tmp/analysis.json', JSON.stringify(analysis))

return analysis
```

## Security Considerations

### Container Security
- **No network access** - `NetworkMode: 'none'`
- **Read-only filesystem** - Except `/tmp` and `/workspace` (tmpfs)
- **Non-root user** - All code runs as `sandbox:sandbox`
- **Resource limits** - CPU, memory, processes
- **Auto-cleanup** - Containers removed after timeout
- **No capabilities** - All Linux capabilities dropped

### Code Validation
Pre-execution scanning blocks:
- ✗ Process manipulation
- ✗ Network access
- ✗ Unauthorized file access
- ✗ Dynamic code evaluation
- ✗ Unauthorized imports

### Audit Logging
All executions are logged:
```typescript
{
  userId: 'user-123',
  code: '...',
  success: true,
  executionTime: 1234,
  resourcesUsed: { cpu: 10, memory: 128, diskIO: 5 },
  timestamp: '2025-11-13T...'
}
```

## API Reference

### Execute Code Tool

**Name:** `executeCode`

**Description:** Execute TypeScript/JavaScript code in a secure sandbox with access to Smart Todos tools.

**Parameters:**
```json
{
  "token": "JWT authentication token",
  "code": "TypeScript/JavaScript code to execute",
  "language": "typescript | javascript (default: typescript)",
  "timeout": "Execution timeout in ms (default: 30000, max: 60000)"
}
```

**Returns:**
```json
{
  "success": true,
  "output": "Code output (stdout)",
  "error": "Error message if failed",
  "executionTime": 1234,
  "resourcesUsed": {
    "cpu": 10,
    "memory": 128,
    "diskIO": 5
  }
}
```

## Troubleshooting

### Docker Not Available
```bash
# Install Docker Desktop (macOS/Windows)
# Or install Docker Engine (Linux)

# Verify Docker
docker --version
```

### Image Build Fails
```bash
# Check Docker daemon is running
docker ps

# Rebuild with verbose output
cd apps/mcp-server
docker build -f Dockerfile.sandbox -t smart-todos-sandbox:latest . --progress=plain
```

### Container Execution Timeout
```typescript
// Increase timeout in execution options
executeCode({
  code: '...',
  timeout: 60000  // 60 seconds
})
```

### Permission Denied Errors
```bash
# Ensure Docker daemon has permissions
# macOS: Check Docker Desktop settings
# Linux: Add user to docker group
sudo usermod -aG docker $USER
```

## Performance Optimization

### Container Reuse (Future)
Currently, containers are created per execution. Future optimization:
- Keep container pool per user
- Reuse containers for multiple executions
- Cleanup after inactivity timeout

### Memory Management
- Default: 512MB per container
- Adjust based on workload
- Monitor resource usage in logs

### Execution Caching
- Cache immutable tool definitions
- Reuse compiled TypeScript
- Store intermediate results

## Migration from Traditional Tools

### Before (Traditional)
```python
# Multiple tool calls
tasks = mcp.call_tool('getTasks', {'token': token, 'completed': False})
for task in tasks['data']:
    mcp.call_tool('updateTask', {
        'token': token,
        'taskId': task['id'],
        'priority': 'high'
    })
```

### After (Code Execution)
```python
code = """
import { getTasks, updateTask } from '/servers/tasks'

const tasks = await getTasks({ completed: false })

for (const task of tasks) {
  await updateTask(task.id, { priority: 'high' })
}

return { updated: tasks.length }
"""

result = mcp.execute_code(code, 'typescript')
```

**Benefits:**
- ✅ 1 tool call instead of N+1
- ✅ Runs in ~30ms instead of N * latency
- ✅ Better error handling (try/catch in code)
- ✅ Easier to read and maintain

## Future Enhancements

### Planned Features
1. **Python Support** - Execute Python code alongside TypeScript
2. **Artifact Capture** - Save plots, images, generated files
3. **REPL Mode** - Interactive code execution
4. **Skills Framework** - Let agents save reusable functions
5. **E2B Integration** - Cloud sandboxes for production

### Contributing
See [CONTRIBUTING.md](../../CONTRIBUTING.md) for development guidelines.

## References

- [Anthropic: Code Execution with MCP](https://www.anthropic.com/engineering/code-execution-with-mcp)
- [MCP Specification: Resources](https://modelcontextprotocol.io/specification/2025-06-18/server/resources)
- [Docker Security](https://docs.docker.com/engine/security/)
- [scooter-lacroix/sandbox-mcp](https://github.com/scooter-lacroix/sandbox-mcp) - Reference implementation

## Support

For issues or questions:
- GitHub Issues: [smart-todos/issues](https://github.com/your-org/smart-todos/issues)
- Documentation: [Smart Todos Docs](https://smart-todos.com/docs)
