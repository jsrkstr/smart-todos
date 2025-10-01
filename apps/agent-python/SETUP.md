# Python Agent Setup Guide

## Prerequisites

- Python 3.9 or higher
- PostgreSQL database (same as Next.js app)
- OpenAI API key

## Installation Steps

### 1. Install Python Dependencies

```bash
cd apps/agent-python
pip install -r requirements.txt
```

### 2. Configure Environment Variables

Create a `.env` file in the `apps/agent-python` directory:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
OPENAI_API_KEY=your_openai_api_key_here
POSTGRES_USER=your_postgres_user
POSTGRES_PASSWORD=your_postgres_password
POSTGRES_HOST=your_postgres_host
POSTGRES_DATABASE=your_postgres_database
PORT=8001
```

**Important:** Use the same PostgreSQL credentials as your Next.js app to share the database.

### 3. Initialize Database Schema

The agent uses the `langgraph` schema for storing conversation state. Run the following SQL to create the schema:

```sql
CREATE SCHEMA IF NOT EXISTS langgraph;
```

The tables will be created automatically when the agent starts for the first time.

### 4. Start the Python Agent Server

```bash
# Option 1: Using the start script
./start.sh

# Option 2: Using Python directly
python -m uvicorn src.server:app --host 0.0.0.0 --port 8001 --reload
```

The agent API will be available at `http://localhost:8001`

### 5. Verify the Agent is Running

```bash
curl http://localhost:8001/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "smarttodos-agent"
}
```

### 6. Configure Next.js to Use the Agent

Add to your Next.js `.env` file:

```env
AGENT_API_URL=http://localhost:8001
```

For production, set it to your deployed agent URL.

## Testing the Integration

### Test from Flutter App

1. Start the Next.js dev server: `cd apps/web && npm run dev`
2. Start the Python agent: `cd apps/agent-python && ./start.sh`
3. Run the Flutter app
4. Open a task and click "Chat with Coach"
5. Send a message - it should be processed by the Python agent

### Test the Agent API Directly

```bash
curl -X POST http://localhost:8001/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "your-user-id",
    "message": "Create a task to finish the project report",
    "threadId": "test-thread-1"
  }'
```

## Architecture

```
Flutter App
    ↓ (HTTP POST)
Next.js API (/api/agent/chat)
    ↓ (HTTP POST)
Python Agent Server (FastAPI)
    ↓ (LangGraph execution)
PostgreSQL (shared database)
```

## Troubleshooting

### Port Already in Use

If port 8001 is already in use, change it in `.env`:

```env
PORT=8002
```

And update Next.js `.env`:

```env
AGENT_API_URL=http://localhost:8002
```

### Database Connection Errors

1. Verify PostgreSQL is running
2. Check credentials in `.env`
3. Ensure the database exists
4. Verify SSL mode (`sslmode=require` for cloud databases)

### OpenAI API Errors

1. Verify `OPENAI_API_KEY` is set correctly
2. Check your OpenAI account has available credits
3. Verify API key has proper permissions

### Agent Not Responding

1. Check Python agent logs for errors
2. Verify the agent is running: `curl http://localhost:8001/health`
3. Check Next.js logs for API call errors
4. Verify `AGENT_API_URL` is set correctly in Next.js `.env`

## Development Tips

### Hot Reload

The agent server supports hot reload when started with `--reload`:

```bash
python -m uvicorn src.server:app --reload
```

File changes will automatically restart the server.

### Debugging

Enable verbose logging by setting in `.env`:

```env
LOG_LEVEL=DEBUG
```

### Testing Individual Agents

You can test the agent directly with Python:

```python
import asyncio
from src.index import process_request

async def test():
    response = await process_request(
        user_id="test-user",
        message="Help me plan my tasks",
        thread_id="test-thread"
    )
    print(response)

asyncio.run(test())
```

## Production Deployment

### Option 1: Docker

Create a `Dockerfile`:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY src/ ./src/

CMD ["python", "-m", "uvicorn", "src.server:app", "--host", "0.0.0.0", "--port", "8001"]
```

Build and run:

```bash
docker build -t smarttodos-agent .
docker run -p 8001:8001 --env-file .env smarttodos-agent
```

### Option 2: Cloud Platforms

Deploy to:
- **Railway**: Connect GitHub repo, set environment variables
- **Render**: Python web service, auto-deploy from GitHub
- **AWS ECS/Fargate**: Use Docker image
- **Google Cloud Run**: Serverless container deployment

Set the `AGENT_API_URL` in your Next.js production environment to point to your deployed agent.

## Next Steps

1. Monitor agent performance and response times
2. Add rate limiting and authentication
3. Implement caching for frequently asked questions
4. Add analytics and logging
5. Scale horizontally by running multiple agent instances
