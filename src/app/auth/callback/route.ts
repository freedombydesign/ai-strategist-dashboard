import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase-client'

export async function GET(request: NextRequest) {
  try {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const error = requestUrl.searchParams.get('error')
    const errorCode = requestUrl.searchParams.get('error_code')
    const errorDescription = requestUrl.searchParams.get('error_description')
    
    console.log('[AUTH-CALLBACK] Callback received, code present:', !!code, 'error:', error)
    
    // Handle magic link errors
    if (error) {
      console.log('[AUTH-CALLBACK] Auth error received:', { error, errorCode, errorDescription })
      
      if (errorCode === 'otp_expired') {
        return NextResponse.redirect(`${requestUrl.origin}/login?error=link_expired&message=Your magic link has expired. Please request a new one.`)
      }
      
      return NextResponse.redirect(`${requestUrl.origin}/login?error=auth_error&message=${errorDescription || 'Authentication failed'}`)
    }
    
    // Using centralized supabase client

    if (code) {
      console.log('[AUTH-CALLBACK] Processing auth callback with code')
      
      // Exchange the code for a session
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('[AUTH-CALLBACK] Error exchanging code:', error)
        return NextResponse.redirect(`${requestUrl.origin}/login?error=auth_failed&message=Authentication failed. Please try again.`)
      }

      if (data.session && data.user) {
        console.log('[AUTH-CALLBACK] User authenticated successfully:', data.user.id)
        
        // Create or update user profile
        try {
          const { error: profileError } = await supabase
            .from('users')
            .upsert({
              id: data.user.id,
              email: data.user.email,
              created_at: data.user.created_at,
              updated_at: new Date().toISOString(),
            }, {
              onConflict: 'id'
            })

          if (profileError) {
            console.error('[AUTH-CALLBACK] Error creating user profile:', profileError)
          } else {
            console.log('[AUTH-CALLBACK] User profile created/updated')
          }
        } catch (profileErr) {
          console.error('[AUTH-CALLBACK] Profile creation failed:', profileErr)
        }

        // Successful auth - redirect to dashboard
        console.log('[AUTH-CALLBACK] Redirecting to dashboard')
        return NextResponse.redirect(`${requestUrl.origin}/dashboard`)
      } else {
        console.error('[AUTH-CALLBACK] No session or user after code exchange')
        return NextResponse.redirect(`${requestUrl.origin}/login?error=no_session`)
      }
    } else {
      // Handle direct access or other auth methods
      console.log('[AUTH-CALLBACK] No code provided, checking existing session')
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        console.log('[AUTH-CALLBACK] Existing session found, redirecting to dashboard')
        return NextResponse.redirect(`${requestUrl.origin}/dashboard`)
      } else {
        console.log('[AUTH-CALLBACK] No session found, redirecting to login')
        return NextResponse.redirect(`${requestUrl.origin}/login`)
      }
    }
  } catch (error) {
    console.error('[AUTH-CALLBACK] Unexpected error:', error)
    return NextResponse.redirect(`${request.url.split('/auth')[0]}/login?error=callback_error`)
  }
}