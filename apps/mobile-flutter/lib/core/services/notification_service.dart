import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:permission_handler/permission_handler.dart';

/// Service for managing local notifications display and permissions
class NotificationService {
  static final NotificationService _instance = NotificationService._internal();
  factory NotificationService() => _instance;
  NotificationService._internal();

  final FlutterLocalNotificationsPlugin _notifications =
      FlutterLocalNotificationsPlugin();

  /// Callback when user taps on notification
  Function(String? taskId)? onNotificationTap;

  /// Initialize notification service
  Future<void> initialize() async {
    debugPrint('[NotificationService] Initializing...');

    // Android initialization
    const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');

    // iOS initialization
    const iosSettings = DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );

    const initSettings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );

    await _notifications.initialize(
      initSettings,
      onDidReceiveNotificationResponse: _onNotificationResponse,
    );

    // Create Android notification channels
    await _createAndroidChannels();

    debugPrint('[NotificationService] Initialized successfully');
  }

  /// Create Android notification channels
  Future<void> _createAndroidChannels() async {
    final androidPlugin =
        _notifications.resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>();

    if (androidPlugin == null) return;

    // Urgent tasks channel (Priority 9-10)
    await androidPlugin.createNotificationChannel(
      const AndroidNotificationChannel(
        'urgent-tasks',
        'Urgent Tasks',
        description: 'Notifications for urgent and overdue tasks',
        importance: Importance.high,
        playSound: true,
        enableVibration: true,
      ),
    );

    // Important tasks channel (Priority 7-8)
    await androidPlugin.createNotificationChannel(
      const AndroidNotificationChannel(
        'important-tasks',
        'Important Tasks',
        description: 'Notifications for important upcoming tasks',
        importance: Importance.defaultImportance,
        playSound: true,
        enableVibration: true,
      ),
    );

    // Default channel (Priority 1-6)
    await androidPlugin.createNotificationChannel(
      const AndroidNotificationChannel(
        'default',
        'Task Reminders',
        description: 'General task reminders and updates',
        importance: Importance.defaultImportance,
        playSound: true,
      ),
    );

    debugPrint('[NotificationService] Android channels created');
  }

  /// Handle notification tap
  void _onNotificationResponse(NotificationResponse response) {
    final taskId = response.payload;
    debugPrint('[NotificationService] Notification tapped: taskId=$taskId');

    if (onNotificationTap != null && taskId != null) {
      onNotificationTap!(taskId);
    }
  }

  /// Request notification permissions
  Future<bool> requestPermissions() async {
    debugPrint('[NotificationService] Requesting permissions...');

    if (defaultTargetPlatform == TargetPlatform.iOS) {
      // iOS permissions
      final iosPlugin =
          _notifications.resolvePlatformSpecificImplementation<
              IOSFlutterLocalNotificationsPlugin>();

      final granted = await iosPlugin?.requestPermissions(
        alert: true,
        badge: true,
        sound: true,
      );

      debugPrint('[NotificationService] iOS permission: $granted');
      return granted ?? false;
    } else if (defaultTargetPlatform == TargetPlatform.android) {
      // Android 13+ permissions
      final status = await Permission.notification.request();
      debugPrint('[NotificationService] Android permission: $status');
      return status.isGranted;
    }

    return false;
  }

  /// Check if notifications are enabled
  Future<bool> areNotificationsEnabled() async {
    if (defaultTargetPlatform == TargetPlatform.iOS) {
      final iosPlugin =
          _notifications.resolvePlatformSpecificImplementation<
              IOSFlutterLocalNotificationsPlugin>();

      final granted = await iosPlugin?.requestPermissions(
        alert: false, // Don't request, just check
        badge: false,
        sound: false,
      );

      return granted ?? false;
    } else if (defaultTargetPlatform == TargetPlatform.android) {
      final status = await Permission.notification.status;
      return status.isGranted;
    }

    return false;
  }

  /// Show a local notification
  Future<void> showNotification({
    required int id,
    required String title,
    required String body,
    required String channelId,
    String? taskId,
  }) async {
    debugPrint('[NotificationService] Showing notification: $title');

    // Determine importance based on channel
    final importance = channelId == 'urgent-tasks'
        ? Importance.high
        : channelId == 'important-tasks'
            ? Importance.defaultImportance
            : Importance.defaultImportance;

    final androidDetails = AndroidNotificationDetails(
      channelId,
      _getChannelName(channelId),
      channelDescription: _getChannelDescription(channelId),
      importance: importance,
      priority: channelId == 'urgent-tasks' ? Priority.high : Priority.defaultPriority,
      playSound: true,
      enableVibration: true,
    );

    const iosDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );

    final details = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    await _notifications.show(
      id,
      title,
      body,
      details,
      payload: taskId,
    );
  }

  /// Get channel name
  String _getChannelName(String channelId) {
    switch (channelId) {
      case 'urgent-tasks':
        return 'Urgent Tasks';
      case 'important-tasks':
        return 'Important Tasks';
      default:
        return 'Task Reminders';
    }
  }

  /// Get channel description
  String _getChannelDescription(String channelId) {
    switch (channelId) {
      case 'urgent-tasks':
        return 'Notifications for urgent and overdue tasks';
      case 'important-tasks':
        return 'Notifications for important upcoming tasks';
      default:
        return 'General task reminders and updates';
    }
  }

  /// Cancel a notification
  Future<void> cancelNotification(int id) async {
    await _notifications.cancel(id);
  }

  /// Cancel all notifications
  Future<void> cancelAllNotifications() async {
    await _notifications.cancelAll();
  }

  /// Get pending notifications
  Future<List<PendingNotificationRequest>> getPendingNotifications() async {
    return await _notifications.pendingNotificationRequests();
  }
}
