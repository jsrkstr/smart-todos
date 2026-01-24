/**
 * Intervention Evaluator
 *
 * Uses historical and physical context to determine:
 * 1. Whether to send an intervention
 * 2. What type of intervention to send
 * 3. Optimal timing for the intervention
 * 4. Priority/urgency level
 */

import { PrismaClient, Task, User, Settings } from '@prisma/client';

// Historical context interface (from agent)
interface HistoricalContext {
  notificationsSentToday: number;
  lastNotificationSent: Date | null;
  tasksCompletedToday: number;
  tasksCompletedThisWeek: number;
  currentDailyStreak: number;
  pomodorosCompletedToday: number;
  totalFocusMinutesToday: number;
  averageMoodThisWeek: number | null;
  overdueTaskCount: number;
  appOpenedToday: boolean;
}

// Physical context interface (from mobile)
interface PhysicalContext {
  currentActivity: 'stationary' | 'walking' | 'running' | 'driving' | 'unknown';
  activityConfidence: number;
  locationType: 'home' | 'work' | 'commuting' | 'shopping' | 'gym' | 'restaurant' | 'unknown';
  isAtSavedLocation: boolean;
  savedLocationName?: string;
  screenOn: boolean;
  batteryLevel: number;
  doNotDisturb: boolean;
  isWeekend: boolean;
  isWorkingHours: boolean;
}

// Intervention evaluation result
export interface InterventionEvaluation {
  shouldIntervene: boolean;
  reason: string;
  interruptibilityScore: number; // 0-100
  suggestedInterventionType: string;
  suggestedPriority: number; // 1-10
  optimalTiming: 'now' | 'defer' | 'never';
  deferMinutes?: number;
}

export class InterventionEvaluator {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Evaluate whether to send an intervention for a task
   */
  async evaluateIntervention(
    user: User & { settings?: Settings | null },
    task: Task,
    historicalContext: HistoricalContext,
    physicalContext: PhysicalContext | null
  ): Promise<InterventionEvaluation> {
    // Calculate interruptibility score
    const interruptibilityScore = this.calculateInterruptibilityScore(
      user,
      historicalContext,
      physicalContext
    );

    // Check notification fatigue
    if (historicalContext.notificationsSentToday >= 10) {
      return {
        shouldIntervene: false,
        reason: 'Notification fatigue - too many notifications sent today',
        interruptibilityScore,
        suggestedInterventionType: 'none',
        suggestedPriority: 0,
        optimalTiming: 'never',
      };
    }

    // Check if recently notified (< 1 hour ago)
    if (historicalContext.lastNotificationSent) {
      const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
      if (historicalContext.lastNotificationSent > hourAgo) {
        return {
          shouldIntervene: false,
          reason: 'Too soon since last notification',
          interruptibilityScore,
          suggestedInterventionType: 'defer',
          suggestedPriority: 5,
          optimalTiming: 'defer',
          deferMinutes: 30,
        };
      }
    }

    // Use physical context if available
    if (physicalContext) {
      // Don't interrupt if driving (safety)
      if (physicalContext.currentActivity === 'driving') {
        return {
          shouldIntervene: false,
          reason: 'User is driving - safety concern',
          interruptibilityScore: 0,
          suggestedInterventionType: 'defer',
          suggestedPriority: 8,
          optimalTiming: 'defer',
          deferMinutes: 15,
        };
      }

      // Don't interrupt if DND is on (unless very urgent)
      if (physicalContext.doNotDisturb && task.priority !== 'high') {
        return {
          shouldIntervene: false,
          reason: 'Do Not Disturb is enabled',
          interruptibilityScore: 10,
          suggestedInterventionType: 'defer',
          suggestedPriority: 5,
          optimalTiming: 'defer',
          deferMinutes: 60,
        };
      }

      // Low battery - only urgent tasks
      if (physicalContext.batteryLevel < 10 && task.priority !== 'high') {
        return {
          shouldIntervene: false,
          reason: 'Battery very low',
          interruptibilityScore: 20,
          suggestedInterventionType: 'defer',
          suggestedPriority: 5,
          optimalTiming: 'defer',
          deferMinutes: 30,
        };
      }

      // Screen off - user not actively using device
      if (!physicalContext.screenOn) {
        return {
          shouldIntervene: false,
          reason: 'Screen is off',
          interruptibilityScore: 30,
          suggestedInterventionType: 'defer',
          suggestedPriority: 5,
          optimalTiming: 'defer',
          deferMinutes: 15,
        };
      }
    }

    // Check secretary aggressiveness setting
    const aggressiveness = user.settings?.secretaryAggressiveness || 'moderate';

    if (aggressiveness === 'conservative') {
      // Only intervene for urgent tasks
      if (task.priority !== 'high' && !task.deadline) {
        return {
          shouldIntervene: false,
          reason: 'Conservative mode - only urgent tasks',
          interruptibilityScore,
          suggestedInterventionType: 'none',
          suggestedPriority: 3,
          optimalTiming: 'never',
        };
      }
    }

    // Determine intervention type and priority
    const interventionType = this.determineInterventionType(task, historicalContext, physicalContext);
    const priority = this.calculatePriority(task, historicalContext, physicalContext);

    // Good to intervene!
    return {
      shouldIntervene: true,
      reason: this.buildInterventionReason(task, historicalContext, physicalContext),
      interruptibilityScore,
      suggestedInterventionType: interventionType,
      suggestedPriority: priority,
      optimalTiming: 'now',
    };
  }

