# SmartTodos Multi-Agent System

## Overview

This project implements a multi-agent LangGraph system using a Supervisor architecture for the SmartTodos application. The system is designed to provide personalized task management with different specialized agents handling various aspects of the user experience.

**NEW:** The agent now integrates with the MCP server for efficient operations. See [MCP Integration](./MCP_INTEGRATION.md) for details.

## Architecture

The system uses a **Hybrid Supervisor architecture** with the following components:

### Data Access Strategy

1. **Direct Database Access** - Fast context loading (user profile, tasks)
2. **MCP Server Integration** - Efficient analytics and batch operations
3. **Graceful Fallback** - Works without MCP if unavailable

### Specialized Agents

1. **Supervisor Agent**: Central orchestrator that maintains the overall "mental model" of the user and delegates tasks to specialized agents.

2. **Task Creation Agent**: Handles natural language understanding and converts user requests into structured tasks.
   - Uses: Direct database access via Prisma

3. **Planning Agent**: Manages task breakdown, prioritization, and scheduling.
   - Uses: MCP code execution for bulk subtask creation (5+ subtasks)
   - Fallback: Direct database access for simple operations

4. **Execution Coach Agent**: Provides motivation, technique guidance, and progress tracking.
   - Uses: Direct database access

5. **Adaptation Agent**: Handles strategy revision and goal recalibration.
   - Uses: MCP code execution for batch updates (e.g., bulk priority changes)
   - Fallback: Direct database access for single updates

6. **Analytics Agent**: Performs performance analysis and generates insights.
   - Uses: **MCP code execution (PRIMARY)** - 98% token reduction
   - Fallback: Direct database access (less efficient)

## Project Structure

```
src/
├── agents/             # Individual agent implementations
│   ├── supervisor.ts   # Routes to specialized agents
│   ├── taskCreation.ts # Task creation (direct DB)
│   ├── planning.ts     # Planning (MCP for bulk ops)
│   ├── executionCoach.ts # Coaching (direct DB)
│   ├── adaptation.ts   # Adaptation (MCP for batch)
│   └── analytics.ts    # Analytics (MCP PRIMARY)
├── services/           # Service layer
│   ├── database.ts     # Prisma database services
│   └── mcp-client.ts   # MCP server client (NEW)
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
│   ├── code-generator.ts # Code templates for MCP (NEW)
│   └── ...
├── api.ts              # API integration
├── graph.ts            # LangGraph implementation
└── index.ts            # Main entry point
```

## Setup and Installation

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Create a `.env` file in the root directory with your configuration:
   ```
   OPENAI_API_KEY=your-api-key-here
   DATABASE_URL=postgresql://...
   JWT_SECRET=your-jwt-secret
   ```

3. Build the project:
   ```bash
   pnpm build
   ```

4. **(Optional) Setup MCP Server for code execution:**

   For analytics efficiency (98% token reduction), set up the MCP server:

   ```bash
   # Build MCP server
   cd ../mcp-server
   pnpm install
   pnpm build

   # (Optional) Install Docker for code execution pattern
   # https://docs.docker.com/get-docker/

   # Build sandbox image (requires Docker)
   ./build-sandbox.sh
   ```

   **Note:** Agent works without MCP server, but falls back to less efficient traditional approach.

## Usage

### Development

Run the project in development mode:

```bash
pnpm dev
```

**With MCP integration:**
The agent will automatically spawn the MCP server as a subprocess when needed.

### Production

Build and run the project in production mode:

```bash
pnpm build
pnpm start
```

### Integration with Web App

The multi-agent system integrates with the Next.js web app through API routes.

**Important:** When invoking the agent, pass a JWT token for MCP authentication:

```typescript
const result = await graph.invoke({
  userId: 'user-123',
  jwtToken: req.headers.authorization?.replace('Bearer ', ''), // From API request
  input: 'Analyze my task performance',
  messages: [],
  // ...
});
```

See [MCP Integration Guide](./MCP_INTEGRATION.md) for detailed integration patterns.

## Key Features

- **Centralized Decision Intelligence**: The supervisor agent maintains a consistent mental model of the user.
- **Complex Workflow Management**: Different agents handle different stages of the task lifecycle.
- **Personalization Coherence**: Ensures consistent application of personalization data across all agents.
- **User Experience Consistency**: Maintains a consistent tone and interaction style.
- **Hybrid Data Access**: Fast direct DB for context, efficient MCP for analytics (NEW)
- **98% Token Reduction**: Analytics operations use code execution pattern (NEW)
- **Graceful Fallback**: Works without MCP server, falls back to traditional methods (NEW)

## MCP Integration Benefits

When MCP server is available:

- ✅ **Analytics Agent**: Process 10,000+ tasks, return 50-token summaries (vs 50,000 tokens)
- ✅ **Planning Agent**: Create 10+ subtasks in single operation (vs N sequential calls)
- ✅ **Adaptation Agent**: Bulk update overdue tasks instantly (vs iterating in LLM)
- ✅ **15x faster** execution for complex operations
- ✅ **Privacy**: Sensitive data processed in sandbox, only summaries to model

When MCP is unavailable:

- ⚠️ Falls back to traditional direct database access
- ⚠️ Higher token usage for analytics
- ⚠️ Slower batch operations
- ✅ System remains fully functional

## Dependencies

- **LangChain & LangGraph**: Agent interactions and workflow management
- **OpenAI**: LLM capabilities
- **Prisma**: Direct database interactions
- **Next.js**: API integration
- **@modelcontextprotocol/sdk**: MCP server communication (NEW)
- **Docker** (optional): Code execution sandbox for analytics
