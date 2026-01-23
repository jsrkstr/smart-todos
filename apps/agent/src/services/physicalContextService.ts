import { PrismaClient } from '@prisma/client';

/**
 * Physical Context - Real-time user state from mobile device
 */
export interface PhysicalContext {
  // Activity detection
  currentActivity: 'stationary' | 'walking' | 'running' | 'driving' | 'unknown';
  activityConfidence: number;
  activityDurationMinutes: number;

  // Location context (privacy-preserving)
  locationType: 'home' | 'work' | 'commuting' | 'shopping' | 'gym' | 'restaurant' | 'unknown';
  isAtSavedLocation: boolean;
  savedLocationName?: string;

  // Device state
  screenOn: boolean;
  batteryLevel: number;
  isCharging: boolean;
  doNotDisturb: boolean;

  // Time context
  localTime: string;
  timezone: string;
  isWeekend: boolean;
  isWorkingHours: boolean;
}

/**
 * Physical Context Service
 *
 * Loads real-time physical context about the user:
 * - Current activity (stationary, walking, driving, etc.)
 * - Location type (home, work, commuting, etc.)
 * - Device state (battery, screen, DND)
 * - Time context (working hours, weekend)
 */
export class PhysicalContextService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Load latest physical context for a user
   */
  async loadPhysicalContext(userId: string): Promise<PhysicalContext | null> {
    // Get most recent context report from mobile device
    const latestContext = await this.prisma.userContext.findFirst({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      include: {
        savedLocation: true,
      },
    });

    if (!latestContext) {
      return null;
    }

    // Check if context is recent (within last 30 minutes)
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    if (latestContext.timestamp < thirtyMinutesAgo) {
      // Context is stale
      return null;
    }

    // Calculate activity duration
    const activityDuration = await this.calculateActivityDuration(
      userId,
      latestContext.activity
    );

    // Determine time context
    const now = new Date();
    const timeContext = this.getTimeContext(now);

    // Get user's settings for working hours (if available)
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { settings: true },
    });

    const isWorkingHours = this.isWithinWorkingHours(
      now,
      user?.settings?.timezone || 'UTC'
    );

    return {
      // Activity
      currentActivity: latestContext.activity as any,
      activityConfidence: latestContext.confidence,
      activityDurationMinutes: activityDuration,

      // Location
      locationType: latestContext.locationType as any,
      isAtSavedLocation: !!latestContext.savedLocation,
      savedLocationName: latestContext.savedLocation?.name,

      // Device
      screenOn: latestContext.screenOn,
      batteryLevel: latestContext.battery,
      isCharging: false, // TODO: Add charging status to schema
      doNotDisturb: latestContext.doNotDisturb,

      // Time
      localTime: now.toLocaleTimeString(),
      timezone: user?.settings?.timezone || 'UTC',
      isWeekend: timeContext.isWeekend,
      isWorkingHours,
    };
  }

  /**
   * Calculate how long user has been in current activity
   */
  private async calculateActivityDuration(
    userId: string,
    currentActivity: string
  ): Promise<number> {
    // Get recent context entries
    const recentContexts = await this.prisma.userContext.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: 10,
    });

    if (recentContexts.length === 0) {
      return 0;
    }

    // Count how many consecutive recent entries have the same activity
    let duration = 0;
    for (const context of recentContexts) {
      if (context.activity === currentActivity) {
        duration++;
      } else {
        break;
      }
    }

    // Assume context reports every 15 minutes
    return duration * 15;
  }

  /**
   * Get time context (weekend, time of day)
   */
  private getTimeContext(date: Date): { isWeekend: boolean; timeOfDay: string } {
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    const hour = date.getHours();
    let timeOfDay = 'unknown';
    if (hour >= 6 && hour < 12) {
      timeOfDay = 'morning';
    } else if (hour >= 12 && hour < 17) {
      timeOfDay = 'afternoon';
    } else if (hour >= 17 && hour < 21) {
      timeOfDay = 'evening';
    } else {
      timeOfDay = 'night';
    }

    return { isWeekend, timeOfDay };
  }

  /**
   * Check if current time is within working hours
   */
  private isWithinWorkingHours(date: Date, timezone: string): boolean {
    const hour = date.getHours();
    const dayOfWeek = date.getDay();

    // Weekend
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return false;
    }

    // Typical working hours: 9 AM - 5 PM
    return hour >= 9 && hour < 17;
  }

  /**
   * Check if user should be interrupted based on physical context
   */
  shouldAllowInterruption(context: PhysicalContext): boolean {
    // Do Not Disturb is on
    if (context.doNotDisturb) {
      return false;
    }

    // User is driving (safety concern)
    if (context.currentActivity === 'driving') {
      return false;
    }

    // Battery very low (< 10%)
    if (context.batteryLevel < 10) {
      return false;
    }

    // Screen is off (user not actively using device)
    if (!context.screenOn) {
      return false;
    }

    return true;
  }

  /**
   * Get context summary for agent prompts
   */
  getContextSummary(context: PhysicalContext): string {
    let summary = `\n=== PHYSICAL CONTEXT ===\n`;

    // Activity
    summary += `Current Activity: ${context.currentActivity}`;
    if (context.activityDurationMinutes > 0) {
      summary += ` (for ${context.activityDurationMinutes} minutes)`;
    }
    summary += `\n`;

    // Location
    summary += `Location: ${context.locationType}`;
    if (context.savedLocationName) {
      summary += ` (${context.savedLocationName})`;
    }
    summary += `\n`;

    // Device State
    summary += `Device: Battery ${context.batteryLevel}%`;
    if (context.doNotDisturb) {
      summary += `, DND ON`;
    }
    if (!context.screenOn) {
      summary += `, Screen OFF`;
    }
    summary += `\n`;

    // Time Context
    summary += `Time: ${context.localTime}`;
    if (context.isWeekend) {
      summary += ` (Weekend)`;
    }
    if (!context.isWorkingHours) {
      summary += ` (Outside working hours)`;
    }
    summary += `\n`;

    // Interruptibility
    const canInterrupt = this.shouldAllowInterruption(context);
    summary += `Interruptible: ${canInterrupt ? 'Yes' : 'No'}\n`;

    return summary;
  }
}

/**
 * Create and export singleton instance
 */
export function createPhysicalContextService(
  prisma: PrismaClient
): PhysicalContextService {
  return new PhysicalContextService(prisma);
}
