import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-middleware'

export const GET = withAuth(async (req) => {
  // Redirect to Google OAuth with calendar scopes
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const redirectUrl = `${baseUrl}/api/auth/google?calendar=true`

  return NextResponse.redirect(redirectUrl)
})
