# Google Calendar Integration Setup Guide

This guide will help you complete the Google Calendar integration for SmartTodos.

## Overview

The Google Calendar integration allows users to:
- Sync calendar events from all their Google Calendars
- View events in SmartTodos for AI-powered scheduling context
- Manually link tasks to calendar events (optional feature)

**Integration Type:** One-way sync (Calendar → SmartTodos only)

## Prerequisites

1. Google Cloud Console project with Calendar API enabled
2. OAuth 2.0 credentials (Client ID and Client Secret)
3. PostgreSQL database with Prisma schema applied
4. Environment variables configured

## Step 1: Google Cloud Console Setup

### 1.1 Enable Google Calendar API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create a new one)
3. Navigate to **APIs & Services > Library**
4. Search for "Google Calendar API"
5. Click **Enable**

### 1.2 Configure OAuth Consent Screen

1. Navigate to **APIs & Services > OAuth consent screen**
2. Choose **External** user type
3. Fill in required fields:
   - App name: `SmartTodos`
   - User support email: Your email
   - Developer contact: Your email
4. Add scopes:
   - `../auth/calendar.readonly` (Read calendar events)
   - `../auth/calendar.events` (Create/update events - for future)
5. Add test users (if in testing mode)
6. Save and continue

### 1.3 Create OAuth 2.0 Credentials

1. Navigate to **APIs & Services > Credentials**
2. Click **Create Credentials > OAuth 2.0 Client ID**
3. Application type: **Web application**
4. Name: `SmartTodos Web`
5. Authorized redirect URIs:
   - Development: `http://localhost:3000/api/auth/google`
   - Production: `https://yourdomain.com/api/auth/google`
6. Click **Create**
7. Copy the Client ID and Client Secret

## Step 2: Environment Variables

Add these to your `apps/web/.env` file:

```bash
# Google OAuth (existing - verify these are set)
GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google

# Calendar Sync Secret (new - generate a random string)
CALENDAR_SYNC_SECRET=your_random_secret_here_min_32_chars

# Optional: Set base URL for production
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Generate a Secret

```bash
# On macOS/Linux
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## Step 3: Database Migration

The Prisma schema already includes `CalendarConnection` and `CalendarEvent` models.

Run the migration:

```bash
cd apps/web
pnpm prisma:generate
pnpm prisma:push
```

Verify in Prisma Studio:

```bash
pnpm prisma:studio
```

You should see the `CalendarConnection` and `CalendarEvent` tables.

## Step 4: Install Dependencies

Dependencies are already installed via the setup script, but if needed:

```bash
cd apps/web
pnpm add googleapis
```

## Step 5: Test the Integration

### 5.1 Start the Development Server

```bash
# From root
pnpm dev

# Or just the web app
cd apps/web
pnpm dev
```

### 5.2 Test OAuth Flow

1. Navigate to `http://localhost:3000/api/calendar/connect`
2. You should be redirected to Google's OAuth consent screen
3. Grant calendar permissions
4. You should be redirected back to the app
5. Check that a `CalendarConnection` was created in the database

### 5.3 Test Manual Sync

```bash
# Using curl
curl -X POST http://localhost:3000/api/calendar/sync \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

Or visit the calendar connections page in the UI and click "Sync Now".

### 5.4 Verify Events Synced

Check Prisma Studio to see if `CalendarEvent` records were created:

```bash
cd apps/web
pnpm prisma:studio
```

## Step 6: Set Up Background Sync (Optional)

### Option A: Use cron-job.org (Recommended)

1. Go to [cron-job.org](https://cron-job.org/)
2. Create a free account
3. Create a new cron job:
   - Title: `SmartTodos Calendar Sync`
   - URL: `https://yourdomain.com/api/cron/calendar-sync`
   - Schedule: Every 15-30 minutes (e.g., `*/15 * * * *`)
   - Request method: POST
   - Headers:
     ```
     Authorization: Bearer YOUR_CALENDAR_SYNC_SECRET
     ```
4. Save and enable

### Option B: Vercel Cron (if deployed on Vercel)

