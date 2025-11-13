import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../theme/app_colors.dart';
import '../../../theme/app_spacing.dart';
import '../../../theme/app_text_styles.dart';
import '../providers/tasks_provider.dart';
import 'package:intl/intl.dart';

enum DateTimeTab { dueDate, date, repeat, reminders }

class TaskDateTimePicker extends ConsumerStatefulWidget {
  final String taskId;
  final DateTime? initialDate;
  final TimeOfDay? initialTime;
  final DateTime? initialDueDate;
  final Function(DateTime? date, TimeOfDay? time, DateTime? dueDate)? onSave;

  const TaskDateTimePicker({
    super.key,
    required this.taskId,
    this.initialDate,
    this.initialTime,
    this.initialDueDate,
    this.onSave,
  });

  @override
  ConsumerState<TaskDateTimePicker> createState() => _TaskDateTimePickerState();
}

class _TaskDateTimePickerState extends ConsumerState<TaskDateTimePicker> {
  DateTimeTab _currentTab = DateTimeTab.dueDate;
  DateTime? _selectedDate;
  DateTime? _selectedDueDate;
  TimeOfDay? _selectedTime;
  DateTime _displayedMonth = DateTime.now();

  // Repeat settings
  bool _repeatEnabled = false;
  int _repeatInterval = 1;
  String _repeatUnit = 'Week'; // Day, Week, Month, Year
  Set<String> _selectedDays = {}; // For weekly repeat
  String? _selectedMonth; // For yearly repeat
  int? _selectedDay; // For yearly repeat

  // Reminder settings
  List<Map<String, dynamic>> _reminders = [];

  @override
  void initState() {
    super.initState();
    _selectedDate = widget.initialDate;
    _selectedTime = widget.initialTime;
    _selectedDueDate = widget.initialDueDate;
    if (_selectedDate != null) {
      _displayedMonth = DateTime(_selectedDate!.year, _selectedDate!.month);
    }
  }

  void _selectDate(DateTime date) {
    setState(() {
      if (_currentTab == DateTimeTab.dueDate) {
        _selectedDueDate = date;
        // Update task via API
        ref.read(tasksProvider.notifier).updateTask(
          taskId: widget.taskId,
          dueDate: date,
        );
      } else {
        _selectedDate = date;
        // Combine date and time if both are set
        DateTime? dateTime;
        if (_selectedTime != null) {
          dateTime = DateTime(
            date.year,
            date.month,
            date.day,
            _selectedTime!.hour,
            _selectedTime!.minute,
          );
        } else {
          dateTime = date;
        }
        // Update task via API
        ref.read(tasksProvider.notifier).updateTask(
          taskId: widget.taskId,
          date: dateTime,
        );
      }
    });
  }

  void _selectQuickDate(int days) {
    final date = DateTime.now().add(Duration(days: days));
    _selectDate(date);
  }

  void _previousMonth() {
    setState(() {
      _displayedMonth = DateTime(_displayedMonth.year, _displayedMonth.month - 1);
    });
  }

  void _nextMonth() {
    setState(() {
      _displayedMonth = DateTime(_displayedMonth.year, _displayedMonth.month + 1);
    });
  }

  void _showTimePicker() async {
    final time = await showTimePicker(
      context: context,
      initialTime: _selectedTime ?? TimeOfDay.now(),
    );
    if (time != null) {
      setState(() {
        _selectedTime = time;
        // Combine date and time
        DateTime? dateTime;
        if (_selectedDate != null) {
          dateTime = DateTime(
            _selectedDate!.year,
            _selectedDate!.month,
            _selectedDate!.day,
            time.hour,
            time.minute,
          );
        } else {
          // If no date selected, use today
          final now = DateTime.now();
          dateTime = DateTime(
            now.year,
            now.month,
            now.day,
            time.hour,
            time.minute,
          );
          _selectedDate = dateTime;
        }
        // Update task via API
        ref.read(tasksProvider.notifier).updateTask(
          taskId: widget.taskId,
          date: dateTime,
        );
      });
    }
  }

  void _addReminder() {
    setState(() {
      _reminders.add({
        'type': 'Notification',
        'value': 15,
        'unit': 'minutes',
      });
      _saveReminders();
    });
  }

