import { NextResponse } from 'next/server'
import { OAuth2Client } from 'google-auth-library'
import { prisma } from '@/lib/db'
import { cookies } from 'next/headers'
import { JWT } from '@/lib/jwt'

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
)

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams
  const code = searchParams.get('code')

  if (!code) {
    // Generate OAuth URL and redirect to Google
    const url = client.generateAuthUrl({
      access_type: 'offline',
      scope: ['profile', 'email']
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

    // Generate JWT
    const jwt = await JWT.sign({ userId: user.id })
    
    // Set cookie
    cookies().set('token', jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 1 week
    })

    // Redirect to home or onboarding
    if (user.principles.length === 0) {
      return NextResponse.redirect('/onboarding')
    }
    return NextResponse.redirect('/')
  } catch (error) {
    console.error('Google OAuth error:', error)
    return NextResponse.redirect('/login?error=oauth_failed')
  }
} 