import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  console.log('[Asana Callback] Received request with code:', code ? 'YES' : 'NO', 'error:', error)

  if (error) {
    console.error('[Asana Callback] OAuth error:', error)
    return NextResponse.redirect(`https://business-systemizer.scalewithruth.com/export-manager?error=asana_oauth_error`)
  }

  if (!code) {
    console.error('[Asana Callback] No code received')
    return NextResponse.redirect(`https://business-systemizer.scalewithruth.com/export-manager?error=asana_no_code`)
  }

  try {
    // Exchange code for token
    const tokenResponse = await fetch('https://app.asana.com/-/oauth_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.ASANA_CLIENT_ID!,
        client_secret: process.env.ASANA_CLIENT_SECRET!,
        redirect_uri: 'https://business-systemizer.scalewithruth.com/api/auth/callback/asana',
        code: code,
      }),
    })

    const tokenData = await tokenResponse.json()
    console.log('[Asana Callback] Token response status:', tokenResponse.status)
    console.log('[Asana Callback] Token data keys:', Object.keys(tokenData))

    if (tokenData.access_token) {
      // Get user info
      const userResponse = await fetch('https://app.asana.com/api/1.0/users/me', {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Accept': 'application/json',
        },
      })

      const userData = await userResponse.json()
      console.log('[Asana Callback] User response status:', userResponse.status)
      console.log('[Asana Callback] User data:', userData.data?.name || 'No name')

      // Store connection in database
      const { supabase } = await import('../../../../../../lib/supabase')

      const connectionData = {
        platform: 'asana',
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        token_type: 'Bearer',
        expires_at: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString() : null,
        platform_user_id: userData.data.gid,
        platform_username: userData.data.name,
        last_used_at: new Date().toISOString()
      }

      const { error: dbError } = await supabase
        .from('platform_connections')
        .upsert(connectionData, { onConflict: 'platform,platform_user_id' })

      if (dbError) {
        console.error('[Asana Callback] Database error:', dbError)
      } else {
        console.log('[Asana Callback] Successfully stored connection for user:', userData.data.name)
      }
    } else {
      console.error('[Asana Callback] No access token in response:', tokenData)
    }

    // Redirect to success page
    return NextResponse.redirect(`https://business-systemizer.scalewithruth.com/export-manager?connected=asana&success=true`)

  } catch (error) {
    console.error('[Asana Callback] Error:', error)
    return NextResponse.redirect(`https://business-systemizer.scalewithruth.com/export-manager?error=asana_callback_failed`)
  }
}