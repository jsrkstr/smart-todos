import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../theme/app_colors.dart';
import '../../../theme/app_spacing.dart';
import '../../../theme/app_text_styles.dart';
import '../../../core/models/task.dart';
import '../../../features/chat/widgets/chat_drawer.dart';
import '../providers/tasks_provider.dart';
import '../widgets/task_item.dart';
import '../widgets/task_form_dialog.dart';

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
            icon: const Icon(Icons.edit_outlined),
            onPressed: () {
              showDialog(
                context: context,
                builder: (context) => TaskFormDialog(task: task),
              );
            },
          ),
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
                  // Task Item (shows title, metadata, etc.)
                  TaskItem(
                    task: task,
                    showDetails: true,
                    onCheckboxChanged: (task, value) {
                      ref.read(tasksProvider.notifier).toggleTaskCompletion(task);
                    },
                    onTap: null, // Don't allow tapping to open detail from detail
                  ),

                  const SizedBox(height: AppSpacing.xl2),

                  // Description
                  if (task.description != null && task.description!.isNotEmpty) ...[
                    Text(
                      task.description!,
                      style: AppTextStyles.bodyMedium.copyWith(
                        color: AppColors.mutedForeground,
                      ),
                    ),
                    const SizedBox(height: AppSpacing.xl2),
                  ],

                  // Subtasks section
                  if (subtasks.isNotEmpty || task.parentId == null) ...[
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Sub Tasks',
                          style: AppTextStyles.h3,
                        ),
                        IconButton(
                          icon: const Icon(Icons.add_box_outlined),
                          onPressed: () {
                            // TODO: Add new subtask
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('Add subtask coming soon'),
                              ),
                            );
                          },
                        ),
                      ],
                    ),
                    const SizedBox(height: AppSpacing.md),

                    if (subtasks.isEmpty)
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
}