import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth, AuthenticatedApiRequest } from '@/lib/api-middleware'
import { ProfileService } from '@/lib/services/profileService'

// GET /api/profile
export const GET = withAuth(async (req: AuthenticatedApiRequest) => {
  try {
    const userId = req.user.id
    
    // Get user profile using the ProfileService
    const user = await ProfileService.getUserProfile(userId)
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      bio: user.bio || '',
      principles: user.principles,
      inspirations: user.inspirations,
      psychProfile: user.psychProfile,
    })
  } catch (error) {
    console.error('Failed to get profile:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json({ error: 'Failed to get profile' }, { status: 500 })
  }
})

// PUT /api/profile
export const PUT = withAuth(async (req: AuthenticatedApiRequest) => {
  try {
    const userId = req.user.id
    const updates = await req.json()
    
    // Extract profile data
    const { preferences, integrations, psychProfile: psychProfileData, coach, ...userProfileData } = updates
    
    // Prepare data for profile update
    const profileUpdateData = {
      userProfile: userProfileData,
      psychProfile: psychProfileData ? {
        ...psychProfileData,
        coachId: coach || psychProfileData.coachId
      } : coach ? { coachId: coach } : undefined
    }

    // Update full profile using the service
    const result = await ProfileService.updateFullProfile(userId, profileUpdateData)
    
    return NextResponse.json({
      id: result.user.id,
      name: result.user.name,
      email: result.user.email,
      bio: result.user.bio || '',
      principles: result.user.principles,
      inspirations: result.user.inspirations,
      psychProfile: result.psychProfile,
    })
  } catch (error) {
    console.error('Failed to update profile:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}) 