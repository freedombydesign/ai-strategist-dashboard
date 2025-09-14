import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')

  if (!code) {
    // Get client_id from environment
    const clientId = process.env.CLICKUP_CLIENT_ID
    const nextAuthUrl = process.env.NEXTAUTH_URL

    if (!clientId) {
      console.error('[ClickUp OAuth] Missing CLICKUP_CLIENT_ID environment variable')
      return NextResponse.redirect(`${nextAuthUrl}/export-manager?error=missing_clickup_client_id`)
    }

    // TEMPORARY: Skip OAuth for immediate launch - show "Coming Soon"
    console.log('[ClickUp OAuth] Skipping OAuth for immediate launch - showing coming soon message')
    return NextResponse.redirect(`${nextAuthUrl}/export-manager?error=clickup_coming_soon`)
  }

  try {
    // Exchange code for token
    const tokenResponse = await fetch('https://api.clickup.com/api/v2/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.CLICKUP_CLIENT_ID!,
        client_secret: process.env.CLICKUP_CLIENT_SECRET!,
        redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/clickup/callback`,
        code: code,
      }),
    })

    const tokenData = await tokenResponse.json()

    if (tokenData.access_token) {
      // Get user info
      const userResponse = await fetch('https://api.clickup.com/api/v2/user', {
        headers: {
          'Authorization': tokenData.access_token,
          'Content-Type': 'application/json',
        },
      })

      const userData = await userResponse.json()

      // Store connection in database
      const { supabase } = await import('../../../../lib/supabase')

      const connectionData = {
        platform: 'clickup',
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        token_type: 'Bearer',
        expires_at: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString() : null,
        platform_user_id: userData.user.id.toString(),
        platform_username: userData.user.username,
        last_used_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('platform_connections')
        .upsert(connectionData, { onConflict: 'platform,platform_user_id' })

      if (error) {
        console.error('[ClickUp OAuth] Database error:', error)
      }
    }

    // Redirect to success page
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/export-manager?connected=clickup&success=true`)

  } catch (error) {
    console.error('[ClickUp OAuth] Error:', error)
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/export-manager?error=clickup_oauth_failed`)
  }
}