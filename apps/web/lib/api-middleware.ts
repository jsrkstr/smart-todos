import { NextResponse } from 'next/server'
import { JWT } from '@/lib/jwt'

export interface AuthenticatedApiRequest extends Request {
  user: {
    id: string
  }
}

/**
 * Middleware for API routes to handle authentication
 * @param handler The API route handler function
 * @returns A wrapped handler that includes authentication
 */
export function withAuth(handler: (req: AuthenticatedApiRequest) => Promise<Response>) {
  return async (req: Request) => {
    // Get token from cookies in the request headers
    const cookieHeader = req.headers.get('cookie') || ''
    const cookies = Object.fromEntries(
      cookieHeader.split('; ').map(c => {
        const [name, ...value] = c.split('=')
        return [name, value.join('=')]
      })
    )
    const token = cookies.token
    
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    
    try {
      // Verify token
      const payload = await JWT.verify<{ userId: string }>(token)
      
      if (!payload || !payload.userId) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
      }
      
      // Extend request with authenticated user
      const authReq = req as AuthenticatedApiRequest
      authReq.user = {
        id: payload.userId
      }
      
      // Call the original handler with the authenticated request
      return handler(authReq)
    } catch (error) {
      console.error('Authentication error:', error instanceof Error ? error.message : 'Unknown error')
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 })
    }
  }
} 