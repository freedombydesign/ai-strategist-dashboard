import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const pathname = request.nextUrl.pathname

  // Handle suite subdomain
  if (hostname.includes('suite.scalewithruth.com')) {
    // If already on the freedom-suite path, continue
    if (pathname.startsWith('/freedom-suite')) {
      return NextResponse.next()
    }
    
    // If on root path, redirect to freedom-suite
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/freedom-suite', request.url))
    }
    
    // For any other path, try to serve it normally
    return NextResponse.next()
  }

  // Handle ai subdomain  
  if (hostname.includes('ai.scalewithruth.com')) {
    // If already on the executive-intelligence path, continue
    if (pathname.startsWith('/executive-intelligence')) {
      return NextResponse.next()
    }
    
    // If on root path, redirect to executive-intelligence
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/executive-intelligence', request.url))
    }
    
    // For any other path, try to serve it normally
    return NextResponse.next()
  }

  // For main domain or other cases, continue normally
  return NextResponse.next()
}

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
}