# LangSmith Setup Guide

LangSmith is configured for debugging and tracing all LLM calls in the agent system.

## Setup Instructions

### 1. Get Your LangSmith API Key

1. Go to [LangSmith](https://smith.langchain.com/)
2. Sign up or log in
3. Navigate to Settings → API Keys
4. Create a new API key (starts with `ls__`)

### 2. Configure Environment Variables

Add these variables to your `.env` file (or `apps/web/.env` since agent symlinks to it):

```bash
# LangSmith (for LLM debugging and tracing)
LANGCHAIN_TRACING_V2="true"
LANGCHAIN_API_KEY="ls__your_api_key_here"
LANGCHAIN_PROJECT="smart-todos-agent"
```

**Important:** The `.env` file is located at `apps/web/.env` and is symlinked from `apps/agent/.env`.

### 3. Verify Setup

Once configured, all LLM calls will automatically be traced to LangSmith:

- **Supervisor agent** decisions
- **Task Creation Agent** reasoning
- **Planning Agent** strategies
- **Execution Coach** motivational messages
- **Adaptation Agent** adjustments
- **Analytics Agent** insights

### 4. View Traces

1. Go to [LangSmith](https://smith.langchain.com/)
2. Select your project: `smart-todos-agent`
3. View traces for all LLM calls with:
   - Input prompts
   - Output responses
   - Token usage
   - Latency metrics
   - Error messages

## What Gets Traced

Every LLM invocation through `createLLM()` is automatically traced:

- Agent routing decisions
- Task analysis
- Planning strategies
- Coach responses
- Adaptation recommendations
- Analytics insights
- Conversation summaries

## Debugging Tips

1. **Find specific conversations:** Use filters to search by user ID or task ID
2. **Monitor performance:** Check latency and token usage across agents
3. **Debug errors:** See full error traces with context
4. **Compare models:** Test different models and compare outputs
5. **Optimize prompts:** Iterate on prompts and see immediate results

## Disabling Tracing

To disable tracing (e.g., in production), set:

```bash
LANGCHAIN_TRACING_V2="false"
```

Or remove the environment variables entirely.

## Project Organization

The default project is `smart-todos-agent`. You can create separate projects for different environments:

- `smart-todos-agent-dev` (development)
- `smart-todos-agent-staging` (staging)
- `smart-todos-agent-prod` (production)

Just change the `LANGCHAIN_PROJECT` variable accordingly.
