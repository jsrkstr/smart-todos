# Flutter Setup Guide

## Quick Start Commands

Run these commands in the `apps/mobile-flutter` directory:

### 1. Install Dependencies
```bash
cd apps/mobile-flutter
flutter pub get
```

### 2. Generate Code Files
The project uses code generation for JSON serialization and API clients. Run:

```bash
flutter pub run build_runner build --delete-conflicting-outputs
```

Or to watch for changes automatically:

```bash
flutter pub run build_runner watch
```

### 3. Run the App

**iOS Simulator:**
```bash
flutter run -d ios
```

**Android Emulator:**
```bash
flutter run -d android
```

**List all devices:**
```bash
flutter devices
```

**Run on specific device:**
```bash
flutter run -d <device-id>
```

## Common Issues & Solutions

### Issue: Missing .g.dart files

**Error:**
```
Error: 'user.g.dart' doesn't exist
```

**Solution:**
Run the code generator:
```bash
flutter pub run build_runner build --delete-conflicting-outputs
```

### Issue: Flutter command not found

**Solution:**
Make sure Flutter is in your PATH:
```bash
export PATH="$PATH:`pwd`/flutter/bin"
```

Or add to your `~/.zshrc` or `~/.bashrc`:
```bash
export PATH="$PATH:/path/to/flutter/bin"
```

Then reload:
```bash
source ~/.zshrc  # or source ~/.bashrc
```

### Issue: iOS build fails

**Solution:**
1. Make sure you have Xcode installed
2. Run:
   ```bash
   cd ios
   pod install
   cd ..
   ```

### Issue: Android build fails

**Solution:**
1. Make sure Android SDK is installed
2. Accept licenses:
   ```bash
   flutter doctor --android-licenses
   ```

## Development Workflow

### 1. Adding New Models

When you add new models with `@JsonSerializable()`:

1. Create the model file with annotations
2. Run code generation:
   ```bash
   flutter pub run build_runner build --delete-conflicting-outputs
   ```

### 2. Adding New Dependencies

1. Add to `pubspec.yaml`:
   ```yaml
   dependencies:
     package_name: ^version
   ```

2. Get the package:
   ```bash
   flutter pub get
   ```

### 3. Running Tests

```bash
flutter test
```

### 4. Analyzing Code

```bash
flutter analyze
```

### 5. Formatting Code

```bash
flutter format lib/
```

## Building for Production

### iOS
```bash
flutter build ios --release
```

Then open `ios/Runner.xcworkspace` in Xcode and archive.

### Android APK
```bash
flutter build apk --release
```

### Android App Bundle (for Play Store)
```bash
flutter build appbundle --release
```

## Project Status

### ✅ Completed
- Project structure and architecture
- Design system (colors, typography, spacing)
- Theme configuration matching web app
- Data models (User, Task, Tag, Notification)
- API configuration
- Base UI components:
  - AppButton (5 variants)
  - AppCheckbox (circular)
  - AppCard
  - AppInput / AppTextarea

### 🚧 In Progress
- Additional UI components
- API client with Dio
- Authentication screens

### 📋 Todo
- Tasks list screen
- Task detail sheet
- Chat drawer
- Pomodoro timer modal
- Navigation setup
- Background notifications
- Offline storage

## Next Steps

After running `flutter pub get` and `build_runner`, continue with:

1. **API Client**: Create Dio client and Retrofit API service
2. **Authentication**: Login/signup screens
3. **Tasks Screen**: Main tasks list with all features
4. **Task Detail**: Right-side sheet with subtasks
5. **Chat**: Bottom drawer for coach chat
6. **Pomodoro**: Timer modal
7. **Native Features**: Notifications, background tasks

## Useful Flutter Commands

```bash
# Check Flutter installation
flutter doctor

# List available devices
flutter devices

# Run with hot reload
flutter run

# Clear build cache
flutter clean

# Update dependencies
flutter pub upgrade

# Generate app icons
flutter pub run flutter_launcher_icons:main

# Generate splash screens
flutter pub run flutter_native_splash:create
```

## API Testing

The app connects to your Next.js backend:
- **Dev**: `http://localhost:3000`
- **Prod**: `https://smart-todos-web.vercel.app`

Make sure your Next.js app is running locally for development:
```bash
cd apps/web
npm run dev
```

## Resources

- [Flutter Documentation](https://docs.flutter.dev)
- [Riverpod Documentation](https://riverpod.dev)
- [Dio Documentation](https://pub.dev/packages/dio)
- [Go Router Documentation](https://pub.dev/packages/go_router)