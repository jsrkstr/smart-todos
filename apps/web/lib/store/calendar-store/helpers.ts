import { CalendarEvent } from "@/types/calendar-events"

export const transformEvent = (event: CalendarEvent): CalendarEvent => {
    return {
        ...event,
        ...(event.startTime ? { startTime: new Date(event.startTime) } : {}),
        ...(event.endTime ? { endTime: new Date(event.endTime) } : {}),
        ...(event.lastModified ? { lastModified: new Date(event.lastModified) } : {}),
        ...(event.createdAt ? { createdAt: new Date(event.createdAt) } : {}),
        ...(event.updatedAt ? { updatedAt: new Date(event.updatedAt) } : {}),
    };
};
