import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')

  if (!code) {
    // Get client_id from environment
    const clientId = process.env.NOTION_CLIENT_ID
    const nextAuthUrl = process.env.NEXTAUTH_URL

    if (!clientId) {
      console.error('[Notion OAuth] Missing NOTION_CLIENT_ID environment variable')
      return NextResponse.redirect(`${nextAuthUrl}/export-manager?error=missing_notion_client_id`)
    }

    // TEMPORARY: Skip OAuth for immediate launch - show "Coming Soon"
    console.log('[Notion OAuth] Skipping OAuth for immediate launch - showing coming soon message')
    return NextResponse.redirect(`${nextAuthUrl}/export-manager?error=notion_coming_soon`)
  }

  try {
    // Exchange code for token
    const tokenResponse = await fetch('https://api.notion.com/v1/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${process.env.NOTION_CLIENT_ID}:${process.env.NOTION_CLIENT_SECRET}`).toString('base64')}`
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/notion/callback`
      }),
    })

    const tokenData = await tokenResponse.json()

    if (tokenData.access_token) {
      // Store connection in database
      const { supabase } = await import('../../../../lib/supabase')

      const connectionData = {
        platform: 'notion',
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token || null,
        token_type: 'Bearer',
        expires_at: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString() : null,
        platform_user_id: tokenData.owner?.user?.id || tokenData.bot_id || 'unknown',
        platform_username: tokenData.owner?.user?.name || tokenData.workspace_name || 'Notion User',
        last_used_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('platform_connections')
        .upsert(connectionData, { onConflict: 'platform,platform_user_id' })

      if (error) {
        console.error('[Notion OAuth] Database error:', error)
      }
    }

    // Redirect to success page
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/export-manager?connected=notion&success=true`)

  } catch (error) {
    console.error('[Notion OAuth] Error:', error)
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/export-manager?error=notion_oauth_failed`)
  }
}