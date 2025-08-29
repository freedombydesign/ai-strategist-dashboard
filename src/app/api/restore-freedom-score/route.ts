import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { userId, freedomScore, assessmentAnswers } = await request.json()
    
    if (!userId || !freedomScore) {
      return NextResponse.json({ 
        error: 'User ID and Freedom Score are required' 
      }, { status: 400 })
    }

    console.log('[RESTORE-FREEDOM-SCORE] Restoring for user:', userId)
    console.log('[RESTORE-FREEDOM-SCORE] Score:', freedomScore.percent + '%')

    // Save the diagnostic response
    if (assessmentAnswers) {
      try {
        const { data: savedResponse, error: saveError } = await supabase
          .from('diagnostic_responses')
          .insert({
            user_id: userId,
            responses: assessmentAnswers,
            score_result: freedomScore,
            created_at: new Date().toISOString()
          })
          .select()
          .single()

        if (saveError) {
          console.error('[RESTORE-FREEDOM-SCORE] Error saving responses:', saveError)
        } else {
          console.log('[RESTORE-FREEDOM-SCORE] Responses saved successfully:', savedResponse.id)
        }
      } catch (error) {
        console.error('[RESTORE-FREEDOM-SCORE] Exception saving responses:', error)
      }
    }

    // Check if user has a sprint started
    const { data: existingSprints, error: sprintError } = await supabase
      .from('user_steps')
      .select('*, sprints(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)

    if (sprintError) {
      console.error('[RESTORE-FREEDOM-SCORE] Error checking sprints:', sprintError)
    }

    let sprintInfo = null
    if (existingSprints && existingSprints.length > 0) {
      const sprint = existingSprints[0]
      sprintInfo = {
        id: sprint.id,
        sprint_id: sprint.sprint_id,
        sprint_name: sprint.sprints?.name,
        sprint_title: sprint.sprints?.client_facing_title,
        step_number: sprint.step_number,
        step_title: sprint.step_title,
        status: sprint.status
      }
      console.log('[RESTORE-FREEDOM-SCORE] Found existing sprint:', sprintInfo)

      // Update the sprint with proper step tracking if needed
      if (!sprint.step_number || sprint.step_number === null) {
        console.log('[RESTORE-FREEDOM-SCORE] Fixing sprint step tracking...')
        
        const { data: updatedSprint, error: updateError } = await supabase
          .from('user_steps')
          .update({
            step_number: 1,
            step_title: sprint.step_title || 'Getting Started',
            status: 'started',
            updated_at: new Date().toISOString()
          })
          .eq('id', sprint.id)
          .select('*, sprints(*)')
          .single()

        if (updateError) {
          console.error('[RESTORE-FREEDOM-SCORE] Error updating sprint:', updateError)
        } else {
          sprintInfo = {
            id: updatedSprint.id,
            sprint_id: updatedSprint.sprint_id,
            sprint_name: updatedSprint.sprints?.name,
            sprint_title: updatedSprint.sprints?.client_facing_title,
            step_number: updatedSprint.step_number,
            step_title: updatedSprint.step_title,
            status: updatedSprint.status
          }
          console.log('[RESTORE-FREEDOM-SCORE] Sprint updated successfully')
        }
      }
    } else {
      console.log('[RESTORE-FREEDOM-SCORE] No existing sprints found')
    }

    return NextResponse.json({
      success: true,
      message: 'Freedom Score restored successfully',
      freedomScore,
      sprintInfo,
      userId
    })

  } catch (error) {
    console.error('[RESTORE-FREEDOM-SCORE] API error:', error)
    return NextResponse.json({
      error: 'Failed to restore Freedom Score',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}