# Google Calendar API - Enable Guide

## ⚠️ Issue Identified

Your OAuth token **has the correct calendar scopes**, but the Calendar API call is failing with "Login Required (401)".

This typically means: **The Google Calendar API is not enabled in your Google Cloud project.**

---

## ✅ Solution: Enable Google Calendar API

### Step 1: Go to Google Cloud Console

1. Visit: https://console.cloud.google.com/
2. Select your project (the one with your OAuth credentials)

### Step 2: Enable Calendar API

1. In the left sidebar, click **"APIs & Services"** → **"Library"**
2. Search for **"Google Calendar API"**
3. Click on **"Google Calendar API"**
4. Click the blue **"Enable"** button

**Direct link:** https://console.cloud.google.com/apis/library/calendar-json.googleapis.com

### Step 3: Verify It's Enabled

1. Go to **"APIs & Services"** → **"Enabled APIs & services"**
2. You should see **"Google Calendar API"** in the list
3. Status should be **"Enabled"**

---

## 🧪 Test Again

After enabling the API, wait 1-2 minutes for it to propagate, then test:

```bash
cd /Users/jsrkstr/work/smart-todos/apps/web
npx tsx ../../test-google-token.js
```

You should see:
```
✅ Successfully called Calendar API!
   Found X calendars
```

Then trigger the sync:
```bash
curl -X POST http://localhost:3000/api/calendar/sync \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

## 📊 What We Verified

✅ OAuth credentials are correct
✅ Token has calendar.readonly and calendar.events scopes
✅ Token is not expired (expires in 806 seconds)
✅ Access token and refresh token are both stored
❌ Calendar API is not enabled in Google Cloud project ← **This is the issue**

---

## 🔍 Why This Happens

Even though OAuth consent includes calendar scopes, the actual Calendar API must be explicitly enabled in your Google Cloud project. The OAuth flow only grants **permission** to access the API, but the API itself must be **activated** in your project.

---

## ⏭️ Next Steps

1. **Enable Calendar API** (see Step 2 above)
2. **Wait 1-2 minutes** for propagation
3. **Test with test script** to verify it works
4. **Trigger sync** to fetch calendar events

That's it! No need to reconnect or change any code - just enable the API.
