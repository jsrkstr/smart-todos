import { Task } from '@prisma/client';
import { notificationService } from './notificationService';
import { logService } from './logService';

export type TaskChangeType = 'created' | 'updated' | 'deleted' | 'completed';

export interface TaskChangeEvent {
  type: TaskChangeType;
  taskId: string;
  userId: string;
  changes?: Partial<Task>; // What changed
  timestamp: Date;
}

/**
 * Service for handling task change events and notifying mobile clients
 * via push notifications for near-instant updates
 */
class TaskChangeEventService {
  private pendingNotifications = new Map<string, TaskChangeEvent>();
  private timeouts = new Map<string, NodeJS.Timeout>();
  private debounceTimeout = 2000; // 2 seconds

  /**
   * Send a silent push notification with task update metadata
   * This triggers the mobile app to sync changes immediately
   */
  async notifyTaskChange(event: TaskChangeEvent): Promise<void> {
    try {
      logService.info('Sending task change notification', {
        taskId: event.taskId,
        userId: event.userId,
        type: event.type,
      });

      // Send silent/data notification to trigger sync
      await notificationService.sendPushNotification({
        userId: event.userId,
        title: '', // Silent notification - no banner
        body: '', // Silent notification - no text
        data: {
          type: 'TASK_UPDATE',
          changeType: event.type,
          taskId: event.taskId,
          timestamp: event.timestamp.toISOString(),
          silent: true, // Flag for mobile app to handle silently
        },
      });

      logService.info('Task change notification sent successfully', {
        taskId: event.taskId,
        type: event.type,
      });
    } catch (error) {
      logService.error('Failed to send task change notification', {
        error,
        taskId: event.taskId,
        userId: event.userId,
      });
      // Don't throw - we don't want to break task operations if push fails
    }
  }

  /**
   * Debounced version of notifyTaskChange
   * Prevents notification spam for rapid successive updates
   * Batches multiple changes to the same task within 2 seconds
   */
  async notifyTaskChangeDebounced(event: TaskChangeEvent): Promise<void> {
    const key = `${event.userId}:${event.taskId}`;

    // Update pending notification (merges changes)
    const existing = this.pendingNotifications.get(key);
    if (existing) {
      // Merge changes
      this.pendingNotifications.set(key, {
        ...event,
        changes: {
          ...existing.changes,
          ...event.changes,
        },
      });
    } else {
      this.pendingNotifications.set(key, event);
    }

    // Clear existing timeout
    const existingTimeout = this.timeouts.get(key);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Set new timeout
    const timeout = setTimeout(() => {
      const pending = this.pendingNotifications.get(key);
      if (pending) {
        this.notifyTaskChange(pending);
        this.pendingNotifications.delete(key);
        this.timeouts.delete(key);
      }
    }, this.debounceTimeout);

    this.timeouts.set(key, timeout);
  }

  /**
   * Cancel any pending notifications for a specific task
   * Useful when a task is deleted before debounced notification fires
   */
  cancelPendingNotification(userId: string, taskId: string): void {
    const key = `${userId}:${taskId}`;
    const timeout = this.timeouts.get(key);
    if (timeout) {
      clearTimeout(timeout);
      this.timeouts.delete(key);
      this.pendingNotifications.delete(key);
    }
  }

  /**
   * Flush all pending notifications immediately
   * Useful for graceful shutdown
   */
  async flushPendingNotifications(): Promise<void> {
    const notifications = Array.from(this.pendingNotifications.values());

    // Clear all timeouts
    for (const timeout of this.timeouts.values()) {
      clearTimeout(timeout);
    }
    this.timeouts.clear();
    this.pendingNotifications.clear();

    // Send all pending notifications
    await Promise.allSettled(
      notifications.map((event) => this.notifyTaskChange(event))
    );
  }
}

export const taskChangeEventService = new TaskChangeEventService();
