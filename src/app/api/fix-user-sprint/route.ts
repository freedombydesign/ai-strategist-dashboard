import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    console.log('[FIX-USER-SPRINT] Fixing sprint progress for:', userId)

    // Get the user's most recent sprint
    const { data: userSteps, error: fetchError } = await supabase
      .from('user_steps')
      .select('*, sprints(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)

    if (fetchError) {
      console.error('[FIX-USER-SPRINT] Error fetching user steps:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch user steps' }, { status: 500 })
    }

    if (!userSteps || userSteps.length === 0) {
      return NextResponse.json({ error: 'No sprints found for user' }, { status: 404 })
    }

    const currentSprint = userSteps[0]
    
    // Update the sprint to have proper step tracking
    const { data: updatedSprint, error: updateError } = await supabase
      .from('user_steps')
      .update({
        step_number: currentSprint.step_number || 1,
        step_title: currentSprint.step_title || 'Getting Started',
        status: 'started',
        updated_at: new Date().toISOString()
      })
      .eq('id', currentSprint.id)
      .select('*, sprints(*)')
      .single()

    if (updateError) {
      console.error('[FIX-USER-SPRINT] Error updating sprint:', updateError)
      return NextResponse.json({ error: 'Failed to update sprint' }, { status: 500 })
    }

    console.log('[FIX-USER-SPRINT] Sprint updated successfully:', updatedSprint)

    return NextResponse.json({
      success: true,
      before: currentSprint,
      after: updatedSprint,
      message: 'Sprint progress fixed successfully'
    })

  } catch (error) {
    console.error('[FIX-USER-SPRINT] API error:', error)
    return NextResponse.json({
      error: 'Failed to fix sprint progress',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}