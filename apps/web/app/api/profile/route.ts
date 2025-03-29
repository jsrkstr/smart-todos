import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { withAuth, AuthenticatedApiRequest } from '@/lib/api-middleware'

// GET /api/profile
export const GET = withAuth(async (req: AuthenticatedApiRequest) => {
  try {
    const userId = req.user.id
    
    // Get user from database with their profile
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        psychProfile: true
      }
    })
    
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
    
    // Extract onboarding data if present
    const { preferences, integrations, psychProfile, coach } = updates
    
    // Start transaction to ensure all updates succeed or fail together
    const result = await prisma.$transaction(async (tx) => {
      // Handle standard profile updates (name, email, bio, etc.)
      const userUpdates: any = { ...updates }
      
      // Remove fields that require special handling
      delete userUpdates.preferences
      delete userUpdates.integrations
      delete userUpdates.psychProfile
      delete userUpdates.coach
      
      // Update user with standard fields and onboarding preferences/integrations
      const user = await tx.user.update({
        where: { id: userId },
        data: {
          ...userUpdates,
          ...(preferences && { preferences: preferences }),
          ...(integrations && { integrations: integrations }),
        },
        include: {
          psychProfile: true
        }
      })
      
      // Handle psychProfile if present
      let profile = user.psychProfile
      if (psychProfile) {
        if (profile) {
          // Update existing profile
          profile = await tx.psychProfile.update({
            where: { userId },
            data: {
              productivityTime: psychProfile.productivityTime || profile.productivityTime,
              communicationPref: psychProfile.communicationPref || profile.communicationPref,
              taskApproach: psychProfile.taskApproach || profile.taskApproach,
              difficultyPreference: psychProfile.difficultyPreference || profile.difficultyPreference,
              reminderTiming: psychProfile.reminderTiming || profile.reminderTiming,
              coachId: psychProfile.coachId,
              updatedAt: new Date(),
            }
          })
        } else {
          // Create new profile
          profile = await tx.psychProfile.create({
            data: {
              userId,
              productivityTime: psychProfile.productivityTime || 'morning',
              communicationPref: psychProfile.communicationPref || 'moderate',
              taskApproach: psychProfile.taskApproach || 'varied',
              difficultyPreference: psychProfile.difficultyPreference || 'alternate',
              reminderTiming: psychProfile.reminderTiming || 'just_in_time',
            }
          })
        }
      }
      
      // Handle coach selection
      if (coach && profile) {
        profile = await tx.psychProfile.update({
          where: { userId },
          data: {
            coachId: coach,
            selectedCoach: coach,
            updatedAt: new Date()
          }
        })
      } else if (coach) {
        // Create profile with coach if it doesn't exist
        profile = await tx.psychProfile.create({
          data: {
            userId,
            coachId: coach,
            selectedCoach: coach,
            productivityTime: 'morning',
            communicationPref: 'moderate',
            taskApproach: 'varied',
            difficultyPreference: 'alternate',
            reminderTiming: 'just_in_time',
          }
        })
      }
      
      return { user, profile }
    })
    
    return NextResponse.json({
      id: result.user.id,
      name: result.user.name,
      email: result.user.email,
      bio: result.user.bio || '',
      principles: result.user.principles,
      inspirations: result.user.inspirations,
      psychProfile: result.profile,
    })
  } catch (error) {
    console.error('Failed to update profile:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
})

// POST /api/profile/principles
export const POST = withAuth(async (req: AuthenticatedApiRequest) => {
  try {
    const userId = req.user.id
    const { principle } = await req.json()
    
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        principles: [...user.principles, principle],
      },
    })

    return NextResponse.json({
      principles: updatedUser.principles,
    })
  } catch (error) {
    console.error('Failed to add principle:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json({ error: 'Failed to add principle' }, { status: 500 })
  }
})

// DELETE /api/profile/principles
export const DELETE = withAuth(async (req: AuthenticatedApiRequest) => {
  try {
    const userId = req.user.id
    const { index } = await req.json()
    
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const updatedPrinciples = user.principles.filter((_, i) => i !== index)
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        principles: updatedPrinciples,
      },
    })

    return NextResponse.json({
      principles: updatedUser.principles,
    })
  } catch (error) {
    console.error('Failed to remove principle:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json({ error: 'Failed to remove principle' }, { status: 500 })
  }
}) 