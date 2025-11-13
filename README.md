# Smart Todos

A comprehensive productivity platform with AI-powered task management, coaching, and focus tools.

## Monorepo Structure

This is a Turborepo monorepo containing:

- **apps/web** - Next.js full-stack web application
- **apps/mobile-flutter** - Flutter mobile app (iOS/Android)
- **apps/agent** - TypeScript LangGraph multi-agent system (being deprecated)
- **apps/agent-python** - Python LangGraph multi-agent system
- **apps/mcp-server** - Model Context Protocol server for AI agent integration
- **apps/mobile** - React Native Expo app (legacy)
- **packages/ui** - Shared UI components

## Getting Started

Always use **pnpm** - contributors should not use npm or yarn.

### Prerequisites

- Node.js 18+
- pnpm 8+
- PostgreSQL database
- Python 3.9+ (for agent-python)
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

The Model Context Protocol (MCP) server provides a standardized interface for AI agents to interact with Smart Todos data.

### Quick Start

```bash
cd apps/mcp-server
pnpm install
pnpm build
pnpm start
```

See [apps/mcp-server/README.md](apps/mcp-server/README.md) for detailed documentation.

### Integration with Python Agent

```python
from services.mcp_client import get_mcp_client

mcp = get_mcp_client(jwt_token="user-token")
tasks = mcp.get_tasks(completed=False)
```

See [apps/agent-python/MCP_INTEGRATION.md](apps/agent-python/MCP_INTEGRATION.md) for integration guide.

## Documentation

- [CLAUDE.md](CLAUDE.md) - Instructions for Claude Code AI assistant
- [apps/web/README.md](apps/web/README.md) - Web app documentation
- [apps/mobile-flutter/README.md](apps/mobile-flutter/README.md) - Flutter app documentation
- [apps/agent-python/README.md](apps/agent-python/README.md) - Python agent documentation
- [apps/mcp-server/README.md](apps/mcp-server/README.md) - MCP server documentation

## Contributing

1. Use pnpm for package management
2. Follow existing code structure and patterns
3. Update documentation for new features
4. Run tests before submitting PRs
5. Use TypeScript strict mode

## License

Private project.
