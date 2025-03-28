import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Public routes that don't require authentication
const publicRoutes = ['/login', '/signup', '/api'];

export function middleware(request: NextRequest) {
  // Get the pathname from the URL
  const { pathname } = request.nextUrl
  
  // Check if the path is a public route or starts with a public route
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );
  
  // Note: In a real application, this would check for session tokens, JWT tokens, etc.
  // For our simplified approach, we're not using any server authentication
  // since localStorage isn't accessible in middleware
  
  // For demo purposes only: Skip authentication in middleware
  // The real authentication will happen client-side
  if (!isPublicRoute) {
    return NextResponse.next();
  }
  
  return NextResponse.next();
}

// Apply this middleware to all routes except public assets
export const config = {
  matcher: [
    // Match all routes except for static assets, api routes, etc
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}; 