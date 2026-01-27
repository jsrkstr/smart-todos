import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-middleware'
import { prisma } from '@/lib/prisma'

// GET - Get a specific calendar connection
export const GET = withAuth(async (req, { params }: { params: { id: string } }) => {
  const userId = req.user.userId
  const { id } = params

  const connection = await prisma.calendarConnection.findFirst({
    where: {
      id,
      userId
    },
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
      icalUrl: true,
      syncToken: true
    }
  })

  if (!connection) {
    return NextResponse.json(
      { error: 'Connection not found' },
      { status: 404 }
    )
  }

  return NextResponse.json(connection)
})

// PUT - Update a calendar connection
export const PUT = withAuth(async (req, { params }: { params: { id: string } }) => {
  const userId = req.user.userId
  const { id } = params
  const body = await req.json()

  // Only allow updating certain fields
  const { name, isActive, syncFrequency } = body

  const connection = await prisma.calendarConnection.findFirst({
    where: { id, userId }
  })

  if (!connection) {
    return NextResponse.json(
      { error: 'Connection not found' },
      { status: 404 }
    )
  }

  const updated = await prisma.calendarConnection.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(isActive !== undefined && { isActive }),
      ...(syncFrequency !== undefined && { syncFrequency })
    }
  })

  return NextResponse.json(updated)
})

// DELETE - Remove a calendar connection
export const DELETE = withAuth(async (req, { params }: { params: { id: string } }) => {
  const userId = req.user.userId
  const { id } = params

  const connection = await prisma.calendarConnection.findFirst({
    where: { id, userId }
  })

  if (!connection) {
    return NextResponse.json(
      { error: 'Connection not found' },
      { status: 404 }
    )
  }

  // Delete connection and all associated events (cascade)
  await prisma.calendarConnection.delete({
    where: { id }
  })

  return NextResponse.json({ success: true })
})
