import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { JWT } from '@/lib/jwt'
import { z } from 'zod'
import crypto from 'crypto'

// Validation schema for registration
const registerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
})

// Hash password using crypto
function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex')
  return `${salt}:${hash}`
}

// POST /api/auth/register - Create a new user account
export async function POST(request: Request) {
  try {
    // Parse request body
    const body = await request.json()
    
    // Validate input
    const { name, email, password } = registerSchema.parse(body)
    
    // Check if user with this email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })
    
    if (existingUser) {
      return NextResponse.json({ 
        success: false,
        message: 'A user with this email already exists'
      }, { status: 400 })
    }
    
    // Hash the password
    const hashedPassword = hashPassword(password)
    
    // Create new user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        hashedPassword,
        principles: [],
        inspirations: [],
        settings: {
          create: {
            theme: 'system',
            notifications: true,
            emailNotifications: true,
            timezone: 'UTC',
            language: 'en'
          }
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true
      }
    })
    
    // Generate JWT
    const token = await JWT.sign({ userId: user.id })
    
    // Set token cookie
    const cookieStore = await cookies()
    cookieStore.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 1 week
    })

    await prisma.log.create({
      data: {
        type: 'user_register',
        userId: user.id,
        author: 'User',
      }
    });
    
    // Return user data
    return NextResponse.json({
      success: true,
      message: 'User registered successfully',
      user
    })
  } catch (error) {
    console.error('Registration error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        success: false,
        message: 'Invalid input',
        errors: error.errors
      }, { status: 400 })
    }
    
    return NextResponse.json({ 
      success: false,
      message: 'Registration failed'
    }, { status: 500 })
  }
}
