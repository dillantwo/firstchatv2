import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;
  
  // Allow LTI authentication routes
  if (pathname.startsWith('/api/lti/')) {
    return NextResponse.next();
  }
  
  // Allow admin routes without LTI authentication
  if (pathname.startsWith('/api/admin/') || pathname.startsWith('/admin')) {
    return NextResponse.next();
  }
  
  // Allow public assets and Next.js internals
  if (pathname.startsWith('/_next/') || 
      pathname.startsWith('/favicon.ico') ||
      pathname.includes('.')) {
    return NextResponse.next();
  }
  
  // For API routes (except LTI), check authentication
  if (pathname.startsWith('/api/')) {
    console.log('[Middleware] Checking authentication for API route:', pathname);
    const token = request.cookies.get('lti_session')?.value;
    
    console.log('[Middleware] LTI session token found:', !!token);
    if (token) {
      console.log('[Middleware] Token length:', token.length);
    }
    
    if (!token) {
      console.log('[Middleware] No token found, returning 401');
      return NextResponse.json(
        { error: 'Unauthorized - LTI session required' },
        { status: 401 }
      );
    }
    
    // Instead of verifying JWT in middleware, just check if token exists
    // Let the API routes handle JWT verification with proper Node.js runtime
    console.log('[Middleware] Token found, passing request to API route for verification');
    return NextResponse.next();
  }
  
  // For the main app, just pass through - auth guard will handle it
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};