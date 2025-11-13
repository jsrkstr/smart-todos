import 'package:flutter/material.dart';
import 'package:flutter_slidable/flutter_slidable.dart';
import 'package:intl/intl.dart';
import '../../../core/models/task.dart';
import '../../../theme/app_colors.dart';
import '../../../theme/app_spacing.dart';
import '../../../theme/app_text_styles.dart';
import '../../../shared/widgets/app_checkbox.dart';

class TaskItem extends StatelessWidget {
  final Task task;
  final Function(Task)? onTap;
  final Function(Task, bool?)? onCheckboxChanged;
  final VoidCallback? onDelete;
  final VoidCallback? onPlay;
  final VoidCallback? onDateTimeTap;
  final bool showDetails;

  const TaskItem({
    super.key,
    required this.task,
    this.onTap,
    this.onCheckboxChanged,
    this.onDelete,
    this.onPlay,
    this.onDateTimeTap,
    this.showDetails = false,
  });

  @override
  Widget build(BuildContext context) {
    return Slidable(
      key: ValueKey(task.id),
      startActionPane: ActionPane(
        motion: const ScrollMotion(),
        children: [
          SlidableAction(
            onPressed: (context) => onDelete?.call(),
            backgroundColor: AppColors.destructive,
            foregroundColor: AppColors.destructiveForeground,
            icon: Icons.delete_outline,
            label: 'Delete',
            borderRadius: BorderRadius.circular(AppSpacing.radiusMD),
          ),
        ],
      ),
      endActionPane: ActionPane(
        motion: const ScrollMotion(),
        children: [
          SlidableAction(
            onPressed: (context) => onPlay?.call(),
            backgroundColor: AppColors.success,
            foregroundColor: Colors.white,
            icon: Icons.play_arrow,
            label: 'Play',
            borderRadius: BorderRadius.circular(AppSpacing.radiusMD),
          ),
        ],
      ),
      child: InkWell(
        onTap: onTap != null ? () => onTap!(task) : null,
        child: Padding(
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.paddingLG,
            vertical: AppSpacing.taskItemPadding,
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Checkbox
              if (!showDetails)
                Padding(
                  padding: const EdgeInsets.only(top: 2),
                  child: AppCheckbox(
                    value: task.completed,
                    onChanged: onCheckboxChanged != null
                        ? (value) => onCheckboxChanged!(task, value)
                        : null,
                  ),
                ),
              if (!showDetails) const SizedBox(width: AppSpacing.md),

              // Task content
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Title
                    Text(
                      task.title,
                      style: task.completed
                          ? AppTextStyles.taskCompleted
                          : AppTextStyles.taskActive,
                    ),
                    const SizedBox(height: AppSpacing.xs),

                    // Metadata row
                    Wrap(
                      spacing: AppSpacing.sm,
                      runSpacing: AppSpacing.xs,
                      children: [
                        // Progress indicator (subtasks)
                        if (task.hasSubtasks)
                          _MetadataItem(
                            icon: Icons.radio_button_unchecked,
                            text: task.progressText,
                          ),

                        // Date
                        if (task.date != null)
                          GestureDetector(
                            onTap: onDateTimeTap,
                            child: _MetadataItem(
                              icon: Icons.calendar_today_outlined,
                              text: _formatDate(task.date!),
                            ),
                          ),

                        // Due date (with X icon)
                        if (task.dueDate != null)
                          GestureDetector(
                            onTap: onDateTimeTap,
                            child: _MetadataItem(
                              icon: Icons.close,
                              text: _formatDate(task.dueDate!),
                            ),
                          ),

                        // Estimated time
                        if (task.estimatedMinutes != null)
                          _MetadataItem(
                            icon: Icons.schedule_outlined,
                            text: _formatDuration(task.estimatedMinutes!),
                          ),

                        // Recurrence
                        if (task.recurrenceRule != null)
                          const _MetadataItem(
                            icon: Icons.repeat,
                            text: '',
                          ),

                        // Tags
                        if (task.tags != null && task.tags!.isNotEmpty)
                          for (final tag in task.tags!)
                            _MetadataItem(
                              icon: Icons.local_offer_outlined,
                              text: tag.name,
                            ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final tomorrow = today.add(const Duration(days: 1));
    final taskDate = DateTime(date.year, date.month, date.day);

    if (taskDate == today) {
      return DateFormat('HH:mm').format(date);
    } else if (taskDate == tomorrow) {
      return 'Tomorrow ${DateFormat('HH:mm').format(date)}';
    } else {
      return DateFormat('MMM dd HH:mm').format(date);
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

class _MetadataItem extends StatelessWidget {
  final IconData icon;
  final String text;

  const _MetadataItem({
    required this.icon,
    required this.text,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(
          icon,
          size: 14,
          color: AppColors.mutedForeground,
        ),
        if (text.isNotEmpty) ...[
          const SizedBox(width: 4),
          Text(
            text,
            style: AppTextStyles.bodySmall,
          ),
        ],
      ],
    );
  }
}