import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Public routes that don't require authentication
const publicRoutes = [
  '/signup', 
  '/api/auth/google',
  '/api/auth/telegram',
  '/api/auth/credentials',
  '/api/auth/session',
  '/api/auth/register',
  '/api/auth/logout',
  '/_next',
  '/favicon.ico'
];

// Login route needs special handling
const loginRoute = '/login';

export function middleware(request: NextRequest) {
  // Get the pathname from the URL
  const { pathname } = request.nextUrl
  
  // Skip middleware for API routes except auth-related ones
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/')) {
    return NextResponse.next();
  }
  
  // Check if the path is a public route or starts with a public route
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );
  
  // Skip auth check for public routes
  if (isPublicRoute) {
    return NextResponse.next();
  }
  
  // Check for authentication token in cookies
  const token = request.cookies.get('token');
  
  // Special case for login page - redirect to dashboard if already logged in
  if (pathname === loginRoute || pathname.startsWith(`${loginRoute}/`)) {
    if (token) {
      // User is already logged in - redirect to dashboard
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    // Not logged in, allow access to login page
    return NextResponse.next();
  }
  
  // For other protected routes, if there's no token, redirect to login
  if (!token) {
    const url = new URL('/login', request.url);
    // Save the original URL so we can redirect back after login
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }
  
  // If token exists, allow the request
  return NextResponse.next();
}

// Apply this middleware to all routes except public assets
export const config = {
  matcher: [
    // Match all routes except for static assets, api routes, etc
    '/((?!_next/static|_next/image|_next/scripts|favicon.ico).*)',
  ],
}; 