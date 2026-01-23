import { PrismaClient } from '@prisma/client';
import { HistoricalContext } from '../types';

/**
 * Historical Context Service
 *
 * Loads historical activity data to give agents context about:
 * - What notifications were sent previously
 * - User's recent activity patterns
 * - Task completion history
 * - Pomodoro sessions
 * - Mood and energy levels
 * - Communication patterns
 */
export class HistoricalContextService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Load complete historical context for a user
   */
  async loadHistoricalContext(userId: string): Promise<HistoricalContext> {
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);

    // Parallel queries for better performance
    const [
      appActivity,
      notifications,
      taskStats,
      pomodoroStats,
      moodStats,
      streakStats,
      chatStats,
    ] = await Promise.all([
      this.getAppActivity(userId, startOfToday, startOfWeek),
      this.getNotificationHistory(userId, startOfToday, startOfWeek),
      this.getTaskCompletionStats(userId, startOfToday, startOfWeek),
      this.getPomodoroStats(userId, startOfToday),
      this.getMoodStats(userId, startOfWeek),
      this.getStreakStats(userId),
      this.getChatStats(userId, startOfToday),
    ]);

    return {
      // App activity
      lastAppOpen: appActivity.lastAppOpen,
      appOpenedToday: appActivity.appOpenedToday,
      sessionCountThisWeek: appActivity.sessionCountThisWeek,

      // Notifications
      notificationsSentToday: notifications.sentToday,
      lastNotificationSent: notifications.lastSent,
      notificationsThisWeekByType: notifications.byType,

      // Task patterns
      tasksCompletedToday: taskStats.completedToday,
      tasksCompletedThisWeek: taskStats.completedThisWeek,
      averageCompletionTimeByPriority: taskStats.avgTimeByPriority,
      overdueTaskCount: taskStats.overdueCount,

      // Pomodoro
      pomodorosCompletedToday: pomodoroStats.completedToday,
      totalFocusMinutesToday: pomodoroStats.totalMinutesToday,
      lastPomodoroCompletedAt: pomodoroStats.lastCompleted,

      // Mood
      recentMoods: moodStats.recentMoods,
      averageMoodThisWeek: moodStats.weeklyAverage,

      // Streaks
      currentDailyStreak: streakStats.currentStreak,
      longestStreak: streakStats.longestStreak,

      // Communication
      lastUserMessageAt: chatStats.lastUserMessage,
      messagesExchangedToday: chatStats.messagesExchangedToday,
      preferredResponseLength: chatStats.preferredLength,
    };
  }

  /**
   * Get app activity logs
   */
  private async getAppActivity(
    userId: string,
    startOfToday: Date,
    startOfWeek: Date
  ) {
    // Get logs for app_opened events
    const logs = await this.prisma.log.findMany({
      where: {
        userId,
        type: 'app_opened',
        createdAt: { gte: startOfWeek },
      },
      orderBy: { createdAt: 'desc' },
    });

    const todayLogs = logs.filter((log) => log.createdAt >= startOfToday);

    return {
      lastAppOpen: logs[0]?.createdAt || null,
      appOpenedToday: todayLogs.length > 0,
      sessionCountThisWeek: logs.length,
    };
  }

  /**
   * Get notification history
   */
  private async getNotificationHistory(
    userId: string,
    startOfToday: Date,
    startOfWeek: Date
  ) {
    // Get assistant chat messages (interventions sent by scheduler/agents)
    const assistantMessages = await this.prisma.chatMessage.findMany({
      where: {
        userId,
        role: 'assistant',
        createdAt: { gte: startOfWeek },
      },
      orderBy: { createdAt: 'desc' },
    });

    const todayMessages = assistantMessages.filter(
      (msg) => msg.createdAt >= startOfToday
    );

    // Count by intervention type
    const byType: Record<string, number> = {};
    assistantMessages.forEach((msg) => {
      if (msg.metadata && typeof msg.metadata === 'object') {
        const metadata = msg.metadata as any;
        const type = metadata.interventionType || 'general';
        byType[type] = (byType[type] || 0) + 1;
      }
    });

    return {
      sentToday: todayMessages.length,
      lastSent: assistantMessages[0]?.createdAt || null,
      byType,
    };
  }

  /**
   * Get task completion statistics
   */
  private async getTaskCompletionStats(
    userId: string,
    startOfToday: Date,
    startOfWeek: Date
  ) {
    // Tasks completed today
    const completedToday = await this.prisma.task.count({
      where: {
        userId,
        completed: true,
        updatedAt: { gte: startOfToday },
      },
    });

    // Tasks completed this week
    const completedThisWeek = await this.prisma.task.count({
      where: {
        userId,
        completed: true,
        updatedAt: { gte: startOfWeek },
      },
    });

    // Overdue tasks
    const overdueCount = await this.prisma.task.count({
      where: {
        userId,
        completed: false,
        deadline: { lt: new Date() },
      },
    });

    // Average completion time by priority
    // (simplified - would need task creation tracking for accurate timing)
    const avgTimeByPriority: Record<string, number> = {
      high: 0,
      medium: 0,
      low: 0,
    };

    return {
      completedToday,
      completedThisWeek,
      avgTimeByPriority,
      overdueCount,
    };
  }

  /**
   * Get pomodoro session statistics
   */
  private async getPomodoroStats(userId: string, startOfToday: Date) {
    const pomodoros = await this.prisma.pomodoro.findMany({
      where: {
        userId,
        createdAt: { gte: startOfToday },
        status: 'finished', // Changed from 'completed' to 'finished'
        type: 'focus',
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalMinutes = pomodoros.reduce(
      (sum, p) => sum + (p.duration || 25),
      0
    );

    return {
      completedToday: pomodoros.length,
      totalMinutesToday: totalMinutes,
      lastCompleted: pomodoros[0]?.createdAt || null,
    };
  }

  /**
   * Get mood statistics
   */
  private async getMoodStats(userId: string, startOfWeek: Date) {
    // Mood is tied to tasks, so we need to get moods for user's tasks
    const userTasks = await this.prisma.task.findMany({
      where: { userId },
      select: { id: true },
    });

    const taskIds = userTasks.map((t) => t.id);

    const moods = await this.prisma.mood.findMany({
      where: {
        taskId: { in: taskIds },
        createdAt: { gte: startOfWeek },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const recentMoods = moods.map((m) => ({
      mood: m.value,
      taskId: m.taskId,
      timestamp: m.createdAt,
    }));

    const weeklyAverage =
      moods.length > 0
        ? moods.reduce((sum, m) => sum + m.value, 0) / moods.length
        : null;

    return {
      recentMoods,
      weeklyAverage,
    };
  }

  /**
   * Get streak statistics
   */
  private async getStreakStats(userId: string) {
    // Get daily streak (assuming type 'daily' exists)
    const dailyStreak = await this.prisma.streak.findFirst({
      where: {
        userId,
        type: 'daily',
      },
      orderBy: {
        count: 'desc',
      },
    });

    // For now, use count as current streak
    // In a real implementation, you'd check if lastDate is today
    return {
      currentStreak: dailyStreak?.count || 0,
      longestStreak: dailyStreak?.count || 0, // This should be tracked separately in the future
    };
  }

  /**
   * Get chat communication statistics
   */
  private async getChatStats(userId: string, startOfToday: Date) {
    // Get user messages today
    const userMessages = await this.prisma.chatMessage.findMany({
      where: {
        userId,
        role: 'user',
        createdAt: { gte: startOfToday },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get last user message ever
    const lastUserMessage = await this.prisma.chatMessage.findFirst({
      where: {
        userId,
        role: 'user',
      },
      orderBy: { createdAt: 'desc' },
    });

    // Analyze preferred response length from recent assistant messages
    const recentAssistantMessages = await this.prisma.chatMessage.findMany({
      where: {
        userId,
        role: 'assistant',
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const avgLength =
      recentAssistantMessages.length > 0
        ? recentAssistantMessages.reduce(
            (sum, msg) => sum + msg.content.length,
            0
          ) / recentAssistantMessages.length
        : 200;

    const preferredLength =
      avgLength < 150 ? 'short' : avgLength < 400 ? 'medium' : 'detailed';

    return {
      lastUserMessage: lastUserMessage?.createdAt || null,
      messagesExchangedToday: userMessages.length,
      preferredLength: preferredLength as 'short' | 'medium' | 'detailed',
    };
  }
}

/**
 * Create and export singleton instance
 */
export function createHistoricalContextService(
  prisma: PrismaClient
): HistoricalContextService {
  return new HistoricalContextService(prisma);
}
