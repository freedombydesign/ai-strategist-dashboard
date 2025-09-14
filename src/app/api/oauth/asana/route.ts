import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')

  if (!code) {
    // Get client_id from environment
    const clientId = process.env.ASANA_CLIENT_ID
    const nextAuthUrl = process.env.NEXTAUTH_URL

    if (!clientId) {
      console.error('[Asana OAuth] Missing ASANA_CLIENT_ID environment variable')
      return NextResponse.redirect(`${nextAuthUrl}/export-manager?error=missing_asana_client_id`)
    }

    // TEMPORARY: Skip OAuth for immediate launch - show "Coming Soon"
    console.log('[Asana OAuth] Skipping OAuth due to scope restrictions - showing coming soon message')
    return NextResponse.redirect('https://business-systemizer.scalewithruth.com/export-manager?error=asana_coming_soon')
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

    if (tokenData.access_token) {
      // Get user info
      const userResponse = await fetch('https://app.asana.com/api/1.0/users/me', {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Accept': 'application/json',
        },
      })

      const userData = await userResponse.json()

      // Store connection in database
      const { supabase } = await import('../../../../lib/supabase')

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

      const { error } = await supabase
        .from('platform_connections')
        .upsert(connectionData, { onConflict: 'platform,platform_user_id' })

      if (error) {
        console.error('[Asana OAuth] Database error:', error)
      }
    }

    // Redirect to success page
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/export-manager?connected=asana&success=true`)

  } catch (error) {
    console.error('[Asana OAuth] Error:', error)
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/export-manager?error=asana_oauth_failed`)
  }
}