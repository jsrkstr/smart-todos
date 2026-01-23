# Task Lifecycle Scheduler Setup Guide

This guide walks you through setting up the Task Lifecycle Scheduler with cron-job.org to run automatically.

## Prerequisites

- SmartTodos web app deployed and accessible via HTTPS
- Scheduler service running and accessible from internet
- cron-job.org account (free tier is sufficient)

## Step 1: Deploy the Scheduler Service

### Option A: Deploy with Web App (Recommended)

If your web app is on Vercel, Railway, or similar:

1. The scheduler runs as part of the agent package
2. Ensure it's accessible at: `https://your-domain.com/api/scheduler/run-lifecycle-check`

### Option B: Separate Deployment

Deploy the scheduler as a standalone service:

**Using Vercel:**

1. Create `vercel.json` in `apps/agent/`:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "src/scheduler/server.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "src/scheduler/server.ts"
    }
  ]
}
```

2. Deploy:
```bash
cd apps/agent
vercel deploy --prod
```

**Using Railway:**

1. Connect your GitHub repo to Railway
2. Set root directory to `apps/agent`
3. Set start command to `pnpm scheduler`
4. Add environment variables

**Using Heroku:**

```bash
cd apps/agent
heroku create smarttodos-scheduler
heroku config:set SCHEDULER_SECRET=your-secret-here
heroku config:set DATABASE_URL=your-db-url
heroku config:set OPENAI_API_KEY=your-key
git push heroku main
```

## Step 2: Configure Environment Variables

Set these environment variables in your deployment platform:

```bash
# Required
DATABASE_URL="postgresql://..."
OPENAI_API_KEY="sk-..."
SCHEDULER_SECRET="<generate-with-openssl-rand-hex-32>"

# Optional (with defaults)
SCHEDULER_ENABLED="true"
SCHEDULER_PORT="3001"
SCHEDULER_BATCH_SIZE="50"
SCHEDULER_MAX_INTERVENTIONS_PER_USER="5"
SCHEDULER_MIN_HOURS_BETWEEN_INTERVENTIONS="2"
ENABLE_PUSH_NOTIFICATIONS="true"
```

**Generate a secure secret:**

```bash
openssl rand -hex 32
```

Copy this value and save it as `SCHEDULER_SECRET`.

## Step 3: Test the Endpoint

Before setting up the cron job, verify the endpoint works:

```bash
curl -X POST https://your-domain.com/api/scheduler/run-lifecycle-check \
  -H "Authorization: Bearer YOUR_SCHEDULER_SECRET" \
  -H "Content-Type: application/json"
```

Expected response (if successful):

```json
{
  "success": true,
  "result": {
    "tasksProcessed": 0,
    "interventionsCreated": 0,
    "notificationsSent": 0,
    "errors": [],
    "duration": "0.25s",
    "timestamp": "2024-01-20T10:30:00.000Z"
  }
}
```

If you get authentication error:
- Verify the `Authorization` header format: `Bearer YOUR_SECRET`
- Ensure `SCHEDULER_SECRET` environment variable is set correctly

## Step 4: Create cron-job.org Account

1. Go to https://cron-job.org/en/
2. Click "Sign Up" (top right)
3. Enter email and create password
4. Verify your email address
5. Log in to your dashboard

## Step 5: Create Cron Job

### Basic Setup

1. Click **"Create cronjob"** button (top right)

2. **Title**:
   ```
   SmartTodos Task Lifecycle Check
   ```

3. **URL**:
   ```
   https://your-domain.com/api/scheduler/run-lifecycle-check
   ```
   Replace `your-domain.com` with your actual deployment URL.

4. **Schedule**: Choose one of:
   - **Every 15 minutes**: `*/15 * * * *` (Recommended)
   - **Every 30 minutes**: `*/30 * * * *`
   - **Every hour**: `0 * * * *`

5. **Request Method**:
   - Select **POST**

6. **Request Headers**:
   - Click "Add header"
   - **Name**: `Authorization`
   - **Value**: `Bearer YOUR_SCHEDULER_SECRET`

   Replace `YOUR_SCHEDULER_SECRET` with your actual secret.

7. **Request Body**: Leave empty (not needed)

8. Click **"Create cronjob"**

### Advanced Options (Optional)

Expand "Advanced" section for additional settings:

- **Timeout**: 30 seconds (default is fine)
- **Retry on failure**: Enable
- **Expected response code**: 200
- **Email notifications**: Enable to get alerts on failures

## Step 6: Verify Cron Job

### Test Execution

After creating the cron job:

1. Click the **"Play"** icon next to your cron job to run it manually
2. Wait a few seconds for execution
3. Check the **"Execution log"** tab
4. Verify:
   - Status: ✅ Success (200 OK)
   - Response contains: `"success": true`

### Monitor First Automatic Run

1. Wait for the next scheduled execution (up to 15 minutes)
2. Check the execution log again
3. Verify it runs successfully

### Check Application Logs

In your SmartTodos database, check for interventions:

```sql
-- Check recent chat messages from the agent
SELECT * FROM "ChatMessage"
WHERE role = 'assistant'
AND metadata->>'interventionType' IS NOT NULL
ORDER BY "createdAt" DESC
LIMIT 10;

