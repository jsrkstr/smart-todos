import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { JWT } from '@/lib/jwt'
import { prisma } from '@/lib/db'

// GET /api/auth/session - Get current session information
export async function GET() {
  try {
    // Get token from cookies
    const token = (await cookies()).get('token')?.value
    
    if (!token) {
      return NextResponse.json({ 
        isAuthenticated: false,
        user: null
      })
    }
    
    // Verify token
    const payload = await JWT.verify<{ userId: string }>(token)
    
    if (!payload || !payload.userId) {
      return NextResponse.json({ 
        isAuthenticated: false,
        user: null
      })
    }
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true
      }
    })
    
    if (!user) {
      return NextResponse.json({ 
        isAuthenticated: false,
        user: null
      })
    }
    
    // Return authenticated user data
    return NextResponse.json({
      isAuthenticated: true,
      user
    })
  } catch (error) {
    console.error('Session check error:', error)
    return NextResponse.json({ 
      isAuthenticated: false,
      user: null
    })
  }
}
