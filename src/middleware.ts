import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Extend the JWT type to include user_metadata
interface ExtendedToken {
  name?: string;
  email?: string;
  picture?: string;
  sub?: string;
  user_metadata?: {
    onboarding_completed?: boolean;
    name?: string;
    dev_experience?: string;
  };
  iat: number;
  exp: number;
  jti: string;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for API routes and public assets
  if (
    pathname.startsWith('/api') || 
    pathname.startsWith('/_next') || 
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }
  
  // Check if user is authenticated
  const token = await getToken({ req: request }) as ExtendedToken | null;
  
  // Public routes that don't require authentication
  const publicRoutes = ['/auth/signin', '/auth/error', '/'];
  
  // If not authenticated and trying to access protected route, redirect to signin
  if (!token && !publicRoutes.includes(pathname)) {
    const url = new URL('/auth/signin', request.url);
    url.searchParams.set('callbackUrl', encodeURI(request.url));
    return NextResponse.redirect(url);
  }
  
  // If authenticated but trying to access auth routes, redirect to dashboard
  if (token && pathname.startsWith('/auth')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  // If authenticated and accessing dashboard but hasn't completed onboarding,
  // redirect to onboarding (except if already on onboarding page)
  if (
    token && 
    pathname.startsWith('/dashboard') && 
    token.user_metadata?.onboarding_completed !== true &&
    pathname !== '/onboarding'
  ) {
    return NextResponse.redirect(new URL('/onboarding', request.url));
  }
  
  // If authenticated and accessing onboarding but has already completed it,
  // redirect to dashboard
  if (
    token && 
    pathname === '/onboarding' && 
    token.user_metadata?.onboarding_completed === true
  ) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
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