  /**
   * Calculate interruptibility score (0-100)
   * Higher score = more interruptible
   */
  private calculateInterruptibilityScore(
    user: User & { settings?: Settings | null },
    historicalContext: HistoricalContext,
    physicalContext: PhysicalContext | null
  ): number {
    let score = 50; // Start at neutral

    // Historical factors
    if (historicalContext.notificationsSentToday > 5) {
      score -= 20; // Notification fatigue
    }
    if (historicalContext.appOpenedToday) {
      score += 10; // User is engaged today
    }
    if (historicalContext.currentDailyStreak > 7) {
      score += 5; // Motivated user
    }

    // Physical context factors
    if (physicalContext) {
      // Activity
      if (physicalContext.currentActivity === 'stationary') {
        score += 15; // Stationary = more available
      } else if (physicalContext.currentActivity === 'walking') {
        score += 5; // Walking = somewhat available
      } else if (physicalContext.currentActivity === 'driving') {
        score = 0; // Driving = never interrupt
        return score;
      }

      // Location
      if (physicalContext.locationType === 'home' && !physicalContext.isWorkingHours) {
        score += 10; // At home, off hours
      } else if (physicalContext.locationType === 'work' && physicalContext.isWorkingHours) {
        score += 10; // At work during work hours
      } else if (physicalContext.locationType === 'commuting') {
        score -= 5; // Commuting = less available
      }

      // Device state
      if (physicalContext.doNotDisturb) {
        score -= 30; // DND is a strong signal
      }
      if (!physicalContext.screenOn) {
        score -= 20; // Screen off
      }
      if (physicalContext.batteryLevel < 20) {
        score -= 10; // Low battery
      }

      // Weekend
      if (physicalContext.isWeekend) {
        score -= 5; // Respect weekend time
      }
    }

    // Clamp to 0-100
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Determine what type of intervention to send
   */
  private determineInterventionType(
    task: Task,
    historicalContext: HistoricalContext,
    physicalContext: PhysicalContext | null
  ): string {
    // Check if task is overdue
    if (task.deadline && new Date(task.deadline) < new Date()) {
      return 'consequence_warning';
    }

    // Check if deadline is approaching
    if (task.deadline) {
      const hoursUntilDeadline = (new Date(task.deadline).getTime() - Date.now()) / (1000 * 60 * 60);
      if (hoursUntilDeadline < 4) {
        return 'reminder';
      }
    }

    // Check for idle/stuck state
    if (physicalContext && physicalContext.currentActivity === 'stationary' &&
        physicalContext.activityDurationMinutes > 120) {
      // User has been stationary for 2+ hours
      if (historicalContext.tasksCompletedToday === 0 ||
          (task.updatedAt && (Date.now() - new Date(task.updatedAt).getTime()) / (1000 * 60) > 60)) {
        // AND no tasks completed today OR this task hasn't been touched in 60+ minutes
        return 'idle_check';
      }
    }

    // Check if user hasn't completed any tasks today
    if (historicalContext.tasksCompletedToday === 0 && new Date().getHours() > 14) {
      return 'motivation';
    }

    // Check if user is at optimal location for task
    if (physicalContext && task.tags) {
      const tags = JSON.parse(JSON.stringify(task.tags));
      if (tags.includes('home') && physicalContext.locationType === 'home') {
        return 'reminder';
      }
      if (tags.includes('work') && physicalContext.locationType === 'work') {
        return 'reminder';
      }
      if (tags.includes('gym') && physicalContext.locationType === 'gym') {
        return 'reminder';
      }
    }

    // Default progress check
    return 'progress_check';
  }

  /**
   * Calculate intervention priority (1-10)
   */
  private calculatePriority(
    task: Task,
    historicalContext: HistoricalContext,
    physicalContext: PhysicalContext | null
  ): number {
    let priority = 5; // Start at medium

    // Task priority
    if (task.priority === 'high') {
      priority += 3;
    } else if (task.priority === 'low') {
      priority -= 2;
    }

    // Deadline urgency
    if (task.deadline) {
      const hoursUntilDeadline = (new Date(task.deadline).getTime() - Date.now()) / (1000 * 60 * 60);
      if (hoursUntilDeadline < 2) {
        priority += 4;
      } else if (hoursUntilDeadline < 24) {
        priority += 2;
      }
    }

    // Overdue tasks
    if (historicalContext.overdueTaskCount > 3) {
      priority += 1;
    }

    // Location match
    if (physicalContext && task.tags) {
      const tags = JSON.parse(JSON.stringify(task.tags));
      if (
        (tags.includes('home') && physicalContext.locationType === 'home') ||
        (tags.includes('work') && physicalContext.locationType === 'work')
      ) {
        priority += 2; // User is at the right location!
      }
    }

    // Clamp to 1-10
    return Math.max(1, Math.min(10, priority));
  }

  /**
   * Build human-readable reason for intervention
   */
  private buildInterventionReason(
    task: Task,
    historicalContext: HistoricalContext,
    physicalContext: PhysicalContext | null
  ): string {
    const reasons: string[] = [];

    if (task.deadline) {
      const hoursUntilDeadline = (new Date(task.deadline).getTime() - Date.now()) / (1000 * 60 * 60);
      if (hoursUntilDeadline < 4) {
        reasons.push(`Deadline in ${Math.round(hoursUntilDeadline)} hours`);
      }
    }

    if (physicalContext) {
      if (physicalContext.locationType === 'home' && task.tags?.includes('home')) {
        reasons.push('You\'re at home - perfect timing');
      }
      if (physicalContext.currentActivity === 'stationary') {
        reasons.push('You\'re stationary and available');
      }
    }

    if (historicalContext.tasksCompletedToday === 0) {
      reasons.push('Haven\'t completed any tasks today');
    }

    if (reasons.length === 0) {
      reasons.push('Good time to check in');
    }

    return reasons.join(', ');
  }
}

export function createInterventionEvaluator(prisma: PrismaClient): InterventionEvaluator {
  return new InterventionEvaluator(prisma);
}
