import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import '../../../core/models/notification.dart';
import '../../../core/api/api_service.dart';
import '../../../shared/providers/api_provider.dart';

class NotificationsState {
  final List<AppNotification> notifications;
  final bool isLoading;
  final bool isLoadingMore;
  final bool hasMore;
  final String? error;

  const NotificationsState({
    this.notifications = const [],
    this.isLoading = false,
    this.isLoadingMore = false,
    this.hasMore = true,
    this.error,
  });

  NotificationsState copyWith({
    List<AppNotification>? notifications,
    bool? isLoading,
    bool? isLoadingMore,
    bool? hasMore,
    String? error,
  }) {
    return NotificationsState(
      notifications: notifications ?? this.notifications,
      isLoading: isLoading ?? this.isLoading,
      isLoadingMore: isLoadingMore ?? this.isLoadingMore,
      hasMore: hasMore ?? this.hasMore,
      error: error,
    );
  }

  int get unreadCount => notifications.where((n) => !n.read).length;
}

class NotificationsNotifier extends StateNotifier<NotificationsState> {
  final ApiService _apiService;
  static const String _cacheKey = 'notifications_cache';
  static const int _pageSize = 20;

  NotificationsNotifier(this._apiService) : super(const NotificationsState()) {
    _loadFromCache();
    fetchNotifications();
  }

  Future<void> _loadFromCache() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final cached = prefs.getString(_cacheKey);
      if (cached != null) {
        final List<dynamic> jsonList = json.decode(cached);
        final notifications =
            jsonList.map((j) => AppNotification.fromJson(j)).toList();
        state = state.copyWith(notifications: notifications);
      }
    } catch (e) {
      print('Error loading notifications cache: $e');
    }
  }

  Future<void> _saveToCache() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final jsonList = state.notifications.map((n) => n.toJson()).toList();
      await prefs.setString(_cacheKey, json.encode(jsonList));
    } catch (e) {
      print('Error saving notifications cache: $e');
    }
  }

  Future<void> fetchNotifications() async {
    state = state.copyWith(isLoading: true);
    try {
      final notifications = await _apiService.getNotifications(
        limit: _pageSize,
        skip: 0,
      );
      state = NotificationsState(
        notifications: notifications,
        isLoading: false,
        hasMore: notifications.length >= _pageSize,
      );
      await _saveToCache();
    } catch (e) {
      print('Error fetching notifications: $e');
      state = NotificationsState(
        notifications: state.notifications,
        isLoading: false,
        hasMore: false,
        error: e.toString(),
      );
    }
  }

  Future<void> loadMoreNotifications() async {
    if (state.isLoadingMore || !state.hasMore) return;

    state = state.copyWith(isLoadingMore: true);
    try {
      final newNotifications = await _apiService.getNotifications(
        limit: _pageSize,
        skip: state.notifications.length,
      );

      final allNotifications = [...state.notifications, ...newNotifications];

      state = state.copyWith(
        notifications: allNotifications,
        isLoadingMore: false,
        hasMore: newNotifications.length >= _pageSize,
      );
      await _saveToCache();
    } catch (e) {
      print('Error loading more notifications: $e');
      state = state.copyWith(
        isLoadingMore: false,
        error: e.toString(),
      );
    }
  }

  Future<void> markAsRead(String id) async {
    // Optimistic update: immediately mark as read in UI
    final optimisticList = state.notifications.map((n) {
      return n.id == id ? n.copyWith(read: true) : n;
    }).toList();
    state = state.copyWith(notifications: optimisticList);

    try {
      final updated = await _apiService.markNotificationAsRead(id, true);

      final updatedList = state.notifications.map((n) {
        return n.id == id ? updated : n;
      }).toList();

      state = state.copyWith(notifications: updatedList);
      await _saveToCache();
    } catch (e) {
      print('Error marking notification as read: $e');
      // Revert optimistic update on error
      final revertedList = state.notifications.map((n) {
        return n.id == id ? n.copyWith(read: false) : n;
      }).toList();
      state = state.copyWith(notifications: revertedList, error: e.toString());
    }
  }

  Future<void> markAllAsRead() async {
    try {
      await _apiService.markAllNotificationsAsRead();

      final updatedList =
          state.notifications.map((n) => n.copyWith(read: true)).toList();

      state = state.copyWith(notifications: updatedList);
      await _saveToCache();
    } catch (e) {
      print('Error marking all as read: $e');
      state = state.copyWith(error: e.toString());
    }
  }

  void clearError() {
    state = state.copyWith(error: null);
  }
}

final notificationsProvider =
    StateNotifierProvider<NotificationsNotifier, NotificationsState>((ref) {
  final apiService = ref.watch(apiServiceProvider);
  return NotificationsNotifier(apiService);
});
