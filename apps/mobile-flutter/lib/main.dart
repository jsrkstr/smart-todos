import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_core/firebase_core.dart';
import 'theme/app_theme.dart';
import 'theme/app_colors.dart';
import 'features/auth/screens/login_screen.dart';
import 'features/auth/providers/auth_provider.dart';
import 'features/tasks/screens/tasks_screen.dart';
import 'core/services/notification_service.dart';
import 'core/services/push_token_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Firebase
  try {
    await Firebase.initializeApp();
    print('[main] Firebase initialized');
  } catch (e) {
    print('[main] Firebase initialization error: $e');
    // Continue even if Firebase fails (for development without Firebase config)
  }

  // Initialize notification services
  final notificationService = NotificationService();
  final pushTokenService = PushTokenService();

  try {
    await notificationService.initialize();
    print('[main] Notification service initialized');

    await pushTokenService.initialize();
    print('[main] Push token service initialized');

    // Set up notification tap handler to navigate to task
    notificationService.onNotificationTap = (taskId) {
      print('[main] Notification tapped for task: $taskId');
      // Navigation will be handled by router when available
    };
  } catch (e) {
    print('[main] Notification initialization error: $e');
  }

  runApp(
    const ProviderScope(
      child: SmartTodosApp(),
    ),
  );
}

class SmartTodosApp extends ConsumerWidget {
  const SmartTodosApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return MaterialApp(
      title: 'SmartTodos',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      home: const AppRoot(),
    );
  }
}

/// App root that handles auth routing
class AppRoot extends ConsumerWidget {
  const AppRoot({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);

    print('AppRoot - isLoading: ${authState.isLoading}, user: ${authState.user}, error: ${authState.error}');
    print('AppRoot - isAuthenticated: ${authState.isAuthenticated}');

    // Show splash screen while checking session
    if (authState.isLoading && authState.user == null && authState.error == null) {
      print('AppRoot - Showing splash screen');
      return const SplashScreen();
    }

    // Show main app if authenticated
    if (authState.isAuthenticated) {
      print('AppRoot - Showing tasks screen');
      return const TasksScreen();
    }

    // Show login screen if not authenticated
    print('AppRoot - Showing login screen');
    return const LoginScreen();
  }
}

/// Splash screen shown while checking authentication
class SplashScreen extends StatelessWidget {
  const SplashScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.check_circle_outline,
              size: 80,
              color: AppColors.primary,
            ),
            const SizedBox(height: 24),
            Text(
              'SmartTodos',
              style: Theme.of(context).textTheme.displayLarge,
            ),
            const SizedBox(height: 8),
            Text(
              'Flutter Mobile App',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppColors.mutedForeground,
                  ),
            ),
            const SizedBox(height: 48),
            const CircularProgressIndicator(
              valueColor: AlwaysStoppedAnimation<Color>(AppColors.primary),
            ),
          ],
        ),
      ),
    );
  }
}

/// Placeholder home screen (will be replaced with actual tasks screen)
class PlaceholderHomeScreen extends ConsumerWidget {
  const PlaceholderHomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider).user;

    return Scaffold(
      appBar: AppBar(
        title: const Text('SmartTodos'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () {
              ref.read(authProvider.notifier).logout();
            },
          ),
        ],
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.check_circle,
              size: 80,
              color: AppColors.primary,
            ),
            const SizedBox(height: 24),
            Text(
              'Welcome back!',
              style: Theme.of(context).textTheme.displayLarge,
            ),
            const SizedBox(height: 8),
            Text(
              user?.name ?? user?.email ?? 'User',
              style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    color: AppColors.mutedForeground,
                  ),
            ),
            const SizedBox(height: 48),
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 32),
              child: Text(
                'Tasks screen coming next...',
                textAlign: TextAlign.center,
                style: TextStyle(color: AppColors.mutedForeground),
              ),
            ),
          ],
        ),
      ),
    );
  }
}