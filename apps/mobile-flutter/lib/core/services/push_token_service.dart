import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'notification_service.dart';

/// Service for managing Firebase Cloud Messaging (FCM) push tokens
/// FCM tokens are compatible with Expo Push Notification service
class PushTokenService {
  static final PushTokenService _instance = PushTokenService._internal();
  factory PushTokenService() => _instance;
  PushTokenService._internal();

  final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  final NotificationService _notificationService = NotificationService();

  static const String _tokenKey = 'expo_push_token';
  String? _currentToken;

  /// Callback when token changes
  Function(String token)? onTokenRefresh;

  /// Callback when notification received in foreground
  Function(RemoteMessage message)? onForegroundMessage;

  /// Initialize push token service
  Future<void> initialize() async {
    debugPrint('[PushTokenService] Initializing...');

    // Request permission first
    final permission = await _requestPermission();
    if (!permission) {
      debugPrint('[PushTokenService] Permission denied');
      return;
    }

    // Get FCM token
    await _getAndStoreToken();

    // Listen for token refresh
    _messaging.onTokenRefresh.listen((newToken) {
      debugPrint('[PushTokenService] Token refreshed: $newToken');
      _currentToken = newToken;
      _saveTokenLocally(newToken);

      if (onTokenRefresh != null) {
        onTokenRefresh!(newToken);
      }
    });

    // Handle foreground messages
    FirebaseMessaging.onMessage.listen(_handleForegroundMessage);

    // Handle background messages
    FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

    // Handle notification tap when app is in background or terminated
    FirebaseMessaging.onMessageOpenedApp.listen(_handleNotificationTap);

    // Check if app was opened from notification
    final initialMessage = await _messaging.getInitialMessage();
    if (initialMessage != null) {
      _handleNotificationTap(initialMessage);
    }

    debugPrint('[PushTokenService] Initialized successfully');
  }

  /// Request notification permission
  Future<bool> _requestPermission() async {
    final settings = await _messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
      provisional: false,
    );

    final granted = settings.authorizationStatus == AuthorizationStatus.authorized ||
        settings.authorizationStatus == AuthorizationStatus.provisional;

    debugPrint('[PushTokenService] Permission: ${settings.authorizationStatus}');
    return granted;
  }

  /// Get FCM token and store it
  Future<void> _getAndStoreToken() async {
    try {
      // Get FCM token
      final token = await _messaging.getToken();

      if (token != null) {
        // Convert FCM token to Expo-compatible format
        final expoToken = 'ExponentPushToken[$token]';
        _currentToken = expoToken;

        debugPrint('[PushTokenService] Token obtained: ${expoToken.substring(0, 50)}...');

        // Save locally
        await _saveTokenLocally(expoToken);
      } else {
        debugPrint('[PushTokenService] Failed to get token');
      }
    } catch (e) {
      debugPrint('[PushTokenService] Error getting token: $e');
    }
  }

  /// Save token to local storage
  Future<void> _saveTokenLocally(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, token);
    debugPrint('[PushTokenService] Token saved locally');
  }

  /// Get stored token
  Future<String?> getToken() async {
    if (_currentToken != null) {
      return _currentToken;
    }

    // Try to get from local storage
    final prefs = await SharedPreferences.getInstance();
    _currentToken = prefs.getString(_tokenKey);

    // If not in storage, get new token
    if (_currentToken == null) {
      await _getAndStoreToken();
    }

    return _currentToken;
  }

  /// Clear stored token
  Future<void> clearToken() async {
    _currentToken = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
    await _messaging.deleteToken();
    debugPrint('[PushTokenService] Token cleared');
  }

  /// Handle foreground message
  void _handleForegroundMessage(RemoteMessage message) {
    debugPrint('[PushTokenService] Foreground message: ${message.notification?.title}');

    // Notify callback
    if (onForegroundMessage != null) {
      onForegroundMessage!(message);
    }

    // Show local notification
    if (message.notification != null) {
      final taskId = message.data['taskId'] as String?;
      final channelId = message.data['channelId'] as String? ?? 'default';

      _notificationService.showNotification(
        id: message.hashCode,
        title: message.notification!.title ?? 'SmartTodos',
        body: message.notification!.body ?? '',
        channelId: channelId,
        taskId: taskId,
      );
    }
  }

  /// Handle notification tap
  void _handleNotificationTap(RemoteMessage message) {
    debugPrint('[PushTokenService] Notification tapped: ${message.data}');

    final taskId = message.data['taskId'] as String?;
    if (taskId != null && _notificationService.onNotificationTap != null) {
      _notificationService.onNotificationTap!(taskId);
    }
  }

  /// Check if token exists
  bool hasToken() {
    return _currentToken != null && _currentToken!.isNotEmpty;
  }
}

/// Background message handler (top-level function required by Firebase)
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  debugPrint('[PushTokenService] Background message: ${message.notification?.title}');
  // Firebase handles showing the notification automatically in background
}
