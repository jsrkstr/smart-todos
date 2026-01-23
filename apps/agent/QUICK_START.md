# Quick Start: Task Lifecycle Scheduler

Get the scheduler running in 5 minutes.

## 1. Install & Configure (2 min)

```bash
cd apps/agent
pnpm install
cp .env.example .env
```

Edit `.env`:
```bash
DATABASE_URL="postgresql://..."
OPENAI_API_KEY="sk-..."
SCHEDULER_SECRET="$(openssl rand -hex 32)"
```

## 2. Start Server (1 min)

```bash
pnpm scheduler
```

Server runs on http://localhost:3001

## 3. Test Endpoint (1 min)

```bash
# Health check
curl http://localhost:3001/

# Run lifecycle check
curl -X POST http://localhost:3001/api/scheduler/run-lifecycle-check \
  -H "Authorization: Bearer YOUR_SCHEDULER_SECRET"
```

## 4. Setup Cron (1 min)

Go to https://cron-job.org/en/

1. **Create account** → Verify email
2. **Create cronjob**:
   - Title: `SmartTodos Lifecycle Check`
   - URL: `https://your-domain.com/api/scheduler/run-lifecycle-check`
   - Schedule: `*/15 * * * *` (every 15 min)
   - Method: **POST**
   - Header: `Authorization: Bearer YOUR_SECRET`
3. **Save** → Click play icon to test

## That's It! 🎉

The scheduler will now:
- Check tasks every 15 minutes
- Send reminders for upcoming deadlines
- Motivate users on stuck tasks
- Suggest adaptations for overdue tasks

## Next Steps

- 📖 Read [Full Setup Guide](../../docs/SCHEDULER_SETUP_GUIDE.md)
- 🏗️ Review [Architecture Docs](../../docs/TASK_LIFECYCLE_AGENT.md)
- 🐛 [Troubleshooting](./SCHEDULER_README.md#troubleshooting)

## Common Issues

**Authentication failed**
→ Check `SCHEDULER_SECRET` matches in both .env and cron-job.org

**No interventions created**
→ Normal if no active users or tasks meeting criteria

**Push notifications not working**
→ Verify user has `expoPushToken` and `settings.notificationsEnabled = true`

## Configuration

Adjust in `.env`:

```bash
SCHEDULER_BATCH_SIZE="50"                      # Max tasks per run
SCHEDULER_MAX_INTERVENTIONS_PER_USER="5"       # Max per day per user
SCHEDULER_MIN_HOURS_BETWEEN_INTERVENTIONS="2"  # Hours between same-task interventions
```

## Monitoring

Check database for interventions:

```sql
SELECT * FROM "ChatMessage"
WHERE role = 'assistant'
AND metadata->>'interventionType' IS NOT NULL
ORDER BY "createdAt" DESC LIMIT 10;
```

## Support

- 📚 Docs: `docs/TASK_LIFECYCLE_AGENT.md`
- 🔧 Scheduler README: `apps/agent/SCHEDULER_README.md`
- 🌐 cron-job.org docs: https://cron-job.org/en/documentation/
