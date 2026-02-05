import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/models/task.dart';
import '../../../core/api/api_service.dart';
import '../../../shared/providers/api_provider.dart';
import '../../../core/services/push_token_service.dart';

/// Tasks state
class TasksState {
  final List<Task> tasks;
  final bool isLoading;
  final String? error;
  final Task? selectedTask;

  const TasksState({
    this.tasks = const [],
    this.isLoading = false,
    this.error,
    this.selectedTask,
  });

  TasksState copyWith({
    List<Task>? tasks,
    bool? isLoading,
    String? error,
    Task? selectedTask,
  }) {
    return TasksState(
      tasks: tasks ?? this.tasks,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      selectedTask: selectedTask,
    );
  }

  // Helper getters for task groups
  // Only show root tasks (no parentId)
  List<Task> get rootTasks {
    return tasks.where((task) => task.parentId == null).toList();
  }

  List<Task> get todayTasks {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    return rootTasks.where((task) {
      if (task.completed) return false;
      if (task.date == null) return false;
      final taskDate = DateTime(task.date!.year, task.date!.month, task.date!.day);
      return taskDate.isAtSameMomentAs(today);
    }).toList();
  }

  List<Task> get highPriorityTasks {
    return rootTasks
        .where((task) => !task.completed && task.priority == TaskPriority.high)
        .toList();
  }

  List<Task> get mediumPriorityTasks {
    return rootTasks
        .where((task) => !task.completed && task.priority == TaskPriority.medium)
        .toList();
  }

  List<Task> get lowPriorityTasks {
    return rootTasks
        .where((task) => !task.completed && task.priority == TaskPriority.low)
        .toList();
  }

  List<Task> get completedTasks {
    return rootTasks.where((task) => task.completed).toList();
  }
}

/// Tasks notifier
class TasksNotifier extends StateNotifier<TasksState> {
  final ApiService _apiService;
  Timer? _pollTimer;
  final PushTokenService _pushTokenService = PushTokenService();

  TasksNotifier(this._apiService) : super(const TasksState()) {
    _initializeRealtimeSync();
  }

  /// Initialize real-time synchronization
  void _initializeRealtimeSync() {
    debugPrint('[TasksNotifier] Initializing real-time sync...');

    // Setup push notification listener for instant updates
    _pushTokenService.onDataNotification = _handleTaskUpdateNotification;

    // Initial fetch
    fetchTasks();

    // Setup fallback polling (every 60 seconds) as a safety net
    _startPolling();
  }

  /// Handle task update notification from push
  void _handleTaskUpdateNotification(Map<String, dynamic> data) {
    debugPrint('[TasksNotifier] Received task update notification: $data');

    final type = data['changeType'] as String?;
    final taskId = data['taskId'] as String?;

    debugPrint('[TasksNotifier] Change type: $type, Task ID: $taskId');

    // Immediately sync tasks when notification received
    fetchTasks();
  }

  /// Start polling timer (fallback mechanism)
  void _startPolling() {
    _pollTimer?.cancel();
    _pollTimer = Timer.periodic(const Duration(seconds: 60), (_) {
      // Only poll if app is in foreground
      debugPrint('[TasksNotifier] Fallback polling - syncing tasks');
      fetchTasks();
    });
  }

  /// Stop polling timer
  void _stopPolling() {
    _pollTimer?.cancel();
    _pollTimer = null;
  }

  @override
  void dispose() {
    _stopPolling();
    super.dispose();
  }

