import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  console.log('[ClickUp Callback] Received request with code:', code ? 'YES' : 'NO', 'error:', error)

  if (error) {
    console.error('[ClickUp Callback] OAuth error:', error)
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/export-manager?error=clickup_oauth_error`)
  }

  if (!code) {
    console.error('[ClickUp Callback] No code received')
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/export-manager?error=clickup_no_code`)
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
    console.log('[ClickUp Callback] Token response status:', tokenResponse.status)
    console.log('[ClickUp Callback] Token data keys:', Object.keys(tokenData))

    if (tokenData.access_token) {
      // Get user info
      const userResponse = await fetch('https://api.clickup.com/api/v2/user', {
        headers: {
          'Authorization': tokenData.access_token,
          'Content-Type': 'application/json',
        },
      })

      const userData = await userResponse.json()
      console.log('[ClickUp Callback] User response status:', userResponse.status)
      console.log('[ClickUp Callback] User data:', userData.user?.username || 'No username')

      // Store connection in database
      const { supabase } = await import('../../../../../../lib/supabase')

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

      const { error: dbError } = await supabase
        .from('platform_connections')
        .upsert(connectionData, { onConflict: 'platform,platform_user_id' })

      if (dbError) {
        console.error('[ClickUp Callback] Database error:', dbError)
      } else {
        console.log('[ClickUp Callback] Successfully stored connection for user:', userData.user.username)
      }
    } else {
      console.error('[ClickUp Callback] No access token in response:', tokenData)
    }

    // Redirect to success page
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/export-manager?connected=clickup&success=true`)

  } catch (error) {
    console.error('[ClickUp Callback] Error:', error)
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/export-manager?error=clickup_callback_failed`)
  }
}