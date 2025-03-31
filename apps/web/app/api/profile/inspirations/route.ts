import { NextResponse } from 'next/server'
import { withAuth, AuthenticatedApiRequest } from '@/lib/api-middleware'
import { ProfileService } from '@/lib/services/profileService'

/**
 * GET /api/profile/inspirations
 * Get user's inspirations
 */
export const GET = withAuth(async (req: AuthenticatedApiRequest) => {
  try {
    const userId = req.user.id
    
    // Get user profile
    const user = await ProfileService.getUserProfile(userId)
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    return NextResponse.json({
      inspirations: user.inspirations,
    })
  } catch (error) {
    console.error('Failed to get inspirations:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json({ error: 'Failed to get inspirations' }, { status: 500 })
  }
})

/**
 * POST /api/profile/inspirations
 * Add an inspiration
 */
export const POST = withAuth(async (req: AuthenticatedApiRequest) => {
  try {
    const userId = req.user.id
    const { inspiration } = await req.json()
    
    if (!inspiration) {
      return NextResponse.json({ error: 'Inspiration is required' }, { status: 400 })
    }

    // Add inspiration using the service
    const updatedUser = await ProfileService.addInspiration(userId, inspiration)

    return NextResponse.json({
      inspirations: updatedUser.inspirations,
    })
  } catch (error) {
    console.error('Failed to add inspiration:', error instanceof Error ? error.message : 'Unknown error')
    
    if (error instanceof Error && error.message === 'User not found') {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    return NextResponse.json({ error: 'Failed to add inspiration' }, { status: 500 })
  }
})

/**
 * DELETE /api/profile/inspirations
 * Remove an inspiration by index
 */
export const DELETE = withAuth(async (req: AuthenticatedApiRequest) => {
  try {
    const userId = req.user.id
    const { index } = await req.json()
    
    if (index === undefined) {
      return NextResponse.json({ error: 'Index is required' }, { status: 400 })
    }

    // Remove inspiration using the service
    const updatedUser = await ProfileService.removeInspiration(userId, index)

    return NextResponse.json({
      inspirations: updatedUser.inspirations,
    })
  } catch (error) {
    console.error('Failed to remove inspiration:', error instanceof Error ? error.message : 'Unknown error')
    
    if (error instanceof Error) {
      if (error.message === 'User not found') {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }
      if (error.message === 'Invalid inspiration index') {
        return NextResponse.json({ error: 'Invalid inspiration index' }, { status: 400 })
      }
    }
    
    return NextResponse.json({ error: 'Failed to remove inspiration' }, { status: 500 })
  }
}) 