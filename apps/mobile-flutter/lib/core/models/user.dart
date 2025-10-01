import 'package:json_annotation/json_annotation.dart';

part 'user.g.dart';

@JsonSerializable()
class User {
  final String id;
  final String? name;
  final String? email;
  final String? image;
  final String? bio;
  final String? gender;
  final int? age;
  final List<String>? principles;
  final List<String>? inspirations;
  final int points;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  User({
    required this.id,
    this.name,
    this.email,
    this.image,
    this.bio,
    this.gender,
    this.age,
    this.principles,
    this.inspirations,
    this.points = 0,
    this.createdAt,
    this.updatedAt,
  });

  factory User.fromJson(Map<String, dynamic> json) => _$UserFromJson(json);
  Map<String, dynamic> toJson() => _$UserToJson(this);

  User copyWith({
    String? id,
    String? name,
    String? email,
    String? image,
    String? bio,
    String? gender,
    int? age,
    List<String>? principles,
    List<String>? inspirations,
    int? points,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return User(
      id: id ?? this.id,
      name: name ?? this.name,
      email: email ?? this.email,
      image: image ?? this.image,
      bio: bio ?? this.bio,
      gender: gender ?? this.gender,
      age: age ?? this.age,
      principles: principles ?? this.principles,
      inspirations: inspirations ?? this.inspirations,
      points: points ?? this.points,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}

@JsonSerializable()
class PsychProfile {
  final String id;
  final String userId;
  final String productivityTime;
  final String communicationPref;
  final String taskApproach;
  final String difficultyPreference;
  final String? coachId;
  final DateTime createdAt;
  final DateTime updatedAt;

  PsychProfile({
    required this.id,
    required this.userId,
    required this.productivityTime,
    required this.communicationPref,
    required this.taskApproach,
    required this.difficultyPreference,
    this.coachId,
    required this.createdAt,
    required this.updatedAt,
  });

  factory PsychProfile.fromJson(Map<String, dynamic> json) => _$PsychProfileFromJson(json);
  Map<String, dynamic> toJson() => _$PsychProfileToJson(this);
}

@JsonSerializable()
class Settings {
  final String id;
  final String userId;
  final String theme;
  final bool notifications;
  final bool emailNotifications;
  final String timezone;
  final String language;
  final int pomodoroDuration;
  final int shortBreakDuration;
  final int longBreakDuration;
  final bool soundEnabled;
  final bool notificationsEnabled;
  final int defaultReminderTime;
  final DateTime createdAt;
  final DateTime updatedAt;

  Settings({
    required this.id,
    required this.userId,
    this.theme = 'system',
    this.notifications = true,
    this.emailNotifications = true,
    this.timezone = 'UTC',
    this.language = 'en',
    this.pomodoroDuration = 25,
    this.shortBreakDuration = 5,
    this.longBreakDuration = 15,
    this.soundEnabled = true,
    this.notificationsEnabled = true,
    this.defaultReminderTime = 0,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Settings.fromJson(Map<String, dynamic> json) => _$SettingsFromJson(json);
  Map<String, dynamic> toJson() => _$SettingsToJson(this);
}