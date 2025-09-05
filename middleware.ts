import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const pathname = request.nextUrl.pathname

  console.log(`[MIDDLEWARE] ${hostname} ${pathname}`)

  // Handle suite subdomain - force redirect
  if (hostname.includes('suite.scalewithruth.com')) {
    // If already on the freedom-suite path, continue
    if (pathname.startsWith('/freedom-suite')) {
      return NextResponse.next()
    }
    
    // Always redirect to freedom-suite for this subdomain
    const url = request.nextUrl.clone()
    url.pathname = '/freedom-suite'
    console.log(`[MIDDLEWARE] Redirecting suite to: ${url}`)
    return NextResponse.redirect(url)
  }

  // Handle ai subdomain - force redirect
  if (hostname.includes('ai.scalewithruth.com')) {
    // If already on the executive-intelligence path, continue
    if (pathname.startsWith('/executive-intelligence')) {
      return NextResponse.next()
    }
    
    // Always redirect to executive-intelligence for this subdomain
    const url = request.nextUrl.clone()
    url.pathname = '/executive-intelligence'
    console.log(`[MIDDLEWARE] Redirecting ai to: ${url}`)
    return NextResponse.redirect(url)
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