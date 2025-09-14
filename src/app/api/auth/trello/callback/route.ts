import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  console.log('[Trello Callback] Received request with code:', code ? 'YES' : 'NO', 'error:', error)

  if (error) {
    console.error('[Trello Callback] OAuth error:', error)
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/export-manager?error=trello_oauth_error`)
  }

  if (!code) {
    console.error('[Trello Callback] No code received')
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/export-manager?error=trello_no_code`)
  }

  try {
    // Trello OAuth 2.0 is not fully available yet, this is a placeholder
    console.log('[Trello Callback] Trello OAuth 2.0 integration coming soon')

    // For now, redirect with coming soon message
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/export-manager?error=trello_coming_soon`)

  } catch (error) {
    console.error('[Trello Callback] Error:', error)
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/export-manager?error=trello_callback_failed`)
  }
}