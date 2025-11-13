import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../theme/app_colors.dart';
import '../../../theme/app_spacing.dart';
import '../../../theme/app_text_styles.dart';
import '../../../core/models/task.dart';
import '../../../features/chat/widgets/chat_drawer.dart';
import '../providers/tasks_provider.dart';
import '../widgets/task_item.dart';
import '../widgets/task_date_time_picker.dart';

class TaskDetailScreen extends ConsumerStatefulWidget {
  final String taskId;

  const TaskDetailScreen({
    super.key,
    required this.taskId,
  });

  @override
  ConsumerState<TaskDetailScreen> createState() => _TaskDetailScreenState();
}

class _TaskDetailScreenState extends ConsumerState<TaskDetailScreen> {
  late TextEditingController _titleController;
  late TextEditingController _descriptionController;
  final FocusNode _titleFocusNode = FocusNode();
  final FocusNode _descriptionFocusNode = FocusNode();
  bool _isTitleEditing = false;
  bool _isDescriptionEditing = false;
  bool _isAddingSubtask = false;
  final TextEditingController _subtaskController = TextEditingController();
  final FocusNode _subtaskFocusNode = FocusNode();

  @override
  void initState() {
    super.initState();
    final task = _getTask();
    _titleController = TextEditingController(text: task.title);
    _descriptionController = TextEditingController(text: task.description ?? '');
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _titleFocusNode.dispose();
    _descriptionFocusNode.dispose();
    _subtaskController.dispose();
    _subtaskFocusNode.dispose();
    super.dispose();
  }

  Task _getTask() {
    final tasksState = ref.read(tasksProvider);
    return tasksState.tasks.firstWhere(
      (t) => t.id == widget.taskId,
      orElse: () => throw Exception('Task not found'),
    );
  }

  Future<void> _updateTaskTitle() async {
    if (_titleController.text.trim().isEmpty) {
      // Revert to original if empty
      final task = _getTask();
      _titleController.text = task.title;
      return;
    }

    await ref.read(tasksProvider.notifier).updateTask(
          taskId: widget.taskId,
          title: _titleController.text.trim(),
        );

    setState(() {
      _isTitleEditing = false;
    });
  }

  Future<void> _updateTaskDescription() async {
    await ref.read(tasksProvider.notifier).updateTask(
          taskId: widget.taskId,
          description: _descriptionController.text.trim(),
        );

    setState(() {
      _isDescriptionEditing = false;
    });
  }

  Future<void> _createSubtask() async {
    if (_subtaskController.text.trim().isEmpty) {
      _cancelAddingSubtask();
      return;
    }

    await ref.read(tasksProvider.notifier).createTask(
          title: _subtaskController.text.trim(),
          parentId: widget.taskId,
          priority: _getTask().priority,
        );

    _cancelAddingSubtask();
  }

