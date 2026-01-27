# Google Calendar Integration - Quick Start

## 🚀 5-Minute Setup

### 1. Environment Variables
```bash
# Add to apps/web/.env
GOOGLE_CLIENT_ID=your_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google
CALENDAR_SYNC_SECRET=$(openssl rand -base64 32)
```

### 2. Database
```bash
cd apps/web
pnpm prisma:generate
pnpm prisma:push
```

### 3. Start Development
```bash
pnpm dev  # From root
```

### 4. Test OAuth
Visit: `http://localhost:3000/api/calendar/connect`

### 5. Trigger Sync
```bash
curl -X POST http://localhost:3000/api/calendar/sync \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json"
```

---

## 📋 Key Files Created

**Backend:**
- [apps/web/lib/services/calendarSyncService.ts](apps/web/lib/services/calendarSyncService.ts) - Core sync logic
- [apps/web/app/api/calendar/sync/route.ts](apps/web/app/api/calendar/sync/route.ts) - Manual sync
- [apps/web/app/api/cron/calendar-sync/route.ts](apps/web/app/api/cron/calendar-sync/route.ts) - Background sync
- [apps/web/app/api/calendar/connections/route.ts](apps/web/app/api/calendar/connections/route.ts) - CRUD

**Frontend:**
- [apps/web/hooks/use-calendar-connections.ts](apps/web/hooks/use-calendar-connections.ts) - React hook
- [apps/web/components/calendar/calendar-connections.tsx](apps/web/components/calendar/calendar-connections.tsx) - UI

**Mobile:**
- [apps/mobile-flutter/lib/core/api/calendar_api_service.dart](apps/mobile-flutter/lib/core/api/calendar_api_service.dart) - API
- [apps/mobile-flutter/lib/features/calendar/providers/calendar_provider.dart](apps/mobile-flutter/lib/features/calendar/providers/calendar_provider.dart) - State
- [apps/mobile-flutter/lib/features/calendar/screens/calendar_connections_screen.dart](apps/mobile-flutter/lib/features/calendar/screens/calendar_connections_screen.dart) - UI

---

## 🔗 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/calendar/connections` | List connections |
| POST | `/api/calendar/connections` | Create connection |
| PUT | `/api/calendar/connections/[id]` | Update connection |
| DELETE | `/api/calendar/connections/[id]` | Delete connection |
| GET | `/api/calendar/sync` | Get sync status |
| POST | `/api/calendar/sync` | Trigger manual sync |
| POST | `/api/cron/calendar-sync` | Background sync (auth required) |
| GET | `/api/calendar/connect` | OAuth redirect |

---

## ✅ Testing Checklist

- [ ] OAuth redirects to Google
- [ ] Tokens saved in database
- [ ] Manual sync works
- [ ] Events appear in database
- [ ] All calendars synced
- [ ] Token refresh works
- [ ] UI shows connections
- [ ] Mobile app connects

---

## 📖 Full Documentation

- [GOOGLE_CALENDAR_SETUP.md](GOOGLE_CALENDAR_SETUP.md) - Complete setup guide
- [GOOGLE_CALENDAR_IMPLEMENTATION_SUMMARY.md](GOOGLE_CALENDAR_IMPLEMENTATION_SUMMARY.md) - Technical details

---

## 🆘 Common Issues

**OAuth fails:**
```bash
# Check environment variables
cat apps/web/.env | grep GOOGLE
```

**No events syncing:**
```bash
# Check logs
cd apps/web && pnpm dev  # Watch for errors

# Verify connection in database
pnpm prisma:studio  # Check CalendarConnection table
```

**Token expired:**
```bash
# Delete and reconnect
# Visit /api/calendar/connect again
```

---

## 🎯 What's Implemented

✅ One-way sync (Calendar → SmartTodos)
✅ All calendars synced (not just primary)
✅ Incremental sync with syncToken
✅ Automatic token refresh
✅ Manual sync trigger
✅ Background cron sync
✅ Web UI for connections
✅ Mobile app integration
✅ Comprehensive error handling

---

## 🔮 Not Implemented (Future)

❌ Task → Calendar sync
❌ Auto-create tasks from events
❌ Manual task-event linking
❌ Bidirectional conflict resolution

---

**Need help?** See [GOOGLE_CALENDAR_SETUP.md](GOOGLE_CALENDAR_SETUP.md) for detailed troubleshooting.
