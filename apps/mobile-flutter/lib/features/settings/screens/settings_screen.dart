import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../theme/app_colors.dart';
import '../../../theme/app_spacing.dart';
import '../../../theme/app_text_styles.dart';
import '../../../features/auth/providers/auth_provider.dart';

class SettingsScreen extends ConsumerStatefulWidget {
  const SettingsScreen({super.key});

  @override
  ConsumerState<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends ConsumerState<SettingsScreen> {
  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authProvider).user;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Settings'),
      ),
      body: ListView(
        children: [
          // Profile Section
          _buildSection(
            title: 'Profile',
            children: [
              _buildListTile(
                icon: Icons.person_outline,
                title: 'Name',
                subtitle: user?.name ?? 'Not set',
                onTap: () {
                  // TODO: Edit profile
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Edit profile coming soon')),
                  );
                },
              ),
              _buildListTile(
                icon: Icons.email_outlined,
                title: 'Email',
                subtitle: user?.email ?? 'Not set',
                onTap: null,
              ),
            ],
          ),

          const Divider(height: 1),

          // Pomodoro Settings
          _buildSection(
            title: 'Pomodoro Timer',
            children: [
              _buildListTile(
                icon: Icons.timer_outlined,
                title: 'Focus Duration',
                subtitle: '25 minutes',
                onTap: () {
                  // TODO: Edit focus duration
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Timer settings coming soon')),
                  );
                },
              ),
              _buildListTile(
                icon: Icons.coffee_outlined,
                title: 'Short Break',
                subtitle: '5 minutes',
                onTap: () {
                  // TODO: Edit short break
                },
              ),
              _buildListTile(
                icon: Icons.bed_outlined,
                title: 'Long Break',
                subtitle: '15 minutes',
                onTap: () {
                  // TODO: Edit long break
                },
              ),
            ],
          ),

          const Divider(height: 1),

          // Notifications
          _buildSection(
            title: 'Notifications',
            children: [
              _buildSwitchTile(
                icon: Icons.notifications_outlined,
                title: 'Push Notifications',
                subtitle: 'Get notified about task reminders',
                value: true,
                onChanged: (value) {
                  // TODO: Toggle notifications
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Notification settings coming soon')),
                  );
                },
              ),
              _buildSwitchTile(
                icon: Icons.email_outlined,
                title: 'Email Notifications',
                subtitle: 'Receive updates via email',
                value: true,
                onChanged: (value) {
                  // TODO: Toggle email notifications
                },
              ),
              _buildSwitchTile(
                icon: Icons.volume_up_outlined,
                title: 'Sound',
                subtitle: 'Play sound for timer and notifications',
                value: true,
                onChanged: (value) {
                  // TODO: Toggle sound
                },
              ),
            ],
          ),

          const Divider(height: 1),

          // Appearance
          _buildSection(
            title: 'Appearance',
            children: [
              _buildListTile(
                icon: Icons.palette_outlined,
                title: 'Theme',
                subtitle: 'System default',
                onTap: () {
                  // TODO: Theme picker
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Theme settings coming soon')),
                  );
                },
              ),
              _buildListTile(
                icon: Icons.language_outlined,
                title: 'Language',
                subtitle: 'English',
                onTap: () {
                  // TODO: Language picker
                },
              ),
            ],
          ),

          const Divider(height: 1),

          // About
          _buildSection(
            title: 'About',
            children: [
              _buildListTile(
                icon: Icons.info_outline,
                title: 'App Version',
                subtitle: '1.0.0',
                onTap: null,
              ),
              _buildListTile(
                icon: Icons.description_outlined,
                title: 'Terms & Privacy',
                onTap: () {
                  // TODO: Show terms
                },
              ),
            ],
          ),

          const Divider(height: 1),

          // Account Actions
          _buildSection(
            title: 'Account',
            children: [
              _buildListTile(
                icon: Icons.logout,
                title: 'Sign Out',
                titleColor: AppColors.destructive,
                onTap: () {
                  _showLogoutDialog();
                },
              ),
            ],
          ),

          const SizedBox(height: AppSpacing.xl2),
        ],
      ),
    );
  }

  Widget _buildSection({
    required String title,
    required List<Widget> children,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(
            AppSpacing.paddingLG,
            AppSpacing.paddingLG,
            AppSpacing.paddingLG,
            AppSpacing.paddingSM,
          ),
          child: Text(
            title,
            style: AppTextStyles.h4.copyWith(
              color: AppColors.mutedForeground,
              fontSize: 14,
            ),
          ),
        ),
        ...children,
      ],
    );
  }

  Widget _buildListTile({
    required IconData icon,
    required String title,
    String? subtitle,
    VoidCallback? onTap,
    Color? titleColor,
  }) {
    return ListTile(
      leading: Icon(icon, color: titleColor ?? AppColors.foreground),
      title: Text(
        title,
        style: AppTextStyles.bodyMedium.copyWith(
          color: titleColor,
        ),
      ),
      subtitle: subtitle != null
          ? Text(
              subtitle,
              style: AppTextStyles.bodySmall.copyWith(
                color: AppColors.mutedForeground,
              ),
            )
          : null,
      trailing: onTap != null ? const Icon(Icons.chevron_right) : null,
      onTap: onTap,
    );
  }

  Widget _buildSwitchTile({
    required IconData icon,
    required String title,
    String? subtitle,
    required bool value,
    required ValueChanged<bool> onChanged,
  }) {
    return SwitchListTile(
      secondary: Icon(icon, color: AppColors.foreground),
      title: Text(
        title,
        style: AppTextStyles.bodyMedium,
      ),
      subtitle: subtitle != null
          ? Text(
              subtitle,
              style: AppTextStyles.bodySmall.copyWith(
                color: AppColors.mutedForeground,
              ),
            )
          : null,
      value: value,
      onChanged: onChanged,
    );
  }

  void _showLogoutDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Sign Out'),
        content: const Text('Are you sure you want to sign out?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              Navigator.of(context).pop();
              ref.read(authProvider.notifier).logout();
            },
            child: Text(
              'Sign Out',
              style: TextStyle(color: AppColors.destructive),
            ),
          ),
        ],
      ),
    );
  }
}
