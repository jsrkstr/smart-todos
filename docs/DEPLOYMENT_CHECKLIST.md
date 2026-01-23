# Task Lifecycle Scheduler - Deployment Checklist

Use this checklist to deploy the scheduler to production.

## Pre-Deployment

### ☐ 1. Environment Setup

```bash
# Generate a secure secret token
openssl rand -hex 32

# Set environment variables in your hosting platform
SCHEDULER_SECRET="<generated-token>"
DATABASE_URL="postgresql://..."
OPENAI_API_KEY="sk-..."
SCHEDULER_ENABLED="true"
ENABLE_PUSH_NOTIFICATIONS="true"
```

### ☐ 2. Database Verification

Ensure your production database has:
- Latest Prisma schema applied
- User table with `expoPushToken` field
- PsychProfile and Settings tables
- ChatMessage and Log tables

```bash
cd apps/web
pnpm prisma:push
# or
pnpm prisma:migrate deploy
```

### ☐ 3. Code Deployment

Deploy the agent service to your hosting platform:

**Option A: Deploy with Web App**
- Include agent in monorepo deployment
- Ensure build includes `apps/agent`

**Option B: Separate Deployment**
- Deploy `apps/agent` as standalone service
- Configure start command: `pnpm scheduler`

### ☐ 4. Local Testing

Before deploying, test locally:

```bash
# Terminal 1: Start scheduler
cd apps/agent
pnpm scheduler

# Terminal 2: Test endpoints
curl http://localhost:3001/
curl -X POST http://localhost:3001/api/scheduler/run-lifecycle-check \
  -H "Authorization: Bearer YOUR_SECRET"
```

Expected: Both return successful responses

## Deployment Steps

### ☐ 5. Deploy to Hosting Platform

Choose your platform and follow steps:

<details>
<summary>Vercel</summary>

1. Add `vercel.json` to `apps/agent/`:
```json
{
  "version": 2,
  "builds": [{"src": "src/scheduler/server.ts", "use": "@vercel/node"}],
  "routes": [{"src": "/(.*)", "dest": "src/scheduler/server.ts"}]
}
```

2. Deploy:
```bash
cd apps/agent
vercel deploy --prod
```

3. Note the deployment URL
4. Add environment variables in Vercel dashboard
</details>

<details>
<summary>Railway</summary>

1. Connect GitHub repo to Railway
2. Create new service
3. Set root directory: `apps/agent`
4. Set start command: `pnpm scheduler`
5. Add environment variables in Railway dashboard
6. Deploy
7. Note the deployment URL
</details>

<details>
<summary>Heroku</summary>

```bash
cd apps/agent
heroku create smarttodos-scheduler
heroku config:set SCHEDULER_SECRET=...
heroku config:set DATABASE_URL=...
heroku config:set OPENAI_API_KEY=...
git push heroku main
```

Note the deployment URL from Heroku
</details>

<details>
<summary>Docker</summary>

1. Build image:
```bash
cd apps/agent
docker build -t smarttodos-scheduler .
```

2. Run container:
```bash
docker run -p 3001:3001 \
  -e DATABASE_URL="..." \
  -e OPENAI_API_KEY="..." \
  -e SCHEDULER_SECRET="..." \
  smarttodos-scheduler
```

3. Deploy to your container hosting (AWS ECS, GCP Cloud Run, etc.)
</details>

### ☐ 6. Verify Deployment

Test the deployed endpoint:

```bash
# Health check
curl https://your-domain.com/api/scheduler/health

# Full lifecycle check
curl -X POST https://your-domain.com/api/scheduler/run-lifecycle-check \
  -H "Authorization: Bearer YOUR_SECRET"
```

✅ Expected: Both return 200 OK with JSON responses

## Cron Setup

### ☐ 7. Create cron-job.org Account

1. Go to https://cron-job.org/en/
2. Sign up with email
3. Verify email address
4. Log in

### ☐ 8. Create Cron Job

1. Click "Create cronjob"
2. Fill in:
   - **Title**: `SmartTodos Task Lifecycle Check`
   - **URL**: `https://your-domain.com/api/scheduler/run-lifecycle-check`
   - **Schedule**: `*/15 * * * *` (every 15 minutes)
   - **Method**: POST
   - **Header**: Name: `Authorization`, Value: `Bearer YOUR_SECRET`
3. Advanced settings:
   - ✅ Retry on failure: Enable
   - ✅ Expected response code: 200
   - ✅ Email on failure: Your email
4. Click "Create cronjob"

### ☐ 9. Test Cron Job

1. Click the "Play" icon to run manually
2. Check "Execution log" tab
3. Verify:
   - Status: ✅ Success (200 OK)
   - Response contains `"success": true`

### ☐ 10. Monitor First Automatic Run

1. Wait for next scheduled execution (up to 15 minutes)
2. Check execution log
3. Verify successful execution

## Post-Deployment Verification

### ☐ 11. Database Checks