  void _removeReminder(int index) {
    setState(() {
      _reminders.removeAt(index);
      _saveReminders();
    });
  }

  void _updateReminder(int index, String key, dynamic value) {
    setState(() {
      _reminders[index][key] = value;
      _saveReminders();
    });
  }

  void _saveReminders() {
    // TODO: Implement when backend API is ready for notifications
    // The notifications should be sent to /api/notifications endpoint
    // For now, this is a placeholder for future implementation
    print('Saving reminders: $_reminders');
  }

  String _buildRecurrenceRule() {
    if (!_repeatEnabled) return '';

    // Build recurrence rule string (simplified RRULE format)
    final buffer = StringBuffer('FREQ=');
    buffer.write(_repeatUnit.toUpperCase());
    buffer.write(';INTERVAL=$_repeatInterval');

    if (_repeatUnit == 'Week' && _selectedDays.isNotEmpty) {
      buffer.write(';BYDAY=');
      buffer.write(_selectedDays.join(','));
    } else if (_repeatUnit == 'Year' && _selectedMonth != null && _selectedDay != null) {
      // Format: BYMONTH=1;BYMONTHDAY=15 (e.g., January 15)
      final monthIndex = DateFormat.MMMM().dateSymbols.MONTHS.indexOf(_selectedMonth!) + 1;
      buffer.write(';BYMONTH=$monthIndex;BYMONTHDAY=$_selectedDay');
    }

    return buffer.toString();
  }

  void _saveRecurrenceRule() {
    final rule = _buildRecurrenceRule();
    ref.read(tasksProvider.notifier).updateTask(
      taskId: widget.taskId,
      recurrenceRule: rule.isEmpty ? null : rule,
      clearRecurrenceRule: rule.isEmpty,
    );
  }

