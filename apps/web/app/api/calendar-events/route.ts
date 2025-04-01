import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { AuthenticatedApiRequest, withAuth } from '@/lib/api-middleware'

// GET /api/calendar-events
export const GET = withAuth(async (req: AuthenticatedApiRequest) => {
  try {
    const events = await prisma.calendarEvent.findMany({
      where: {
        calendarConnection: {
          userId: req.user.id,
          isActive: true,
        },
      },
      include: {
        calendarConnection: true,
        linkedTask: true,
      },
      orderBy: {
        startTime: "asc",
      },
    })

    return NextResponse.json(events)
  } catch (error) {
    // Safe error handling
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('[CALENDAR_EVENTS_GET]', errorMessage)
    return NextResponse.json({ error: 'Failed to fetch calendar events' }, { status: 500 })
  }
})

// POST /api/calendar-events
export const POST = withAuth(async (req: AuthenticatedApiRequest) => {
  try {
    let eventData;
    try {
      eventData = await req.json();
    } catch (jsonError) {
      const errorMessage = jsonError instanceof Error ? jsonError.message : 'Unknown error';
      console.error('[CALENDAR_EVENTS_POST] Invalid JSON:', errorMessage);
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }

    if (!eventData) {
      return NextResponse.json({ error: 'Missing event data' }, { status: 400 });
    }

    // Create event with user's calendar connection
    const event = await prisma.calendarEvent.create({
      data: {
        ...eventData,
        calendarConnection: {
          connect: {
            userId_provider_calendarId: {
              userId: req.user.id,
              provider: eventData.provider || 'custom',
              calendarId: eventData.calendarId || 'default'
            }
          }
        }
      },
      include: {
        calendarConnection: true,
        linkedTask: true,
      }
    })

    return NextResponse.json(event)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('[CALENDAR_EVENTS_POST]', errorMessage)
    return NextResponse.json({ error: 'Failed to create calendar event' }, { status: 500 })
  }
})

// PUT /api/calendar-events/:id
export const PUT = withAuth(async (req: AuthenticatedApiRequest) => {
  try {
    let updates;
    try {
      updates = await req.json();
    } catch (jsonError) {
      const errorMessage = jsonError instanceof Error ? jsonError.message : 'Unknown error';
      console.error('[CALENDAR_EVENTS_PUT] Invalid JSON:', errorMessage);
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }

    if (!updates) {
      return NextResponse.json({ error: 'Missing event updates' }, { status: 400 });
    }

    // Extract eventId from the URL
    const url = new URL(req.url)
    const eventId = url.pathname.split('/').pop()

    if (!eventId) {
      return NextResponse.json({ error: 'Missing event ID' }, { status: 400 });
    }

    // Verify event belongs to user before updating
    const existingEvent = await prisma.calendarEvent.findFirst({
      where: {
        id: eventId,
        calendarConnection: {
          userId: req.user.id
        }
      }
    })

    if (!existingEvent) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const updatedEvent = await prisma.calendarEvent.update({
      where: { id: eventId },
      data: updates,
      include: {
        calendarConnection: true,
        linkedTask: true,
      }
    })

    return NextResponse.json(updatedEvent)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('[CALENDAR_EVENTS_PUT]', errorMessage)
    return NextResponse.json({ error: 'Failed to update calendar event' }, { status: 500 })
  }
})

// DELETE /api/calendar-events/:id
export const DELETE = withAuth(async (req: AuthenticatedApiRequest) => {
  try {
    // Extract eventId from the URL
    const url = new URL(req.url)
    const eventId = url.pathname.split('/').pop()

    if (!eventId) {
      return NextResponse.json({ error: 'Missing event ID' }, { status: 400 });
    }

    // Verify event belongs to user before deleting
    const existingEvent = await prisma.calendarEvent.findFirst({
      where: {
        id: eventId,
        calendarConnection: {
          userId: req.user.id
        }
      }
    })

    if (!existingEvent) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    await prisma.calendarEvent.delete({
      where: { id: eventId }
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('[CALENDAR_EVENTS_DELETE]', errorMessage)
    return NextResponse.json({ error: 'Failed to delete calendar event' }, { status: 500 })
  }
}) 