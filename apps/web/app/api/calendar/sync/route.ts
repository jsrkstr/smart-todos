import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-middleware'
import { prisma } from '@/lib/prisma'
import { CalendarSyncService } from '@/lib/services/calendarSyncService'

// POST - Trigger manual sync for user's calendar connections
export const POST = withAuth(async (req) => {
  const userId = req.user.userId

  // Parse body, handle empty body case
  let connectionId: string | undefined
  try {
    const body = await req.json()
    connectionId = body?.connectionId
  } catch (e) {
    // Empty body is fine, will sync all connections
    connectionId = undefined
  }

  const syncService = new CalendarSyncService()

  // If connectionId is provided, sync only that connection
  if (connectionId) {
    // Verify connection belongs to user
    const connection = await prisma.calendarConnection.findFirst({
      where: { id: connectionId, userId }
    })

    if (!connection) {
      return NextResponse.json(
        { error: 'Connection not found' },
        { status: 404 }
      )
    }

    const result = await syncService.syncConnection(connectionId)

    return NextResponse.json({
      connectionId,
      ...result
    })
  }

  // Otherwise, sync all active connections for the user
  const connections = await prisma.calendarConnection.findMany({
    where: {
      userId,
      isActive: true,
      provider: 'google' // Only sync Google calendars for now
    }
  })

  if (connections.length === 0) {
    return NextResponse.json({
      message: 'No active calendar connections found'
    })
  }

  const results = []

  for (const connection of connections) {
    const result = await syncService.syncConnection(connection.id)
    results.push({
      connectionId: connection.id,
      name: connection.name,
      ...result
    })
  }

  const successCount = results.filter((r) => r.success).length
  const failureCount = results.length - successCount

  return NextResponse.json({
    total: results.length,
    success: successCount,
    failed: failureCount,
    results
  })
})

// GET - Get sync status for user's connections
export const GET = withAuth(async (req) => {
  const userId = req.user.userId

  const connections = await prisma.calendarConnection.findMany({
    where: { userId },
    select: {
      id: true,
      name: true,
      provider: true,
      isActive: true,
      lastSynced: true,
      _count: {
        select: { calendarEvents: true }
      }
    }
  })

  return NextResponse.json({
    connections: connections.map((c) => ({
      id: c.id,
      name: c.name,
      provider: c.provider,
      isActive: c.isActive,
      lastSynced: c.lastSynced,
      eventCount: c._count.calendarEvents
    }))
  })
})
