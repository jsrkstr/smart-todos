import 'package:dio/dio.dart';
import '../models/calendar_connection.dart';

class CalendarApiService {
  final Dio _dio;

  CalendarApiService(this._dio);

  // Get all calendar connections
  Future<List<CalendarConnection>> getConnections() async {
    try {
      final response = await _dio.get('/api/calendar/connections');
      final List<dynamic> data = response.data;
      return data.map((json) => CalendarConnection.fromJson(json)).toList();
    } catch (e) {
      throw Exception('Failed to fetch calendar connections: $e');
    }
  }

  // Get a specific connection
  Future<CalendarConnection> getConnection(String connectionId) async {
    try {
      final response = await _dio.get('/api/calendar/connections/$connectionId');
      return CalendarConnection.fromJson(response.data);
    } catch (e) {
      throw Exception('Failed to fetch calendar connection: $e');
    }
  }

  // Update a connection
  Future<CalendarConnection> updateConnection(
    String connectionId, {
    String? name,
    bool? isActive,
    String? syncFrequency,
  }) async {
    try {
      final response = await _dio.put(
        '/api/calendar/connections/$connectionId',
        data: {
          if (name != null) 'name': name,
          if (isActive != null) 'isActive': isActive,
          if (syncFrequency != null) 'syncFrequency': syncFrequency,
        },
      );
      return CalendarConnection.fromJson(response.data);
    } catch (e) {
      throw Exception('Failed to update calendar connection: $e');
    }
  }

  // Delete a connection
  Future<void> deleteConnection(String connectionId) async {
    try {
      await _dio.delete('/api/calendar/connections/$connectionId');
    } catch (e) {
      throw Exception('Failed to delete calendar connection: $e');
    }
  }

  // Get sync status
  Future<List<SyncStatus>> getSyncStatus() async {
    try {
      final response = await _dio.get('/api/calendar/sync');
      final data = response.data;
      final List<dynamic> connections = data['connections'] ?? [];
      return connections.map((json) => SyncStatus.fromJson(json)).toList();
    } catch (e) {
      throw Exception('Failed to fetch sync status: $e');
    }
  }

  // Trigger manual sync
  Future<SyncResult> triggerSync({String? connectionId}) async {
    try {
      final response = await _dio.post(
        '/api/calendar/sync',
        data: {
          if (connectionId != null) 'connectionId': connectionId,
        },
      );
      return SyncResult.fromJson(response.data);
    } catch (e) {
      throw Exception('Failed to trigger calendar sync: $e');
    }
  }

  // Connect to Google Calendar (opens browser for OAuth)
  String getGoogleCalendarConnectUrl(String baseUrl) {
    return '$baseUrl/api/calendar/connect';
  }
}
