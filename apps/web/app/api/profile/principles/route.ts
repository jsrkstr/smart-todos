import { NextResponse } from 'next/server'
import { withAuth, AuthenticatedApiRequest } from '@/lib/api-middleware'
import { ProfileService } from '@/lib/services/profileService'

/**
 * GET /api/profile/principles
 * Get user's principles
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
      principles: user.principles,
    })
  } catch (error) {
    console.error('Failed to get principles:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json({ error: 'Failed to get principles' }, { status: 500 })
  }
})

/**
 * POST /api/profile/principles
 * Add a principle
 */
export const POST = withAuth(async (req: AuthenticatedApiRequest) => {
  try {
    const userId = req.user.id
    const { principle } = await req.json()
    
    if (!principle) {
      return NextResponse.json({ error: 'Principle is required' }, { status: 400 })
    }

    // Add principle using the service
    const updatedUser = await ProfileService.addPrinciple(userId, principle)

    return NextResponse.json({
      principles: updatedUser.principles,
    })
  } catch (error) {
    console.error('Failed to add principle:', error instanceof Error ? error.message : 'Unknown error')
    
    if (error instanceof Error && error.message === 'User not found') {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    return NextResponse.json({ error: 'Failed to add principle' }, { status: 500 })
  }
})

/**
 * DELETE /api/profile/principles
 * Remove a principle by index
 */
export const DELETE = withAuth(async (req: AuthenticatedApiRequest) => {
  try {
    const userId = req.user.id
    const { index } = await req.json()
    
    if (index === undefined) {
      return NextResponse.json({ error: 'Index is required' }, { status: 400 })
    }

    // Remove principle using the service
    const updatedUser = await ProfileService.removePrinciple(userId, index)

    return NextResponse.json({
      principles: updatedUser.principles,
    })
  } catch (error) {
    console.error('Failed to remove principle:', error instanceof Error ? error.message : 'Unknown error')
    
    if (error instanceof Error) {
      if (error.message === 'User not found') {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }
      if (error.message === 'Invalid principle index') {
        return NextResponse.json({ error: 'Invalid principle index' }, { status: 400 })
      }
    }
    
    return NextResponse.json({ error: 'Failed to remove principle' }, { status: 500 })
  }
}) 