```sql
-- Check that interventions are being created
SELECT * FROM "ChatMessage"
WHERE role = 'assistant'
AND metadata->>'interventionType' IS NOT NULL
ORDER BY "createdAt" DESC
LIMIT 10;

-- Check logs
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

✅ Expected: New records appearing after each cron execution

### ☐ 12. Mobile App Verification

1. Open Flutter app on test device
2. Ensure user has `expoPushToken` set
3. Enable notifications in settings
4. Create a test task with deadline tomorrow
5. Wait for intervention (up to 15 minutes)
6. Verify push notification received

### ☐ 13. Monitoring Setup

Set up monitoring for:

**Application logs:**
- Vercel: `vercel logs --app=your-app`
- Railway: Check Logs tab in dashboard
- Heroku: `heroku logs --tail`

**cron-job.org notifications:**
- Enable "Email on failure" in cron job settings
- Add webhook for critical alerts (optional)

**Database metrics:**
```sql
-- Daily intervention count
SELECT
  DATE("createdAt") as date,
  COUNT(*) as count
FROM "ChatMessage"
WHERE role = 'assistant'
  AND metadata->>'interventionType' IS NOT NULL
GROUP BY DATE("createdAt")
ORDER BY date DESC;
```

### ☐ 14. Cost Tracking

Set up cost monitoring:

**OpenAI:**
- Set usage limits in OpenAI dashboard
- Monitor daily costs
- Set alert for >$10/day

**Hosting:**
- Review hosting plan limits
- Set up billing alerts
- Monitor resource usage

## Configuration Tuning

### ☐ 15. Initial Configuration

Start conservative:

```bash
SCHEDULER_BATCH_SIZE="25"                    # Start small
SCHEDULER_MAX_INTERVENTIONS_PER_USER="3"     # Conservative limit
SCHEDULER_MIN_HOURS_BETWEEN_INTERVENTIONS="4" # More spacing
```

### ☐ 16. Monitor for 24-48 Hours

Track these metrics:
- Total interventions created per day
- Notifications sent per day
- Average response time
- Error rate
- OpenAI API costs

### ☐ 17. Adjust Based on Data

After 24-48 hours:

**If too many interventions:**
- Increase `MIN_HOURS_BETWEEN_INTERVENTIONS`
- Decrease `MAX_INTERVENTIONS_PER_USER`
- Increase cron interval to 30 minutes

**If too few interventions:**
- Decrease `MIN_HOURS_BETWEEN_INTERVENTIONS`
- Increase `MAX_INTERVENTIONS_PER_USER`
- Decrease cron interval to 10 minutes

**If high costs:**
- Reduce `BATCH_SIZE`
- Switch to `gpt-4o-mini` for some agents
- Increase cron interval

## Security Verification

### ☐ 18. Security Checklist

- ✅ `SCHEDULER_SECRET` is 32+ characters, random
- ✅ Secret stored in environment variables only
- ✅ HTTPS enabled on all endpoints
- ✅ Database uses SSL connection
- ✅ OpenAI API key has usage limits set
- ✅ No secrets in code repository
- ✅ Hosting platform has rate limiting enabled
- ✅ Logs don't expose sensitive data

## Documentation

### ☐ 19. Team Documentation

Document for your team:
- Deployment URL
- Scheduler secret location (password manager)
- cron-job.org account credentials
- Monitoring dashboard URLs
- On-call procedures for failures

### ☐ 20. User Communication

Inform users:
- New feature: AI-powered task reminders
- How to adjust notification preferences
- How to disable notifications
- Privacy policy update (AI-generated messages)

## Rollback Plan

### ☐ 21. Prepare Rollback

In case of issues:

1. **Disable cron job** in cron-job.org dashboard
2. **Set `SCHEDULER_ENABLED=false`** in environment variables
3. **Revert deployment** if needed
4. **Monitor logs** for errors
5. **Fix issues** and redeploy

## Success Criteria

Your deployment is successful when:

✅ Cron job executes successfully every 15 minutes
✅ Interventions appear in database
✅ Push notifications received on mobile
✅ No errors in application logs
✅ OpenAI costs within budget
✅ Users report helpful notifications
✅ Response time <5 seconds per execution

## Next Steps After Deployment

1. **Week 1**: Monitor closely, adjust configuration daily
2. **Week 2**: Collect user feedback, tune intervention types
3. **Month 1**: Analyze effectiveness data, plan Phase 2 features
4. **Ongoing**: Review logs weekly, optimize based on usage patterns

## Troubleshooting

### Cron job fails

1. Check authorization header format
2. Verify URL is accessible
3. Check application logs
4. Verify environment variables

### No interventions created

1. Verify active users exist (logged in within 7 days)
2. Check tasks meet intervention criteria
3. Verify user preferences allow notifications
4. Check daily intervention limits not reached

### Push notifications not working

1. Verify user has `expoPushToken` in database
2. Check `settings.notificationsEnabled = true`
3. Validate Expo token format
4. Check Expo API status

### High costs

1. Review `BATCH_SIZE` and reduce if needed
2. Check `MAX_INTERVENTIONS_PER_USER`
3. Consider switching some agents to cheaper models
4. Increase cron interval

---

## Final Checklist

Before marking deployment complete:

- ☐ Scheduler deployed and accessible via HTTPS
- ☐ Cron job created and running automatically
- ☐ Test interventions received successfully
- ☐ Monitoring and alerts configured
- ☐ Team documented on new system
- ☐ Users informed of new feature
- ☐ Rollback plan tested
- ☐ Cost tracking in place

**Deployment Status**: ___________________

**Deployed By**: ___________________

**Date**: ___________________

**Deployment URL**: ___________________

**Next Review Date**: ___________________

---

Need help? See [SCHEDULER_SETUP_GUIDE.md](./SCHEDULER_SETUP_GUIDE.md) for detailed instructions.