Create `vercel.json` in `apps/web/`:

```json
{
  "crons": [
    {
      "path": "/api/cron/calendar-sync",
      "schedule": "0,15,30,45 * * * *"
    }
  ]
}
```

Note: Vercel cron requires a paid plan.

## Step 7: Mobile App Setup (Flutter)

### 7.1 Run Code Generator

```bash
cd apps/mobile-flutter
flutter pub get
flutter pub run build_runner build --delete-conflicting-outputs
```

### 7.2 Test Mobile OAuth Flow

The mobile app will open the browser for OAuth. After successful authentication, users will be redirected back to the app.

**Note:** For production, configure deep linking to handle OAuth callbacks properly.

## Step 8: Verify Everything Works

### Checklist

- [ ] OAuth flow works (redirects to Google and back)
- [ ] Calendar connection is created in database
- [ ] Manual sync fetches events from Google Calendar
- [ ] Events appear in database (`CalendarEvent` table)
- [ ] Events are displayed in the web calendar view
- [ ] Background sync runs automatically (if configured)
- [ ] Mobile app can view calendar connections
- [ ] Token refresh works (test by expiring a token manually)
- [ ] AI agents can see calendar events for context

## Troubleshooting

### "OAuth failed" error

- Check that `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct
- Verify redirect URI matches exactly (including http/https)
- Check Google Cloud Console for OAuth consent screen status

### "Invalid grant" error

- Refresh token may have expired or been revoked
- User needs to reconnect their calendar
- Check that `prompt: 'consent'` is set in OAuth URL generation

### No events syncing

- Check that calendar connection has `isActive: true`
- Verify `accessToken` and `refreshToken` are saved
- Look for errors in server logs during sync
- Test with `curl` to see detailed error messages

### Token refresh fails

- Check that `refreshToken` exists in database
- Verify Google OAuth credentials are correct
- User may need to re-authenticate

## API Endpoints

### Calendar Connections

- `GET /api/calendar/connections` - List connections
- `GET /api/calendar/connections/[id]` - Get single connection
- `PUT /api/calendar/connections/[id]` - Update connection
- `DELETE /api/calendar/connections/[id]` - Delete connection

### Sync

- `GET /api/calendar/sync` - Get sync status
- `POST /api/calendar/sync` - Trigger manual sync
- `POST /api/cron/calendar-sync` - Background sync (requires secret)

### OAuth

- `GET /api/auth/google?calendar=true` - Start OAuth with calendar scopes
- `GET /api/calendar/connect` - Convenience redirect to OAuth

## Architecture Notes

### Sync Strategy

- **Incremental sync:** Uses Google's `syncToken` to fetch only changed events
- **Frequency:** Configurable per connection (realtime, hourly, daily)
- **Scope:** All calendars by default (not just primary)
- **Direction:** One-way (Calendar → SmartTodos)

### Token Management

- Access tokens are refreshed automatically before expiry
- Refresh tokens are stored securely in database
- Token expiry is checked before each API call

### Error Handling

- Failed syncs are logged but don't block other connections
- Invalid sync tokens trigger full re-sync
- Network errors are retried automatically
- Users are notified of sync failures in UI

## Future Enhancements

Planned features (not in current MVP):

- [ ] Manual task-to-event linking
- [ ] Auto-suggest event links based on similarity
- [ ] Task → Calendar sync (create events for tasks)
- [ ] Full bidirectional sync
- [ ] Calendar event filtering by keywords
- [ ] Per-calendar sync settings
- [ ] Conflict resolution UI

## Support

For issues or questions:
1. Check server logs for error messages
2. Verify environment variables are set correctly
3. Test API endpoints directly with `curl`
4. Check Prisma Studio for database state
5. Review Google Cloud Console for API quotas/limits

## Security Notes

- Never commit `.env` files to git
- Rotate `CALENDAR_SYNC_SECRET` periodically
- Use HTTPS in production
- Tokens are stored encrypted in database (via Prisma)
- OAuth credentials should be restricted to your domain