-- Check recent logs
SELECT * FROM "Log"
WHERE type = 'ai_prompted'
ORDER BY "createdAt" DESC
LIMIT 10;

-- Check notifications
SELECT * FROM "Notification"
WHERE author = 'Bot'
ORDER BY "createdAt" DESC
LIMIT 10;
```

## Step 7: Configure Notifications (Optional)

### Enable Email Alerts for Cron Failures

1. Go to cron-job.org dashboard
2. Click on your cron job
3. Scroll to "Notifications"
4. Enable "Email on failure"
5. Enter your email address

### Set Up Response Validation

To detect silent failures:

1. Edit your cron job
2. Go to "Advanced" section
3. Enable "Check response"
4. Set "Expected content": `"success":true`
5. This will alert you if the API returns an error

## Troubleshooting

### Cron Job Shows "Failed" Status

**Check 1: URL is accessible**
```bash
curl https://your-domain.com/api/scheduler/health
```

Should return:
```json
{
  "status": "ok",
  "service": "task-lifecycle-scheduler",
  "timestamp": "..."
}
```

**Check 2: Authorization header is correct**
- Verify format: `Bearer YOUR_SECRET` (with space after "Bearer")
- Verify secret matches `SCHEDULER_SECRET` environment variable

**Check 3: Method is POST**
- Ensure "Request Method" is set to POST, not GET

### Cron Job Succeeds But No Interventions

This is normal if:
- No users have been active in last 7 days
- No tasks meet intervention criteria
- Users have already received max interventions today

To verify it's working:
1. Create a test task with deadline tomorrow
2. Wait for next cron execution
3. Check if intervention was created

### Notifications Not Sending

**For Push Notifications:**
1. Verify user has `expoPushToken` in database
2. Check `User.settings.notificationsEnabled` is `true`
3. Verify token format: `ExponentPushToken[xxxxx]`

**For In-App Chat:**
1. Should always work if intervention is created
2. Check `ChatMessage` table for new messages
3. Verify `role = 'assistant'` and `metadata` contains `interventionType`

### High Error Rate

Check your application logs:

**If using Vercel:**
```bash
vercel logs --app=your-app-name
```

**If using Railway:**
- Go to Railway dashboard → Your service → Logs

**If using Heroku:**
```bash
heroku logs --tail --app=smarttodos-scheduler
```

Common errors:
- Database connection timeout → Increase connection pool
- OpenAI API rate limit → Reduce `SCHEDULER_BATCH_SIZE`
- Memory issues → Upgrade hosting plan

## Best Practices

### 1. Start with Longer Intervals

Begin with 30-minute or 1-hour intervals, then optimize:

```
# Start with this
0 * * * *         (every hour)

# Then move to
*/30 * * * *      (every 30 minutes)

