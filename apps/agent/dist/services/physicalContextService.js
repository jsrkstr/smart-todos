"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PhysicalContextService = void 0;
exports.createPhysicalContextService = createPhysicalContextService;
/**
 * Physical Context Service
 *
 * Loads real-time physical context about the user:
 * - Current activity (stationary, walking, driving, etc.)
 * - Location type (home, work, commuting, etc.)
 * - Device state (battery, screen, DND)
 * - Time context (working hours, weekend)
 */
class PhysicalContextService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    /**
     * Load latest physical context for a user
     */
    async loadPhysicalContext(userId) {
        var _a, _b, _c;
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
        const activityDuration = await this.calculateActivityDuration(userId, latestContext.activity);
        // Determine time context
        const now = new Date();
        const timeContext = this.getTimeContext(now);
        // Get user's settings for working hours (if available)
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { settings: true },
        });
        const isWorkingHours = this.isWithinWorkingHours(now, ((_a = user === null || user === void 0 ? void 0 : user.settings) === null || _a === void 0 ? void 0 : _a.timezone) || 'UTC');
        return {
            // Activity
            currentActivity: latestContext.activity,
            activityConfidence: latestContext.confidence,
            activityDurationMinutes: activityDuration,
            // Location
            locationType: latestContext.locationType,
            isAtSavedLocation: !!latestContext.savedLocation,
            savedLocationName: (_b = latestContext.savedLocation) === null || _b === void 0 ? void 0 : _b.name,
            // Device
            screenOn: latestContext.screenOn,
            batteryLevel: latestContext.battery,
            isCharging: false, // TODO: Add charging status to schema
            doNotDisturb: latestContext.doNotDisturb,
            // Time
            localTime: now.toLocaleTimeString(),
            timezone: ((_c = user === null || user === void 0 ? void 0 : user.settings) === null || _c === void 0 ? void 0 : _c.timezone) || 'UTC',
            isWeekend: timeContext.isWeekend,
            isWorkingHours,
        };
    }
    /**
     * Calculate how long user has been in current activity
     */
    async calculateActivityDuration(userId, currentActivity) {
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
            }
            else {
                break;
            }
        }
        // Assume context reports every 15 minutes
        return duration * 15;
    }
    /**
     * Get time context (weekend, time of day)
     */
    getTimeContext(date) {
        const dayOfWeek = date.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const hour = date.getHours();
        let timeOfDay = 'unknown';
        if (hour >= 6 && hour < 12) {
            timeOfDay = 'morning';
        }
        else if (hour >= 12 && hour < 17) {
            timeOfDay = 'afternoon';
        }
        else if (hour >= 17 && hour < 21) {
            timeOfDay = 'evening';
        }
        else {
            timeOfDay = 'night';
        }
        return { isWeekend, timeOfDay };
    }
    /**
     * Check if current time is within working hours
     */
    isWithinWorkingHours(date, timezone) {
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
    shouldAllowInterruption(context) {
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
    getContextSummary(context) {
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
exports.PhysicalContextService = PhysicalContextService;
/**
 * Create and export singleton instance
 */
function createPhysicalContextService(prisma) {
    return new PhysicalContextService(prisma);
}
