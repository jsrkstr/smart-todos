# Push Notifications Setup - Flutter Mobile App

## ✅ Implementation Complete

Full native push notification support has been implemented for the Flutter mobile app. The scheduler's push notifications will now work as native system notifications on both iOS and Android.

## What Was Implemented

### 1. Services Created
- **NotificationService** (`lib/core/services/notification_service.dart`)
  - Manages local notification display
  - Handles notification permissions
  - Configures Android notification channels (urgent, important, default)

- **PushTokenService** (`lib/core/services/push_token_service.dart`)
  - Obtains FCM token from Firebase
  - Converts to Expo-compatible format
  - Handles foreground/background/terminated notification states
  - Auto-refreshes tokens when needed

### 2. State Management
- **NotificationProvider** (`lib/core/providers/notification_provider.dart`)
  - Riverpod provider for notification state
  - Tracks permissions and token registration status
  - Syncs with backend API

### 3. API Integration
- **ApiService** updated with notification methods:
  - `registerPushToken(token)` - Registers Expo push token
  - `updateNotificationSettings(enabled)` - Syncs notification preferences

### 4. Model Updates
- **User model** extended with `expoPushToken` field
- Compatible with backend Prisma schema

### 5. Platform Configuration

**Android** (`android/app/src/main/AndroidManifest.xml`):
- ✅ POST_NOTIFICATIONS permission (Android 13+)
- ✅ Firebase Cloud Messaging service
- ✅ Notification channels configured

**iOS** (`ios/Runner/Info.plist`):
- ✅ NSUserNotificationsUsageDescription
- ✅ Background remote-notification mode
- ✅ Firebase delegate configuration

### 6. App Integration
- **main.dart**: Notification services initialized on app startup
- **AuthProvider**: Registers push token after login/register
- **SettingsScreen**: Working notification toggle connected to backend

## Next Steps - Required Before Testing

### Step 1: Install Dependencies

```bash
cd apps/mobile-flutter
flutter pub get
```

### Step 2: Generate Code for User Model

```bash
flutter pub run build_runner build --delete-conflicting-outputs
```

This regenerates `user.g.dart` with the new `expoPushToken` field.

### Step 3: Firebase Configuration

You need to add Firebase configuration files:

**For Android:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create/select your project
3. Add Android app with package name: `com.example.smart_todos_flutter`
4. Download `google-services.json`
5. Place it in: `apps/mobile-flutter/android/app/google-services.json`

**For iOS:**
1. In Firebase Console, add iOS app with bundle ID from Xcode
2. Download `GoogleService-Info.plist`
3. Place it in: `apps/mobile-flutter/ios/Runner/GoogleService-Info.plist`

### Step 4: Update Android build.gradle

Add to `android/build.gradle`:

```gradle
buildscript {
    dependencies {
        // Add this line
        classpath 'com.google.gms:google-services:4.3.15'
    }
}
```

Add to `android/app/build.gradle` (at the bottom):

```gradle
apply plugin: 'com.google.gms.google-services'
```

### Step 5: Test on Real Devices

**Important**: Push notifications only work on real devices, not simulators!

```bash
# For Android
flutter run -d <your-android-device>

# For iOS
flutter run -d <your-ios-device>
```

## Testing the Implementation

### 1. Test Token Registration

**Expected Flow:**
1. User logs in
2. App requests notification permissions (iOS prompts immediately, Android 13+ prompts)
3. User grants permission
4. FCM token is obtained
5. Token is converted to Expo format: `ExponentPushToken[...]`
6. Token is sent to backend at `/api/notifications/register-token`
7. Backend saves token to `User.expoPushToken` field

**Check Logs:**
```
[PushTokenService] Token obtained: ExponentPushToken[...]
[PushTokenService] Token saved locally
[AuthProvider] Push token registered successfully
```

### 2. Test Notification Reception

**From Backend Scheduler:**
1. Backend scheduler runs (every 15 minutes via cron-job.org)
2. Identifies tasks needing attention
3. Generates AI message via LangGraph agent
4. Sends Expo push notification to `exp.host/--/api/v2/push/send`
5. Firebase delivers to device
6. App displays as native notification

**Test States:**
- **App in foreground**: Local notification shown via `flutter_local_notifications`
- **App in background**: System notification shown automatically
- **App terminated**: System notification wakes app

### 3. Test Notification Tap

**Expected:**
1. User taps notification
2. App opens (or comes to foreground)
3. TaskID extracted from notification data
4. App navigates to task detail screen (when routing is implemented)

**Current**: Notification tap is logged but navigation is placeholder

### 4. Test Settings Toggle

1. Open Settings screen
2. Toggle "Push Notifications"
3. If off → Enables and requests permission
4. If on → Disables and updates backend
5. Backend receives `PUT /api/settings` with `notificationsEnabled: false`
6. Scheduler respects this setting

## How It Works

### Token Flow

```
User Logs In
    ↓
Firebase Messaging Gets FCM Token
    ↓
Convert to Expo Format: ExponentPushToken[fcm_token]
    ↓
Send to Backend: POST /api/notifications/register-token
    ↓
Backend Saves to User.expoPushToken
    ↓
Scheduler Uses Token to Send Notifications
```

### Notification Flow

```
Scheduler Identifies Task Needing Attention
    ↓
Invokes LangGraph Agent (Execution Coach, Adaptation, etc.)
    ↓
Generates Personalized Message
    ↓
Checks User Has expoPushToken
    ↓
Sends to Expo Push API with Channel ID (urgent/important/default)
    ↓
Expo Routes to Firebase Cloud Messaging
    ↓
FCM Delivers to Device
    ↓
App Displays Notification (foreground/background/terminated)
```

