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
  try {
    console.log('Middleware executing for:', request.nextUrl.pathname);
    
    // Get the pathname from the URL
    const { pathname } = request.nextUrl
    
    // Skip middleware for API routes except auth-related ones
    if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/')) {
      console.log('Skipping middleware for API route:', pathname);
      return NextResponse.next();
    }
    
    // Check if the path is a public route or starts with a public route
    const isPublicRoute = publicRoutes.some(route => 
      pathname === route || pathname.startsWith(`${route}/`)
    );
    
    // Skip auth check for public routes
    if (isPublicRoute) {
      console.log('Skipping middleware for public route:', pathname);
      return NextResponse.next();
    }
    
    // Check for authentication token in cookies
    const token = request.cookies.get('token')?.value;
    let isValidToken = false;
    let payload: JWTPayload | null = null;
    
    console.log('Token present:', !!token);
    
    // Verify token validity using JWT utility
    if (token) {
      try {
        payload = await JWT.verify<JWTPayload>(token);
        isValidToken = !!payload;
        console.log('Token verification successful');
      } catch (error) {
        console.error('Token verification failed:', error);
        isValidToken = false;
      }
    }
    
    // Special case for login page - redirect to dashboard if already logged in
    if (pathname === loginRoute || pathname.startsWith(`${loginRoute}/`)) {
      if (isValidToken) {
        console.log('Redirecting authenticated user from login to dashboard');
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
      // Not logged in, allow access to login page
      return NextResponse.next();
    }
    
    // Special case for root path - redirect based on auth status
    if (pathname === '/') {
      if (isValidToken) {
        console.log('Redirecting authenticated user from root to dashboard');
        return NextResponse.redirect(new URL('/dashboard', request.url));
      } else {
        console.log('Redirecting unauthenticated user from root to login');
        return NextResponse.redirect(new URL('/login', request.url));
      }
    }
    
    // For protected routes, check token validity
    if (!isValidToken) {
      console.log('Redirecting unauthenticated user to login');
      return NextResponse.redirect(new URL(`${loginRoute}?redirect=${encodeURIComponent(pathname)}`, request.url));
    }
    
    // If token exists and is valid, allow the request
    return NextResponse.next();
  } catch (error) {
    console.error('Middleware error:', error);
    // On error, redirect to login for safety
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

// Apply this middleware to all routes except public assets
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};