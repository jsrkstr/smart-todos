import { NextResponse } from 'next/server'
import { JWT } from '@/lib/jwt'

export interface AuthenticatedApiRequest extends Request {
  user: {
    id: string
  }
}

/**
 * Add CORS headers to response
 */
function addCorsHeaders(response: Response): Response {
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  return response
}

/**
 * Middleware for API routes to handle authentication
 * @param handler The API route handler function
 * @returns A wrapped handler that includes authentication
 */
export function withAuth(handler: (req: AuthenticatedApiRequest) => Promise<Response>) {
  return async (req: Request) => {
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      const response = new NextResponse(null, { status: 200 })
      return addCorsHeaders(response)
    }

    // Try to get token from cookies first
    const cookieHeader = req.headers.get('cookie') || ''
    const cookies = Object.fromEntries(
      cookieHeader.split('; ').map(c => {
        const [name, ...value] = c.split('=')
        return [name, value.join('=')]
      })
    )
    let token = cookies.token

    // If no cookie, check Authorization header
    if (!token) {
      const authHeader = req.headers.get('authorization')
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7)
      }
    }

    if (!token) {
      const response = NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
      return addCorsHeaders(response)
    }

    try {
      // Verify token
      const payload = await JWT.verify<{ userId: string }>(token)

      if (!payload || !payload.userId) {
        const response = NextResponse.json({ error: 'Invalid token' }, { status: 401 })
        return addCorsHeaders(response)
      }

      // Extend request with authenticated user
      const authReq = req as AuthenticatedApiRequest
      authReq.user = {
        id: payload.userId
      }

      // Call the original handler with the authenticated request
      const response = await handler(authReq)
      return addCorsHeaders(response)
    } catch (error) {
      console.error('Authentication error:', error instanceof Error ? error.message : 'Unknown error')
      const response = NextResponse.json({ error: 'Authentication failed' }, { status: 401 })
      return addCorsHeaders(response)
    }
  }
} 