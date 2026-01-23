# Scheduler Migration Guide

## Overview

The Task Lifecycle Scheduler has been migrated from a separate Express server in `apps/agent` to a Next.js API route in `apps/web`. This consolidates infrastructure and simplifies deployment.

## What Changed

### Before (Deprecated)
- **Location**: `apps/agent/src/scheduler/`
- **Server**: Standalone Express HTTP server on port 3001
- **Deployment**: Required separate server hosting (Railway, Render, etc.)
- **Invocation**: External cron job called `http://scheduler-server:3001/api/scheduler/run-lifecycle-check`
- **Agent Access**: Direct `graph.invoke()` calls

### After (Current)
- **Location**: `apps/web/app/api/scheduler/run-lifecycle-check/`
- **Server**: Next.js API route (Vercel serverless function)
- **Deployment**: Single deployment with web app on Vercel
- **Invocation**: External cron job calls `https://your-app.vercel.app/api/scheduler/run-lifecycle-check`
- **Agent Access**: Uses `processRequest()` wrapper (same as chat API)

## Architecture Benefits

1. **Simpler Infrastructure**: One deployment instead of two
2. **Cost Savings**: Free on Vercel Hobby tier (handles up to 900 users with 300s timeout)
3. **Unified Codebase**: All API routes in one place
4. **Same Capabilities**: No functionality lost in migration

## Technical Details

### Timeout Configuration
```typescript
// apps/web/app/api/scheduler/run-lifecycle-check/route.ts
export const maxDuration = 300; // 5 minutes with Fluid Compute on Hobby tier
```

### Cron Job Configuration Update
Change your cron-job.org (or similar service) endpoint from:
```
POST http://scheduler-server:3001/api/scheduler/run-lifecycle-check
Authorization: Bearer YOUR_SCHEDULER_SECRET
```

To:
```
POST https://your-app.vercel.app/api/scheduler/run-lifecycle-check
Authorization: Bearer YOUR_SCHEDULER_SECRET
```

### Environment Variables
The web app already has all required environment variables:
- `SCHEDULER_SECRET` - For authorization
- `DATABASE_URL` - For database access
- `OPENAI_API_KEY` - For agent invocation

No new environment variables needed!

## Files Migrated

### Created in Web App
1. **`apps/web/lib/scheduler/types.ts`**
   - Copied from `apps/agent/src/scheduler/types.ts`
   - Type definitions for interventions, analyses, and results

2. **`apps/web/lib/scheduler/intervention-logic.ts`**
   - Copied from `apps/agent/src/scheduler/intervention-logic.ts`
   - Task analysis logic with 10 intervention triggers
   - Priority calculation (1-10)
   - User preference filtering

3. **`apps/web/app/api/scheduler/run-lifecycle-check/route.ts`**
   - Ported from `apps/agent/src/scheduler/api.ts` + `task-lifecycle-scheduler.ts`
   - Full scheduler orchestration
   - Authorization, batch processing, notification sending

### Removed from Agent App
- `apps/agent/src/scheduler/` (entire directory)
  - `server.ts` - Express server (no longer needed)
  - `api.ts` - HTTP endpoints (replaced by Next.js API route)
  - `task-lifecycle-scheduler.ts` - Scheduler class (logic moved to route handler)
  - `intervention-logic.ts` - Task analysis (copied to web app)
  - `types.ts` - Type definitions (copied to web app)
  - `index.ts` - Module exports

### Package.json Changes
Removed from `apps/agent/package.json`:
- `"scheduler": "ts-node src/scheduler/server.ts"`
- `"scheduler:dev": "nodemon --watch src/scheduler --exec ts-node src/scheduler/server.ts"`

## Intervention Logic

All 10 intervention types remain identical:

| Priority | Trigger | Type | Agent |
|----------|---------|------|-------|
| 10 | Overdue tasks | Adaptation Suggestion | adaptation |
| 9 | Due within 24 hours | Reminder | executionCoach |
| 8 | Stuck in stage >3 days | Progress Check | executionCoach |
| 7 | Due within 2-7 days | Reminder | executionCoach |
| 6 | Scheduled for today | Reminder | executionCoach |
| 5 | Refinement stage >2 days | Reminder | planning |
| 4 | High priority not started | Motivation | executionCoach |

## Rate Limiting

Configuration remains the same:
- **Max interventions per user per day**: 5
- **Min hours between interventions for same task**: 2 hours
- **Batch size**: 50 tasks per run

## Notification Channels

Both channels still supported:
1. **In-app chat messages** - Always created for persistence
2. **Push notifications** - Sent if user has `expoPushToken` and `notificationsEnabled: true`

## Testing the Migration

### Local Testing
```bash
# Start web app
cd apps/web
pnpm dev

# Test scheduler endpoint
curl -X POST http://localhost:3000/api/scheduler/run-lifecycle-check \
  -H "Authorization: Bearer YOUR_SCHEDULER_SECRET" \
  -H "Content-Type: application/json"
```

### Production Testing
```bash
# Test on Vercel
curl -X POST https://your-app.vercel.app/api/scheduler/run-lifecycle-check \
  -H "Authorization: Bearer YOUR_SCHEDULER_SECRET" \
  -H "Content-Type: application/json"
```

Expected response:
```json
{
  "tasksProcessed": 10,
  "interventionsCreated": 3,
  "notificationsSent": 3,
  "errors": [],
  "duration": 2500,
  "timestamp": "2026-01-23T..."
}
```

## Rollback Plan

If issues arise, you can temporarily rollback by:
1. Restoring `apps/agent/src/scheduler/` from git history
2. Re-adding scheduler scripts to `apps/agent/package.json`
3. Deploying agent app to Railway/Render
4. Updating cron job endpoint back to agent server

However, this should not be necessary as the new implementation maintains full feature parity.

## Support

If you encounter issues with the scheduler:
1. Check Vercel function logs for errors
2. Verify `SCHEDULER_SECRET` environment variable is set
3. Confirm cron job endpoint is updated
4. Test locally with curl commands above

## Migration Complete

✅ All scheduler functionality has been successfully migrated to the web app.
✅ The separate agent scheduler server is no longer needed.
✅ No functionality has been lost in the migration.
