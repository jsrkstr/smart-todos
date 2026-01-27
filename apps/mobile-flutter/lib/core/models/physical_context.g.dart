// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'physical_context.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

PhysicalContext _$PhysicalContextFromJson(Map<String, dynamic> json) =>
    PhysicalContext(
      activity: json['activity'] as String,
      confidence: (json['confidence'] as num).toDouble(),
      locationType: json['locationType'] as String,
      savedLocationId: json['savedLocationId'] as String?,
      screenOn: json['screenOn'] as bool,
      battery: (json['battery'] as num).toInt(),
      doNotDisturb: json['doNotDisturb'] as bool,
      timestamp: DateTime.parse(json['timestamp'] as String),
    );

Map<String, dynamic> _$PhysicalContextToJson(PhysicalContext instance) =>
    <String, dynamic>{
      'activity': instance.activity,
      'confidence': instance.confidence,
      'locationType': instance.locationType,
      'savedLocationId': instance.savedLocationId,
      'screenOn': instance.screenOn,
      'battery': instance.battery,
      'doNotDisturb': instance.doNotDisturb,
      'timestamp': instance.timestamp.toIso8601String(),
    };

SavedLocation _$SavedLocationFromJson(Map<String, dynamic> json) =>
    SavedLocation(
      id: json['id'] as String,
      userId: json['userId'] as String,
      name: json['name'] as String,
      latitude: (json['latitude'] as num).toDouble(),
      longitude: (json['longitude'] as num).toDouble(),
      radius: (json['radius'] as num).toInt(),
      createdAt: DateTime.parse(json['createdAt'] as String),
    );

Map<String, dynamic> _$SavedLocationToJson(SavedLocation instance) =>
    <String, dynamic>{
      'id': instance.id,
      'userId': instance.userId,
      'name': instance.name,
      'latitude': instance.latitude,
      'longitude': instance.longitude,
      'radius': instance.radius,
      'createdAt': instance.createdAt.toIso8601String(),
    };