# Finally
*/15 * * * *      (every 15 minutes)
```

### 2. Monitor Costs

- Each cron execution calls OpenAI API for each intervention
- Monitor OpenAI usage dashboard
- Adjust `SCHEDULER_BATCH_SIZE` and `SCHEDULER_MAX_INTERVENTIONS_PER_USER` to control costs

### 3. Set Up Alerts

Configure cron-job.org to email you if:
- Cron job fails 3 times in a row
- Response doesn't contain expected content
- Request times out

### 4. Test During Off-Peak Hours

When first setting up:
1. Set cron to run only during specific hours (e.g., 9 AM - 9 PM)
2. Use the schedule: `0 9-21 * * *` (every hour from 9 AM to 9 PM)
3. Expand to 24/7 once stable

### 5. Backup Webhook

Consider setting up a secondary webhook as backup:

1. Create duplicate cron job on different service (e.g., EasyCron, Cronitor)
2. Set different schedule (offset by 7 minutes)
3. Provides redundancy if one service has issues

## Advanced: Custom Scheduling

### Business Hours Only

Run only during work hours (9 AM - 6 PM, Monday-Friday):

```
0 9-18 * * 1-5
```

### Different Frequencies by Time

High frequency during peak hours, low during off-peak:

**Peak hours (9 AM - 9 PM): Every 15 minutes**
```
*/15 9-21 * * *
```

**Off-peak (10 PM - 8 AM): Every hour**
```
0 22-23,0-8 * * *
```

Create two separate cron jobs for this setup.

## Monitoring Dashboard

### cron-job.org Dashboard

Monitor these metrics:
- **Success rate**: Should be >95%
- **Average response time**: Should be <5 seconds
- **Last execution**: Should be recent (within expected interval)

### Application Metrics

Track in your database:

```sql
-- Interventions per day
SELECT
  DATE("createdAt") as date,
  COUNT(*) as intervention_count
FROM "ChatMessage"
WHERE role = 'assistant'
  AND metadata->>'interventionType' IS NOT NULL
GROUP BY DATE("createdAt")
ORDER BY date DESC
LIMIT 7;

-- Intervention effectiveness (if tracking user responses)
SELECT
  metadata->>'interventionType' as type,
  COUNT(*) as total,
  COUNT(CASE WHEN metadata->>'userResponded' = 'true' THEN 1 END) as responded
FROM "ChatMessage"
WHERE role = 'assistant'
  AND metadata->>'interventionType' IS NOT NULL
GROUP BY metadata->>'interventionType';
```

## Security Checklist

- ✅ `SCHEDULER_SECRET` is long and random (32+ characters)
- ✅ Secret is stored in environment variables, not code
- ✅ HTTPS is used for all endpoints
- ✅ Database credentials are secure
- ✅ OpenAI API key has usage limits set
- ✅ Rate limiting is enabled on your hosting platform

## Next Steps

After successful setup:

1. **Monitor for 24-48 hours** - Verify interventions are being created
2. **Check user feedback** - Are notifications helpful? Too frequent?
3. **Adjust configuration** - Tune `MAX_INTERVENTIONS_PER_USER` based on feedback
4. **Implement tracking** - Add user response tracking for effectiveness
5. **Optimize timing** - Use analytics to determine best intervention times

## Support Resources

- **cron-job.org Docs**: https://cron-job.org/en/documentation/
- **Cron Syntax Guide**: https://crontab.guru/
- **Task Lifecycle Agent Docs**: [TASK_LIFECYCLE_AGENT.md](./TASK_LIFECYCLE_AGENT.md)
- **Scheduler README**: [SCHEDULER_README.md](../apps/agent/SCHEDULER_README.md)

## Frequently Asked Questions

**Q: How much does this cost?**
- cron-job.org: Free for up to 5 cron jobs
- OpenAI API: ~$0.01-0.10 per intervention (GPT-4o)
- Hosting: Depends on platform (Vercel free tier may be sufficient)

**Q: Can I run this locally?**
- Yes, for testing. Use ngrok to expose local server
- Not recommended for production (unreliable)

**Q: What happens if my server is down?**
- Cron job will fail
- cron-job.org will retry (if enabled)
- Interventions will be missed for that cycle
- Next successful run will catch up

**Q: Can I pause interventions temporarily?**
- Yes, in cron-job.org dashboard, click "Disable" on your cron job
- Or set `SCHEDULER_ENABLED=false` in environment variables

**Q: How do I test without sending real notifications?**
- Set `ENABLE_PUSH_NOTIFICATIONS=false`
- Interventions will still be logged to database
- Only in-app chat messages will be created
