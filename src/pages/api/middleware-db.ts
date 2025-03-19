import { NextRequest, NextResponse } from 'next/server';

export const config = {
  matcher: ['/api/projects/get-project*'],
};

export function middleware(request: NextRequest) {
  // Redirect get-project requests to our edge function
  const url = new URL(request.url);
  const projectId = url.searchParams.get('projectId');
  
  if (projectId) {
    // Create a new URL for the edge function
    const edgeUrl = new URL('/api/projects/edge-get-project', request.url);
    edgeUrl.searchParams.set('projectId', projectId);
    
    // Redirect to the edge function
    return NextResponse.rewrite(edgeUrl);
  }
  
  // For other requests, continue normally
  return NextResponse.next();
} 