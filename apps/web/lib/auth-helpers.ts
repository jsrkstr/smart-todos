import { cookies } from 'next/headers'
import { JWT } from './jwt'

export interface AuthUser {
  userId: string
}

/**
 * Get authenticated user from request
 * Checks both cookies and Authorization header
 */
export async function getAuthUser(request: Request): Promise<AuthUser | null> {
  try {
    // Try to get token from cookies first
    let token = (await cookies()).get('token')?.value

    // If no cookie, check Authorization header
    if (!token) {
      const authHeader = request.headers.get('authorization')
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7)
      }
    }

    if (!token) {
      return null
    }

    // Verify token
    const payload = await JWT.verify<AuthUser>(token)

    if (!payload || !payload.userId) {
      return null
    }

    return payload
  } catch (error) {
    console.error('Auth verification error:', error)
    return null
  }
}

/**
 * Require authentication - returns user or throws 401
 */
export async function requireAuth(request: Request): Promise<AuthUser> {
  const user = await getAuthUser(request)

  if (!user) {
    throw new Error('Unauthorized')
  }

  return user
}