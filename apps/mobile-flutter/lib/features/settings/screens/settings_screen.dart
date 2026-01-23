import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../theme/app_colors.dart';
import '../../../theme/app_spacing.dart';
import '../../../theme/app_text_styles.dart';
import '../../../features/auth/providers/auth_provider.dart';
import '../../../core/providers/notification_provider.dart';
import '../../../core/api/api_service.dart';
import '../../../core/api/dio_client.dart';

class SettingsScreen extends ConsumerStatefulWidget {
  const SettingsScreen({super.key});

  @override
  ConsumerState<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends ConsumerState<SettingsScreen> {
  bool _notificationsEnabled = true;
  bool _emailNotificationsEnabled = true;
  bool _soundEnabled = true;
  String _secretaryAggressiveness = 'moderate';
  String _locationTrackingLevel = 'minimal';

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authProvider).user;
    final notificationState = ref.watch(notificationProvider);

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
                subtitle: notificationState.tokenRegistered
                    ? 'Get notified about task reminders'
                    : 'Tap to enable notifications',
                value: _notificationsEnabled && notificationState.permissionsGranted,
                onChanged: (value) async {
                  setState(() => _notificationsEnabled = value);

                  if (value && !notificationState.permissionsGranted) {
                    // Request permissions
                    final granted = await ref
                        .read(notificationProvider.notifier)
                        .requestPermissions();

                    if (!granted) {
                      setState(() => _notificationsEnabled = false);
                      if (mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('Notification permission denied. Please enable in settings.'),
                          ),
                        );
                      }
                      return;
                    }
                  }

                  // Update backend settings
                  try {
                    await ref
                        .read(notificationProvider.notifier)
                        .updateNotificationSettings(value);

                    if (mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text(
                            value
                                ? 'Notifications enabled'
                                : 'Notifications disabled',
                          ),
                        ),
                      );
                    }
                  } catch (e) {
                    if (mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text('Failed to update: $e')),
                      );
                    }
                  }
                },
              ),
              _buildSwitchTile(
                icon: Icons.email_outlined,
                title: 'Email Notifications',
                subtitle: 'Receive updates via email',
                value: _emailNotificationsEnabled,
                onChanged: (value) {
                  setState(() => _emailNotificationsEnabled = value);
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Email notification settings coming soon')),
                  );
                },
              ),
              _buildSwitchTile(
                icon: Icons.volume_up_outlined,
                title: 'Sound',
                subtitle: 'Play sound for timer and notifications',
                value: _soundEnabled,
                onChanged: (value) {
                  setState(() => _soundEnabled = value);
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Sound settings coming soon')),
                  );
                },
              ),
            ],
          ),

          const Divider(height: 1),

          // AI Secretary Settings
          _buildSection(
            title: 'AI Secretary',
            children: [
              _buildListTile(
                icon: Icons.psychology_outlined,
                title: 'Secretary Aggressiveness',
                subtitle: _getSecretaryAggressivenessLabel(_secretaryAggressiveness),
                onTap: () {
                  _showSecretaryAggressivenessDialog();
                },
              ),
              _buildListTile(
                icon: Icons.location_on_outlined,
                title: 'Location Tracking',
                subtitle: _getLocationTrackingLabel(_locationTrackingLevel),
                onTap: () {
                  _showLocationTrackingDialog();
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

  String _getSecretaryAggressivenessLabel(String value) {
    switch (value) {
      case 'conservative':
        return 'Conservative - Only urgent items';
      case 'moderate':
        return 'Moderate - Daily briefings (default)';
      case 'proactive':
        return 'Proactive - Frequent check-ins';
      default:
        return 'Moderate';
    }
  }

  String _getLocationTrackingLabel(String value) {
    switch (value) {
      case 'off':
        return 'Off - No location tracking';
      case 'minimal':
        return 'Minimal - Saved locations only (default)';
      case 'moderate':
        return 'Moderate - Significant location changes';
      case 'full':
        return 'Full - Continuous tracking';
      default:
        return 'Minimal';
    }
  }

  void _showSecretaryAggressivenessDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Secretary Aggressiveness'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Choose how proactive your AI secretary should be:',
              style: TextStyle(fontSize: 14),
            ),
            const SizedBox(height: AppSpacing.paddingMD),
            RadioListTile<String>(
              title: const Text('Conservative'),
              subtitle: const Text('Only urgent items + explicit triggers'),
              value: 'conservative',
              groupValue: _secretaryAggressiveness,
              onChanged: (value) {
                setState(() => _secretaryAggressiveness = value!);
                Navigator.of(context).pop();
                _updateSecretarySettings();
              },
            ),
            RadioListTile<String>(
              title: const Text('Moderate'),
              subtitle: const Text('Daily briefing + opportunistic moments'),
              value: 'moderate',
              groupValue: _secretaryAggressiveness,
              onChanged: (value) {
                setState(() => _secretaryAggressiveness = value!);
                Navigator.of(context).pop();
                _updateSecretarySettings();
              },
            ),
            RadioListTile<String>(
              title: const Text('Proactive'),
              subtitle: const Text('Frequent check-ins throughout day'),
              value: 'proactive',
              groupValue: _secretaryAggressiveness,
              onChanged: (value) {
                setState(() => _secretaryAggressiveness = value!);
                Navigator.of(context).pop();
                _updateSecretarySettings();
              },
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Cancel'),
          ),
        ],
      ),
    );
  }

  void _showLocationTrackingDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Location Tracking'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Choose your location tracking privacy level:',
              style: TextStyle(fontSize: 14),
            ),
            const SizedBox(height: AppSpacing.paddingMD),
            RadioListTile<String>(
              title: const Text('Off'),
              subtitle: const Text('No location tracking'),
              value: 'off',
              groupValue: _locationTrackingLevel,
              onChanged: (value) {
                setState(() => _locationTrackingLevel = value!);
                Navigator.of(context).pop();
                _updateSecretarySettings();
              },
            ),
            RadioListTile<String>(
              title: const Text('Minimal'),
              subtitle: const Text('Only saved locations, check every 15 min'),
              value: 'minimal',
              groupValue: _locationTrackingLevel,
              onChanged: (value) {
                setState(() => _locationTrackingLevel = value!);
                Navigator.of(context).pop();
                _updateSecretarySettings();
              },
            ),
            RadioListTile<String>(
              title: const Text('Moderate'),
              subtitle: const Text('Significant location changes, background updates'),
              value: 'moderate',
              groupValue: _locationTrackingLevel,
              onChanged: (value) {
                setState(() => _locationTrackingLevel = value!);
                Navigator.of(context).pop();
                _updateSecretarySettings();
              },
            ),
            RadioListTile<String>(
              title: const Text('Full'),
              subtitle: const Text('Continuous tracking with detailed history'),
              value: 'full',
              groupValue: _locationTrackingLevel,
              onChanged: (value) {
                setState(() => _locationTrackingLevel = value!);
                Navigator.of(context).pop();
                _updateSecretarySettings();
              },
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Cancel'),
          ),
        ],
      ),
    );
  }

  Future<void> _updateSecretarySettings() async {
    try {
      final apiService = ApiService(DioClient());
      await apiService.updateSettings({
        'secretaryAggressiveness': _secretaryAggressiveness,
        'locationTrackingLevel': _locationTrackingLevel,
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Secretary settings updated'),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to update settings: $e'),
            backgroundColor: AppColors.destructive,
          ),
        );
      }
    }
  }
}
