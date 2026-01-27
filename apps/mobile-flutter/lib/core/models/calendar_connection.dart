import 'package:json_annotation/json_annotation.dart';

part 'calendar_connection.g.dart';

@JsonSerializable()
class CalendarConnection {
  final String id;
  final String provider;
  final String? name;
  final bool isActive;
  final String? calendarId;
  final DateTime? lastSynced;
  final String syncFrequency;
  final DateTime? tokenExpiry;
  final DateTime createdAt;
  final DateTime updatedAt;

  CalendarConnection({
    required this.id,
    required this.provider,
    this.name,
    required this.isActive,
    this.calendarId,
    this.lastSynced,
    required this.syncFrequency,
    this.tokenExpiry,
    required this.createdAt,
    required this.updatedAt,
  });

  factory CalendarConnection.fromJson(Map<String, dynamic> json) =>
      _$CalendarConnectionFromJson(json);

  Map<String, dynamic> toJson() => _$CalendarConnectionToJson(this);
}

@JsonSerializable()
class SyncStatus {
  final String id;
  final String? name;
  final String provider;
  final bool isActive;
  final DateTime? lastSynced;
  final int eventCount;

  SyncStatus({
    required this.id,
    this.name,
    required this.provider,
    required this.isActive,
    this.lastSynced,
    required this.eventCount,
  });

  factory SyncStatus.fromJson(Map<String, dynamic> json) =>
      _$SyncStatusFromJson(json);

  Map<String, dynamic> toJson() => _$SyncStatusToJson(this);
}

@JsonSerializable()
class SyncResult {
  final int? total;
  final int? success;
  final int? failed;
  final List<ConnectionSyncResult>? results;
  final String? message;
  final bool? connectionSuccess;
  final String? error;

  SyncResult({
    this.total,
    this.success,
    this.failed,
    this.results,
    this.message,
    this.connectionSuccess,
    this.error,
  });

  factory SyncResult.fromJson(Map<String, dynamic> json) =>
      _$SyncResultFromJson(json);

  Map<String, dynamic> toJson() => _$SyncResultToJson(this);
}

@JsonSerializable()
class ConnectionSyncResult {
  final String connectionId;
  final String? name;
  final bool success;
  final String? error;

  ConnectionSyncResult({
    required this.connectionId,
    this.name,
    required this.success,
    this.error,
  });

  factory ConnectionSyncResult.fromJson(Map<String, dynamic> json) =>
      _$ConnectionSyncResultFromJson(json);

  Map<String, dynamic> toJson() => _$ConnectionSyncResultToJson(this);
}
