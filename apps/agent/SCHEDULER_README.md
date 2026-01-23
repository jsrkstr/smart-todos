# Task Lifecycle Scheduler

This is the background scheduler service for the SmartTodos Task Lifecycle Agent. It proactively monitors tasks and sends timely interventions to help users stay on track.

## Overview

The scheduler runs as a standalone HTTP service that can be triggered by external cron services (like cron-job.org). It:

1. Identifies tasks needing attention based on various criteria
2. Invokes the appropriate LangGraph agents to generate personalized messages
3. Sends notifications via push notifications and in-app chat
4. Tracks intervention effectiveness

See [full architecture documentation](../../docs/TASK_LIFECYCLE_AGENT.md) for details.

## Quick Start

### 1. Install Dependencies

```bash
cd apps/agent
pnpm install
```

### 2. Configure Environment

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Edit `.env` and set:

- `DATABASE_URL` - PostgreSQL connection string
- `OPENAI_API_KEY` - Your OpenAI API key
- `SCHEDULER_SECRET` - A random secret token (generate with `openssl rand -hex 32`)

### 3. Run the Scheduler Server

**Development mode (with auto-reload):**

```bash
pnpm scheduler:dev
```

**Production mode:**

```bash
pnpm scheduler
```

The server will start on `http://localhost:3001` (or your configured `SCHEDULER_PORT`).

### 4. Test the Endpoint

**Health check:**

```bash
curl http://localhost:3001/
```

**Run lifecycle check (requires auth):**

```bash
curl -X POST http://localhost:3001/api/scheduler/run-lifecycle-check \
  -H "Authorization: Bearer YOUR_SCHEDULER_SECRET"
```

Expected response:

```json
{
  "success": true,
  "result": {
    "tasksProcessed": 15,
    "interventionsCreated": 8,
    "notificationsSent": 8,
    "errors": [],
    "duration": "3.45s",
    "timestamp": "2024-01-20T10:30:00.000Z"
  }
}
```

## Setting Up Cron Trigger

### Option 1: Using cron-job.org (Recommended for external hosting)

1. Go to https://cron-job.org/en/
2. Create a free account
3. Click "Create Cronjob"
4. Configure:
   - **Title**: SmartTodos Task Lifecycle Check
   - **URL**: `https://your-domain.com/api/scheduler/run-lifecycle-check`
   - **Schedule**: Every 15 minutes (e.g., `*/15 * * * *`)
   - **Request method**: POST
   - **Headers**: Add `Authorization: Bearer YOUR_SCHEDULER_SECRET`
5. Save and enable

### Option 2: Using System Cron (Linux/Mac)

If hosting on your own server:

```bash
# Edit crontab
crontab -e

# Add this line (runs every 15 minutes)
*/15 * * * * curl -X POST http://localhost:3001/api/scheduler/run-lifecycle-check -H "Authorization: Bearer YOUR_SCHEDULER_SECRET" >> /var/log/scheduler.log 2>&1
```

### Option 3: Using Vercel Cron Jobs

If deploying to Vercel, add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/scheduler/run-lifecycle-check",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

## API Endpoints

### POST `/api/scheduler/run-lifecycle-check`

Main endpoint to trigger the lifecycle check.

**Authentication**: Required (Bearer token)

**Headers**:
```
Authorization: Bearer YOUR_SCHEDULER_SECRET
```

**Response**:
```json
{
  "success": true,
  "result": {
    "tasksProcessed": 15,
    "interventionsCreated": 8,
    "notificationsSent": 8,
    "errors": [],
    "duration": "3.45s",
    "timestamp": "2024-01-20T10:30:00.000Z"
  }
}
```

### GET `/api/scheduler/status`

Get scheduler configuration and status.

**Authentication**: Required (Bearer token)

**Response**:
```json
{
  "enabled": true,
  "config": {
    "batchSize": 50,
    "maxInterventionsPerUser": 5,
    "minHoursBetweenInterventions": 2
  },
  "timestamp": "2024-01-20T10:30:00.000Z"
}
```

### GET `/api/scheduler/health`

Health check endpoint (no authentication required).

**Response**:
```json
{
  "status": "ok",
  "service": "task-lifecycle-scheduler",
  "timestamp": "2024-01-20T10:30:00.000Z"
}
```

## Configuration

All configuration is done via environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `SCHEDULER_SECRET` | (required) | Secret token for authenticating cron requests |
| `SCHEDULER_ENABLED` | `true` | Enable/disable scheduler |
| `SCHEDULER_PORT` | `3001` | Port for HTTP server |
| `SCHEDULER_BATCH_SIZE` | `50` | Max tasks to process per run |
| `SCHEDULER_MAX_INTERVENTIONS_PER_USER` | `5` | Max interventions per user per day |
| `SCHEDULER_MIN_HOURS_BETWEEN_INTERVENTIONS` | `2` | Min hours between interventions for same task |
| `ENABLE_PUSH_NOTIFICATIONS` | `true` | Enable Expo push notifications |
| `ENABLE_EMAIL_NOTIFICATIONS` | `false` | Enable email notifications (future) |

## How It Works

### 1. Task Identification

The scheduler queries the database for tasks that meet intervention criteria:

- **Overdue tasks** (Priority 10): Deadline passed
- **Urgent deadline** (Priority 9): Due within 24 hours
- **Stuck in stage** (Priority 8): No updates for >72 hours
- **Approaching deadline** (Priority 7): Due within 2-7 days
- **Scheduled today** (Priority 6): Task scheduled for current day
- **Stuck in Refinement** (Priority 5): In Refinement stage for >2 days
- **High priority not started** (Priority 4): High priority, not started after 1 day

