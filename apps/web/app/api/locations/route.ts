import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AuthenticatedApiRequest, withAuth } from '@/lib/api-middleware'

/**
 * GET /api/locations
 *
 * Get all saved locations for the authenticated user
 */
export const GET = withAuth(async (req: AuthenticatedApiRequest) => {
  try {
    const locations = await prisma.savedLocation.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(locations)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Failed to get locations:', errorMessage)
    return NextResponse.json(
      { error: 'Failed to get locations' },
      { status: 500 }
    )
  }
})

/**
 * POST /api/locations
 *
 * Create a new saved location
 */
export const POST = withAuth(async (req: AuthenticatedApiRequest) => {
  try {
    const body = await req.json()

    // Validate required fields
    if (!body.name || body.latitude === undefined || body.longitude === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: name, latitude, longitude' },
        { status: 400 }
      )
    }

    // Check if location with this name already exists
    const existing = await prisma.savedLocation.findUnique({
      where: {
        userId_name: {
          userId: req.user.id,
          name: body.name,
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Location with this name already exists' },
        { status: 409 }
      )
    }

    // Create location
    const location = await prisma.savedLocation.create({
      data: {
        userId: req.user.id,
        name: body.name,
        latitude: body.latitude,
        longitude: body.longitude,
        radius: body.radius || 100,
      },
    })

    // Log location creation
    await prisma.log.create({
      data: {
        type: 'location_created',
        userId: req.user.id,
        author: 'User',
        metadata: { locationName: body.name },
      },
    })

    return NextResponse.json(location, { status: 201 })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Failed to create location:', errorMessage)
    return NextResponse.json(
      { error: 'Failed to create location' },
      { status: 500 }
    )
  }
})
