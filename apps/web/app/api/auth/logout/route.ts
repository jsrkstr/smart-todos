import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// POST /api/auth/logout - Log out user by clearing cookies
export async function POST() {
  try {
    // Clear token cookie
    const cookieStore = cookies()
    cookieStore.delete('token')
    
    return NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json({ 
      success: false,
      message: 'Failed to log out'
    }, { status: 500 })
  }
}
