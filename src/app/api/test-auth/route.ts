import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Import Supabase directly with hardcoded credentials
    const { createClient } = await import('@supabase/supabase-js')
    
    const supabase = createClient(
      'https://kmpdmofcqdfqwcsvrwvv.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttcGRtb2ZjcWRmcXdjc3Zyd3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MTkzMTksImV4cCI6MjA3MTI5NTMxOX0.tXuEepbVcmF3zMnayfYAHJ12o24auRosK02s-p6RnBs'
    )

    console.log('[TEST-AUTH] Attempting to send magic link to:', email)
    
    const { data, error } = await supabase.auth.signInWithOtp({
      email: email,
      options: {
        emailRedirectTo: `https://scalewithruth.com/dashboard`
      }
    })

    console.log('[TEST-AUTH] Result:', { data, error })

    if (error) {
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        details: error
      })
    }

    return NextResponse.json({ 
      success: true, 
      message: `Magic link sent to ${email}`,
      data
    })

  } catch (error) {
    console.error('[TEST-AUTH] Exception:', error)
    return NextResponse.json({
      success: false,
      error: 'Server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Test auth endpoint',
    instructions: 'POST with { "email": "your@email.com" } to test magic link'
  })
}