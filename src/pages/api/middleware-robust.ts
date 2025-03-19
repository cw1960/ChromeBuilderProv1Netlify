import { NextRequest, NextResponse } from 'next/server';

export const config = {
  matcher: [
    '/api/projects/get-project',
    '/api/conversations/:path*'
  ],
};

export function middleware(request: NextRequest) {
  const url = new URL(request.url);
  const path = url.pathname;
  
  console.log(`ROBUST MIDDLEWARE TRIGGERED: ${path}`);
  
  // Redirect get-project requests to our robust endpoint
  if (path === '/api/projects/get-project') {
    const projectId = url.searchParams.get('projectId');
    
    if (projectId) {
      const robustUrl = new URL('/api/projects/robust-get-project', request.url);
      robustUrl.searchParams.set('projectId', projectId);
      
      console.log(`Middleware: Redirecting get-project request to robust endpoint: ${robustUrl.pathname} for project ${projectId}`);
      
      return NextResponse.rewrite(robustUrl);
    }
  }
  
  // Redirect conversation requests to our robust endpoints
  if (path.startsWith('/api/conversations')) {
    // Get conversation by ID
    if (path.match(/^\/api\/conversations\/[a-zA-Z0-9-]+\/?$/)) {
      const conversationId = path.split('/').pop();
      
      if (conversationId) {
        const robustUrl = new URL('/api/conversations/robust-get', request.url);
        robustUrl.searchParams.set('conversationId', conversationId);
        
        console.log(`Middleware: Redirecting get-conversation request to robust endpoint: ${robustUrl.pathname} for conversation ${conversationId}`);
        
        return NextResponse.rewrite(robustUrl);
      }
    }
    
    // Create conversation
    if (path === '/api/conversations/create' || path === '/api/conversations/create/') {
      const robustUrl = new URL('/api/conversations/robust-create', request.url);
      
      console.log(`Middleware: Redirecting create-conversation request to robust endpoint: ${robustUrl.pathname}`);
      
      return NextResponse.rewrite(robustUrl);
    }
    
    // Add message to conversation
    if (path === '/api/conversations/add-message' || path === '/api/conversations/add-message/') {
      const robustUrl = new URL('/api/conversations/robust-add-message', request.url);
      
      console.log(`Middleware: Redirecting add-message request to robust endpoint: ${robustUrl.pathname}`);
      
      return NextResponse.rewrite(robustUrl);
    }
    
    // List conversations
    if (path === '/api/conversations' || path === '/api/conversations/') {
      const projectId = url.searchParams.get('projectId');
      
      if (projectId) {
        const robustUrl = new URL('/api/conversations/robust-list', request.url);
        robustUrl.searchParams.set('projectId', projectId);
        
        console.log(`Middleware: Redirecting list-conversations request to robust endpoint: ${robustUrl.pathname} for project ${projectId}`);
        
        return NextResponse.rewrite(robustUrl);
      }
    }
  }
  
  // For other requests, continue normally
  console.log(`Middleware: No redirection for path: ${path}`);
  return NextResponse.next();
} 