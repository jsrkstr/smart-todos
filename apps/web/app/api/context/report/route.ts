import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AuthenticatedApiRequest, withAuth } from '@/lib/api-middleware'

/**
 * POST /api/context/report
 *
 * Mobile app reports real-time physical context (activity, location, device state)
 * This enables context-aware AI secretary features
 */
export const POST = withAuth(async (req: AuthenticatedApiRequest) => {
  try {
    const body = await req.json()

    // Validate required fields
    if (!body.activity || !body.locationType || body.screenOn === undefined ||
        body.battery === undefined || body.doNotDisturb === undefined ||
        body.confidence === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate activity type
    const validActivities = ['stationary', 'walking', 'running', 'driving', 'unknown']
    if (!validActivities.includes(body.activity)) {
      return NextResponse.json(
        { error: 'Invalid activity type' },
        { status: 400 }
      )
    }

    // Validate location type
    const validLocationTypes = ['home', 'work', 'commuting', 'shopping', 'gym', 'restaurant', 'unknown']
    if (!validLocationTypes.includes(body.locationType)) {
      return NextResponse.json(
        { error: 'Invalid location type' },
        { status: 400 }
      )
    }

    // Store context in database
    const userContext = await prisma.userContext.create({
      data: {
        userId: req.user.id,
        activity: body.activity,
        confidence: body.confidence,
        locationType: body.locationType,
        savedLocationId: body.savedLocationId || null,
        screenOn: body.screenOn,
        battery: body.battery,
        doNotDisturb: body.doNotDisturb,
      },
    })

    // Log context report
    await prisma.log.create({
      data: {
        type: 'context_reported',
        userId: req.user.id,
        author: 'System',
        metadata: {
          activity: body.activity,
          locationType: body.locationType,
        },
      },
    })

    // TODO: Evaluate if proactive outreach is warranted based on context
    // For now, we'll just store the context and let the scheduler pick it up
    const shouldOutreach = false

    return NextResponse.json({
      success: true,
      contextId: userContext.id,
      shouldOutreach,
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Failed to report context:', errorMessage)
    return NextResponse.json(
      { error: 'Failed to report context' },
      { status: 500 }
    )
  }
})
