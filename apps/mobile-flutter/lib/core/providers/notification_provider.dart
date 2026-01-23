import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import '../services/notification_service.dart';
import '../services/push_token_service.dart';
import '../api/api_service.dart';
import '../../shared/providers/api_provider.dart';

/// Notification state
class NotificationState {
  final bool permissionsGranted;
  final bool tokenRegistered;
  final String? pushToken;
  final bool isLoading;
  final String? error;

  const NotificationState({
    this.permissionsGranted = false,
    this.tokenRegistered = false,
    this.pushToken,
    this.isLoading = false,
    this.error,
  });

  NotificationState copyWith({
    bool? permissionsGranted,
    bool? tokenRegistered,
    String? pushToken,
    bool? isLoading,
    String? error,
  }) {
    return NotificationState(
      permissionsGranted: permissionsGranted ?? this.permissionsGranted,
      tokenRegistered: tokenRegistered ?? this.tokenRegistered,
      pushToken: pushToken ?? this.pushToken,
      isLoading: isLoading ?? this.isLoading,
      error: error ?? this.error,
    );
  }
}

/// Notification provider
class NotificationNotifier extends StateNotifier<NotificationState> {
  final NotificationService _notificationService;
  final PushTokenService _pushTokenService;
  final ApiService _apiService;

  NotificationNotifier({
    required NotificationService notificationService,
    required PushTokenService pushTokenService,
    required ApiService apiService,
  })  : _notificationService = notificationService,
        _pushTokenService = pushTokenService,
        _apiService = apiService,
        super(const NotificationState());

  /// Initialize notification services
  Future<void> initialize() async {
    try {
      state = state.copyWith(isLoading: true, error: null);

      // Initialize notification service
      await _notificationService.initialize();

      // Initialize push token service
      await _pushTokenService.initialize();

      // Set up token refresh callback
      _pushTokenService.onTokenRefresh = (token) {
        _registerToken(token);
      };

      // Set up foreground message handler
      _pushTokenService.onForegroundMessage = (message) {
        _handleForegroundMessage(message);
      };

      // Check permissions
      final permissionsGranted = await _notificationService.areNotificationsEnabled();

      // Get token if permissions granted
      String? token;
      if (permissionsGranted) {
        token = await _pushTokenService.getToken();
      }

      state = state.copyWith(
        permissionsGranted: permissionsGranted,
        pushToken: token,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  /// Request notification permissions
  Future<bool> requestPermissions() async {
    try {
      state = state.copyWith(isLoading: true, error: null);

      final granted = await _notificationService.requestPermissions();

      if (granted) {
        // Get push token after permissions granted
        final token = await _pushTokenService.getToken();

        state = state.copyWith(
          permissionsGranted: true,
          pushToken: token,
          isLoading: false,
        );

        // Register token with backend
        if (token != null) {
          await _registerToken(token);
        }
      } else {
        state = state.copyWith(
          permissionsGranted: false,
          isLoading: false,
        );
      }

      return granted;
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
      return false;
    }
  }

  /// Register push token with backend
  Future<void> registerPushToken() async {
    try {
      final token = await _pushTokenService.getToken();
      if (token != null) {
        await _registerToken(token);
      }
    } catch (e) {
      state = state.copyWith(error: e.toString());
    }
  }

  /// Internal method to register token
  Future<void> _registerToken(String token) async {
    try {
      await _apiService.registerPushToken(token);

      state = state.copyWith(
        tokenRegistered: true,
        pushToken: token,
      );
    } catch (e) {
      state = state.copyWith(
        tokenRegistered: false,
        error: 'Failed to register token: $e',
      );
    }
  }

  /// Handle foreground message
  void _handleForegroundMessage(RemoteMessage message) {
    // Additional handling if needed
    // The PushTokenService already shows the notification
  }

  /// Clear push token (on logout)
  Future<void> clearPushToken() async {
    try {
      await _pushTokenService.clearToken();

      state = state.copyWith(
        tokenRegistered: false,
        pushToken: null,
      );
    } catch (e) {
      state = state.copyWith(error: e.toString());
    }
  }

  /// Update notification settings on backend
  Future<void> updateNotificationSettings(bool enabled) async {
    try {
      await _apiService.updateNotificationSettings(enabled);
    } catch (e) {
      state = state.copyWith(error: e.toString());
    }
  }
}

/// Provider for notification state
final notificationProvider =
    StateNotifierProvider<NotificationNotifier, NotificationState>((ref) {
  final apiService = ref.watch(apiServiceProvider);

  return NotificationNotifier(
    notificationService: NotificationService(),
    pushTokenService: PushTokenService(),
    apiService: apiService,
  );
});