  /// Fetch all tasks
  Future<void> fetchTasks() async {
    state = state.copyWith(isLoading: true);
    try {
      print('fetchTasks - Making API call');
      final tasks = await _apiService.getTasks();
      print('fetchTasks - Received ${tasks.length} tasks');
      for (var task in tasks) {
        print('  Task: ${task.title}, priority: ${task.priority}, completed: ${task.completed}, date: ${task.date}');
      }
      state = TasksState(tasks: tasks, isLoading: false);
    } catch (e) {
      print('fetchTasks - Error: $e');
      state = TasksState(
        tasks: state.tasks,
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  /// Create new task
  Future<bool> createTask({
    required String title,
    String? description,
    TaskPriority priority = TaskPriority.medium,
    DateTime? date,
    DateTime? dueDate,
    String? parentId,
  }) async {
    try {
      final task = await _apiService.createTask({
        'title': title,
        if (description != null) 'description': description,
        'priority': priority.name,
        if (date != null) 'date': date.toIso8601String(),
        if (dueDate != null) 'dueDate': dueDate.toIso8601String(),
        if (parentId != null) 'parentId': parentId,
        'completed': false,
      });

      state = state.copyWith(
        tasks: [...state.tasks, task],
      );
      return true;
    } catch (e) {
      state = state.copyWith(error: e.toString());
      return false;
    }
  }

  /// Update task with map of updates
  Future<bool> _updateTaskWithMap(String id, Map<String, dynamic> updates) async {
    try {
      final updatedTask = await _apiService.updateTask(id, updates);

      final updatedTasks = state.tasks.map((task) {
        return task.id == id ? updatedTask : task;
      }).toList();

      state = state.copyWith(tasks: updatedTasks);
      return true;
    } catch (e) {
      state = state.copyWith(error: e.toString());
      return false;
    }
  }

  /// Update task with named parameters
  /// To clear a date field, pass a special sentinel value or use the clearDate/clearDueDate parameters
  Future<bool> updateTask({
    required String taskId,
    String? title,
    String? description,
    TaskPriority? priority,
    DateTime? date,
    DateTime? dueDate,
    bool? completed,
    String? recurrenceRule,
    int? estimatedMinutes,
    bool clearDate = false,
    bool clearDueDate = false,
    bool clearRecurrenceRule = false,
  }) async {
    final updates = <String, dynamic>{};
    if (title != null) updates['title'] = title;
    if (description != null) updates['description'] = description;
    if (priority != null) updates['priority'] = priority.name;
    if (clearDate) {
      updates['date'] = null;
    } else if (date != null) {
      updates['date'] = date.toIso8601String();
    }
    if (clearDueDate) {
      updates['dueDate'] = null;
    } else if (dueDate != null) {
      updates['dueDate'] = dueDate.toIso8601String();
    }
    if (completed != null) updates['completed'] = completed;
    if (clearRecurrenceRule) {
      updates['recurrenceRule'] = null;
    } else if (recurrenceRule != null) {
      updates['recurrenceRule'] = recurrenceRule;
    }
    if (estimatedMinutes != null) updates['estimatedMinutes'] = estimatedMinutes;

    return _updateTaskWithMap(taskId, updates);
  }

  /// Toggle task completion
  Future<void> toggleTaskCompletion(Task task) async {
    await _updateTaskWithMap(task.id, {'completed': !task.completed});
  }

  /// Delete task
  Future<bool> deleteTask(String id) async {
    try {
      await _apiService.deleteTask(id);

      final updatedTasks = state.tasks.where((task) => task.id != id).toList();
      state = state.copyWith(tasks: updatedTasks);
      return true;
    } catch (e) {
      state = state.copyWith(error: e.toString());
      return false;
    }
  }

  /// Duplicate task
  Future<Task?> duplicateTask(String id) async {
    try {
      // Find the original task
      final originalTask = state.tasks.firstWhere((task) => task.id == id);

      // Create a new task with the same properties but a new title
      final newTask = await _apiService.createTask({
        'title': '${originalTask.title} (copy)',
        if (originalTask.description != null) 'description': originalTask.description,
        'priority': originalTask.priority.name,
        if (originalTask.date != null) 'date': originalTask.date!.toIso8601String(),
        if (originalTask.dueDate != null) 'dueDate': originalTask.dueDate!.toIso8601String(),
        if (originalTask.parentId != null) 'parentId': originalTask.parentId,
        if (originalTask.estimatedMinutes != null) 'estimatedMinutes': originalTask.estimatedMinutes,
        if (originalTask.recurrenceRule != null) 'recurrenceRule': originalTask.recurrenceRule,
        'completed': false,
      });

      state = state.copyWith(
        tasks: [...state.tasks, newTask],
      );
      return newTask;
    } catch (e) {
      state = state.copyWith(error: e.toString());
      return null;
    }
  }

  /// Select task for detail view
  void selectTask(Task? task) {
    state = state.copyWith(selectedTask: task);
  }

  /// Clear error
  void clearError() {
    state = state.copyWith(error: null);
  }
}

/// Tasks provider
final tasksProvider = StateNotifierProvider<TasksNotifier, TasksState>((ref) {
  final apiService = ref.watch(apiServiceProvider);
  return TasksNotifier(apiService);
});