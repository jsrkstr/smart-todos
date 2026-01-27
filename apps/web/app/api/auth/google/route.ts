import { NextResponse } from 'next/server'
import { OAuth2Client } from 'google-auth-library'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { JWT } from '@/lib/jwt'

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
)

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const searchParams = requestUrl.searchParams
  const code = searchParams.get('code')
  const enableCalendar = searchParams.get('calendar') === 'true'

  // Get base URL for redirects
  const baseUrl = `${requestUrl.protocol}//${requestUrl.host}`

  if (!code) {
    // Generate OAuth URL and redirect to Google
    const scopes = ['profile', 'email']

    // Add calendar scopes if calendar integration is requested
    if (enableCalendar) {
      scopes.push(
        'https://www.googleapis.com/auth/calendar.readonly',
        'https://www.googleapis.com/auth/calendar.events'
      )
    }

    const url = client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent' // Force consent to get refresh token
    })
    return NextResponse.redirect(url)
  }

  try {
    // Exchange code for tokens
    const { tokens } = await client.getToken(code)
    client.setCredentials(tokens)

    // Get user info
    const userinfo = await client.request({
      url: 'https://www.googleapis.com/oauth2/v2/userinfo'
    })

    // Find or create user
    const user = await prisma.user.upsert({
      where: { email: userinfo.data.email },
      update: {},
      create: {
        email: userinfo.data.email,
        name: userinfo.data.name,
        principles: [],
        inspirations: []
      }
    })

    // Check if calendar scopes were granted
    const hasCalendarScope = tokens.scope?.includes('calendar')

    // Create or update calendar connection if calendar scopes were granted
    if (hasCalendarScope && tokens.access_token) {
      const tokenExpiry = tokens.expiry_date
        ? new Date(tokens.expiry_date)
        : new Date(Date.now() + 3600 * 1000) // Default 1 hour

      await prisma.calendarConnection.upsert({
        where: {
          userId_provider_calendarId: {
            userId: user.id,
            provider: 'google',
            calendarId: 'primary'
          }
        },
        update: {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token || undefined,
          tokenExpiry,
          isActive: true
        },
        create: {
          userId: user.id,
          provider: 'google',
          name: 'Google Calendar',
          calendarId: 'primary',
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token || undefined,
          tokenExpiry,
          isActive: true,
          syncFrequency: 'hourly'
        }
      })
    }

    // Generate JWT
    const jwt = await JWT.sign({ userId: user.id })

    // Set cookie (await for Next.js 15+)
    const cookieStore = await cookies()
    cookieStore.set('token', jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 1 week
    })

    // Redirect to home or onboarding (use absolute URLs)
    if (user.principles.length === 0) {
      return NextResponse.redirect(new URL('/onboarding', baseUrl))
    }
    return NextResponse.redirect(new URL('/', baseUrl))
  } catch (error: any) {
    console.error('Google OAuth error:', error)

    // Handle specific error cases (use absolute URLs)
    if (error.message?.includes('invalid_grant')) {
      return NextResponse.redirect(new URL('/login?error=invalid_grant', baseUrl))
    }

    if (error.message?.includes('access_denied')) {
      return NextResponse.redirect(new URL('/login?error=access_denied', baseUrl))
    }

    if (error.code === 'P2002') {
      // Prisma unique constraint violation
      console.error('Database constraint violation:', error)
      return NextResponse.redirect(new URL('/login?error=db_error', baseUrl))
    }

    return NextResponse.redirect(new URL('/login?error=oauth_failed', baseUrl))
  }
} 