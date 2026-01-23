import 'package:json_annotation/json_annotation.dart';

part 'physical_context.g.dart';

/// Physical context data collected from device sensors
@JsonSerializable()
class PhysicalContext {
  /// User activity type detected from accelerometer
  final String activity; // stationary, walking, running, driving, unknown

  /// Confidence level of activity detection (0.0 to 1.0)
  final double confidence;

  /// Type of location (privacy-preserving, not exact coordinates)
  final String locationType; // home, work, commuting, shopping, gym, restaurant, unknown

  /// ID of saved location if detected
  final String? savedLocationId;

  /// Whether device screen is currently on
  final bool screenOn;

  /// Battery level (0-100 percentage)
  final int battery;

  /// Whether Do Not Disturb mode is active
  final bool doNotDisturb;

  /// Timestamp when context was captured
  final DateTime timestamp;

  PhysicalContext({
    required this.activity,
    required this.confidence,
    required this.locationType,
    this.savedLocationId,
    required this.screenOn,
    required this.battery,
    required this.doNotDisturb,
    required this.timestamp,
  });

  factory PhysicalContext.fromJson(Map<String, dynamic> json) =>
      _$PhysicalContextFromJson(json);

  Map<String, dynamic> toJson() => _$PhysicalContextToJson(this);

  /// Create a default/unknown context when sensors are unavailable
  factory PhysicalContext.unknown() {
    return PhysicalContext(
      activity: 'unknown',
      confidence: 0.0,
      locationType: 'unknown',
      screenOn: true,
      battery: 100,
      doNotDisturb: false,
      timestamp: DateTime.now(),
    );
  }
}

/// Saved location for privacy-preserving location tracking
@JsonSerializable()
class SavedLocation {
  final String id;
  final String userId;
  final String name; // "Home", "Work", "Gym", etc.
  final double latitude;
  final double longitude;
  final int radius; // Detection radius in meters
  final DateTime createdAt;

  SavedLocation({
    required this.id,
    required this.userId,
    required this.name,
    required this.latitude,
    required this.longitude,
    required this.radius,
    required this.createdAt,
  });

  factory SavedLocation.fromJson(Map<String, dynamic> json) =>
      _$SavedLocationFromJson(json);

  Map<String, dynamic> toJson() => _$SavedLocationToJson(this);
}

/// Activity type enum for type-safe activity detection
enum ActivityType {
  stationary,
  walking,
  running,
  driving,
  unknown;

  @override
  String toString() => name;

  static ActivityType fromString(String value) {
    return ActivityType.values.firstWhere(
      (e) => e.name == value,
      orElse: () => ActivityType.unknown,
    );
  }
}

/// Location type enum for type-safe location classification
enum LocationType {
  home,
  work,
  commuting,
  shopping,
  gym,
  restaurant,
  unknown;

  @override
  String toString() => name;

  static LocationType fromString(String value) {
    return LocationType.values.firstWhere(
      (e) => e.name == value,
      orElse: () => LocationType.unknown,
    );
  }
}
