import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma';
import { AuthenticatedApiRequest, withAuth } from '@/lib/api-middleware';

// POST /api/auth/logout - Log out user by clearing cookies
export const POST = withAuth(async (req: AuthenticatedApiRequest) => {
  try {
    // Clear token cookie
    const cookieStore = cookies()
    cookieStore.delete('token')

    await prisma.log.create({
      data: {
        type: 'user_logout',
        userId: req.user.id,
        author: 'User',
      }
    });
    
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
});
