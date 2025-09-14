import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const referer = request.headers.get('referer') || ''
  
  console.log('Subdomain check:', { hostname, referer })
  
  // Check which subdomain and return appropriate redirect
  if (hostname.includes('suite.scalewithruth.com')) {
    return NextResponse.json({
      should_redirect: true,
      target: '/freedom-suite',
      hostname,
      message: 'Suite subdomain detected'
    })
  }
  
  if (hostname.includes('ai.scalewithruth.com')) {
    return NextResponse.json({
      should_redirect: true,
      target: '/executive-intelligence',
      hostname,
      message: 'AI subdomain detected'
    })
  }
  
  return NextResponse.json({
    should_redirect: false,
    hostname,
    message: 'Main domain or other'
  })
}