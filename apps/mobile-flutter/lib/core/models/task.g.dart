// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'task.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

Task _$TaskFromJson(Map<String, dynamic> json) => Task(
      id: json['id'] as String,
      title: json['title'] as String,
      description: json['description'] as String?,
      priority: $enumDecodeNullable(_$TaskPriorityEnumMap, json['priority']) ??
          TaskPriority.medium,
      completed: json['completed'] as bool? ?? false,
      date:
          json['date'] == null ? null : DateTime.parse(json['date'] as String),
      dueDate: json['dueDate'] == null
          ? null
          : DateTime.parse(json['dueDate'] as String),
      userId: json['userId'] as String?,
      parentId: json['parentId'] as String?,
      position: (json['position'] as num?)?.toInt() ?? 0,
      estimatedMinutes: (json['estimatedMinutes'] as num?)?.toInt(),
      recurrenceRule: json['recurrenceRule'] as String?,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
      subtasks: (json['subtasks'] as List<dynamic>?)
          ?.map((e) => Task.fromJson(e as Map<String, dynamic>))
          .toList(),
      tags: (json['tags'] as List<dynamic>?)
          ?.map((e) => Tag.fromJson(e as Map<String, dynamic>))
          .toList(),
      notifications: (json['notifications'] as List<dynamic>?)
          ?.map((e) => Notification.fromJson(e as Map<String, dynamic>))
          .toList(),
    );

Map<String, dynamic> _$TaskToJson(Task instance) => <String, dynamic>{
      'id': instance.id,
      'title': instance.title,
      'description': instance.description,
      'priority': _$TaskPriorityEnumMap[instance.priority]!,
      'completed': instance.completed,
      'date': instance.date?.toIso8601String(),
      'dueDate': instance.dueDate?.toIso8601String(),
      'userId': instance.userId,
      'parentId': instance.parentId,
      'position': instance.position,
      'estimatedMinutes': instance.estimatedMinutes,
      'recurrenceRule': instance.recurrenceRule,
      'createdAt': instance.createdAt.toIso8601String(),
      'updatedAt': instance.updatedAt.toIso8601String(),
      'subtasks': instance.subtasks,
      'tags': instance.tags,
      'notifications': instance.notifications,
    };

const _$TaskPriorityEnumMap = {
  TaskPriority.high: 'high',
  TaskPriority.medium: 'medium',
  TaskPriority.low: 'low',
};

Tag _$TagFromJson(Map<String, dynamic> json) => Tag(
      id: json['id'] as String,
      name: json['name'] as String,
      color: json['color'] as String?,
      categoryId: json['categoryId'] as String?,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );

Map<String, dynamic> _$TagToJson(Tag instance) => <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'color': instance.color,
      'categoryId': instance.categoryId,
      'createdAt': instance.createdAt.toIso8601String(),
    };

TagCategory _$TagCategoryFromJson(Map<String, dynamic> json) => TagCategory(
      id: json['id'] as String,
      name: json['name'] as String,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );

Map<String, dynamic> _$TagCategoryToJson(TagCategory instance) =>
    <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'createdAt': instance.createdAt.toIso8601String(),
    };

Notification _$NotificationFromJson(Map<String, dynamic> json) => Notification(
      id: json['id'] as String,
      taskId: json['taskId'] as String?,
      mode: $enumDecode(_$NotificationModeEnumMap, json['mode']),
      type: $enumDecode(_$NotificationTypeEnumMap, json['type']),
      trigger: $enumDecode(_$NotificationTriggerEnumMap, json['trigger']),
      relativeTimeValue: (json['relativeTimeValue'] as num?)?.toInt(),
      relativeTimeUnit:
          $enumDecodeNullable(_$TimeUnitEnumMap, json['relativeTimeUnit']),
      fixedTime: json['fixedTime'] == null
          ? null
          : DateTime.parse(json['fixedTime'] as String),
      author: json['author'] as String,
      sent: json['sent'] as bool? ?? false,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );

Map<String, dynamic> _$NotificationToJson(Notification instance) =>
    <String, dynamic>{
      'id': instance.id,
      'taskId': instance.taskId,
      'mode': _$NotificationModeEnumMap[instance.mode]!,
      'type': _$NotificationTypeEnumMap[instance.type]!,
      'trigger': _$NotificationTriggerEnumMap[instance.trigger]!,
      'relativeTimeValue': instance.relativeTimeValue,
      'relativeTimeUnit': _$TimeUnitEnumMap[instance.relativeTimeUnit],
      'fixedTime': instance.fixedTime?.toIso8601String(),
      'author': instance.author,
      'sent': instance.sent,
      'createdAt': instance.createdAt.toIso8601String(),
    };

const _$NotificationModeEnumMap = {
  NotificationMode.push: 'Push',
  NotificationMode.email: 'Email',
  NotificationMode.sms: 'SMS',
};

const _$NotificationTypeEnumMap = {
  NotificationType.reminder: 'Reminder',
  NotificationType.followUp: 'FollowUp',
  NotificationType.motivation: 'Motivation',
};

const _$NotificationTriggerEnumMap = {
  NotificationTrigger.relativeTime: 'RelativeTime',
  NotificationTrigger.fixedTime: 'FixedTime',
  NotificationTrigger.location: 'Location',
};

const _$TimeUnitEnumMap = {
  TimeUnit.minutes: 'Minutes',
  TimeUnit.hours: 'Hours',
  TimeUnit.days: 'Days',
};
