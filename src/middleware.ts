import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Define public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/auth/signin',
  '/auth/signin/',
  '/auth/signup',
  '/auth/signup/',
  '/auth/error',
  '/auth/error/',
  '/',
  '/landing'
];

// Define static asset paths that should be excluded from middleware
const STATIC_PATHS = [
  '/api',
  '/_next',
  '/favicon.ico',
];

/**
 * Middleware function to handle authentication and routing
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for static assets and API routes
  if (STATIC_PATHS.some(path => pathname.startsWith(path)) || pathname.includes('.')) {
    return NextResponse.next();
  }
  
  // Check for bypass cookie (development only)
  const bypassMiddleware = request.cookies.get('bypass_middleware')?.value === 'true';
  if (bypassMiddleware && process.env.NODE_ENV === 'development') {
    console.log('Middleware - Development bypass detected, allowing access');
    return NextResponse.next();
  }
  
  // Get authentication token
  const token = await getToken({ req: request });
  const isAuthenticated = !!token;
  
  console.log(`Middleware - Path: ${pathname}, Authenticated: ${isAuthenticated}`);
  
  // Check if the path is a public route
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
  
  // Always allow access to public routes
  if (isPublicRoute) {
    console.log('Middleware - Public route access');
    return NextResponse.next();
  }
  
  // Handle unauthenticated users trying to access protected routes
  if (!isAuthenticated) {
    console.log('Middleware - Redirecting unauthenticated user to signin');
    const signinUrl = new URL('/auth/signin', request.url);
    signinUrl.searchParams.set('callbackUrl', encodeURI(request.url));
    return NextResponse.redirect(signinUrl);
  }
  
  // Handle authenticated users trying to access auth routes
  if (isAuthenticated && pathname.startsWith('/auth')) {
    console.log('Middleware - Redirecting authenticated user from auth to dashboard');
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  // Default: allow access
  return NextResponse.next();
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}; 