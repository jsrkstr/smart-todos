import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { JWT } from '@/lib/jwt'
import { prisma } from '@/lib/db'
import { z } from 'zod'

// Validation schema for login
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

// POST /api/auth/credentials - Authenticate with email/password
export async function POST(request: Request) {
  try {
    // Parse request body
    const body = await request.json()
    
    // Validate input
    const { email, password } = loginSchema.parse(body)
    
    // Find user by email (in a real app, you would check the password hash)
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      }
    })
    
    // If user not found or password doesn't match (mock implementation for demo)
    if (!user) {
      return NextResponse.json({ 
        success: false,
        message: 'Invalid email or password'
      }, { status: 401 })
    }

    await prisma.log.create({
      data: {
        type: 'user_login',
        userId: user?.id,
        author: 'User',
      }
    });
    
    // Generate JWT
    const token = await JWT.sign({ userId: user.id })
    
    // Set token cookie
    cookies().set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 1 week
    })
    
    // Return user data
    return NextResponse.json({
      success: true,
      message: 'Authentication successful',
      user,
    })
  } catch (error) {
    console.error('Login error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        success: false,
        message: 'Invalid input',
        errors: error.errors,
      }, { status: 400 })
    }
    
    return NextResponse.json({ 
      success: false,
      message: 'Authentication failed'
    }, { status: 500 })
  }
}
