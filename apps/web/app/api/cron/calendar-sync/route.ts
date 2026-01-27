import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CalendarSyncService } from '@/lib/services/calendarSyncService'

export const dynamic = 'force-dynamic'
export const maxDuration = 60 // Vercel function timeout (seconds)

// POST - Background sync endpoint (called by external cron service)
export async function POST(request: Request) {
  // Verify secret to prevent unauthorized access
  const authHeader = request.headers.get('authorization')
  const secret = process.env.CALENDAR_SYNC_SECRET

  if (!secret) {
    console.error('[Calendar Cron] CALENDAR_SYNC_SECRET not configured')
    return NextResponse.json(
      { error: 'Service misconfigured' },
      { status: 500 }
    )
  }

  if (authHeader !== `Bearer ${secret}`) {
    console.warn('[Calendar Cron] Unauthorized access attempt')
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const syncService = new CalendarSyncService()

    // Get all active Google calendar connections
    const connections = await prisma.calendarConnection.findMany({
      where: {
        isActive: true,
        provider: 'google'
      },
      include: {
        user: {
          select: { id: true, email: true }
        }
      }
    })

    console.log(`[Calendar Cron] Found ${connections.length} active connections to sync`)

    const results = []
    let successCount = 0
    let failureCount = 0

    for (const connection of connections) {
      // Check if sync is needed based on frequency
      const shouldSync = this.shouldSyncConnection(connection)

      if (!shouldSync) {
        console.log(`[Calendar Cron] Skipping ${connection.name} (not due for sync)`)
        continue
      }

      console.log(`[Calendar Cron] Syncing ${connection.name} for user ${connection.user.email}`)

      const result = await syncService.syncConnection(connection.id)

      results.push({
        connectionId: connection.id,
        userId: connection.userId,
        name: connection.name,
        ...result
      })

      if (result.success) {
        successCount++
      } else {
        failureCount++
      }
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      total: results.length,
      success: successCount,
      failed: failureCount,
      results
    })
  } catch (error: any) {
    console.error('[Calendar Cron] Error:', error)
    return NextResponse.json(
      {
        error: 'Sync failed',
        message: error.message
      },
      { status: 500 }
    )
  }
}

// Helper function to determine if connection should sync
function shouldSyncConnection(connection: any): boolean {
  if (!connection.lastSynced) {
    return true // Never synced before
  }

  const now = new Date()
  const lastSynced = new Date(connection.lastSynced)
  const hoursSinceSync = (now.getTime() - lastSynced.getTime()) / (1000 * 60 * 60)

  switch (connection.syncFrequency) {
    case 'realtime':
      return hoursSinceSync >= 0.25 // 15 minutes
    case 'hourly':
      return hoursSinceSync >= 1
    case 'daily':
      return hoursSinceSync >= 24
    default:
      return hoursSinceSync >= 1 // Default to hourly
  }
}

// GET - Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'calendar-sync-cron',
    timestamp: new Date().toISOString()
  })
}
