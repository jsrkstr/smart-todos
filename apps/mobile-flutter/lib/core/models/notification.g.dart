// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'notification.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

AppNotification _$AppNotificationFromJson(Map<String, dynamic> json) =>
    AppNotification(
      id: json['id'] as String,
      type: $enumDecode(_$NotificationTypeEnumEnumMap, json['type']),
      mode: json['mode'] as String,
      message: json['message'] as String,
      read: json['read'] as bool,
      triggered: json['triggered'] as bool,
      triggeredAt: json['triggeredAt'] == null
          ? null
          : DateTime.parse(json['triggeredAt'] as String),
      userId: json['userId'] as String,
      taskId: json['taskId'] as String?,
      createdAt: DateTime.parse(json['createdAt'] as String),
      author: $enumDecode(_$NotificationAuthorEnumEnumMap, json['author']),
      task: json['task'] == null
          ? null
          : NotificationTask.fromJson(json['task'] as Map<String, dynamic>),
    );

Map<String, dynamic> _$AppNotificationToJson(AppNotification instance) =>
    <String, dynamic>{
      'id': instance.id,
      'type': _$NotificationTypeEnumEnumMap[instance.type]!,
      'mode': instance.mode,
      'message': instance.message,
      'read': instance.read,
      'triggered': instance.triggered,
      'triggeredAt': instance.triggeredAt?.toIso8601String(),
      'userId': instance.userId,
      'taskId': instance.taskId,
      'createdAt': instance.createdAt.toIso8601String(),
      'author': _$NotificationAuthorEnumEnumMap[instance.author]!,
      'task': instance.task,
    };

const _$NotificationTypeEnumEnumMap = {
  NotificationTypeEnum.reminder: 'Reminder',
  NotificationTypeEnum.question: 'Question',
  NotificationTypeEnum.info: 'Info',
};

const _$NotificationAuthorEnumEnumMap = {
  NotificationAuthorEnum.user: 'User',
  NotificationAuthorEnum.bot: 'Bot',
  NotificationAuthorEnum.model: 'Model',
};

NotificationTask _$NotificationTaskFromJson(Map<String, dynamic> json) =>
    NotificationTask(
      id: json['id'] as String,
      title: json['title'] as String,
    );

Map<String, dynamic> _$NotificationTaskToJson(NotificationTask instance) =>
    <String, dynamic>{
      'id': instance.id,
      'title': instance.title,
    };