  void _clear() {
    setState(() {
      if (_currentTab == DateTimeTab.dueDate) {
        _selectedDueDate = null;
        // Update task via API - clear due date
        ref.read(tasksProvider.notifier).updateTask(
          taskId: widget.taskId,
          clearDueDate: true,
        );
      } else if (_currentTab == DateTimeTab.date) {
        _selectedDate = null;
        _selectedTime = null;
        // Update task via API - clear date
        ref.read(tasksProvider.notifier).updateTask(
          taskId: widget.taskId,
          clearDate: true,
        );
      } else if (_currentTab == DateTimeTab.repeat) {
        _repeatEnabled = false;
        _repeatInterval = 1;
        _repeatUnit = 'Week';
        _selectedDays.clear();
        _selectedMonth = null;
        _selectedDay = null;
        // Update task via API - clear repeat settings
        ref.read(tasksProvider.notifier).updateTask(
          taskId: widget.taskId,
          clearRecurrenceRule: true,
        );
      } else if (_currentTab == DateTimeTab.reminders) {
        _reminders.clear();
        // Update task via API - clear reminders
        _saveReminders();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: AppColors.background,
        borderRadius: BorderRadius.vertical(top: Radius.circular(AppSpacing.radiusLG)),
      ),
      child: SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Handle bar
            Container(
              margin: const EdgeInsets.only(top: AppSpacing.paddingMD),
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: AppColors.muted,
                borderRadius: BorderRadius.circular(2),
              ),
            ),

            // Title
            Padding(
              padding: const EdgeInsets.all(AppSpacing.paddingLG),
              child: Text(
                _getTitle(),
                style: AppTextStyles.h3,
              ),
            ),

            // Tab bar
            Container(
              decoration: BoxDecoration(
                border: Border(
                  bottom: BorderSide(color: AppColors.border, width: 1),
                ),
              ),
              child: Row(
                children: [
                  _buildTab(DateTimeTab.dueDate, Icons.calendar_today_outlined),
                  _buildTab(DateTimeTab.date, Icons.hourglass_empty),
                  _buildTab(DateTimeTab.repeat, Icons.refresh),
                  _buildTab(DateTimeTab.reminders, Icons.notifications_outlined),
                ],
              ),
            ),

            // Content
            Flexible(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(AppSpacing.paddingLG),
                child: _buildContent(),
              ),
            ),

            // Clear button
            Padding(
              padding: const EdgeInsets.all(AppSpacing.paddingLG),
              child: Align(
                alignment: Alignment.centerRight,
                child: TextButton(
                  onPressed: _clear,
                  child: const Text('Clear'),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _getTitle() {
    switch (_currentTab) {
      case DateTimeTab.dueDate:
        return 'Set Due date';
      case DateTimeTab.date:
        return 'Set Date';
      case DateTimeTab.repeat:
        return 'Set Repeat';
      case DateTimeTab.reminders:
        return 'Set Reminders';
    }
  }

  Widget _buildTab(DateTimeTab tab, IconData icon) {
    final isSelected = _currentTab == tab;
    return Expanded(
      child: InkWell(
        onTap: () {
          setState(() {
            _currentTab = tab;
          });
        },
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: AppSpacing.paddingMD),
          decoration: BoxDecoration(
            border: isSelected
                ? const Border(
                    bottom: BorderSide(color: AppColors.primary, width: 2),
                  )
                : null,
          ),
          child: Icon(
            icon,
            color: isSelected ? AppColors.primary : AppColors.mutedForeground,
          ),
        ),
      ),
    );
  }

  Widget _buildContent() {
    switch (_currentTab) {
      case DateTimeTab.dueDate:
        return _buildDueDateContent();
      case DateTimeTab.date:
        return _buildDateContent();
      case DateTimeTab.repeat:
        return _buildRepeatContent();
      case DateTimeTab.reminders:
        return _buildRemindersContent();
    }
  }

  Widget _buildDueDateContent() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Calendar
            Expanded(
              flex: 3,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Due date', style: AppTextStyles.h4),
                  const SizedBox(height: AppSpacing.md),
                  _buildCalendar(),
                ],
              ),
            ),
            const SizedBox(width: AppSpacing.lg),
            // Quick select
            Expanded(
              flex: 2,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Quick select', style: AppTextStyles.h4),
                  const SizedBox(height: AppSpacing.md),
                  _buildQuickSelectButton('Today', 0),
                  _buildQuickSelectButton('Tomorrow', 1),
                  _buildQuickSelectButton('This week', 7),
                  _buildQuickSelectButton('1 week', 7),
                  _buildQuickSelectButton('2 weeks', 14),
                  _buildQuickSelectButton('1 month', 30),
                  _buildQuickSelectButton('3 months', 90),
                ],
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildDateContent() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Calendar
            Expanded(
              flex: 3,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Date', style: AppTextStyles.h4),
                  const SizedBox(height: AppSpacing.md),
                  _buildCalendar(),
                ],
              ),
            ),
            const SizedBox(width: AppSpacing.lg),
            // Time
            Expanded(
              flex: 2,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Time', style: AppTextStyles.h4),
                  const SizedBox(height: AppSpacing.md),
                  InkWell(
                    onTap: _showTimePicker,
                    child: Container(
                      padding: const EdgeInsets.all(AppSpacing.paddingMD),
                      decoration: BoxDecoration(
                        border: Border.all(color: AppColors.border),
                        borderRadius: BorderRadius.circular(AppSpacing.radiusMD),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            _selectedTime?.format(context) ?? '12:00',
                            style: AppTextStyles.h3,
                          ),
                          const SizedBox(width: AppSpacing.sm),
                          const Icon(Icons.access_time),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildRepeatContent() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
          Checkbox(
              value: _repeatEnabled,
              onChanged: (value) {
                setState(() {
                  _repeatEnabled = value ?? false;
                  _saveRecurrenceRule();
                });
              },
            ),
            const Text('Repeats'),
          ],
        ),
        const SizedBox(height: AppSpacing.lg),
        Text('Repeat every...', style: AppTextStyles.bodyMedium),
        const SizedBox(height: AppSpacing.md),
        Row(
          children: [
            SizedBox(
              width: 80,
              child: TextField(
                keyboardType: TextInputType.number,
                decoration: InputDecoration(
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(AppSpacing.radiusMD),
                  ),
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.paddingMD,
                    vertical: AppSpacing.paddingSM,
                  ),
                ),
                controller: TextEditingController(text: _repeatInterval.toString()),
                onChanged: (value) {
                  setState(() {
                    _repeatInterval = int.tryParse(value) ?? 1;
                    _saveRecurrenceRule();
                  });
                },
              ),
            ),
            const SizedBox(width: AppSpacing.md),
            Expanded(
              child: DropdownButtonFormField<String>(
                value: _repeatUnit,
                decoration: InputDecoration(
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(AppSpacing.radiusMD),
                  ),
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.paddingMD,
                    vertical: AppSpacing.paddingSM,
                  ),
                ),
                items: ['Day', 'Week', 'Month', 'Year']
                    .map((unit) => DropdownMenuItem(
                          value: unit,
                          child: Text(unit),
                        ))
                    .toList(),
                onChanged: (value) {
                  setState(() {
                    _repeatUnit = value ?? 'Week';
                    _saveRecurrenceRule();
                  });
                },
              ),
            ),
          ],
        ),
        const SizedBox(height: AppSpacing.lg),
        if (_repeatUnit == 'Week') ...[
          Text('On', style: AppTextStyles.h4),
          const SizedBox(height: AppSpacing.md),
          Wrap(
            spacing: AppSpacing.sm,
            runSpacing: AppSpacing.sm,
            children: ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU']
                .map((day) => _buildDayChip(day))
                .toList(),
          ),
        ],
        if (_repeatUnit == 'Year') ...[
          Text('On', style: AppTextStyles.h4),
          const SizedBox(height: AppSpacing.md),
          Row(
            children: [
              Expanded(
                child: DropdownButtonFormField<String>(
                  value: _selectedMonth,
                  hint: const Text('January'),
                  decoration: InputDecoration(
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(AppSpacing.radiusMD),
                    ),
                  ),
                  items: DateFormat.MMMM()
                      .dateSymbols
                      .MONTHS
                      .map((month) => DropdownMenuItem(
                            value: month,
                            child: Text(month),
                          ))
                      .toList(),
                  onChanged: (value) {
                    setState(() {
                      _selectedMonth = value;
                      _saveRecurrenceRule();
                    });
                  },
                ),
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: DropdownButtonFormField<int>(
                  value: _selectedDay,
                  hint: const Text('1'),
                  decoration: InputDecoration(
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(AppSpacing.radiusMD),
                    ),
                  ),
                  items: List.generate(31, (i) => i + 1)
                      .map((day) => DropdownMenuItem(
                            value: day,
                            child: Text(day.toString()),
                          ))
                      .toList(),
                  onChanged: (value) {
                    setState(() {
                      _selectedDay = value;
                      _saveRecurrenceRule();
                    });
                  },
                ),
              ),
            ],
          ),
        ],
      ],
    );
  }

  Widget _buildRemindersContent() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        ..._reminders.asMap().entries.map((entry) {
          final index = entry.key;
          final reminder = entry.value;
          return Container(
            margin: const EdgeInsets.only(bottom: AppSpacing.md),
            child: Row(
              children: [
                Expanded(
                  flex: 2,
                  child: DropdownButtonFormField<String>(
                    value: reminder['type'],
                    decoration: InputDecoration(
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(AppSpacing.radiusMD),
                      ),
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: AppSpacing.paddingMD,
                        vertical: AppSpacing.paddingSM,
                      ),
                    ),
                    items: ['Notification', 'Email', 'SMS']
                        .map((type) => DropdownMenuItem(
                              value: type,
                              child: Text(type),
                            ))
                        .toList(),
                    onChanged: (value) {
                      _updateReminder(index, 'type', value);
                    },
                  ),
                ),
                const SizedBox(width: AppSpacing.sm),
                SizedBox(
                  width: 70,
                  child: TextField(
                    keyboardType: TextInputType.number,
                    decoration: InputDecoration(
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(AppSpacing.radiusMD),
                      ),
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: AppSpacing.paddingMD,
                        vertical: AppSpacing.paddingSM,
                      ),
                    ),
                    controller: TextEditingController(text: reminder['value'].toString()),
                    onChanged: (value) {
                      _updateReminder(index, 'value', int.tryParse(value) ?? 15);
                    },
                  ),
                ),
                const SizedBox(width: AppSpacing.sm),
                Expanded(
                  child: DropdownButtonFormField<String>(
                    value: reminder['unit'],
                    decoration: InputDecoration(
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(AppSpacing.radiusMD),
                      ),
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: AppSpacing.paddingMD,
                        vertical: AppSpacing.paddingSM,
                      ),
                    ),
                    items: ['minutes', 'hours', 'days']
                        .map((unit) => DropdownMenuItem(
                              value: unit,
                              child: Text(unit),
                            ))
                        .toList(),
                    onChanged: (value) {
                      _updateReminder(index, 'unit', value);
                    },
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close),
                  onPressed: () => _removeReminder(index),
                ),
              ],
            ),
          );
        }),
        OutlinedButton.icon(
          onPressed: _addReminder,
          icon: const Icon(Icons.add_circle_outline),
          label: const Text('Add notification'),
          style: OutlinedButton.styleFrom(
            padding: const EdgeInsets.all(AppSpacing.paddingMD),
          ),
        ),
      ],
    );
  }

  Widget _buildCalendar() {
    final daysInMonth = DateTime(_displayedMonth.year, _displayedMonth.month + 1, 0).day;
    final firstDayOfWeek = DateTime(_displayedMonth.year, _displayedMonth.month, 1).weekday % 7;

    return Column(
      children: [
        // Month navigation
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            IconButton(
              icon: const Icon(Icons.chevron_left),
              onPressed: _previousMonth,
            ),
            Text(
              DateFormat('MMMM yyyy').format(_displayedMonth),
              style: AppTextStyles.h4,
            ),
            IconButton(
              icon: const Icon(Icons.chevron_right),
              onPressed: _nextMonth,
            ),
          ],
        ),
        const SizedBox(height: AppSpacing.md),
        // Week days
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
              .map((day) => Expanded(
                    child: Center(
                      child: Text(
                        day,
                        style: AppTextStyles.bodySmall.copyWith(
                          color: AppColors.mutedForeground,
                        ),
                      ),
                    ),
                  ))
              .toList(),
        ),
        const SizedBox(height: AppSpacing.sm),
        // Calendar grid
        ...List.generate((daysInMonth + firstDayOfWeek + 6) ~/ 7, (weekIndex) {
          return Padding(
            padding: const EdgeInsets.symmetric(vertical: 2),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: List.generate(7, (dayIndex) {
                final dayNumber = weekIndex * 7 + dayIndex - firstDayOfWeek + 1;
                if (dayNumber < 1 || dayNumber > daysInMonth) {
                  return const Expanded(child: SizedBox(height: 40));
                }

                final date = DateTime(_displayedMonth.year, _displayedMonth.month, dayNumber);
                final isSelected = (_currentTab == DateTimeTab.dueDate && _selectedDueDate != null &&
                        _selectedDueDate!.year == date.year &&
                        _selectedDueDate!.month == date.month &&
                        _selectedDueDate!.day == date.day) ||
                    (_currentTab == DateTimeTab.date && _selectedDate != null &&
                        _selectedDate!.year == date.year &&
                        _selectedDate!.month == date.month &&
                        _selectedDate!.day == date.day);

                return Expanded(
                  child: InkWell(
                    onTap: () => _selectDate(date),
                    child: Container(
                      height: 40,
                      alignment: Alignment.center,
                      decoration: isSelected
                          ? BoxDecoration(
                              color: AppColors.primary,
                              borderRadius: BorderRadius.circular(AppSpacing.radiusMD),
                            )
                          : null,
                      child: Text(
                        dayNumber.toString(),
                        style: TextStyle(
                          color: isSelected ? Colors.white : AppColors.foreground,
                        ),
                      ),
                    ),
                  ),
                );
              }),
            ),
          );
        }),
      ],
    );
  }

  Widget _buildQuickSelectButton(String label, int days) {
    return Container(
      margin: const EdgeInsets.only(bottom: AppSpacing.sm),
      child: OutlinedButton(
        onPressed: () => _selectQuickDate(days),
        style: OutlinedButton.styleFrom(
          minimumSize: const Size(double.infinity, 40),
        ),
        child: Text(label),
      ),
    );
  }

  Widget _buildDayChip(String day) {
    final isSelected = _selectedDays.contains(day);
    return FilterChip(
      label: Text(day),
      selected: isSelected,
      onSelected: (selected) {
        setState(() {
          if (selected) {
            _selectedDays.add(day);
          } else {
            _selectedDays.remove(day);
          }
          _saveRecurrenceRule();
        });
      },
      selectedColor: AppColors.primary,
      labelStyle: TextStyle(
        color: isSelected ? Colors.white : AppColors.foreground,
      ),
    );
  }
}
