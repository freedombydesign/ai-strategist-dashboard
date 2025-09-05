import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const pathname = request.nextUrl.pathname

  console.log(`[MIDDLEWARE] ${hostname} ${pathname}`)

  // Handle suite subdomain
  if (hostname.includes('suite.scalewithruth.com')) {
    // Allow all freedom-suite related paths and other pages
    if (pathname.startsWith('/freedom-suite') || 
        pathname.startsWith('/cash-flow-command') || 
        pathname.startsWith('/profit-pulse') ||
        pathname.startsWith('/business-metrics') ||
        pathname.startsWith('/api/') ||
        pathname.startsWith('/_next/')) {
      return NextResponse.next()
    }
    
    // Only redirect root path
    if (pathname === '/') {
      const url = request.nextUrl.clone()
      url.pathname = '/freedom-suite'
      console.log(`[MIDDLEWARE] Redirecting suite root to: ${url}`)
      return NextResponse.redirect(url)
    }
    
    // Allow other paths to continue normally
    return NextResponse.next()
  }

  // Handle ai subdomain
  if (hostname.includes('ai.scalewithruth.com')) {
    // Allow executive-intelligence paths and other necessary paths
    if (pathname.startsWith('/executive-intelligence') ||
        pathname.startsWith('/api/') ||
        pathname.startsWith('/_next/')) {
      return NextResponse.next()
    }
    
    // Only redirect root path
    if (pathname === '/') {
      const url = request.nextUrl.clone()
      url.pathname = '/executive-intelligence'
      console.log(`[MIDDLEWARE] Redirecting ai root to: ${url}`)
      return NextResponse.redirect(url)
    }
    
    // Allow other paths to continue normally
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