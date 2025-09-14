import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')

  if (!code) {
    // Trello doesn't use OAuth 2.0 yet, redirect with coming soon message
    console.log('[Trello OAuth] Trello OAuth 2.0 not available yet')
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/export-manager?error=trello_coming_soon`)
  }

  try {
    // This is a placeholder for when Trello supports OAuth 2.0
    console.log('[Trello OAuth] OAuth 2.0 integration coming soon')
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/export-manager?error=trello_coming_soon`)

  } catch (error) {
    console.error('[Trello OAuth] Error:', error)
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/export-manager?error=trello_oauth_failed`)
  }
}