import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/calendar_api_service.dart';
import '../../../core/models/calendar_connection.dart';
import '../../../shared/providers/api_provider.dart';

// Calendar API Service Provider
final calendarApiServiceProvider = Provider<CalendarApiService>((ref) {
  final dio = ref.watch(dioProvider);
  return CalendarApiService(dio);
});

// Calendar Connections State
class CalendarConnectionsState {
  final List<CalendarConnection> connections;
  final bool isLoading;
  final String? error;

  CalendarConnectionsState({
    this.connections = const [],
    this.isLoading = false,
    this.error,
  });

  CalendarConnectionsState copyWith({
    List<CalendarConnection>? connections,
    bool? isLoading,
    String? error,
  }) {
    return CalendarConnectionsState(
      connections: connections ?? this.connections,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

// Calendar Connections Provider
class CalendarConnectionsNotifier extends StateNotifier<CalendarConnectionsState> {
  final CalendarApiService _calendarApiService;

  CalendarConnectionsNotifier(this._calendarApiService)
      : super(CalendarConnectionsState()) {
    loadConnections();
  }

  Future<void> loadConnections() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final connections = await _calendarApiService.getConnections();
      state = state.copyWith(connections: connections, isLoading: false);
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  Future<void> updateConnection(
    String connectionId, {
    String? name,
    bool? isActive,
    String? syncFrequency,
  }) async {
    try {
      await _calendarApiService.updateConnection(
        connectionId,
        name: name,
        isActive: isActive,
        syncFrequency: syncFrequency,
      );
      await loadConnections();
    } catch (e) {
      state = state.copyWith(error: e.toString());
      rethrow;
    }
  }

  Future<void> deleteConnection(String connectionId) async {
    try {
      await _calendarApiService.deleteConnection(connectionId);
      await loadConnections();
    } catch (e) {
      state = state.copyWith(error: e.toString());
      rethrow;
    }
  }

  Future<void> refresh() async {
    await loadConnections();
  }
}

final calendarConnectionsProvider =
    StateNotifierProvider<CalendarConnectionsNotifier, CalendarConnectionsState>(
  (ref) {
    final calendarApiService = ref.watch(calendarApiServiceProvider);
    return CalendarConnectionsNotifier(calendarApiService);
  },
);

// Sync Status State
class SyncStatusState {
  final List<SyncStatus> statuses;
  final bool isLoading;
  final bool isSyncing;
  final String? error;

  SyncStatusState({
    this.statuses = const [],
    this.isLoading = false,
    this.isSyncing = false,
    this.error,
  });

  SyncStatusState copyWith({
    List<SyncStatus>? statuses,
    bool? isLoading,
    bool? isSyncing,
    String? error,
  }) {
    return SyncStatusState(
      statuses: statuses ?? this.statuses,
      isLoading: isLoading ?? this.isLoading,
      isSyncing: isSyncing ?? this.isSyncing,
      error: error,
    );
  }
}

// Sync Status Provider
class SyncStatusNotifier extends StateNotifier<SyncStatusState> {
  final CalendarApiService _calendarApiService;

  SyncStatusNotifier(this._calendarApiService) : super(SyncStatusState()) {
    loadSyncStatus();
  }

  Future<void> loadSyncStatus() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final statuses = await _calendarApiService.getSyncStatus();
      state = state.copyWith(statuses: statuses, isLoading: false);
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  Future<SyncResult> triggerSync({String? connectionId}) async {
    state = state.copyWith(isSyncing: true, error: null);
    try {
      final result = await _calendarApiService.triggerSync(
        connectionId: connectionId,
      );
      await loadSyncStatus();
      state = state.copyWith(isSyncing: false);
      return result;
    } catch (e) {
      state = state.copyWith(
        isSyncing: false,
        error: e.toString(),
      );
      rethrow;
    }
  }

  Future<void> refresh() async {
    await loadSyncStatus();
  }
}

final syncStatusProvider =
    StateNotifierProvider<SyncStatusNotifier, SyncStatusState>(
  (ref) {
    final calendarApiService = ref.watch(calendarApiServiceProvider);
    return SyncStatusNotifier(calendarApiService);
  },
);
