import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verify } from 'jsonwebtoken'
import { JWTPayload } from '@/types/auth'
import { JWT_SECRET } from '@/config'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    // Get cookies from headers
    const requestHeaders = new Headers(request.headers)
    const cookieString = requestHeaders.get('cookie')
    
    if (!cookieString) {
      return NextResponse.json({ isValid: false }, { status: 401 })
    }

    // Parse cookies
    const cookiesList = cookieString.split(';')
    const tokenCookie = cookiesList.find(cookie => cookie.trim().startsWith('token='))
    const token = tokenCookie ? tokenCookie.split('=')[1].trim() : null
    
    if (!token) {
      return NextResponse.json({ isValid: false }, { status: 401 })
    }

    // Verify the token
    const payload = verify(token, JWT_SECRET) as JWTPayload
    
    return NextResponse.json({ isValid: true, payload })
  } catch (error) {
    console.error('Token verification error:', error)
    return NextResponse.json({ isValid: false }, { status: 401 })
  }
}
