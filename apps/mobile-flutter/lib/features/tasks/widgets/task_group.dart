import 'package:flutter/material.dart';
import '../../../core/models/task.dart';
import '../../../theme/app_colors.dart';
import '../../../theme/app_spacing.dart';
import '../../../theme/app_text_styles.dart';
import 'task_item.dart';

class TaskGroup extends StatelessWidget {
  final String title;
  final List<Task> tasks;
  final VoidCallback? onAddTask;
  final Function(Task)? onTaskTap;
  final Function(Task, bool?)? onCheckboxChanged;
  final Function(Task)? onDeleteTask;
  final Function(Task)? onPlayTask;

  const TaskGroup({
    super.key,
    required this.title,
    required this.tasks,
    this.onAddTask,
    this.onTaskTap,
    this.onCheckboxChanged,
    this.onDeleteTask,
    this.onPlayTask,
  });

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
                title,
                style: AppTextStyles.h4,
              ),
              IconButton(
                icon: const Icon(Icons.add, size: 20),
                onPressed: onAddTask,
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(),
                visualDensity: VisualDensity.compact,
              ),
            ],
          ),
        ),

        // Task items
        if (tasks.isEmpty)
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
            itemCount: tasks.length,
            itemBuilder: (context, index) {
              final task = tasks[index];
              return TaskItem(
                task: task,
                onTap: onTaskTap,
                onCheckboxChanged: onCheckboxChanged,
                onDelete: onDeleteTask != null ? () => onDeleteTask!(task) : null,
                onPlay: onPlayTask != null ? () => onPlayTask!(task) : null,
              );
            },
          ),

        const SizedBox(height: AppSpacing.taskGroupSpacing),
      ],
    );
  }
}