  void _startAddingSubtask() {
    setState(() {
      _isAddingSubtask = true;
    });
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _subtaskFocusNode.requestFocus();
    });
  }

  void _cancelAddingSubtask() {
    setState(() {
      _isAddingSubtask = false;
      _subtaskController.clear();
    });
  }

  void _showDateTimePicker() {
    final task = _getTask();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.9,
        minChildSize: 0.5,
        maxChildSize: 0.95,
        builder: (context, scrollController) => TaskDateTimePicker(
          taskId: widget.taskId,
          initialDate: task.date,
          initialTime: task.date != null
              ? TimeOfDay.fromDateTime(task.date!)
              : null,
          initialDueDate: task.dueDate,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final tasksState = ref.watch(tasksProvider);
    final task = tasksState.tasks.firstWhere(
      (t) => t.id == widget.taskId,
      orElse: () => throw Exception('Task not found'),
    );

    // Get subtasks
    final subtasks = tasksState.tasks
        .where((t) => t.parentId == widget.taskId)
        .toList();

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () => Navigator.of(context).pop(),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.more_vert),
            onPressed: () {
              // TODO: Show more options menu
            },
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(AppSpacing.paddingLG),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Checkbox and Title
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Padding(
                        padding: const EdgeInsets.only(top: 2),
                        child: Checkbox(
                          value: task.completed,
                          onChanged: (value) {
                            ref.read(tasksProvider.notifier).toggleTaskCompletion(task);
                          },
                          shape: const CircleBorder(),
                        ),
                      ),
                      const SizedBox(width: AppSpacing.sm),
                      Expanded(
                        child: _isTitleEditing
                            ? TextField(
                                controller: _titleController,
                                focusNode: _titleFocusNode,
                                style: AppTextStyles.h2,
                                decoration: const InputDecoration(
                                  border: InputBorder.none,
                                  isDense: true,
                                  contentPadding: EdgeInsets.zero,
                                ),
                                autofocus: true,
                                onSubmitted: (_) => _updateTaskTitle(),
                              )
                            : GestureDetector(
                                onTap: () {
                                  setState(() {
                                    _isTitleEditing = true;
                                  });
                                  WidgetsBinding.instance.addPostFrameCallback((_) {
                                    _titleFocusNode.requestFocus();
                                  });
                                },
                                child: Text(
                                  task.title,
                                  style: AppTextStyles.h2.copyWith(
                                    decoration: task.completed
                                        ? TextDecoration.lineThrough
                                        : null,
                                  ),
                                ),
                              ),
                      ),
                      if (_isTitleEditing) ...[
                        IconButton(
                          icon: const Icon(Icons.check, color: AppColors.primary),
                          onPressed: _updateTaskTitle,
                          padding: EdgeInsets.zero,
                          constraints: const BoxConstraints(),
                        ),
                        IconButton(
                          icon: const Icon(Icons.close, color: AppColors.mutedForeground),
                          onPressed: () {
                            setState(() {
                              _isTitleEditing = false;
                              _titleController.text = task.title;
                            });
                          },
                          padding: EdgeInsets.zero,
                          constraints: const BoxConstraints(),
                        ),
                      ],
                    ],
                  ),

                  const SizedBox(height: AppSpacing.xl),

                  // Metadata row
                  Wrap(
                    spacing: AppSpacing.md,
                    runSpacing: AppSpacing.sm,
                    children: [
                      // Priority chip
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: AppSpacing.paddingSM,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: _getPriorityColor(task.priority),
                          borderRadius: BorderRadius.circular(AppSpacing.radiusSM),
                        ),
                        child: Text(
                          task.priority.name.toUpperCase(),
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                      ),

                      // Due date
                      InkWell(
                        onTap: _showDateTimePicker,
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              task.dueDate != null ? Icons.close : Icons.calendar_today_outlined,
                              size: 14,
                              color: AppColors.mutedForeground,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              task.dueDate != null
                                  ? _formatDate(task.dueDate!)
                                  : 'Set date',
                              style: AppTextStyles.bodySmall,
                            ),
                          ],
                        ),
                      ),

                      // Date/Time
                      if (task.date != null)
                        InkWell(
                          onTap: _showDateTimePicker,
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(
                                Icons.calendar_today_outlined,
                                size: 14,
                                color: AppColors.mutedForeground,
                              ),
                              const SizedBox(width: 4),
                              Text(
                                _formatDate(task.date!),
                                style: AppTextStyles.bodySmall,
                              ),
                            ],
                          ),
                        ),

                      // Estimated time
                      if (task.estimatedMinutes != null && task.estimatedMinutes! > 0)
                        Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(
                              Icons.schedule_outlined,
                              size: 14,
                              color: AppColors.mutedForeground,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              _formatDuration(task.estimatedMinutes!),
                              style: AppTextStyles.bodySmall,
                            ),
                          ],
                        ),

                      // Recurrence indicator
                      if (task.recurrenceRule != null)
                        const Icon(
                          Icons.repeat,
                          size: 14,
                          color: AppColors.mutedForeground,
                        ),
                    ],
                  ),

                  const SizedBox(height: AppSpacing.xl2),

                  // Description section
                  Text(
                    'Description',
                    style: AppTextStyles.h4,
                  ),
                  const SizedBox(height: AppSpacing.md),
                  _isDescriptionEditing
                      ? Column(
                          children: [
                            TextField(
                              controller: _descriptionController,
                              focusNode: _descriptionFocusNode,
                              maxLines: null,
                              style: AppTextStyles.bodyMedium,
                              decoration: InputDecoration(
                                hintText: 'Add a description...',
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(AppSpacing.radiusMD),
                                ),
                                contentPadding: const EdgeInsets.all(AppSpacing.paddingMD),
                              ),
                              autofocus: true,
                            ),
                            const SizedBox(height: AppSpacing.sm),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.end,
                              children: [
                                TextButton(
                                  onPressed: () {
                                    setState(() {
                                      _isDescriptionEditing = false;
                                      _descriptionController.text = task.description ?? '';
                                    });
                                  },
                                  child: const Text('Cancel'),
                                ),
                                const SizedBox(width: AppSpacing.sm),
                                ElevatedButton(
                                  onPressed: _updateTaskDescription,
                                  child: const Text('Save'),
                                ),
                              ],
                            ),
                          ],
                        )
                      : GestureDetector(
                          onTap: () {
                            setState(() {
                              _isDescriptionEditing = true;
                            });
                            WidgetsBinding.instance.addPostFrameCallback((_) {
                              _descriptionFocusNode.requestFocus();
                            });
                          },
                          child: Container(
                            width: double.infinity,
                            padding: const EdgeInsets.all(AppSpacing.paddingMD),
                            decoration: BoxDecoration(
                              color: AppColors.muted.withOpacity(0.3),
                              borderRadius: BorderRadius.circular(AppSpacing.radiusMD),
                              border: Border.all(
                                color: AppColors.border,
                              ),
                            ),
                            child: Text(
                              task.description?.isNotEmpty == true
                                  ? task.description!
                                  : 'Add a description...',
                              style: AppTextStyles.bodyMedium.copyWith(
                                color: task.description?.isNotEmpty == true
                                    ? AppColors.foreground
                                    : AppColors.mutedForeground,
                              ),
                            ),
                          ),
                        ),

                  const SizedBox(height: AppSpacing.xl2),

                  // Subtasks section
                  if (task.parentId == null) ...[
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Sub Tasks',
                          style: AppTextStyles.h3,
                        ),
                        IconButton(
                          icon: const Icon(Icons.add_box_outlined),
                          onPressed: _startAddingSubtask,
                        ),
                      ],
                    ),
                    const SizedBox(height: AppSpacing.md),

                    // Inline subtask creation
                    if (_isAddingSubtask)
                      Container(
                        margin: const EdgeInsets.only(bottom: AppSpacing.md),
                        padding: const EdgeInsets.all(AppSpacing.paddingMD),
                        decoration: BoxDecoration(
                          color: AppColors.card,
                          borderRadius: BorderRadius.circular(AppSpacing.radiusMD),
                          border: Border.all(color: AppColors.primary, width: 2),
                        ),
                        child: Row(
                          children: [
                            const Icon(
                              Icons.circle_outlined,
                              color: AppColors.mutedForeground,
                              size: 20,
                            ),
                            const SizedBox(width: AppSpacing.md),
                            Expanded(
                              child: TextField(
                                controller: _subtaskController,
                                focusNode: _subtaskFocusNode,
                                decoration: const InputDecoration(
                                  hintText: 'Subtask name',
                                  border: InputBorder.none,
                                  isDense: true,
                                  contentPadding: EdgeInsets.zero,
                                ),
                                style: AppTextStyles.bodyMedium,
                                onSubmitted: (_) => _createSubtask(),
                              ),
                            ),
                            IconButton(
                              icon: const Icon(Icons.check, color: AppColors.primary),
                              onPressed: _createSubtask,
                              padding: EdgeInsets.zero,
                              constraints: const BoxConstraints(),
                              iconSize: 20,
                            ),
                            const SizedBox(width: AppSpacing.sm),
                            IconButton(
                              icon: const Icon(Icons.close, color: AppColors.mutedForeground),
                              onPressed: _cancelAddingSubtask,
                              padding: EdgeInsets.zero,
                              constraints: const BoxConstraints(),
                              iconSize: 20,
                            ),
                          ],
                        ),
                      ),

                    if (subtasks.isEmpty && !_isAddingSubtask)
                      Padding(
                        padding: const EdgeInsets.symmetric(vertical: AppSpacing.paddingLG),
                        child: Text(
                          'No subtasks yet',
                          style: AppTextStyles.bodySmall.copyWith(
                            color: AppColors.mutedForeground,
                          ),
                        ),
                      )
                    else
                      ListView.separated(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: subtasks.length,
                        separatorBuilder: (context, index) =>
                            const SizedBox(height: AppSpacing.sm),
                        itemBuilder: (context, index) {
                          final subtask = subtasks[index];
                          return TaskItem(
                            task: subtask,
                            onCheckboxChanged: (task, value) {
                              ref.read(tasksProvider.notifier).toggleTaskCompletion(task);
                            },
                            onTap: (task) {
                              // Navigate to subtask detail
                              Navigator.of(context).push(
                                MaterialPageRoute(
                                  builder: (context) => TaskDetailScreen(
                                    taskId: task.id,
                                  ),
                                ),
                              );
                            },
                            onDateTimeTap: _showDateTimePicker,
                          );
                        },
                      ),
                  ],
                ],
              ),
            ),
          ),

          // "Chat with Coach" button at bottom
          Container(
            padding: const EdgeInsets.all(AppSpacing.paddingLG),
            decoration: BoxDecoration(
              color: AppColors.background,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.1),
                  blurRadius: 8,
                  offset: const Offset(0, -2),
                ),
              ],
            ),
            child: SafeArea(
              child: SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    showModalBottomSheet(
                      context: context,
                      isScrollControlled: true,
                      backgroundColor: Colors.transparent,
                      builder: (context) => ChatDrawer(taskId: widget.taskId),
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.secondary,
                    foregroundColor: AppColors.secondaryForeground,
                    padding: const EdgeInsets.symmetric(
                      vertical: AppSpacing.paddingMD,
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(AppSpacing.radiusMD),
                    ),
                  ),
                  child: const Text('Chat with Coach'),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Color _getPriorityColor(TaskPriority priority) {
    switch (priority) {
      case TaskPriority.high:
        return AppColors.destructive;
      case TaskPriority.medium:
        return Colors.orange;
      case TaskPriority.low:
        return Colors.blue;
    }
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final tomorrow = today.add(const Duration(days: 1));
    final taskDate = DateTime(date.year, date.month, date.day);

    if (taskDate == today) {
      return 'Today ${TimeOfDay.fromDateTime(date).format(context)}';
    } else if (taskDate == tomorrow) {
      return 'Tomorrow ${TimeOfDay.fromDateTime(date).format(context)}';
    } else {
      // Show date without year if same year, otherwise with year
      if (date.year == now.year) {
        return '${date.month}/${date.day} ${TimeOfDay.fromDateTime(date).format(context)}';
      }
      return '${date.month}/${date.day}/${date.year} ${TimeOfDay.fromDateTime(date).format(context)}';
    }
  }

  String _formatDuration(int minutes) {
    if (minutes < 60) {
      return '$minutes m';
    } else {
      final hours = minutes ~/ 60;
      final remainingMinutes = minutes % 60;
      if (remainingMinutes == 0) {
        return '$hours h';
      }
      return '$hours h $remainingMinutes m';
    }
  }
}
