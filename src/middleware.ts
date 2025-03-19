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
  '/landing',
  '/error'  // Add error page to public routes
];

// Define static asset paths that should be excluded from middleware
const STATIC_PATHS = [
  '/_next',
  '/favicon.ico',
];

/**
 * Middleware function to handle authentication and routing
 */
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  console.log(`MIDDLEWARE TRIGGERED: ${pathname}`);
  
  // Skip middleware for static assets and API routes (except the ones we specifically want to handle)
  if ((STATIC_PATHS.some(path => pathname.startsWith(path)) || pathname.includes('.')) 
      && !pathname.match(/^\/api\/(projects\/get-project|conversations)/)
  ) {
    return NextResponse.next();
  }
  
  // Check for bypass cookie (development only)
  const bypassMiddleware = request.cookies.get('bypass_middleware')?.value === 'true';
  if (bypassMiddleware && process.env.NODE_ENV === 'development') {
    console.log('Middleware - Development bypass detected, allowing access');
    return NextResponse.next();
  }
  
  // API route handling for project and conversation endpoints
  if (pathname.startsWith('/api/')) {
    // Redirect get-project requests to our robust endpoint
    if (pathname === '/api/projects/get-project') {
      const projectId = request.nextUrl.searchParams.get('projectId');
      
      if (projectId) {
        const robustUrl = new URL('/api/projects/robust-get-project', request.url);
        robustUrl.searchParams.set('projectId', projectId);
        
        console.log(`Middleware: Redirecting get-project request to robust endpoint: ${robustUrl.pathname} for project ${projectId}`);
        
        return NextResponse.rewrite(robustUrl);
      }
    }
    
    // Redirect conversation requests to our robust endpoints
    if (pathname.startsWith('/api/conversations')) {
      // Get conversation by ID
      if (pathname.match(/^\/api\/conversations\/[a-zA-Z0-9-]+\/?$/)) {
        const conversationId = pathname.split('/').pop();
        
        if (conversationId) {
          const robustUrl = new URL('/api/conversations/robust-get', request.url);
          robustUrl.searchParams.set('conversationId', conversationId);
          
          console.log(`Middleware: Redirecting get-conversation request to robust endpoint: ${robustUrl.pathname} for conversation ${conversationId}`);
          
          return NextResponse.rewrite(robustUrl);
        }
      }
      
      // Create conversation
      if (pathname === '/api/conversations/create' || pathname === '/api/conversations/create/') {
        const robustUrl = new URL('/api/conversations/robust-create', request.url);
        
        console.log(`Middleware: Redirecting create-conversation request to robust endpoint: ${robustUrl.pathname}`);
        
        return NextResponse.rewrite(robustUrl);
      }
      
      // Add message to conversation
      if (pathname === '/api/conversations/add-message' || pathname === '/api/conversations/add-message/') {
        const robustUrl = new URL('/api/conversations/robust-add-message', request.url);
        
        console.log(`Middleware: Redirecting add-message request to robust endpoint: ${robustUrl.pathname}`);
        
        return NextResponse.rewrite(robustUrl);
      }
      
      // List conversations
      if (pathname === '/api/conversations' || pathname === '/api/conversations/') {
        const projectId = request.nextUrl.searchParams.get('projectId');
        
        if (projectId) {
          const robustUrl = new URL('/api/conversations/robust-list', request.url);
          robustUrl.searchParams.set('projectId', projectId);
          
          console.log(`Middleware: Redirecting list-conversations request to robust endpoint: ${robustUrl.pathname} for project ${projectId}`);
          
          return NextResponse.rewrite(robustUrl);
        }
      }
    }
    
    // For other API routes, continue normally
    return NextResponse.next();
  }
  
  // Get authentication token
  const token = await getToken({ req: request });
  const isAuthenticated = !!token;
  
  console.log(`Middleware - Path: ${pathname}, Authenticated: ${isAuthenticated}`);
  
  // Check if the path is a public route
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname) || 
                        PUBLIC_ROUTES.some(route => pathname.startsWith(route + '/'));
  
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
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
    '/api/projects/get-project',
    '/api/conversations/:path*'
  ],
}; 