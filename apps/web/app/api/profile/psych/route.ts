import { NextResponse } from 'next/server'
import { withAuth, AuthenticatedApiRequest } from '@/lib/api-middleware'
import { ProfileService } from '@/lib/services/profileService'

/**
 * GET /api/profile/psych
 * Get user's psychological profile
 */
export const GET = withAuth(async (req: AuthenticatedApiRequest) => {
  try {
    const userId = req.user.id
    
    // Get psych profile
    const profile = await ProfileService.getPsychProfile(userId)
    
    if (!profile) {
      return NextResponse.json({ error: 'Psychological profile not found' }, { status: 404 })
    }
    
    return NextResponse.json(profile)
  } catch (error) {
    console.error('Failed to get psychological profile:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json({ error: 'Failed to get psychological profile' }, { status: 500 })
  }
})

/**
 * PUT /api/profile/psych
 * Update psychological profile
 */
export const PUT = withAuth(async (req: AuthenticatedApiRequest) => {
  try {
    const userId = req.user.id
    const updates = await req.json()
    
    // Update psych profile
    const profile = await ProfileService.updatePsychProfile(userId, updates)
    
    return NextResponse.json(profile)
  } catch (error) {
    console.error('Failed to update psychological profile:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json({ error: 'Failed to update psychological profile' }, { status: 500 })
  }
})

/**
 * POST /api/profile/psych
 * Create psychological profile (if it doesn't exist)
 */
export const POST = withAuth(async (req: AuthenticatedApiRequest) => {
  try {
    const userId = req.user.id
    const data = await req.json()
    
    // Check if profile already exists
    const existingProfile = await ProfileService.getPsychProfile(userId)
    
    if (existingProfile) {
      return NextResponse.json(
        { error: 'Psychological profile already exists, use PUT to update' }, 
        { status: 400 }
      )
    }
    
    // Create psych profile
    const profile = await ProfileService.updatePsychProfile(userId, data)
    
    return NextResponse.json(profile)
  } catch (error) {
    console.error('Failed to create psychological profile:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json({ error: 'Failed to create psychological profile' }, { status: 500 })
  }
}) 