import { NextResponse } from 'next/server';
import { containsDangerousPattern, isUrlSafe, logSecurityEvent } from './middleware/securityValidation';

// Simple rate limiting (in production, use Redis or similar)
const rateLimitMap = new Map();

export function middleware(request) {
  const { pathname } = request.nextUrl;
  
  // === 1. SECURITY: Block malicious path patterns ===
  const dangerousPathPatterns = [
    /\.\.[\/\\]/,  // Path traversal
    /\/dev\/lrt/,   // The specific attack we saw
    /\/\/lrt/,       // Another variant
    /\/(etc|proc|sys|root)\//,  // System directories
    /<script/i,      // XSS in URL
  ];
  
  for (const pattern of dangerousPathPatterns) {
    if (pattern.test(pathname)) {
      logSecurityEvent({
        type: 'malicious_path',
        path: pathname,
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent')
      });
      return NextResponse.json(
        { error: 'Invalid request' },
        { status: 400 }
      );
    }
  }
  
  // === 2. RATE LIMITING: Prevent DOS attacks ===
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  const now = Date.now();
  const windowMs = 60000; // 1 minute
  const maxRequests = 100; // Max 100 requests per minute per IP
  
  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
  } else {
    const record = rateLimitMap.get(ip);
    if (now > record.resetTime) {
      // Reset the window
      rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    } else {
      record.count++;
      if (record.count > maxRequests) {
        logSecurityEvent({
          type: 'rate_limit_exceeded',
          ip,
          path: pathname,
          count: record.count
        });
        return NextResponse.json(
          { error: 'Too many requests. Please try again later.' },
          { status: 429 }
        );
      }
    }
  }
  
  // Clean up old entries (keep map size manageable)
  if (rateLimitMap.size > 10000) {
    rateLimitMap.forEach((value, key) => {
      if (now > value.resetTime) {
        rateLimitMap.delete(key);
      }
    });
  }
  
  // === 3. VALIDATE URL parameters ===
  const url = request.nextUrl;
  for (const [key, value] of url.searchParams.entries()) {
    const danger = containsDangerousPattern(value, `query_${key}`);
    if (danger) {
      logSecurityEvent({
        type: 'malicious_query_param',
        path: pathname,
        param: key,
        value: value.substring(0, 100),
        ip
      });
      return NextResponse.json(
        { error: 'Invalid request parameters' },
        { status: 400 }
      );
    }
  }
  
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
    const token = request.cookies.get('lti_session')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized - LTI session required' },
        { status: 401 }
      );
    }
    
    // Instead of verifying JWT in middleware, just check if token exists
    // Let the API routes handle JWT verification with proper Node.js runtime
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