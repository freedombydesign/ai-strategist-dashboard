import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || 'f85eba27-6eb9-4933-9459-2517739ef846'
    
    console.log('[CHECK-SPRINT-DATA] Checking for user:', userId)

    // Get all user_steps records for this user
    const { data: userSteps, error: stepsError } = await supabase
      .from('user_steps')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    console.log('[CHECK-SPRINT-DATA] Found', userSteps?.length || 0, 'user_steps records')

    // Get all sprints for reference
    const { data: allSprints, error: sprintsError } = await supabase
      .from('sprints')
      .select('*')

    // Try the exact query that the AI uses
    const { data: aiQuery, error: aiError } = await supabase
      .from('user_steps')
      .select('*, sprints!inner(*)')
      .eq('user_id', userId)
      .in('status', ['started', 'in_progress', 'active'])
      .order('created_at', { ascending: false })
      .limit(1)

    // Try a broader query
    const { data: broadQuery, error: broadError } = await supabase
      .from('user_steps')
      .select('*, sprints(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)

    const response = {
      success: true,
      userId,
      queries: {
        userSteps: {
          count: userSteps?.length || 0,
          data: userSteps,
          error: stepsError
        },
        aiQuery: {
          count: aiQuery?.length || 0,
          data: aiQuery,
          error: aiError,
          description: "This is the exact query the AI uses"
        },
        broadQuery: {
          count: broadQuery?.length || 0,
          data: broadQuery,
          error: broadError,
          description: "This is a broader query to see what exists"
        },
        allSprints: {
          count: allSprints?.length || 0,
          error: sprintsError
        }
      }
    }

    console.log('[CHECK-SPRINT-DATA] Response summary:', {
      userStepsFound: userSteps?.length || 0,
      aiQueryFound: aiQuery?.length || 0,
      broadQueryFound: broadQuery?.length || 0
    })

    return NextResponse.json(response)

  } catch (error) {
    console.error('[CHECK-SPRINT-DATA] API error:', error)
    return NextResponse.json({
      error: 'Failed to check sprint data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}