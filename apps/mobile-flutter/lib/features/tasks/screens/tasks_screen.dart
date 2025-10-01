import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../theme/app_colors.dart';
import '../../../theme/app_spacing.dart';
import '../../../theme/app_text_styles.dart';
import '../../../features/auth/providers/auth_provider.dart';
import '../../../features/chat/widgets/chat_drawer.dart';
import '../../../features/pomodoro/widgets/pomodoro_modal.dart';
import '../../../features/pomodoro/providers/pomodoro_provider.dart';
import '../../../features/settings/screens/settings_screen.dart';
import '../../../core/models/task.dart';
import '../providers/tasks_provider.dart';
import '../widgets/task_group.dart';
import '../widgets/task_form_dialog.dart';
import 'task_detail_screen.dart';

class TasksScreen extends ConsumerStatefulWidget {
  const TasksScreen({super.key});

  @override
  ConsumerState<TasksScreen> createState() => _TasksScreenState();
}

class _TasksScreenState extends ConsumerState<TasksScreen> {
  @override
  Widget build(BuildContext context) {
    final tasksState = ref.watch(tasksProvider);
    final user = ref.watch(authProvider).user;

    print('TasksScreen - Total tasks: ${tasksState.tasks.length}');
    print('TasksScreen - Today tasks: ${tasksState.todayTasks.length}');
    print('TasksScreen - High priority: ${tasksState.highPriorityTasks.length}');
    print('TasksScreen - Medium priority: ${tasksState.mediumPriorityTasks.length}');
    print('TasksScreen - Low priority: ${tasksState.lowPriorityTasks.length}');
    print('TasksScreen - Completed: ${tasksState.completedTasks.length}');

    return Scaffold(
      appBar: AppBar(
        leading: Builder(
          builder: (context) => IconButton(
            icon: const Icon(Icons.menu),
            onPressed: () => Scaffold.of(context).openDrawer(),
          ),
        ),
        title: const Text('Tasks'),
        actions: [
          // Pomodoro timer (will show time when active)
          IconButton(
            icon: const Icon(Icons.timer_outlined),
            onPressed: () {
              ref.read(pomodoroProvider.notifier).show();
              showDialog(
                context: context,
                builder: (context) => const PomodoroModal(),
              );
            },
          ),
          // Notifications
          IconButton(
            icon: const Icon(Icons.notifications_outlined),
            onPressed: () {
              // TODO: Open notifications
            },
          ),
          // Theme toggle
          IconButton(
            icon: const Icon(Icons.light_mode_outlined),
            onPressed: () {
              // TODO: Toggle theme
            },
          ),
          // User avatar
          Padding(
            padding: const EdgeInsets.only(right: AppSpacing.paddingSM),
            child: GestureDetector(
              onTap: () {
                // TODO: Open profile
              },
              child: CircleAvatar(
                radius: 16,
                backgroundColor: AppColors.primary,
                child: Text(
                  user?.name?.substring(0, 1).toUpperCase() ??
                      user?.email?.substring(0, 1).toUpperCase() ??
                      'U',
                  style: const TextStyle(
                    color: AppColors.primaryForeground,
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
      drawer: _buildDrawer(context),
      body: tasksState.isLoading && tasksState.tasks.isEmpty
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: () => ref.read(tasksProvider.notifier).fetchTasks(),
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                child: Column(
                  children: [
                    const SizedBox(height: AppSpacing.lg),

                    // Today group
                    TaskGroup(
                      title: 'Today',
                      tasks: tasksState.todayTasks,
                      onAddTask: () => _showAddTaskDialog(context, date: DateTime.now()),
                      onTaskTap: (task) => _showTaskDetail(context, task),
                      onCheckboxChanged: (task, value) =>
                          ref.read(tasksProvider.notifier).toggleTaskCompletion(task),
                      onDeleteTask: (task) =>
                          ref.read(tasksProvider.notifier).deleteTask(task.id),
                      onPlayTask: (task) => _startPomodoro(context, task),
                    ),

                    // High Priority group
                    TaskGroup(
                      title: 'High Priority',
                      tasks: tasksState.highPriorityTasks,
                      onAddTask: () => _showAddTaskDialog(context, priority: TaskPriority.high),
                      onTaskTap: (task) => _showTaskDetail(context, task),
                      onCheckboxChanged: (task, value) =>
                          ref.read(tasksProvider.notifier).toggleTaskCompletion(task),
                      onDeleteTask: (task) =>
                          ref.read(tasksProvider.notifier).deleteTask(task.id),
                      onPlayTask: (task) => _startPomodoro(context, task),
                    ),

                    // Medium Priority group
                    TaskGroup(
                      title: 'Medium Priority',
                      tasks: tasksState.mediumPriorityTasks,
                      onAddTask: () => _showAddTaskDialog(context, priority: TaskPriority.medium),
                      onTaskTap: (task) => _showTaskDetail(context, task),
                      onCheckboxChanged: (task, value) =>
                          ref.read(tasksProvider.notifier).toggleTaskCompletion(task),
                      onDeleteTask: (task) =>
                          ref.read(tasksProvider.notifier).deleteTask(task.id),
                      onPlayTask: (task) => _startPomodoro(context, task),
                    ),

                    // Low Priority group
                    TaskGroup(
                      title: 'Low Priority',
                      tasks: tasksState.lowPriorityTasks,
                      onAddTask: () => _showAddTaskDialog(context, priority: TaskPriority.low),
                      onTaskTap: (task) => _showTaskDetail(context, task),
                      onCheckboxChanged: (task, value) =>
                          ref.read(tasksProvider.notifier).toggleTaskCompletion(task),
                      onDeleteTask: (task) =>
                          ref.read(tasksProvider.notifier).deleteTask(task.id),
                      onPlayTask: (task) => _startPomodoro(context, task),
                    ),

                    // Completed group
                    TaskGroup(
                      title: 'Completed',
                      tasks: tasksState.completedTasks,
                      onAddTask: () => _showAddTaskDialog(context),
                      onTaskTap: (task) => _showTaskDetail(context, task),
                      onCheckboxChanged: (task, value) =>
                          ref.read(tasksProvider.notifier).toggleTaskCompletion(task),
                      onDeleteTask: (task) =>
                          ref.read(tasksProvider.notifier).deleteTask(task.id),
                      onPlayTask: (task) => _startPomodoro(context, task),
                    ),

                    const SizedBox(height: AppSpacing.xl6),
                  ],
                ),
              ),
            ),
      floatingActionButton: _buildChatButton(context),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerFloat,
    );
  }

  Widget _buildDrawer(BuildContext context) {
    return Drawer(
      child: ListView(
        padding: EdgeInsets.zero,
        children: [
          DrawerHeader(
            decoration: const BoxDecoration(
              color: AppColors.primary,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                const Icon(
                  Icons.check_circle,
                  size: 48,
                  color: AppColors.primaryForeground,
                ),
                const SizedBox(height: AppSpacing.sm),
                Text(
                  'SmartTodos',
                  style: AppTextStyles.h3.copyWith(
                    color: AppColors.primaryForeground,
                  ),
                ),
              ],
            ),
          ),
          ListTile(
            leading: const Icon(Icons.dashboard_outlined),
            title: const Text('Dashboard'),
            onTap: () {},
          ),
          ListTile(
            leading: const Icon(Icons.check_circle_outline),
            title: const Text('Tasks'),
            selected: true,
            onTap: () => Navigator.pop(context),
          ),
          ListTile(
            leading: const Icon(Icons.calendar_today_outlined),
            title: const Text('Calendar'),
            onTap: () {},
          ),
          ListTile(
            leading: const Icon(Icons.bar_chart_outlined),
            title: const Text('Progress'),
            onTap: () {},
          ),
          ListTile(
            leading: const Icon(Icons.person_outline),
            title: const Text('My Coach'),
            onTap: () {},
          ),
          ListTile(
            leading: const Icon(Icons.emoji_events_outlined),
            title: const Text('Rewards'),
            onTap: () {},
          ),
          ListTile(
            leading: const Icon(Icons.account_circle_outlined),
            title: const Text('Profile'),
            onTap: () {},
          ),
          ListTile(
            leading: const Icon(Icons.settings_outlined),
            title: const Text('Settings'),
            onTap: () {
              Navigator.pop(context);
              Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (context) => const SettingsScreen(),
                ),
              );
            },
          ),
          const Divider(),
          ListTile(
            leading: const Icon(Icons.logout),
            title: const Text('Logout'),
            onTap: () {
              ref.read(authProvider.notifier).logout();
            },
          ),
        ],
      ),
    );
  }

  Widget _buildChatButton(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: AppSpacing.paddingLG),
      child: ElevatedButton(
        onPressed: () {
          showModalBottomSheet(
            context: context,
            isScrollControlled: true,
            backgroundColor: Colors.transparent,
            builder: (context) => const ChatDrawer(),
          );
        },
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary,
          foregroundColor: AppColors.primaryForeground,
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.paddingXL,
            vertical: AppSpacing.paddingMD,
          ),
          elevation: 4,
          shadowColor: AppColors.primary.withOpacity(0.5),
        ),
        child: const Text('Chat with Coach'),
      ),
    );
  }

  void _showAddTaskDialog(BuildContext context, {TaskPriority? priority, DateTime? date}) {
    showDialog(
      context: context,
      builder: (context) => TaskFormDialog(
        initialPriority: priority,
        initialDate: date,
      ),
    );
  }

  void _showTaskDetail(BuildContext context, task) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => TaskDetailScreen(taskId: task.id),
      ),
    );
  }

  void _startPomodoro(BuildContext context, task) {
    ref.read(pomodoroProvider.notifier).startFocus(task.id);
    showDialog(
      context: context,
      builder: (context) => const PomodoroModal(),
    );
  }
}