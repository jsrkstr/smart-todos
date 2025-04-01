import { Task } from "./task"

export interface CalendarEvent {
    id: string
    externalId?: string
    title: string
    description?: string
    location?: string
    startTime: Date
    endTime: Date
    allDay: boolean
    recurrence?: string
    status: string
    lastModified: Date
    calendarConnectionId: string
    linkedTaskId: string
    externalData?: string
    createdAt: Date
    updatedAt: Date
    // calendarConnection: Prisma.$CalendarConnectionPayload<ExtArgs>
    linkedTask: Task
}
