import { PrismaClient, User, Task } from '@prisma/client';
import { processRequest } from '@smart-todos/agent';

/**
 * Morning Briefing Service
 *
 * Generates comprehensive morning briefings for users
 */

export interface BriefingData {
  user: User;
  tasksToday: Task[];
  overdueTask: Task[];
  upcomingDeadlines: Task[];
  calendarEvents: any[];
  streak: number;
  tasksCompletedYesterday: number;
  freeTimeBlocks: any[];
  behavioralInsights: string[];
}

export class MorningBriefingService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Generate morning briefing for a user
   */
  async generateBriefing(userId: string): Promise<string> {
    // Gather all data for briefing
    const data = await this.gatherBriefingData(userId);

    // Generate briefing using agent
    const briefingPrompt = this.createBriefingPrompt(data);

    const result = await processRequest(userId, briefingPrompt, {
      databaseUrl: process.env.DATABASE_URL,
    });

    return result.agentResponse || this.generateFallbackBriefing(data);
  }

  /**
   * Gather all data needed for briefing
   */
  private async gatherBriefingData(userId: string): Promise<BriefingData> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        psychProfile: { include: { coach: true } },
        settings: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);

    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);

    // Get tasks for today (high priority or with deadlines today)
    const tasksToday = await this.prisma.task.findMany({
      where: {
        userId,
        completed: false,
        OR: [
          { priority: 'high' },
          {
            deadline: {
              gte: startOfToday,
              lte: endOfToday,
            },
          },
        ],
      },
      orderBy: [{ priority: 'desc' }, { deadline: 'asc' }],
      take: 5,
    });

    // Get overdue tasks
    const overdueTask = await this.prisma.task.findMany({
      where: {
        userId,
        completed: false,
        deadline: { lt: startOfToday },
      },
      orderBy: { deadline: 'asc' },
      take: 5,
    });

    // Get upcoming deadlines (next 3 days)
    const threeDaysFromNow = new Date(now);
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    const upcomingDeadlines = await this.prisma.task.findMany({
      where: {
        userId,
        completed: false,
        deadline: {
          gt: endOfToday,
          lte: threeDaysFromNow,
        },
      },
      orderBy: { deadline: 'asc' },
      take: 5,
    });

    // Get calendar events for today
    const calendarEvents = await this.prisma.calendarEvent.findMany({
      where: {
        calendarConnection: {
          userId,
          isActive: true,
        },
        startTime: {
          gte: startOfToday,
          lte: endOfToday,
        },
        status: { not: 'cancelled' },
      },
      orderBy: { startTime: 'asc' },
    });

    // Get streak
    const streak = await this.prisma.streak.findFirst({
      where: {
        userId,
        type: 'daily',
      },
      orderBy: { count: 'desc' },
    });

    // Get tasks completed yesterday
    const tasksCompletedYesterday = await this.prisma.task.count({
      where: {
        userId,
        completed: true,
        completedAt: {
          gte: startOfYesterday,
          lt: startOfToday,
        },
      },
    });

    // Calculate free time blocks
    const freeTimeBlocks = this.calculateFreeTimeBlocks(calendarEvents, now, endOfToday);

    // Get behavioral insights
    const behavioralInsights = await this.getBehavioralInsights(userId);

    return {
      user,
      tasksToday,
      overdueTask,
      upcomingDeadlines,
      calendarEvents,
      streak: streak?.count || 0,
      tasksCompletedYesterday,
      freeTimeBlocks,
      behavioralInsights,
    };
  }

  /**
   * Create briefing prompt for agent
   */
  private createBriefingPrompt(data: BriefingData): string {
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

    let prompt = `${greeting}! I'd like my daily briefing. Give me an overview of my day ahead.\n\n`;

    // Yesterday's summary
    if (data.tasksCompletedYesterday > 0) {
      prompt += `Yesterday I completed ${data.tasksCompletedYesterday} task${data.tasksCompletedYesterday > 1 ? 's' : ''}. `;
    }

    if (data.streak > 0) {
      prompt += `I'm on a ${data.streak}-day streak! `;
    }

    prompt += '\n\n';

    // Today's tasks
    if (data.tasksToday.length > 0) {
      prompt += `Today's priorities:\n`;
      data.tasksToday.forEach((task, i) => {
        prompt += `${i + 1}. ${task.title}${task.deadline ? ` (due ${new Date(task.deadline).toLocaleTimeString()})` : ''}\n`;
      });
      prompt += '\n';
    }

    // Overdue tasks
    if (data.overdueTask.length > 0) {
      prompt += `Overdue tasks (${data.overdueTask.length}):\n`;
      data.overdueTask.slice(0, 3).forEach((task, i) => {
        const daysOverdue = Math.floor(
          (Date.now() - new Date(task.deadline!).getTime()) / (1000 * 60 * 60 * 24)
        );
        prompt += `${i + 1}. ${task.title} (${daysOverdue} day${daysOverdue > 1 ? 's' : ''} overdue)\n`;
      });
      prompt += '\n';
    }

    // Calendar
    if (data.calendarEvents.length > 0) {
      prompt += `Calendar (${data.calendarEvents.length} event${data.calendarEvents.length > 1 ? 's' : ''}):\n`;
      data.calendarEvents.forEach((event, i) => {
        prompt += `${i + 1}. ${event.title} at ${new Date(event.startTime).toLocaleTimeString()}\n`;
      });
      prompt += '\n';
    }

    // Free time
    if (data.freeTimeBlocks.length > 0) {
      const totalFreeMinutes = data.freeTimeBlocks.reduce((sum, block) => sum + block.durationMinutes, 0);
      prompt += `Free time available: ${totalFreeMinutes} minutes across ${data.freeTimeBlocks.length} block${data.freeTimeBlocks.length > 1 ? 's' : ''}\n\n`;
    }

    // Behavioral insights
    if (data.behavioralInsights.length > 0) {
      prompt += `Insights about my work style:\n${data.behavioralInsights.join('\n')}\n\n`;
    }

    prompt += `Please give me a motivating briefing that helps me prioritize my day. Include specific recommendations for what to tackle when, based on my calendar and work patterns.`;

    return prompt;
  }

  /**
   * Generate fallback briefing if agent fails
   */
  private generateFallbackBriefing(data: BriefingData): string {
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

    let briefing = `${greeting}! Here's your daily briefing:\n\n`;

    if (data.tasksCompletedYesterday > 0 || data.streak > 0) {
      briefing += `📊 Yesterday: `;
      if (data.tasksCompletedYesterday > 0) {
        briefing += `${data.tasksCompletedYesterday} task${data.tasksCompletedYesterday > 1 ? 's' : ''} completed. `;
      }
      if (data.streak > 0) {
        briefing += `${data.streak}-day streak! `;
      }
      briefing += '\n\n';
    }

    if (data.overdueTask.length > 0) {
      briefing += `⚠️ ${data.overdueTask.length} overdue task${data.overdueTask.length > 1 ? 's' : ''} need attention.\n\n`;
    }

    if (data.tasksToday.length > 0) {
      briefing += `✅ Today's Priorities:\n`;
      data.tasksToday.forEach((task, i) => {
        briefing += `${i + 1}. ${task.title}\n`;
      });
      briefing += '\n';
    }

    if (data.calendarEvents.length > 0) {
      briefing += `📅 Calendar (${data.calendarEvents.length} event${data.calendarEvents.length > 1 ? 's' : ''}):\n`;
      data.calendarEvents.forEach((event) => {
        briefing += `• ${event.title} at ${new Date(event.startTime).toLocaleTimeString()}\n`;
      });
      briefing += '\n';
    }

    if (data.freeTimeBlocks.length > 0) {
      const totalFreeMinutes = data.freeTimeBlocks.reduce((sum, block) => sum + block.durationMinutes, 0);
      briefing += `⏰ Free time: ${totalFreeMinutes} minutes available\n\n`;
    }

    briefing += `💪 Let's make today productive!`;

    return briefing;
  }

  /**
   * Calculate free time blocks
   */
  private calculateFreeTimeBlocks(
    events: any[],
    startTime: Date,
    endTime: Date
  ): Array<{ start: Date; end: Date; durationMinutes: number }> {
    const blocks: Array<{ start: Date; end: Date; durationMinutes: number }> = [];

    if (events.length === 0) {
      const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
      if (duration > 30) {
        blocks.push({
          start: startTime,
          end: endTime,
          durationMinutes: duration,
        });
      }
      return blocks;
    }

    const sortedEvents = [...events].sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );

    // Check for free block before first event
    const firstEvent = sortedEvents[0];
    if (new Date(firstEvent.startTime) > startTime) {
      const duration = (new Date(firstEvent.startTime).getTime() - startTime.getTime()) / (1000 * 60);
      if (duration > 30) {
        blocks.push({
          start: startTime,
          end: new Date(firstEvent.startTime),
          durationMinutes: duration,
        });
      }
    }

    // Check for free blocks between events
    for (let i = 0; i < sortedEvents.length - 1; i++) {
      const currentEvent = sortedEvents[i];
      const nextEvent = sortedEvents[i + 1];

      if (new Date(nextEvent.startTime) > new Date(currentEvent.endTime)) {
        const duration =
          (new Date(nextEvent.startTime).getTime() - new Date(currentEvent.endTime).getTime()) / (1000 * 60);
        if (duration > 30) {
          blocks.push({
            start: new Date(currentEvent.endTime),
            end: new Date(nextEvent.startTime),
            durationMinutes: duration,
          });
        }
      }
    }

    // Check for free block after last event
    const lastEvent = sortedEvents[sortedEvents.length - 1];
    if (new Date(lastEvent.endTime) < endTime) {
      const duration = (endTime.getTime() - new Date(lastEvent.endTime).getTime()) / (1000 * 60);
      if (duration > 30) {
        blocks.push({
          start: new Date(lastEvent.endTime),
          end: endTime,
          durationMinutes: duration,
        });
      }
    }

    return blocks;
  }

  /**
   * Get behavioral insights from patterns
   */
  private async getBehavioralInsights(userId: string): Promise<string[]> {
    const patterns = await this.prisma.userPatterns.findUnique({
      where: { userId },
    });

    if (!patterns) {
      return [];
    }

    const data = patterns.patterns as any;
    const insights: string[] = [];
    const currentHour = new Date().getHours();

    // Productivity insights
    if (data.mostProductiveHours && data.mostProductiveHours.includes(currentHour)) {
      insights.push(`• You're usually very productive at this hour`);
    }

    if (data.procrastinatesThenRushes) {
      insights.push(`• You tend to work better with deadlines - consider starting early today`);
    }

    if (data.takesBreaksRegularly) {
      insights.push(`• Remember to take breaks every ${data.breakFrequencyNeeded || 60} minutes`);
    }

    if (data.underestimatesTime) {
      insights.push(`• Add 30% buffer to your time estimates`);
    }

    // Task type preferences
    const hour = new Date().getHours();
    if (hour < 12 && data.prefersCreativeWork === 'morning') {
      insights.push(`• Perfect time for creative/strategic work`);
    } else if (hour >= 12 && hour < 17 && data.prefersAdminWork === 'afternoon') {
      insights.push(`• Good time to tackle admin tasks`);
    }

    return insights;
  }

  /**
   * Check if briefing should be sent now
   */
  shouldSendBriefingNow(user: User & { settings?: any }): boolean {
    const hour = new Date().getHours();

    // Check if user has preferred briefing time in settings
    const preferredHour = user.settings?.briefingHour || 8; // Default 8 AM

    // Send briefing within 1 hour of preferred time
    return hour >= preferredHour && hour < preferredHour + 2;
  }
}

export function createMorningBriefingService(prisma: PrismaClient): MorningBriefingService {
  return new MorningBriefingService(prisma);
}
