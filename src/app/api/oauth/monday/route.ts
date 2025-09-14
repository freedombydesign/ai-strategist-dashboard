import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')

  if (!code) {
    // Get client_id from environment
    const clientId = process.env.MONDAY_CLIENT_ID
    const nextAuthUrl = process.env.NEXTAUTH_URL

    if (!clientId) {
      console.error('[Monday OAuth] Missing MONDAY_CLIENT_ID environment variable')
      return NextResponse.redirect(`${nextAuthUrl}/export-manager?error=missing_monday_client_id`)
    }

    // TEMPORARY: Skip OAuth for immediate launch - show "Coming Soon"
    console.log('[Monday OAuth] Skipping OAuth for immediate launch - showing coming soon message')
    return NextResponse.redirect(`${nextAuthUrl}/export-manager?error=monday_coming_soon`)
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

    if (tokenData.access_token) {
      // Get user info
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

      // Store connection in database
      const { supabase } = await import('../../../../lib/supabase')

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

      const { error } = await supabase
        .from('platform_connections')
        .upsert(connectionData, { onConflict: 'platform,platform_user_id' })

      if (error) {
        console.error('[Monday OAuth] Database error:', error)
      }
    }

    // Redirect to success page
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/export-manager?connected=monday&success=true`)

  } catch (error) {
    console.error('[Monday OAuth] Error:', error)
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/export-manager?error=monday_oauth_failed`)
  }
}