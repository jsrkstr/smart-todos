import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AuthenticatedApiRequest, withAuth } from '@/lib/api-middleware'

/**
 * DELETE /api/locations/[id]
 *
 * Delete a saved location
 */
export const DELETE = withAuth(async (
  req: AuthenticatedApiRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const { id } = params

    // Verify location belongs to user
    const location = await prisma.savedLocation.findUnique({
      where: { id },
    })

    if (!location) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      )
    }

    if (location.userId !== req.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Delete location
    await prisma.savedLocation.delete({
      where: { id },
    })

    // Log deletion
    await prisma.log.create({
      data: {
        type: 'location_deleted',
        userId: req.user.id,
        author: 'User',
        metadata: { locationName: location.name },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Failed to delete location:', errorMessage)
    return NextResponse.json(
      { error: 'Failed to delete location' },
      { status: 500 }
    )
  }
})

/**
 * PUT /api/locations/[id]
 *
 * Update a saved location
 */
export const PUT = withAuth(async (
  req: AuthenticatedApiRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const { id } = params
    const body = await req.json()

    // Verify location belongs to user
    const location = await prisma.savedLocation.findUnique({
      where: { id },
    })

    if (!location) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      )
    }

    if (location.userId !== req.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Update location
    const updated = await prisma.savedLocation.update({
      where: { id },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.latitude !== undefined && { latitude: body.latitude }),
        ...(body.longitude !== undefined && { longitude: body.longitude }),
        ...(body.radius !== undefined && { radius: body.radius }),
      },
    })

    // Log update
    await prisma.log.create({
      data: {
        type: 'location_updated',
        userId: req.user.id,
        author: 'User',
        metadata: { locationName: updated.name },
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Failed to update location:', errorMessage)
    return NextResponse.json(
      { error: 'Failed to update location' },
      { status: 500 }
    )
  }
})