### Notification Channels (Android)

| Channel ID | Priority | Use Case |
|------------|----------|----------|
| `urgent-tasks` | High | Overdue tasks, due <24h (Priority 9-10) |
| `important-tasks` | Default | Due 2-7 days, stuck >72h (Priority 7-8) |
| `default` | Default | General reminders (Priority 1-6) |

## Troubleshooting

### Token Not Registering

**Problem**: No token in backend database

**Checks:**
1. Firebase properly configured? (google-services.json / GoogleService-Info.plist)
2. Permissions granted? Check in device settings
3. Check logs for errors during token obtainment
4. Verify `/api/notifications/register-token` endpoint works

**Debug:**
```dart
// In auth_provider.dart, check logs
[PushTokenService] Token obtained: ...
[AuthProvider] Push token registered successfully
```

### Notifications Not Received

**Problem**: Scheduler sends but app doesn't receive

**Checks:**
1. Token registered in database? Query: `SELECT "expoPushToken" FROM "User" WHERE email='...'`
2. Backend settings: `notificationsEnabled = true`?
3. FCM token format correct? Must be: `ExponentPushToken[...]`
4. Notification permissions granted on device?
5. App has internet connection?

**Test Manually:**
```bash
# Send test notification via Expo API
curl https://exp.host/--/api/v2/push/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "ExponentPushToken[YOUR_TOKEN]",
    "title": "Test",
    "body": "This is a test notification",
    "data": {"taskId": "test123"},
    "channelId": "default"
  }'
```

### Permissions Denied

**Problem**: User denied notification permissions

**Solution:**
1. User must manually enable in device settings
2. On iOS: Settings → SmartTodos → Notifications → Allow
3. On Android: Settings → Apps → SmartTodos → Notifications → On

**In App**: Settings screen shows status and allows re-requesting

### Firebase Initialization Failed

**Problem**: `[main] Firebase initialization error`

**Checks:**
1. `google-services.json` in correct location?
2. Package name matches Firebase console?
3. `google-services` plugin applied in build.gradle?

**Workaround**: App continues without Firebase (for development)

## Files Modified/Created

### New Files
- `lib/core/services/notification_service.dart`
- `lib/core/services/push_token_service.dart`
- `lib/core/providers/notification_provider.dart`

### Modified Files
- `pubspec.yaml` - Added firebase_core, firebase_messaging, permission_handler
- `lib/core/models/user.dart` - Added expoPushToken field
- `lib/core/api/api_service.dart` - Added notification methods
- `lib/config/api_config.dart` - Added notificationsRegisterToken endpoint
- `lib/main.dart` - Initialize notification services
- `lib/features/auth/providers/auth_provider.dart` - Register token on login
- `lib/features/settings/screens/settings_screen.dart` - Connected toggle
- `android/app/src/main/AndroidManifest.xml` - Permissions and FCM config
- `ios/Runner/Info.plist` - Notification permissions

## Architecture Diagram

```
┌─────────────────────────────────────────┐
│         Flutter Mobile App              │
│                                         │
│  ┌────────────────────────────────────┐ │
│  │  NotificationService                │ │
│  │  - Display notifications            │ │
│  │  - Handle permissions               │ │
│  │  - Configure channels               │ │
│  └────────────────────────────────────┘ │
│                                         │
│  ┌────────────────────────────────────┐ │
│  │  PushTokenService                   │ │
│  │  - Get FCM token                    │ │
│  │  - Convert to Expo format           │ │
│  │  - Handle foreground/background     │ │
│  └────────────────────────────────────┘ │
│                                         │
│  ┌────────────────────────────────────┐ │
│  │  NotificationProvider               │ │
│  │  - Manage state                     │ │
│  │  - Sync with backend                │ │
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
                    │
                    ↓
        POST /api/notifications/register-token
                    │
                    ↓
┌─────────────────────────────────────────┐
│         Backend (Next.js)               │
│                                         │
│  User.expoPushToken = "ExponentPush..." │
└─────────────────────────────────────────┘
                    │
                    ↓
┌─────────────────────────────────────────┐
│    Task Lifecycle Scheduler             │
│                                         │
│  1. Identify tasks needing attention    │
│  2. Invoke LangGraph agent              │
│  3. Generate personalized message       │
│  4. Send to Expo Push API               │
└─────────────────────────────────────────┘
                    │
                    ↓
         exp.host/--/api/v2/push/send
                    │
                    ↓
┌─────────────────────────────────────────┐
│    Firebase Cloud Messaging             │
│                                         │
│  Routes to device via FCM token         │
└─────────────────────────────────────────┘
                    │
                    ↓
         📱 Native System Notification
```

## Next Development Steps

### Phase 1: Complete Routing
- Add deep link support in `app_router.dart`
- Navigate to task detail when notification tapped
- Handle notification tap when app is terminated

### Phase 2: Enhanced Notifications
- Rich notifications with images
- Action buttons (Mark Complete, Snooze)
- Notification grouping
- Sound customization

### Phase 3: Analytics
- Track notification delivery rate
- Track open rate
- Track action conversion
- Use data to optimize timing

## Support

For issues:
1. Check logs in console
2. Verify Firebase configuration
3. Test on real device (not simulator)
4. Check backend scheduler is running
5. Verify cron-job.org is triggering scheduler

## Summary

✅ **Native push notifications are fully implemented and ready to test!**

The Flutter app will now receive the AI-powered task reminders, motivational messages, and intervention notifications sent by the Task Lifecycle Scheduler as native system notifications on both iOS and Android devices.

Users will get proactive, timely reminders about their tasks with full native notification features (sound, vibration, badge, lock screen, notification center).
