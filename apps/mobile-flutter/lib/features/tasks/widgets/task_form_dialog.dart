import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../theme/app_colors.dart';
import '../../../theme/app_spacing.dart';
import '../../../theme/app_text_styles.dart';
import '../../../shared/widgets/app_button.dart';
import '../../../shared/widgets/app_input.dart';
import '../../../core/models/task.dart';
import '../providers/tasks_provider.dart';

class TaskFormDialog extends ConsumerStatefulWidget {
  final Task? task; // If provided, we're editing; if null, we're creating
  final TaskPriority? initialPriority;
  final DateTime? initialDate;

  const TaskFormDialog({
    super.key,
    this.task,
    this.initialPriority,
    this.initialDate,
  });

  @override
  ConsumerState<TaskFormDialog> createState() => _TaskFormDialogState();
}

class _TaskFormDialogState extends ConsumerState<TaskFormDialog> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();

  late TaskPriority _selectedPriority;
  DateTime? _selectedDate;
  DateTime? _selectedDueDate;
  int? _estimatedMinutes;
  bool _isLoading = false;

  bool get _isEditing => widget.task != null;

  @override
  void initState() {
    super.initState();

    if (_isEditing) {
      // Populate fields with existing task data
      _titleController.text = widget.task!.title;
      _descriptionController.text = widget.task!.description ?? '';
      _selectedPriority = widget.task!.priority;
      _selectedDate = widget.task!.date;
      _selectedDueDate = widget.task!.dueDate;
      _estimatedMinutes = widget.task!.estimatedMinutes;
    } else {
      // Use provided defaults for new task
      _selectedPriority = widget.initialPriority ?? TaskPriority.medium;
      _selectedDate = widget.initialDate;
    }
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  Future<void> _handleSubmit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isLoading = true;
    });

    try {
      final bool success;

      if (_isEditing) {
        // Update existing task
        success = await ref.read(tasksProvider.notifier).updateTask(
          taskId: widget.task!.id,
          title: _titleController.text.trim(),
          description: _descriptionController.text.trim().isEmpty
              ? null
              : _descriptionController.text.trim(),
          priority: _selectedPriority,
          date: _selectedDate,
          dueDate: _selectedDueDate,
        );
      } else {
        // Create new task
        success = await ref.read(tasksProvider.notifier).createTask(
          title: _titleController.text.trim(),
          description: _descriptionController.text.trim().isEmpty
              ? null
              : _descriptionController.text.trim(),
          priority: _selectedPriority,
          date: _selectedDate,
          dueDate: _selectedDueDate,
        );
      }

      if (success && mounted) {
        Navigator.of(context).pop(true);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(_isEditing
                ? 'Task updated successfully'
                : 'Task created successfully'),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(_isEditing
                ? 'Failed to update task: $e'
                : 'Failed to create task: $e'),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _selectDate() async {
    final date = await showDatePicker(
      context: context,
      initialDate: _selectedDate ?? DateTime.now(),
      firstDate: DateTime(2020),
      lastDate: DateTime(2030),
    );

    if (date != null) {
      final time = await showTimePicker(
        context: context,
        initialTime: TimeOfDay.fromDateTime(_selectedDate ?? DateTime.now()),
      );

      if (time != null) {
        setState(() {
          _selectedDate = DateTime(
            date.year,
            date.month,
            date.day,
            time.hour,
            time.minute,
          );
        });
      }
    }
  }

  Future<void> _selectDueDate() async {
    final date = await showDatePicker(
      context: context,
      initialDate: _selectedDueDate ?? DateTime.now(),
      firstDate: DateTime(2020),
      lastDate: DateTime(2030),
    );

    if (date != null) {
      final time = await showTimePicker(
        context: context,
        initialTime: TimeOfDay.fromDateTime(_selectedDueDate ?? DateTime.now()),
      );

      if (time != null) {
        setState(() {
          _selectedDueDate = DateTime(
            date.year,
            date.month,
            date.day,
            time.hour,
            time.minute,
          );
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      insetPadding: const EdgeInsets.all(AppSpacing.paddingLG),
      child: Container(
        constraints: const BoxConstraints(maxWidth: 500),
        child: SingleChildScrollView(
          child: Padding(
            padding: const EdgeInsets.all(AppSpacing.paddingXL),
            child: Form(
              key: _formKey,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Header
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        _isEditing ? 'Edit Task' : 'New Task',
                        style: AppTextStyles.h3,
                      ),
                      IconButton(
                        icon: const Icon(Icons.close),
                        onPressed: () => Navigator.of(context).pop(),
                      ),
                    ],
                  ),

                  const SizedBox(height: AppSpacing.xl),

                  // Title
                  AppInput(
                    controller: _titleController,
                    labelText: 'Title',
                    hintText: 'Enter task title',
                    validator: (value) {
                      if (value == null || value.trim().isEmpty) {
                        return 'Please enter a title';
                      }
                      return null;
                    },
                  ),

                  const SizedBox(height: AppSpacing.lg),

                  // Description
                  AppInput(
                    controller: _descriptionController,
                    labelText: 'Description',
                    hintText: 'Enter task description (optional)',
                    maxLines: 3,
                  ),

                  const SizedBox(height: AppSpacing.lg),

                  // Priority
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Priority',
                        style: AppTextStyles.bodyMedium.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: AppSpacing.sm),
                      SegmentedButton<TaskPriority>(
                        segments: const [
                          ButtonSegment(
                            value: TaskPriority.low,
                            label: Text('Low'),
                          ),
                          ButtonSegment(
                            value: TaskPriority.medium,
                            label: Text('Medium'),
                          ),
                          ButtonSegment(
                            value: TaskPriority.high,
                            label: Text('High'),
                          ),
                        ],
                        selected: {_selectedPriority},
                        onSelectionChanged: (Set<TaskPriority> selected) {
                          setState(() {
                            _selectedPriority = selected.first;
                          });
                        },
                      ),
                    ],
                  ),

                  const SizedBox(height: AppSpacing.lg),

                  // Date
                  OutlinedButton.icon(
                    onPressed: _selectDate,
                    icon: const Icon(Icons.calendar_today_outlined, size: 20),
                    label: Text(
                      _selectedDate == null
                          ? 'Set Date & Time'
                          : 'Date: ${_formatDateTime(_selectedDate!)}',
                    ),
                    style: OutlinedButton.styleFrom(
                      alignment: Alignment.centerLeft,
                      padding: const EdgeInsets.all(AppSpacing.paddingMD),
                    ),
                  ),

                  const SizedBox(height: AppSpacing.md),

                  // Due Date
                  OutlinedButton.icon(
                    onPressed: _selectDueDate,
                    icon: const Icon(Icons.event_outlined, size: 20),
                    label: Text(
                      _selectedDueDate == null
                          ? 'Set Due Date'
                          : 'Due: ${_formatDateTime(_selectedDueDate!)}',
                    ),
                    style: OutlinedButton.styleFrom(
                      alignment: Alignment.centerLeft,
                      padding: const EdgeInsets.all(AppSpacing.paddingMD),
                    ),
                  ),

                  const SizedBox(height: AppSpacing.xl2),

                  // Buttons
                  Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      TextButton(
                        onPressed: _isLoading ? null : () => Navigator.of(context).pop(),
                        child: const Text('Cancel'),
                      ),
                      const SizedBox(width: AppSpacing.md),
                      AppButton(
                        text: _isEditing ? 'Save Changes' : 'Create Task',
                        onPressed: _isLoading ? null : _handleSubmit,
                        isLoading: _isLoading,
                        variant: AppButtonVariant.primary,
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  String _formatDateTime(DateTime dateTime) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final tomorrow = today.add(const Duration(days: 1));
    final dateToCheck = DateTime(dateTime.year, dateTime.month, dateTime.day);

    final timeStr = '${dateTime.hour.toString().padLeft(2, '0')}:${dateTime.minute.toString().padLeft(2, '0')}';

    if (dateToCheck == today) {
      return 'Today $timeStr';
    } else if (dateToCheck == tomorrow) {
      return 'Tomorrow $timeStr';
    } else {
      return '${dateTime.month}/${dateTime.day}/${dateTime.year} $timeStr';
    }
  }
}
