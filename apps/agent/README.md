# SmartTodos Multi-Agent System

## Overview

This project implements a multi-agent langGraph system using a Supervisor architecture for the SmartTodos application. The system is designed to provide personalized task management with different specialized agents handling various aspects of the user experience.

## Architecture

The system uses a Supervisor architecture with the following agents:

1. **Supervisor Agent**: Central orchestrator that maintains the overall "mental model" of the user and delegates tasks to specialized agents.

2. **Task Creation Agent**: Handles natural language understanding and converts user requests into structured tasks.

3. **Planning Agent**: Manages task breakdown, prioritization, and scheduling.

4. **Execution Coach Agent**: Provides motivation, technique guidance, and progress tracking.

5. **Adaptation Agent**: Handles strategy revision and goal recalibration.

6. **Analytics Agent**: Performs performance analysis and generates insights.

## Project Structure

```
src/
├── agents/             # Individual agent implementations
├── services/           # Database/API services
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
├── api.ts              # API integration
├── graph.ts            # LangGraph implementation
└── index.ts            # Main entry point
```

## Setup and Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file in the root directory with your OpenAI API key:
   ```
   OPENAI_API_KEY=your-api-key-here
   ```

3. Build the project:
   ```bash
   npm run build
   ```

## Usage

### Development

Run the project in development mode:

```bash
npm run dev
```

### Production

Build and run the project in production mode:

```bash
npm run build
npm start
```

### Integration with Web App

The multi-agent system can be integrated with the existing web app through the API endpoint. The `api.ts` file provides a handler that can be integrated with a Next.js API route.

## Key Features

- **Centralized Decision Intelligence**: The supervisor agent maintains a consistent mental model of the user.
- **Complex Workflow Management**: Different agents handle different stages of the task lifecycle.
- **Personalization Coherence**: Ensures consistent application of personalization data across all agents.
- **User Experience Consistency**: Maintains a consistent tone and interaction style.

## Dependencies

- LangChain & LangGraph: For agent interactions and workflow management
- OpenAI: For LLM capabilities
- Prisma: For database interactions
- Next.js: For API integration
