# SmartTodos Flutter Mobile App

A Flutter mobile application for SmartTodos with pixel-perfect UI matching the Next.js web app.

## Project Structure

```
lib/
├── main.dart                      # App entry point
├── config/
│   └── api_config.dart            # API configuration
├── core/
│   ├── api/                       # API client and services
│   ├── models/                    # Data models (User, Task, etc.)
│   ├── constants/                 # App constants
│   └── utils/                     # Utility functions
├── features/
│   ├── auth/                      # Authentication feature
│   ├── tasks/                     # Tasks feature
│   ├── chat/                      # Coach chat feature
│   ├── pomodoro/                  # Pomodoro timer feature
│   └── profile/                   # Profile and settings
├── shared/
│   ├── widgets/                   # Reusable UI components
│   └── providers/                 # Riverpod providers
└── theme/
    ├── app_theme.dart             # Main theme configuration
    ├── app_colors.dart            # Color palette from Tailwind
    ├── app_text_styles.dart       # Typography system
    └── app_spacing.dart           # Spacing constants
```

## Design System

The app uses a design system extracted from the Next.js web app:

- **Colors**: Matches Tailwind CSS variables from `apps/web/tailwind.config.ts`
- **Typography**: Matches web app font sizes and weights
- **Spacing**: Consistent with web app's spacing system
- **Components**: Flutter equivalents of shadcn/ui components

## Setup Instructions

### Prerequisites

- Flutter SDK 3.0.0 or higher
- Dart SDK 3.0.0 or higher
- iOS: Xcode 14.0+ (for iOS development)
- Android: Android Studio with SDK 33+ (for Android development)

### Installation

1. **Install Flutter dependencies:**
   ```bash
   cd apps/mobile-flutter
   flutter pub get
   ```

2. **Generate code (for json_serializable, retrofit, etc.):**
   ```bash
   flutter pub run build_runner build --delete-conflicting-outputs
   ```

3. **Run the app:**
   ```bash
   # iOS
   flutter run -d ios

   # Android
   flutter run -d android

   # Or select device
   flutter devices
   flutter run -d <device-id>
   ```

## API Configuration

The app connects to the Next.js backend:

- **Development**: `http://localhost:3000`
- **Production**: `https://smart-todos-web.vercel.app`

Configuration is in `lib/config/api_config.dart`.

## Features

### Implemented
- ✅ Project structure and architecture
- ✅ Design system (colors, typography, spacing)
- ✅ Theme configuration
- ✅ Data models matching Prisma schema
- ✅ API configuration

### In Progress
- 🚧 Base UI components library
- 🚧 API client with Dio
- 🚧 Authentication screens

### Planned
- 📋 Tasks list screen with drag & drop
- 📋 Task detail sheet
- 📋 Chat with coach drawer
- 📋 Pomodoro timer modal
- 📋 Calendar view
- 📋 Profile and settings
- 📋 Background notifications
- 📋 Offline support

## Development

### Code Generation

Run this command after modifying models with annotations:

```bash
flutter pub run build_runner watch
```

This will automatically regenerate code when files change.

### Running Tests

```bash
flutter test
```

### Building for Production

```bash
# iOS
flutter build ios

# Android
flutter build apk
flutter build appbundle
```

## Dependencies

Key dependencies used in this project:

- **State Management**: flutter_riverpod
- **Routing**: go_router
- **Networking**: dio, retrofit
- **Local Storage**: shared_preferences, hive_flutter
- **UI**: flutter_slidable, cached_network_image
- **Notifications**: flutter_local_notifications
- **Background Tasks**: workmanager
- **Icons**: lucide_icons

## API Endpoints

The app uses these Next.js API routes:

- `/api/auth/*` - Authentication
- `/api/tasks` - Tasks CRUD
- `/api/tasks/breakdown` - Task breakdown with AI
- `/api/tasks/prioritize` - Task prioritization
- `/api/tasks/refine` - Task refinement
- `/api/chat` - Coach chat
- `/api/pomodoro/*` - Pomodoro timer
- `/api/profile` - User profile
- `/api/settings` - User settings
- `/api/tags` - Tags management
- `/api/coaches` - Coaches
- `/api/calendar-events` - Calendar integration
- `/api/notifications` - Notifications

## Screenshots

See `apps/web/screenshots/` for reference UI that this app replicates.

## Contributing

1. Follow the existing code structure
2. Match the web app UI pixel-perfectly
3. Use the design system (colors, spacing, typography)
4. Write tests for new features
5. Run `flutter analyze` before committing

## License

Private project - SmartTodos