// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'user.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

User _$UserFromJson(Map<String, dynamic> json) => User(
      id: json['id'] as String,
      name: json['name'] as String?,
      email: json['email'] as String?,
      image: json['image'] as String?,
      bio: json['bio'] as String?,
      gender: json['gender'] as String?,
      age: (json['age'] as num?)?.toInt(),
      principles: (json['principles'] as List<dynamic>?)
          ?.map((e) => e as String)
          .toList(),
      inspirations: (json['inspirations'] as List<dynamic>?)
          ?.map((e) => e as String)
          .toList(),
      points: (json['points'] as num?)?.toInt() ?? 0,
      createdAt: json['createdAt'] == null
          ? null
          : DateTime.parse(json['createdAt'] as String),
      updatedAt: json['updatedAt'] == null
          ? null
          : DateTime.parse(json['updatedAt'] as String),
    );

Map<String, dynamic> _$UserToJson(User instance) => <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'email': instance.email,
      'image': instance.image,
      'bio': instance.bio,
      'gender': instance.gender,
      'age': instance.age,
      'principles': instance.principles,
      'inspirations': instance.inspirations,
      'points': instance.points,
      'createdAt': instance.createdAt?.toIso8601String(),
      'updatedAt': instance.updatedAt?.toIso8601String(),
    };

PsychProfile _$PsychProfileFromJson(Map<String, dynamic> json) => PsychProfile(
      id: json['id'] as String,
      userId: json['userId'] as String,
      productivityTime: json['productivityTime'] as String,
      communicationPref: json['communicationPref'] as String,
      taskApproach: json['taskApproach'] as String,
      difficultyPreference: json['difficultyPreference'] as String,
      coachId: json['coachId'] as String?,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );

Map<String, dynamic> _$PsychProfileToJson(PsychProfile instance) =>
    <String, dynamic>{
      'id': instance.id,
      'userId': instance.userId,
      'productivityTime': instance.productivityTime,
      'communicationPref': instance.communicationPref,
      'taskApproach': instance.taskApproach,
      'difficultyPreference': instance.difficultyPreference,
      'coachId': instance.coachId,
      'createdAt': instance.createdAt.toIso8601String(),
      'updatedAt': instance.updatedAt.toIso8601String(),
    };

Settings _$SettingsFromJson(Map<String, dynamic> json) => Settings(
      id: json['id'] as String,
      userId: json['userId'] as String,
      theme: json['theme'] as String? ?? 'system',
      notifications: json['notifications'] as bool? ?? true,
      emailNotifications: json['emailNotifications'] as bool? ?? true,
      timezone: json['timezone'] as String? ?? 'UTC',
      language: json['language'] as String? ?? 'en',
      pomodoroDuration: (json['pomodoroDuration'] as num?)?.toInt() ?? 25,
      shortBreakDuration: (json['shortBreakDuration'] as num?)?.toInt() ?? 5,
      longBreakDuration: (json['longBreakDuration'] as num?)?.toInt() ?? 15,
      soundEnabled: json['soundEnabled'] as bool? ?? true,
      notificationsEnabled: json['notificationsEnabled'] as bool? ?? true,
      defaultReminderTime: (json['defaultReminderTime'] as num?)?.toInt() ?? 0,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );

Map<String, dynamic> _$SettingsToJson(Settings instance) => <String, dynamic>{
      'id': instance.id,
      'userId': instance.userId,
      'theme': instance.theme,
      'notifications': instance.notifications,
      'emailNotifications': instance.emailNotifications,
      'timezone': instance.timezone,
      'language': instance.language,
      'pomodoroDuration': instance.pomodoroDuration,
      'shortBreakDuration': instance.shortBreakDuration,
      'longBreakDuration': instance.longBreakDuration,
      'soundEnabled': instance.soundEnabled,
      'notificationsEnabled': instance.notificationsEnabled,
      'defaultReminderTime': instance.defaultReminderTime,
      'createdAt': instance.createdAt.toIso8601String(),
      'updatedAt': instance.updatedAt.toIso8601String(),
    };
