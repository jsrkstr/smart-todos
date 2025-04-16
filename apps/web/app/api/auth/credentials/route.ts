import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { JWT } from '@/lib/jwt'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import crypto from 'crypto'

// Validation schema for login
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
})

// Verify password hash
function verifyPassword(storedPassword: string, suppliedPassword: string): boolean {
  const [salt, storedHash] = storedPassword.split(':')
  const hash = crypto.pbkdf2Sync(suppliedPassword, salt, 1000, 64, 'sha512').toString('hex')
  return storedHash === hash
}

// POST /api/auth/credentials - Authenticate with email/password
export async function POST(request: Request) {
  try {
    // Parse request body
    const body = await request.json()
   
    // Validate input
    const { email, password } = loginSchema.parse(body)
    
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        hashedPassword: true
      }
    })
    
    // If user not found or password doesn't match
    if (!user || !user.hashedPassword) {
      return NextResponse.json({ 
        success: false,
        message: 'Invalid email or password'
      }, { status: 401 })
    }

    // Verify password
    const passwordMatch = verifyPassword(user.hashedPassword, password)
    if (!passwordMatch) {
      return NextResponse.json({ 
        success: false,
        message: 'Invalid email or password'
      }, { status: 401 })
    }
    
    await prisma.log.create({
      data: {
        type: 'user_login',
        userId: user.id,
        author: 'User',
      }
    });
    
    // Generate JWT
    const token = await JWT.sign({ userId: user.id })
    
    // Set token cookie
    const cookieStore = await cookies()
    cookieStore.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 1 week
    })
    
    // Remove hashedPassword from response
    const { hashedPassword, ...userWithoutPassword } = user
    
    // Return user data
    return NextResponse.json({
      success: true,
      message: 'Authentication successful',
      token: token,
      user: userWithoutPassword,
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
