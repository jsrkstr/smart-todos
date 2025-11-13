import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/models/task.dart';
import '../../../theme/app_colors.dart';
import '../../../theme/app_spacing.dart';
import '../../../theme/app_text_styles.dart';
import '../providers/tasks_provider.dart';
import 'task_item.dart';
import 'task_date_time_picker.dart';

class TaskGroup extends ConsumerStatefulWidget {
  final String title;
  final List<Task> tasks;
  final TaskPriority? priority;
  final DateTime? date;
  final Function(Task)? onTaskTap;
  final Function(Task, bool?)? onCheckboxChanged;
  final Function(Task)? onDeleteTask;
  final Function(Task)? onPlayTask;

  const TaskGroup({
    super.key,
    required this.title,
    required this.tasks,
    this.priority,
    this.date,
    this.onTaskTap,
    this.onCheckboxChanged,
    this.onDeleteTask,
    this.onPlayTask,
  });

  @override
  ConsumerState<TaskGroup> createState() => _TaskGroupState();
}

class _TaskGroupState extends ConsumerState<TaskGroup> {
  bool _isAddingTask = false;
  final TextEditingController _titleController = TextEditingController();
  final FocusNode _focusNode = FocusNode();

  @override
  void dispose() {
    _titleController.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  void _startAddingTask() {
    setState(() {
      _isAddingTask = true;
    });
    // Focus the text field after the widget is built
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _focusNode.requestFocus();
    });
  }

  void _cancelAddingTask() {
    setState(() {
      _isAddingTask = false;
      _titleController.clear();
    });
  }

  Future<void> _createTask() async {
    if (_titleController.text.trim().isEmpty) {
      _cancelAddingTask();
      return;
    }

    await ref.read(tasksProvider.notifier).createTask(
          title: _titleController.text.trim(),
          priority: widget.priority ?? TaskPriority.medium,
          date: widget.date,
        );

    _cancelAddingTask();
  }

  void _showDateTimePicker(BuildContext context, Task task) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.9,
        minChildSize: 0.5,
        maxChildSize: 0.95,
        builder: (context, scrollController) => TaskDateTimePicker(
          taskId: task.id,
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
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Group header
        Padding(
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.paddingLG,
            vertical: AppSpacing.paddingSM,
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                widget.title,
                style: AppTextStyles.h4,
              ),
              IconButton(
                icon: const Icon(Icons.add, size: 20),
                onPressed: _startAddingTask,
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(),
                visualDensity: VisualDensity.compact,
              ),
            ],
          ),
        ),

        // Inline task creation
        if (_isAddingTask)
          Container(
            margin: const EdgeInsets.symmetric(
              horizontal: AppSpacing.paddingLG,
              vertical: AppSpacing.paddingSM,
            ),
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
                    controller: _titleController,
                    focusNode: _focusNode,
                    decoration: const InputDecoration(
                      hintText: 'Task name',
                      border: InputBorder.none,
                      isDense: true,
                      contentPadding: EdgeInsets.zero,
                    ),
                    style: AppTextStyles.bodyMedium,
                    onSubmitted: (_) => _createTask(),
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.check, color: AppColors.primary),
                  onPressed: _createTask,
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(),
                  iconSize: 20,
                ),
                const SizedBox(width: AppSpacing.sm),
                IconButton(
                  icon: const Icon(Icons.close, color: AppColors.mutedForeground),
                  onPressed: _cancelAddingTask,
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(),
                  iconSize: 20,
                ),
              ],
            ),
          ),

        // Task items
        if (widget.tasks.isEmpty && !_isAddingTask)
          Padding(
            padding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.paddingLG,
              vertical: AppSpacing.paddingMD,
            ),
            child: Text(
              'No tasks',
              style: AppTextStyles.bodySmall.copyWith(
                color: AppColors.mutedForeground,
              ),
            ),
          )
        else
          ListView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: widget.tasks.length,
            itemBuilder: (context, index) {
              final task = widget.tasks[index];
              return TaskItem(
                task: task,
                onTap: widget.onTaskTap,
                onCheckboxChanged: widget.onCheckboxChanged,
                onDelete: widget.onDeleteTask != null
                    ? () => widget.onDeleteTask!(task)
                    : null,
                onPlay: widget.onPlayTask != null
                    ? () => widget.onPlayTask!(task)
                    : null,
                onDateTimeTap: () => _showDateTimePicker(context, task),
              );
            },
          ),

        const SizedBox(height: AppSpacing.taskGroupSpacing),
      ],
    );
  }
}
