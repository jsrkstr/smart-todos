import 'package:json_annotation/json_annotation.dart';

part 'task.g.dart';

enum TaskPriority {
  @JsonValue('high')
  high,
  @JsonValue('medium')
  medium,
  @JsonValue('low')
  low,
}

enum TaskStatus {
  @JsonValue('pending')
  pending,
  @JsonValue('in_progress')
  inProgress,
  @JsonValue('completed')
  completed,
  @JsonValue('cancelled')
  cancelled,
}

@JsonSerializable()
class Task {
  final String id;
  final String title;
  final String? description;
  final TaskPriority priority;
  final bool completed;
  final DateTime? date;
  final DateTime? dueDate;
  final String? userId;
  final String? parentId;
  final int position;
  final int? estimatedMinutes;
  final String? recurrenceRule;
  final DateTime createdAt;
  final DateTime updatedAt;

  // Relations
  final List<Task>? subtasks;
  final List<Tag>? tags;
  final List<Notification>? notifications;

  Task({
    required this.id,
    required this.title,
    this.description,
    this.priority = TaskPriority.medium,
    this.completed = false,
    this.date,
    this.dueDate,
    this.userId,
    this.parentId,
    this.position = 0,
    this.estimatedMinutes,
    this.recurrenceRule,
    required this.createdAt,
    required this.updatedAt,
    this.subtasks,
    this.tags,
    this.notifications,
  });

  factory Task.fromJson(Map<String, dynamic> json) => _$TaskFromJson(json);
  Map<String, dynamic> toJson() => _$TaskToJson(this);

  Task copyWith({
    String? id,
    String? title,
    String? description,
    TaskPriority? priority,
    bool? completed,
    DateTime? date,
    DateTime? dueDate,
    String? userId,
    String? parentId,
    int? position,
    int? estimatedMinutes,
    String? recurrenceRule,
    DateTime? createdAt,
    DateTime? updatedAt,
    List<Task>? subtasks,
    List<Tag>? tags,
    List<Notification>? notifications,
  }) {
    return Task(
      id: id ?? this.id,
      title: title ?? this.title,
      description: description ?? this.description,
      priority: priority ?? this.priority,
      completed: completed ?? this.completed,
      date: date ?? this.date,
      dueDate: dueDate ?? this.dueDate,
      userId: userId ?? this.userId,
      parentId: parentId ?? this.parentId,
      position: position ?? this.position,
      estimatedMinutes: estimatedMinutes ?? this.estimatedMinutes,
      recurrenceRule: recurrenceRule ?? this.recurrenceRule,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      subtasks: subtasks ?? this.subtasks,
      tags: tags ?? this.tags,
      notifications: notifications ?? this.notifications,
    );
  }

  // Helper getters
  int get completedSubtasksCount {
    return subtasks?.where((t) => t.completed).length ?? 0;
  }

  int get totalSubtasksCount {
    return subtasks?.length ?? 0;
  }

  String get progressText {
    if (subtasks == null || subtasks!.isEmpty) return '';
    return '$completedSubtasksCount/$totalSubtasksCount';
  }

  bool get hasSubtasks {
    return subtasks != null && subtasks!.isNotEmpty;
  }

  bool get isOverdue {
    if (dueDate == null) return false;
    return DateTime.now().isAfter(dueDate!);
  }
}

@JsonSerializable()
class Tag {
  final String id;
  final String name;
  final String? color;
  final String? categoryId;
  final DateTime createdAt;

  Tag({
    required this.id,
    required this.name,
    this.color,
    this.categoryId,
    required this.createdAt,
  });

  factory Tag.fromJson(Map<String, dynamic> json) => _$TagFromJson(json);
  Map<String, dynamic> toJson() => _$TagToJson(this);
}

@JsonSerializable()
class TagCategory {
  final String id;
  final String name;
  final DateTime createdAt;

  TagCategory({
    required this.id,
    required this.name,
    required this.createdAt,
  });

  factory TagCategory.fromJson(Map<String, dynamic> json) => _$TagCategoryFromJson(json);
  Map<String, dynamic> toJson() => _$TagCategoryToJson(this);
}

enum NotificationMode {
  @JsonValue('Push')
  push,
  @JsonValue('Email')
  email,
  @JsonValue('SMS')
  sms,
}

enum NotificationType {
  @JsonValue('Reminder')
  reminder,
  @JsonValue('FollowUp')
  followUp,
  @JsonValue('Motivation')
  motivation,
}

enum NotificationTrigger {
  @JsonValue('RelativeTime')
  relativeTime,
  @JsonValue('FixedTime')
  fixedTime,
  @JsonValue('Location')
  location,
}

enum TimeUnit {
  @JsonValue('Minutes')
  minutes,
  @JsonValue('Hours')
  hours,
  @JsonValue('Days')
  days,
}

@JsonSerializable()
class Notification {
  final String id;
  final String? taskId;
  final NotificationMode mode;
  final NotificationType type;
  final NotificationTrigger trigger;
  final int? relativeTimeValue;
  final TimeUnit? relativeTimeUnit;
  final DateTime? fixedTime;
  final String author;
  final bool sent;
  final DateTime createdAt;

  Notification({
    required this.id,
    this.taskId,
    required this.mode,
    required this.type,
    required this.trigger,
    this.relativeTimeValue,
    this.relativeTimeUnit,
    this.fixedTime,
    required this.author,
    this.sent = false,
    required this.createdAt,
  });

  factory Notification.fromJson(Map<String, dynamic> json) => _$NotificationFromJson(json);
  Map<String, dynamic> toJson() => _$NotificationToJson(this);
}