### 2. User Filtering

Only active users (logged in within last 7 days) are considered. The scheduler respects:

- User's communication preferences (`minimal`, `moderate`, `frequent`)
- Daily intervention limits (default: 5 per user)
- Minimum time between interventions (default: 2 hours per task)

### 3. Agent Invocation

For each intervention, the scheduler:

1. Invokes the LangGraph supervisor with a contextualized prompt
2. The supervisor routes to the appropriate specialized agent (Execution Coach, Adaptation, etc.)
3. The agent generates a personalized message based on:
   - Task details
   - User's psychological profile
   - Coach preferences
   - Historical patterns

### 4. Notification Delivery

Notifications are sent through multiple channels:

1. **In-app chat** - Always created for persistence
2. **Push notification** - If user has Expo push token and notifications enabled
3. **Email** - (Future) For less urgent notifications
4. **SMS/WhatsApp** - (Future) For critical reminders

### 5. Logging

All interventions are logged to the database for:

- Tracking effectiveness
- Machine learning optimization (future)
- User analytics

## Intervention Types

| Type | Agent | Trigger Example |
|------|-------|-----------------|
| **Reminder** | Execution Coach | Task due soon, scheduled today |
| **Progress Check** | Execution Coach | No updates for >72 hours |
| **Motivation** | Execution Coach | High priority task not started |
| **Adaptation Suggestion** | Adaptation | Task overdue, postponed multiple times |
| **Consequence Warning** | Adaptation | Rescheduling would affect other tasks |
| **Celebration** | Analytics | Task completed, milestone reached |

## Monitoring

### Logs

The scheduler outputs detailed logs:

```
[Scheduler] Starting task lifecycle check...
[Scheduler] Found 25 active users
[Scheduler] User user_123 has 12 incomplete tasks
[Scheduler] Found 15 tasks needing attention
[Scheduler] Processing intervention for task task_456 (type: reminder, priority: 7)
[Scheduler] Agent response: Hey John, ready to tackle "Buy groceries"?...
[Scheduler] Notification sent via chat, push
[Scheduler] Completed. Processed 15 tasks, created 8 interventions
```

### Database Logs

Check the `Log` table for intervention history:

```sql
SELECT * FROM "Log"
WHERE type = 'ai_prompted'
ORDER BY "createdAt" DESC
LIMIT 10;
```

### Chat Messages

All interventions create `ChatMessage` records:

```sql
SELECT * FROM "ChatMessage"
WHERE role = 'assistant'
AND metadata->>'interventionType' IS NOT NULL
ORDER BY "createdAt" DESC
LIMIT 10;
```

## Deployment

### Docker

Create a `Dockerfile` in `apps/agent/`:

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install

COPY . .
RUN pnpm build

EXPOSE 3001

CMD ["pnpm", "scheduler"]
```

Build and run:

```bash
docker build -t smarttodos-scheduler .
docker run -p 3001:3001 --env-file .env smarttodos-scheduler
```

### Vercel/Railway/Heroku

1. Set environment variables in your platform's dashboard
2. Add a start script to `package.json`:
   ```json
   "start:scheduler": "node dist/scheduler/server.js"
   ```
3. Configure the platform to run `pnpm start:scheduler`

### Process Manager (PM2)

For VPS deployment:

```bash
# Install PM2
npm install -g pm2

# Start scheduler
pm2 start "pnpm scheduler" --name smarttodos-scheduler

# Save configuration
pm2 save
pm2 startup
```

## Troubleshooting

### Scheduler not running

Check environment variables:
```bash
curl -H "Authorization: Bearer YOUR_SECRET" http://localhost:3001/api/scheduler/status
```

### No interventions created

- Check if users are active (logged in within 7 days)
- Check if tasks meet intervention criteria
- Review logs for errors

### Push notifications not sending

- Verify user has `expoPushToken` in database
- Check `settings.notificationsEnabled` is `true`
- Verify Expo token format: `ExponentPushToken[...]`

### Authentication errors

- Verify `SCHEDULER_SECRET` matches between cron service and server
- Check `Authorization` header format: `Bearer YOUR_SECRET`

## Development

### Running Tests

```bash
pnpm test
```

### Debugging

Set `DEBUG` environment variable:

```bash
DEBUG=scheduler:* pnpm scheduler:dev
```

### Local Testing Without Cron

Use curl or Postman:

```bash
curl -X POST http://localhost:3001/api/scheduler/run-lifecycle-check \
  -H "Authorization: Bearer YOUR_SCHEDULER_SECRET" \
  -H "Content-Type: application/json"
```

## Future Enhancements

- [ ] ML-powered intervention timing optimization
- [ ] A/B testing for intervention effectiveness
- [ ] Email notification support
- [ ] SMS/WhatsApp integration
- [ ] Voice call reminders for critical tasks
- [ ] Multi-language support
- [ ] Intervention effectiveness dashboard

## Related Documentation

- [Full Architecture](../../docs/TASK_LIFECYCLE_AGENT.md)
- [Product Plan](../../product-plan.txt)
- [LangGraph Agent System](./src/graph.ts)

## Support

For issues or questions:
- Check logs: `pm2 logs smarttodos-scheduler`
- Review documentation: `docs/TASK_LIFECYCLE_AGENT.md`
- GitHub Issues: [Create an issue](https://github.com/your-repo/issues)
