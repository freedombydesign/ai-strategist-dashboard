import { NextRequest, NextResponse } from 'next/server'
import { emailService } from '@/services/emailService'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// Handle GET requests - get user's email preferences
export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log(`[EMAIL-PREFERENCES-API] Getting preferences for user ${session.user.id}`)
    
    const preferences = await emailService.getUserEmailPreferences(session.user.id)
    
    return NextResponse.json({ 
      success: true, 
      preferences 
    })
  } catch (error) {
    console.error('[EMAIL-PREFERENCES-API] Error getting preferences:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}

// Handle POST requests - update user's email preferences
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { preferences } = body

    if (!preferences) {
      return NextResponse.json(
        { error: 'Missing preferences data' },
        { status: 400 }
      )
    }

    console.log(`[EMAIL-PREFERENCES-API] Updating preferences for user ${session.user.id}`)

    const success = await emailService.updateEmailPreferences(session.user.id, preferences)
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update preferences' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Email preferences updated successfully' 
    })
  } catch (error) {
    console.error('[EMAIL-PREFERENCES-API] Error updating preferences:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}