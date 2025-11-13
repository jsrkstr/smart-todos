# Tools as Code

This directory contains tools exposed as TypeScript functions that can be imported and called from agent-generated code.

## Architecture Pattern

Instead of calling MCP tools directly via JSON-RPC, agents write TypeScript code that imports and calls these functions:

```typescript
// Agent-generated code
import { getTasks, createTask } from '/servers/tasks'

// Get high-priority incomplete tasks
const { tasks } = await getTasks({
  completed: false,
  priority: 'high'
})

// Process and filter in execution environment
const urgent = tasks.filter(t =>
  t.dueDate && new Date(t.dueDate) < new Date(Date.now() + 86400000)
)

// Return summary (not full data)
return {
  urgentCount: urgent.length,
  taskIds: urgent.map(t => t.id)
}
```

## Benefits

1. **Token Efficiency**: Filter large datasets in execution environment, return only summaries
2. **Complex Logic**: Use loops, conditionals, error handling naturally
3. **State Persistence**: Write intermediate results to files
4. **Privacy**: Sensitive data stays in sandbox

## Tool Categories

- **tasks/**: Task management operations
- **users/**: User profile and settings
- **chat/**: Chat history and messages
- **pomodoro/**: Pomodoro tracking

## Security

All tools require JWT authentication passed via the `__TOKEN__` global variable injected by the execution environment.
