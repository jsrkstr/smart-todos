import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../config/api_config.dart';
import '../../../theme/app_colors.dart';
import '../../../theme/app_spacing.dart';
import '../../../theme/app_text_styles.dart';
import '../providers/calendar_provider.dart';
import '../../../core/models/calendar_connection.dart';
import 'package:timeago/timeago.dart' as timeago;

class CalendarConnectionsScreen extends ConsumerWidget {
  const CalendarConnectionsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final connectionsState = ref.watch(calendarConnectionsProvider);
    final syncStatusState = ref.watch(syncStatusProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Calendar Connections'),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.textPrimary,
        elevation: 0,
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          await ref.read(calendarConnectionsProvider.notifier).refresh();
          await ref.read(syncStatusProvider.notifier).refresh();
        },
        child: _buildBody(context, ref, connectionsState, syncStatusState),
      ),
    );
  }

  Widget _buildBody(
    BuildContext context,
    WidgetRef ref,
    CalendarConnectionsState connectionsState,
    SyncStatusState syncStatusState,
  ) {
    if (connectionsState.isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (connectionsState.error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, size: 48, color: AppColors.error),
            SizedBox(height: AppSpacing.md),
            Text(
              'Error loading connections',
              style: AppTextStyles.bodyLarge,
            ),
            SizedBox(height: AppSpacing.xs),
            Text(
              connectionsState.error!,
              style: AppTextStyles.bodyMedium.copyWith(
                color: AppColors.textSecondary,
              ),
              textAlign: TextAlign.center,
            ),
            SizedBox(height: AppSpacing.lg),
            ElevatedButton(
              onPressed: () {
                ref.read(calendarConnectionsProvider.notifier).refresh();
              },
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    if (connectionsState.connections.isEmpty) {
      return _buildEmptyState(context);
    }

    return ListView(
      padding: EdgeInsets.all(AppSpacing.md),
      children: [
        ...connectionsState.connections.map((connection) {
          final status = syncStatusState.statuses
              .where((s) => s.id == connection.id)
              .firstOrNull;
          return _buildConnectionCard(context, ref, connection, status, syncStatusState.isSyncing);
        }),
        SizedBox(height: AppSpacing.md),
        _buildAddConnectionButton(context),
        SizedBox(height: AppSpacing.md),
        _buildSyncAllButton(ref, syncStatusState.isSyncing),
      ],
    );
  }

  Widget _buildEmptyState(BuildContext context) {
    return Center(
      child: Padding(
        padding: EdgeInsets.all(AppSpacing.xl),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.calendar_today,
              size: 64,
              color: AppColors.textSecondary,
            ),
            SizedBox(height: AppSpacing.lg),
            Text(
              'No calendar connections',
              style: AppTextStyles.heading3,
            ),
            SizedBox(height: AppSpacing.sm),
            Text(
              'Connect your Google Calendar to sync events and enhance AI scheduling',
              style: AppTextStyles.bodyMedium.copyWith(
                color: AppColors.textSecondary,
              ),
              textAlign: TextAlign.center,
            ),
            SizedBox(height: AppSpacing.xl),
            ElevatedButton.icon(
              onPressed: () => _connectGoogleCalendar(context),
              icon: const Icon(Icons.add),
              label: const Text('Connect Google Calendar'),
              style: ElevatedButton.styleFrom(
                padding: EdgeInsets.symmetric(
                  horizontal: AppSpacing.lg,
                  vertical: AppSpacing.md,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildConnectionCard(
    BuildContext context,
    WidgetRef ref,
    CalendarConnection connection,
    SyncStatus? status,
    bool isSyncing,
  ) {
    return Card(
      margin: EdgeInsets.only(bottom: AppSpacing.md),
      child: Padding(
        padding: EdgeInsets.all(AppSpacing.md),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Text(
                            connection.name ?? connection.provider,
                            style: AppTextStyles.heading4,
                          ),
                          SizedBox(width: AppSpacing.sm),
                          Container(
                            padding: EdgeInsets.symmetric(
                              horizontal: AppSpacing.sm,
                              vertical: AppSpacing.xs,
                            ),
                            decoration: BoxDecoration(
                              color: connection.isActive
                                  ? AppColors.success.withOpacity(0.1)
                                  : AppColors.textSecondary.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(
                              connection.isActive ? 'Active' : 'Inactive',
                              style: AppTextStyles.bodySmall.copyWith(
                                color: connection.isActive
                                    ? AppColors.success
                                    : AppColors.textSecondary,
                              ),
                            ),
                          ),
                        ],
                      ),
                      SizedBox(height: AppSpacing.xs),
                      if (connection.lastSynced != null)
                        Text(
                          'Last synced: ${timeago.format(connection.lastSynced!)}',
                          style: AppTextStyles.bodySmall.copyWith(
                            color: AppColors.textSecondary,
                          ),
                        )
                      else
                        Text(
                          'Never synced',
                          style: AppTextStyles.bodySmall.copyWith(
                            color: AppColors.textSecondary,
                          ),
                        ),
                      if (status != null) ...[
                        SizedBox(height: AppSpacing.xs),
                        Text(
                          'Events: ${status.eventCount}',
                          style: AppTextStyles.bodySmall.copyWith(
                            color: AppColors.textSecondary,
                          ),
                        ),
                      ],
                      SizedBox(height: AppSpacing.xs),
                      Text(
                        'Sync frequency: ${connection.syncFrequency}',
                        style: AppTextStyles.bodySmall.copyWith(
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
                Switch(
                  value: connection.isActive,
                  onChanged: (value) {
                    ref.read(calendarConnectionsProvider.notifier).updateConnection(
                          connection.id,
                          isActive: value,
                        );
                  },
                ),
              ],
            ),
            SizedBox(height: AppSpacing.md),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: isSyncing
                        ? null
                        : () {
                            ref.read(syncStatusProvider.notifier).triggerSync(
                                  connectionId: connection.id,
                                );
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('Syncing calendar...'),
                                duration: Duration(seconds: 2),
                              ),
                            );
                          },
                    icon: Icon(
                      isSyncing ? Icons.sync : Icons.sync,
                      size: 16,
                    ),
                    label: Text(isSyncing ? 'Syncing...' : 'Sync Now'),
                  ),
                ),
                SizedBox(width: AppSpacing.sm),
                OutlinedButton(
                  onPressed: () {
                    _confirmDelete(context, ref, connection);
                  },
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.error,
                  ),
                  child: const Icon(Icons.delete, size: 16),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAddConnectionButton(BuildContext context) {
    return OutlinedButton.icon(
      onPressed: () => _connectGoogleCalendar(context),
      icon: const Icon(Icons.add),
      label: const Text('Add Another Calendar'),
      style: OutlinedButton.styleFrom(
        padding: EdgeInsets.all(AppSpacing.md),
      ),
    );
  }

  Widget _buildSyncAllButton(WidgetRef ref, bool isSyncing) {
    return ElevatedButton.icon(
      onPressed: isSyncing
          ? null
          : () async {
              await ref.read(syncStatusProvider.notifier).triggerSync();
            },
      icon: Icon(isSyncing ? Icons.sync : Icons.sync),
      label: Text(isSyncing ? 'Syncing all calendars...' : 'Sync All Calendars'),
      style: ElevatedButton.styleFrom(
        padding: EdgeInsets.all(AppSpacing.md),
      ),
    );
  }

  void _connectGoogleCalendar(BuildContext context) async {
    final url = Uri.parse('${ApiConfig.baseUrl}/api/calendar/connect');
    if (await canLaunchUrl(url)) {
      await launchUrl(url, mode: LaunchMode.externalApplication);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not open calendar connection')),
      );
    }
  }

  void _confirmDelete(
    BuildContext context,
    WidgetRef ref,
    CalendarConnection connection,
  ) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Disconnect Calendar'),
        content: Text(
          'Are you sure you want to disconnect ${connection.name ?? connection.provider}? All synced events will be removed.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              ref
                  .read(calendarConnectionsProvider.notifier)
                  .deleteConnection(connection.id);
            },
            style: TextButton.styleFrom(foregroundColor: AppColors.error),
            child: const Text('Disconnect'),
          ),
        ],
      ),
    );
  }
}
