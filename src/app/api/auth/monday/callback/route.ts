import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  console.log('[Monday Callback] Received request with code:', code ? 'YES' : 'NO', 'error:', error)

  if (error) {
    console.error('[Monday Callback] OAuth error:', error)
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/export-manager?error=monday_oauth_error`)
  }

  if (!code) {
    console.error('[Monday Callback] No code received')
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/export-manager?error=monday_no_code`)
  }

  try {
    // Exchange code for token
    const tokenResponse = await fetch('https://auth.monday.com/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.MONDAY_CLIENT_ID!,
        client_secret: process.env.MONDAY_CLIENT_SECRET!,
        redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/monday/callback`,
        code: code,
      }),
    })

    const tokenData = await tokenResponse.json()
    console.log('[Monday Callback] Token response status:', tokenResponse.status)
    console.log('[Monday Callback] Token data keys:', Object.keys(tokenData))

    if (tokenData.access_token) {
      // Get user info using GraphQL
      const userResponse = await fetch('https://api.monday.com/v2', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: 'query { me { id name email photo_original } }'
        })
      })

      const userData = await userResponse.json()
      console.log('[Monday Callback] User response status:', userResponse.status)
      console.log('[Monday Callback] User data:', userData.data?.me?.name || 'No name')

      // Store connection in database
      const { supabase } = await import('../../../../../../lib/supabase')

      const connectionData = {
        platform: 'monday',
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        token_type: 'Bearer',
        expires_at: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString() : null,
        platform_user_id: userData.data.me.id.toString(),
        platform_username: userData.data.me.name,
        last_used_at: new Date().toISOString()
      }

      const { error: dbError } = await supabase
        .from('platform_connections')
        .upsert(connectionData, { onConflict: 'platform,platform_user_id' })

      if (dbError) {
        console.error('[Monday Callback] Database error:', dbError)
      } else {
        console.log('[Monday Callback] Successfully stored connection for user:', userData.data.me.name)
      }
    } else {
      console.error('[Monday Callback] No access token in response:', tokenData)
    }

    // Redirect to success page
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/export-manager?connected=monday&success=true`)

  } catch (error) {
    console.error('[Monday Callback] Error:', error)
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/export-manager?error=monday_callback_failed`)
  }
}