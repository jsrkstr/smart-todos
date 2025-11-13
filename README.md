# Smart Todos

A comprehensive productivity platform with AI-powered task management, coaching, and focus tools.

## Monorepo Structure

This is a Turborepo monorepo containing:

- **apps/web** - Next.js full-stack web application
- **apps/mobile-flutter** - Flutter mobile app (iOS/Android)
- **apps/agent** - TypeScript LangGraph multi-agent system (with MCP integration)
- **apps/mcp-server** - Model Context Protocol server for AI agent integration
- **apps/mobile** - React Native Expo app (legacy)
- **packages/ui** - Shared UI components

## Getting Started

Always use **pnpm** - contributors should not use npm or yarn.

### Prerequisites

- Node.js 18+
- pnpm 8+
- PostgreSQL database
- Docker (optional, for MCP code execution pattern)
- Flutter SDK (for mobile-flutter)

### Installation

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp apps/web/.env.example apps/web/.env
# Edit apps/web/.env with your credentials

# Generate Prisma client
cd apps/web && pnpm prisma:generate

# Push database schema
pnpm prisma:push
```

### Development

```bash
# Run all apps in development mode
pnpm dev

# Or run specific apps
cd apps/web && pnpm dev          # Web app on http://localhost:3000
cd apps/mcp-server && pnpm dev   # MCP server
cd apps/mobile-flutter && flutter run  # Flutter app
```

## Key Features

- **Smart Task Management** - AI-powered task creation, breakdown, and prioritization
- **Multi-Agent System** - Specialized AI agents for different aspects of productivity
- **Psychological Profiling** - Personalized coaching based on user psychology
- **Pomodoro Timer** - Focus sessions with tracking
- **Chat Interface** - Natural language interaction with AI coaches
- **MCP Integration** - Standard protocol for AI agent access to data

## MCP Server

The Model Context Protocol (MCP) server provides a standardized interface for AI agents to interact with Smart Todos data. The TypeScript agent (`apps/agent`) uses MCP for efficient operations.

### Architecture

**Hybrid Approach:**
- ✅ Direct Prisma DB access for fast context loading
- ✅ MCP code execution for analytics (98% token reduction)
- ✅ MCP traditional tools for batch operations
- ✅ Graceful fallback when MCP unavailable

### Quick Start

```bash
cd apps/mcp-server
pnpm install
pnpm build

# Optional: Build Docker sandbox for code execution
./build-sandbox.sh  # Requires Docker installed
```

### Integration with TypeScript Agent

The agent automatically spawns MCP server as subprocess when needed:

```typescript
// Agent automatically uses MCP for analytics
const result = await graph.invoke({
  userId: 'user-123',
  jwtToken: 'eyJhbG...', // Required for MCP auth
  input: 'Analyze my task performance',
  // ...
});

// Analytics Agent uses code execution: 10,000 tasks → 50 token summary
// Planning Agent uses code execution: Create 10 subtasks in 1 call
// Adaptation Agent uses code execution: Bulk update all overdue tasks
```

See [apps/agent/MCP_INTEGRATION.md](apps/agent/MCP_INTEGRATION.md) for detailed integration guide.

## Documentation

- [CLAUDE.md](CLAUDE.md) - Instructions for Claude Code AI assistant
- [apps/web/README.md](apps/web/README.md) - Web app documentation
- [apps/mobile-flutter/README.md](apps/mobile-flutter/README.md) - Flutter app documentation
- [apps/agent/README.md](apps/agent/README.md) - TypeScript agent documentation
- [apps/agent/MCP_INTEGRATION.md](apps/agent/MCP_INTEGRATION.md) - MCP integration guide
- [apps/mcp-server/README.md](apps/mcp-server/README.md) - MCP server documentation
- [apps/mcp-server/CODE_EXECUTION.md](apps/mcp-server/CODE_EXECUTION.md) - Code execution pattern

## Contributing

1. Use pnpm for package management
2. Follow existing code structure and patterns
3. Update documentation for new features
4. Run tests before submitting PRs
5. Use TypeScript strict mode

## License

Private project.
