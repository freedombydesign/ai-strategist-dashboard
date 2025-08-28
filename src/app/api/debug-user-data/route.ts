import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    console.log('[DEBUG-USER-DATA] Fetching all data for user:', userId)

    // Check business context
    const { data: businessContext, error: contextError } = await supabase
      .from('business_context')
      .select('*')
      .eq('user_id', userId)
      .single()

    // Check freedom responses (assessments)
    const { data: freedomResponses, error: responseError } = await supabase
      .from('freedom_responses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    // Check conversation history
    const { data: conversations, error: convError } = await supabase
      .from('ai_conversations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10)

    return NextResponse.json({
      success: true,
      userId: userId,
      data: {
        businessContext: {
          found: !!businessContext,
          data: businessContext,
          error: contextError?.message
        },
        freedomResponses: {
          found: !!freedomResponses && freedomResponses.length > 0,
          count: freedomResponses?.length || 0,
          latestScore: freedomResponses?.[0] ? {
            id: freedomResponses[0].id,
            created_at: freedomResponses[0].created_at,
            hasScoreResult: 'scoreResult' in freedomResponses[0]
          } : null,
          error: responseError?.message
        },
        conversations: {
          found: !!conversations && conversations.length > 0,
          count: conversations?.length || 0,
          latest: conversations?.[0] ? {
            id: conversations[0].id,
            created_at: conversations[0].created_at,
            message_preview: conversations[0].message?.substring(0, 50)
          } : null,
          error: convError?.message
        },
        localStorage_check: {
          note: "Check browser console for localStorage values",
          keys_to_check: ['lastFreedomScore', 'scoreCompletedAt']
        }
      }
    })

  } catch (error) {
    console.error('[DEBUG-USER-DATA] Error:', error)
    return NextResponse.json({
      success: false,
      error: 'Debug fetch failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}