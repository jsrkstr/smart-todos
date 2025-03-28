import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { JWTPayload } from '@/types/auth'
import { JWT } from '@/lib/jwt'

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

export async function middleware(request: NextRequest) {
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
  const token = request.cookies.get('token')?.value;
  let isValidToken = false;
  let payload: JWTPayload | null = null;
  
  // Verify token validity using JWT utility
  if (token) {
    try {
      payload = await JWT.verify<JWTPayload>(token);
      isValidToken = !!payload;
    } catch (error) {
      console.error('Token verification failed:', error);
    }
  }
  
  // Special case for login page - redirect to dashboard if already logged in
  if (pathname === loginRoute || pathname.startsWith(`${loginRoute}/`)) {
    if (isValidToken) {
      // User is already logged in - redirect to dashboard
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    // Not logged in, allow access to login page
    return NextResponse.next();
  }
  
  // Special case for root path - redirect based on auth status
  if (pathname === '/') {
    if (isValidToken) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    } else {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }
  
  // For protected routes, check token validity
  if (!isValidToken) {
    // User is not authenticated - redirect to login
    return NextResponse.redirect(new URL(`${loginRoute}?redirect=${encodeURIComponent(pathname)}`, request.url));
  }
  
  // If token exists and is valid, allow the request
  return NextResponse.next();
}

// Apply this middleware to all routes except public assets
export const config = {
  matcher: [
    // Match all routes except for static assets, api routes, etc
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};