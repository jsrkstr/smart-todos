"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExternalContextService = void 0;
exports.createExternalContextService = createExternalContextService;
/**
 * External Context Service
 *
 * Loads external data from:
 * - Calendar events (Google Calendar, etc.)
 * - Weather API (future)
 * - Other external integrations
 */
class ExternalContextService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    /**
     * Load external context for a user
     */
    async loadExternalContext(userId) {
        // Check if user has calendar connected
        const calendarConnections = await this.prisma.calendarConnection.findMany({
            where: {
                userId,
                isActive: true,
            },
        });
        if (calendarConnections.length === 0) {
            return this.getEmptyContext();
        }
        const connectionIds = calendarConnections.map((c) => c.id);
        // Get today's events
        const now = new Date();
        const startOfToday = new Date(now);
        startOfToday.setHours(0, 0, 0, 0);
        const endOfToday = new Date(now);
        endOfToday.setHours(23, 59, 59, 999);
        const eventsToday = await this.prisma.calendarEvent.findMany({
            where: {
                calendarConnectionId: { in: connectionIds },
                startTime: {
                    gte: startOfToday,
                    lte: endOfToday,
                },
                status: { not: 'cancelled' },
            },
            orderBy: { startTime: 'asc' },
        });
        // Find next event
        const upcomingEvents = eventsToday.filter((e) => e.startTime > now);
        const nextEvent = upcomingEvents.length > 0 ? upcomingEvents[0] : undefined;
        // Calculate free time blocks
        const freeTimeBlocks = this.calculateFreeTimeBlocks(eventsToday, now, endOfToday);
        return {
            eventsToday: eventsToday.map((e) => ({
                title: e.title,
                startTime: e.startTime,
                endTime: e.endTime,
                location: e.location || undefined,
                isAllDay: e.allDay,
            })),
            nextEvent: nextEvent
                ? {
                    title: nextEvent.title,
                    startsInMinutes: Math.round((nextEvent.startTime.getTime() - now.getTime()) / (1000 * 60)),
                    location: nextEvent.location || undefined,
                }
                : undefined,
            freeTimeBlocks,
            hasCalendarConnected: true,
        };
    }
    /**
     * Calculate free time blocks between events
     */
    calculateFreeTimeBlocks(events, startTime, endTime) {
        const blocks = [];
        if (events.length === 0) {
            // No events = entire day is free
            const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
            if (duration > 30) {
                // Only consider blocks > 30 minutes
                blocks.push({
                    start: startTime,
                    end: endTime,
                    durationMinutes: duration,
                });
            }
            return blocks;
        }
        // Sort events by start time
        const sortedEvents = [...events].sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
        // Check for free block before first event
        const firstEvent = sortedEvents[0];
        if (firstEvent.startTime > startTime) {
            const duration = (firstEvent.startTime.getTime() - startTime.getTime()) / (1000 * 60);
            if (duration > 30) {
                blocks.push({
                    start: startTime,
                    end: firstEvent.startTime,
                    durationMinutes: duration,
                });
            }
        }
        // Check for free blocks between events
        for (let i = 0; i < sortedEvents.length - 1; i++) {
            const currentEvent = sortedEvents[i];
            const nextEvent = sortedEvents[i + 1];
            if (nextEvent.startTime > currentEvent.endTime) {
                const duration = (nextEvent.startTime.getTime() - currentEvent.endTime.getTime()) / (1000 * 60);
                if (duration > 30) {
                    blocks.push({
                        start: currentEvent.endTime,
                        end: nextEvent.startTime,
                        durationMinutes: duration,
                    });
                }
            }
        }
        // Check for free block after last event
        const lastEvent = sortedEvents[sortedEvents.length - 1];
        if (lastEvent.endTime < endTime) {
            const duration = (endTime.getTime() - lastEvent.endTime.getTime()) / (1000 * 60);
            if (duration > 30) {
                blocks.push({
                    start: lastEvent.endTime,
                    end: endTime,
                    durationMinutes: duration,
                });
            }
        }
        return blocks;
    }
    /**
     * Get empty context when no calendar is connected
     */
    getEmptyContext() {
        return {
            eventsToday: [],
            nextEvent: undefined,
            freeTimeBlocks: [],
            hasCalendarConnected: false,
        };
    }
    /**
     * Get context summary for agent prompts
     */
    getContextSummary(context) {
        if (!context.hasCalendarConnected) {
            return '\n=== EXTERNAL CONTEXT ===\nNo calendar connected\n';
        }
        let summary = '\n=== EXTERNAL CONTEXT ===\n';
        // Calendar overview
        summary += `Calendar: ${context.eventsToday.length} events today\n`;
        // Next event
        if (context.nextEvent) {
            summary += `Next Event: "${context.nextEvent.title}" in ${context.nextEvent.startsInMinutes} min`;
            if (context.nextEvent.location) {
                summary += ` at ${context.nextEvent.location}`;
            }
            summary += '\n';
        }
        else if (context.eventsToday.length > 0) {
            summary += `Next Event: None remaining today\n`;
        }
        else {
            summary += `Next Event: No events today\n`;
        }
        // Free time blocks
        if (context.freeTimeBlocks.length > 0) {
            const longestBlock = context.freeTimeBlocks.reduce((prev, current) => current.durationMinutes > prev.durationMinutes ? current : prev);
            summary += `Free Time: ${context.freeTimeBlocks.length} blocks, longest is ${Math.round(longestBlock.durationMinutes)} min\n`;
        }
        else {
            summary += `Free Time: No significant free blocks today\n`;
        }
        // Today's events
        if (context.eventsToday.length > 0) {
            summary += '\nToday\'s Events:\n';
            context.eventsToday.slice(0, 5).forEach((event) => {
                const timeStr = event.isAllDay
                    ? 'All day'
                    : `${event.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                summary += `- ${timeStr}: ${event.title}\n`;
            });
        }
        return summary;
    }
    /**
     * Check if user has a specific time window available
     */
    hasTimeWindowAvailable(context, durationMinutes) {
        return context.freeTimeBlocks.some((block) => block.durationMinutes >= durationMinutes);
    }
    /**
     * Get optimal time for task based on free blocks
     */
    suggestOptimalTime(context, taskDurationMinutes) {
        // Find blocks that fit the task duration
        const suitableBlocks = context.freeTimeBlocks.filter((block) => block.durationMinutes >= taskDurationMinutes);
        if (suitableBlocks.length === 0) {
            return null;
        }
        // Return the earliest suitable block
        return {
            start: suitableBlocks[0].start,
            end: new Date(suitableBlocks[0].start.getTime() + taskDurationMinutes * 60 * 1000),
        };
    }
}
exports.ExternalContextService = ExternalContextService;
/**
 * Create and export singleton instance
 */
function createExternalContextService(prisma) {
    return new ExternalContextService(prisma);
}
