import 'package:json_annotation/json_annotation.dart';

part 'notification.g.dart';

enum NotificationTypeEnum {
  @JsonValue('Reminder')
  reminder,
  @JsonValue('Question')
  question,
  @JsonValue('Info')
  info,
}

enum NotificationAuthorEnum {
  @JsonValue('User')
  user,
  @JsonValue('Bot')
  bot,
  @JsonValue('Model')
  model,
}

@JsonSerializable()
class AppNotification {
  final String id;
  final NotificationTypeEnum type;
  final String mode;
  final String message;
  final bool read;
  final bool triggered;
  final DateTime? triggeredAt;
  final String userId;
  final String? taskId;
  final DateTime createdAt;
  final NotificationAuthorEnum author;
  final NotificationTask? task;

  AppNotification({
    required this.id,
    required this.type,
    required this.mode,
    required this.message,
    required this.read,
    required this.triggered,
    this.triggeredAt,
    required this.userId,
    this.taskId,
    required this.createdAt,
    required this.author,
    this.task,
  });

  factory AppNotification.fromJson(Map<String, dynamic> json) =>
      _$AppNotificationFromJson(json);

  Map<String, dynamic> toJson() => _$AppNotificationToJson(this);

  AppNotification copyWith({bool? read}) {
    return AppNotification(
      id: id,
      type: type,
      mode: mode,
      message: message,
      read: read ?? this.read,
      triggered: triggered,
      triggeredAt: triggeredAt,
      userId: userId,
      taskId: taskId,
      createdAt: createdAt,
      author: author,
      task: task,
    );
  }
}

@JsonSerializable()
class NotificationTask {
  final String id;
  final String title;

  NotificationTask({
    required this.id,
    required this.title,
  });

  factory NotificationTask.fromJson(Map<String, dynamic> json) =>
      _$NotificationTaskFromJson(json);

  Map<String, dynamic> toJson() => _$NotificationTaskToJson(this);
}
