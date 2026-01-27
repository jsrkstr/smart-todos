import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-middleware'
import { prisma } from '@/lib/prisma'

// GET - List all calendar connections for the user
export const GET = withAuth(async (req) => {
  const userId = req.user.userId

  const connections = await prisma.calendarConnection.findMany({
    where: { userId },
    select: {
      id: true,
      provider: true,
      name: true,
      isActive: true,
      calendarId: true,
      lastSynced: true,
      syncFrequency: true,
      tokenExpiry: true,
      createdAt: true,
      updatedAt: true,
      // Don't send tokens to client
      accessToken: false,
      refreshToken: false
    },
    orderBy: { createdAt: 'desc' }
  })

  return NextResponse.json(connections)
})

// POST - Create a new calendar connection (manual)
export const POST = withAuth(async (req) => {
  const userId = req.user.userId
  const body = await req.json()

  const { provider, name, calendarId, icalUrl } = body

  if (!provider) {
    return NextResponse.json(
      { error: 'Provider is required' },
      { status: 400 }
    )
  }

  // For iCal connections
  if (provider === 'ical' && !icalUrl) {
    return NextResponse.json(
      { error: 'iCal URL is required for iCal connections' },
      { status: 400 }
    )
  }

  const connection = await prisma.calendarConnection.create({
    data: {
      userId,
      provider,
      name: name || `${provider} Calendar`,
      calendarId: calendarId || 'primary',
      icalUrl,
      isActive: true,
      syncFrequency: 'hourly'
    }
  })

  return NextResponse.json(connection, { status: 201 })
})
