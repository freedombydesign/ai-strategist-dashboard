import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    console.log('[DEBUG-USER-STEPS] Checking user_steps for:', userId)

    // Get all user_steps for this user
    const { data: userSteps, error: stepsError } = await supabase
      .from('user_steps')
      .select('*, sprints(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (stepsError) {
      console.error('[DEBUG-USER-STEPS] Error fetching user_steps:', stepsError)
      return NextResponse.json({ 
        error: 'Failed to fetch user steps',
        details: stepsError
      }, { status: 500 })
    }

    // Get all sprints for context
    const { data: allSprints, error: sprintsError } = await supabase
      .from('sprints')
      .select('*')

    console.log('[DEBUG-USER-STEPS] Found', userSteps?.length || 0, 'user step records')
    console.log('[DEBUG-USER-STEPS] Found', allSprints?.length || 0, 'total sprints')

    return NextResponse.json({
      success: true,
      userId,
      userSteps: userSteps || [],
      allSprints: allSprints || [],
      summary: {
        totalUserSteps: userSteps?.length || 0,
        totalSprints: allSprints?.length || 0,
        activeSteps: userSteps?.filter(s => s.status === 'started' || s.status === 'in_progress') || [],
        stepStatuses: [...new Set(userSteps?.map(s => s.status) || [])],
        sprintIds: userSteps?.map(s => s.sprint_id) || []
      }
    })

  } catch (error) {
    console.error('[DEBUG-USER-STEPS] API error:', error)
    return NextResponse.json({
      error: 'Failed to debug user steps',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}