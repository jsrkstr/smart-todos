import { PrismaClient, User, Task } from '@prisma/client';
import { processRequest, createSecretaryStateService } from '@smart-todos/agent';

/**
 * Proactive Outreach Service
 *
 * Handles secretary-initiated check-ins based on:
 * - Inactivity (3+ days without interaction)
 * - Pending follow-ups (scheduled check-ins)
 * - Behavioral patterns (optimal times to reach out)
 */

export interface OutreachOpportunity {
  userId: string;
  reason: 'inactivity' | 'follow_up' | 'pattern_based';
  details: string;
  priority: number; // 1-10
  shouldReachOut: boolean;
}

export class ProactiveOutreachService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Find all users who need proactive outreach
   */
  async findOutreachOpportunities(): Promise<OutreachOpportunity[]> {
    const opportunities: OutreachOpportunity[] = [];

    // Get all active users
    const users = await this.prisma.user.findMany({
      where: {
        // Only users with notifications enabled
        settings: {
          notificationsEnabled: true,
        },
      },
      include: {
        settings: true,
        secretaryState: true,
      },
    });

    for (const user of users) {
      // Check for inactivity
      const inactivityCheck = await this.checkInactivity(user);
      if (inactivityCheck) {
        opportunities.push(inactivityCheck);
      }

      // Check for pending follow-ups
      const followUpChecks = await this.checkFollowUps(user);
      opportunities.push(...followUpChecks);

      // Check for pattern-based opportunities
      const patternCheck = await this.checkPatternBasedOpportunity(user);
      if (patternCheck) {
        opportunities.push(patternCheck);
      }
    }

    // Sort by priority (highest first)
    return opportunities.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Check if user has been inactive
   */
  private async checkInactivity(
    user: User & { settings?: any; secretaryState?: any }
  ): Promise<OutreachOpportunity | null> {
    const secretaryStateService = createSecretaryStateService(this.prisma);
    const state = await secretaryStateService.getState(user.id);

    if (!state.lastInteraction) {
      // New user, don't reach out yet
      return null;
    }

    const daysSinceInteraction = Math.floor(
      (Date.now() - state.lastInteraction.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Check aggressiveness setting
    const aggressiveness = user.settings?.secretaryAggressiveness || 'moderate';

    let threshold = 3; // Default: 3 days
    if (aggressiveness === 'conservative') {
      threshold = 7; // Wait a week
    } else if (aggressiveness === 'proactive') {
      threshold = 2; // Only 2 days
    }

    if (daysSinceInteraction >= threshold) {
      // Check if user has incomplete tasks
      const incompleteTasks = await this.prisma.task.count({
        where: {
          userId: user.id,
          completed: false,
        },
      });

      if (incompleteTasks > 0) {
        return {
          userId: user.id,
          reason: 'inactivity',
          details: `User inactive for ${daysSinceInteraction} days with ${incompleteTasks} incomplete tasks`,
          priority: Math.min(10, 3 + daysSinceInteraction),
          shouldReachOut: true,
        };
      }
    }

    return null;
  }

  /**
   * Check for pending follow-ups
   */
  private async checkFollowUps(
    user: User & { secretaryState?: any }
  ): Promise<OutreachOpportunity[]> {
    const secretaryStateService = createSecretaryStateService(this.prisma);
    const followUps = await secretaryStateService.getPendingFollowUps(user.id);

    const now = new Date();
    const opportunities: OutreachOpportunity[] = [];

    for (const followUp of followUps) {
      if (new Date(followUp.scheduledFor) <= now) {
        // Follow-up is due
        opportunities.push({
          userId: user.id,
          reason: 'follow_up',
          details: `Follow-up on task ${followUp.taskId}: ${followUp.reason}`,
          priority: this.calculateFollowUpPriority(followUp.type),
          shouldReachOut: true,
        });
      }
    }

    return opportunities;
  }

  /**
   * Check for pattern-based opportunities
   */
  private async checkPatternBasedOpportunity(
    user: User & { settings?: any }
  ): Promise<OutreachOpportunity | null> {
    // Load user patterns
    const patterns = await this.prisma.userPatterns.findUnique({
      where: { userId: user.id },
    });

    if (!patterns) {
      return null;
    }

    const data = patterns.patterns as any;
    const currentHour = new Date().getHours();

    // Check if we're in a productive hour and user hasn't started yet today
    if (data.mostProductiveHours && data.mostProductiveHours.includes(currentHour)) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tasksCompletedToday = await this.prisma.task.count({
        where: {
          userId: user.id,
          completed: true,
          completedAt: {
            gte: today,
          },
        },
      });

      const appOpenedToday = await this.prisma.log.findFirst({
        where: {
          userId: user.id,
          type: 'app_opened',
          createdAt: {
            gte: today,
          },
        },
      });

      if (tasksCompletedToday === 0 && !appOpenedToday) {
        return {
          userId: user.id,
          reason: 'pattern_based',
          details: `User's productive hour (${currentHour}:00) but no activity today`,
          priority: 6,
          shouldReachOut: true,
        };
      }
    }

    return null;
  }

  /**
   * Execute outreach for an opportunity
   */
  async executeOutreach(opportunity: OutreachOpportunity): Promise<boolean> {
    try {
      // Load full context before reaching out
      const canReachOut = await this.checkContextBeforeOutreach(opportunity.userId);

      if (!canReachOut.allowed) {
        console.log(
          `[ProactiveOutreach] Skipping outreach for ${opportunity.userId}: ${canReachOut.reason}`
        );
        return false;
      }

      // Generate personalized message based on reason
      const message = await this.generateOutreachMessage(opportunity);

      // Send via agent
      const agentResponse = await processRequest(opportunity.userId, message, {
        databaseUrl: process.env.DATABASE_URL,
      });

      // Record as chat message
      await this.prisma.chatMessage.create({
        data: {
          userId: opportunity.userId,
          content: agentResponse.agentResponse || message,
          role: 'assistant',
          type: 'Info',
        },
      });

      // Update secretary state
      const secretaryStateService = createSecretaryStateService(this.prisma);
      await secretaryStateService.recordInteraction(opportunity.userId, opportunity.reason);

      // If this was a follow-up, mark it as resolved
      if (opportunity.reason === 'follow_up') {
        const state = await secretaryStateService.getState(opportunity.userId);
        const updatedFollowUps = state.pendingFollowUps.map((f) => {
          if (f.scheduledFor.getTime() <= Date.now()) {
            return { ...f, resolved: true };
          }
          return f;
        });

        await this.prisma.secretaryState.update({
          where: { userId: opportunity.userId },
          data: {
            pendingFollowUps: updatedFollowUps,
          },
        });
      }

      // Send push notification if user has token
      const user = await this.prisma.user.findUnique({
        where: { id: opportunity.userId },
      });

      if (user?.expoPushToken) {
        await this.sendPushNotification(
          user.expoPushToken,
          'Check-in from your secretary',
          agentResponse.agentResponse || message
        );
      }

      console.log(`[ProactiveOutreach] Successfully reached out to ${opportunity.userId}`);
      return true;
    } catch (error) {
      console.error(
        `[ProactiveOutreach] Failed to reach out to ${opportunity.userId}:`,
        error
      );
      return false;
    }
  }

  /**
   * Check physical/external context before reaching out
   */
  private async checkContextBeforeOutreach(
    userId: string
  ): Promise<{ allowed: boolean; reason: string }> {
    // Check recent notifications
    const recentNotification = await this.prisma.chatMessage.findFirst({
      where: {
        userId,
        role: 'assistant',
        createdAt: {
          gte: new Date(Date.now() - 4 * 60 * 60 * 1000), // Last 4 hours
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (recentNotification) {
      return {
        allowed: false,
        reason: 'Recent notification sent within last 4 hours',
      };
    }

    // Check physical context if available
    const physicalContext = await this.prisma.userContext.findFirst({
      where: { userId },
      orderBy: { timestamp: 'desc' },
    });

    if (physicalContext) {
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

      // Only use if context is fresh
      if (physicalContext.timestamp >= thirtyMinutesAgo) {
        // Don't interrupt if driving
        if (physicalContext.activity === 'driving') {
          return {
            allowed: false,
            reason: 'User is driving',
          };
        }

        // Don't interrupt if DND
        if (physicalContext.doNotDisturb) {
          return {
            allowed: false,
            reason: 'Do Not Disturb is enabled',
          };
        }

        // Don't interrupt if screen is off
        if (!physicalContext.screenOn) {
          return {
            allowed: false,
            reason: 'Screen is off',
          };
        }
      }
    }

    // Check if it's outside reasonable hours
    const hour = new Date().getHours();
    if (hour < 7 || hour > 22) {
      return {
        allowed: false,
        reason: 'Outside reasonable hours (7 AM - 10 PM)',
      };
    }

    return { allowed: true, reason: 'Context is appropriate' };
  }

  /**
   * Generate personalized outreach message
   */
  private async generateOutreachMessage(opportunity: OutreachOpportunity): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id: opportunity.userId },
      include: {
        tasks: {
          where: { completed: false },
          orderBy: [{ priority: 'desc' }, { deadline: 'asc' }],
          take: 5,
        },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    let prompt = '';

    switch (opportunity.reason) {
      case 'inactivity':
        const daysSince = Math.floor(
          (Date.now() -
            (await this.prisma.secretaryState.findUnique({
              where: { userId: opportunity.userId },
            }))!.lastInteraction!.getTime()) /
            (1000 * 60 * 60 * 24)
        );

        prompt = `I haven't heard from the user in ${daysSince} days. They have ${user.tasks.length} incomplete tasks. Send a gentle, caring check-in message. Don't guilt them - just let them know I'm here to help and ask if they'd like to tackle anything together today.\n\nTheir top tasks:\n`;
        user.tasks.forEach((task, i) => {
          prompt += `${i + 1}. ${task.title}\n`;
        });
        break;

      case 'follow_up':
        const taskId = opportunity.details.match(/task (\w+)/)?.[1];
        const task = await this.prisma.task.findUnique({
          where: { id: taskId },
        });

        if (task) {
          prompt = `Following up on the task "${task.title}". `;
          if (task.deadline && new Date(task.deadline) < new Date()) {
            prompt += `It's overdue. Check in gently to see if they need help or if we should reschedule.`;
          } else {
            prompt += `Check on progress and offer support if needed.`;
          }
        }
        break;

      case 'pattern_based':
        const hour = new Date().getHours();
        prompt = `It's ${hour}:00, which is one of the user's most productive hours based on their patterns. They haven't started any tasks yet today. Send a motivating message to help them get started. Suggest tackling their highest priority task while their energy is good.\n\nTop task: ${user.tasks[0]?.title || 'No tasks'}`;
        break;
    }

    return prompt;
  }

  /**
   * Calculate priority for follow-up type
   */
  private calculateFollowUpPriority(
    type: 'blocked' | 'overdue' | 'check_progress' | 'celebration'
  ): number {
    switch (type) {
      case 'overdue':
        return 9;
      case 'blocked':
        return 8;
      case 'check_progress':
        return 5;
      case 'celebration':
        return 6;
      default:
        return 5;
    }
  }

  /**
   * Send push notification
   */
  private async sendPushNotification(
    expoPushToken: string,
    title: string,
    body: string
  ): Promise<void> {
    try {
      const message = {
        to: expoPushToken,
        sound: 'default' as const,
        title,
        body: body.substring(0, 200), // Limit to 200 chars
        data: {
          type: 'proactive_outreach',
        },
      };

      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      if (!response.ok) {
        throw new Error(`Push notification failed: ${response.statusText}`);
      }
    } catch (error) {
      console.error('[ProactiveOutreach] Failed to send push notification:', error);
    }
  }
}

export function createProactiveOutreachService(prisma: PrismaClient): ProactiveOutreachService {
  return new ProactiveOutreachService(prisma);
}
