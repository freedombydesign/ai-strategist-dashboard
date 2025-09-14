import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  console.log('[Notion Callback] Received request with code:', code ? 'YES' : 'NO', 'error:', error)

  if (error) {
    console.error('[Notion Callback] OAuth error:', error)
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/export-manager?error=notion_oauth_error`)
  }

  if (!code) {
    console.error('[Notion Callback] No code received')
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/export-manager?error=notion_no_code`)
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
    console.log('[Notion Callback] Token response status:', tokenResponse.status)
    console.log('[Notion Callback] Token data keys:', Object.keys(tokenData))

    if (tokenData.access_token) {
      // Store connection in database
      const { supabase } = await import('../../../../../../lib/supabase')

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

      const { error: dbError } = await supabase
        .from('platform_connections')
        .upsert(connectionData, { onConflict: 'platform,platform_user_id' })

      if (dbError) {
        console.error('[Notion Callback] Database error:', dbError)
      } else {
        console.log('[Notion Callback] Successfully stored connection for workspace:', connectionData.platform_username)
      }
    } else {
      console.error('[Notion Callback] No access token in response:', tokenData)
    }

    // Redirect to success page
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/export-manager?connected=notion&success=true`)

  } catch (error) {
    console.error('[Notion Callback] Error:', error)
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/export-manager?error=notion_callback_failed`)
  }
}