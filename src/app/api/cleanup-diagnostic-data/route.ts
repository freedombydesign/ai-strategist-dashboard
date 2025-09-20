import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('[CLEANUP-DIAGNOSTIC] Starting cleanup of corrupted diagnostic data...')

    // 1. Check for broken recommendations (ones with invalid sprint_id references)
    const { data: brokenRecommendations, error: checkError } = await supabase
      .from('recommendations')
      .select(`
        recommendation_id,
        sprint_id,
        sprints (
          sprint_id,
          sprint_key,
          difficulty_level
        )
      `)

    if (checkError) {
      console.error('[CLEANUP-DIAGNOSTIC] Error checking recommendations:', checkError)
      return NextResponse.json({
        error: 'Failed to check recommendations',
        details: checkError.message
      }, { status: 500 })
    }

    console.log('[CLEANUP-DIAGNOSTIC] Found recommendations:', brokenRecommendations?.length || 0)

    // 2. Identify broken recommendations (where sprints is null)
    const broken = (brokenRecommendations || []).filter(rec => !rec.sprints)
    console.log('[CLEANUP-DIAGNOSTIC] Broken recommendations found:', broken.length)

    if (broken.length > 0) {
      console.log('[CLEANUP-DIAGNOSTIC] Broken recommendation IDs:', broken.map(r => r.recommendation_id))

      // 3. Delete broken recommendations
      const { error: deleteError } = await supabase
        .from('recommendations')
        .delete()
        .in('recommendation_id', broken.map(r => r.recommendation_id))

      if (deleteError) {
        console.error('[CLEANUP-DIAGNOSTIC] Error deleting broken recommendations:', deleteError)
        return NextResponse.json({
          error: 'Failed to delete broken recommendations',
          details: deleteError.message
        }, { status: 500 })
      }

      console.log('[CLEANUP-DIAGNOSTIC] Deleted broken recommendations:', broken.length)
    }

    // 4. Also clean up any assessments that might have broken data
    const { data: assessments, error: assessmentError } = await supabase
      .from('assessments')
      .select('assessment_id, completion_status')
      .eq('completion_status', 'completed')

    if (assessmentError) {
      console.error('[CLEANUP-DIAGNOSTIC] Error checking assessments:', assessmentError)
    } else {
      console.log('[CLEANUP-DIAGNOSTIC] Found completed assessments:', assessments?.length || 0)
    }

    // 5. Verify cleanup was successful
    const { data: remainingRecommendations, error: verifyError } = await supabase
      .from('recommendations')
      .select(`
        recommendation_id,
        sprints (
          sprint_id,
          sprint_key,
          difficulty_level
        )
      `)

    if (verifyError) {
      console.error('[CLEANUP-DIAGNOSTIC] Error verifying cleanup:', verifyError)
    } else {
      const stillBroken = (remainingRecommendations || []).filter(rec => !rec.sprints)
      console.log('[CLEANUP-DIAGNOSTIC] Remaining broken recommendations:', stillBroken.length)
    }

    return NextResponse.json({
      success: true,
      message: 'Diagnostic data cleanup completed',
      data: {
        brokenRecommendationsFound: broken.length,
        brokenRecommendationsDeleted: broken.length,
        completedAssessments: assessments?.length || 0,
        remainingRecommendations: remainingRecommendations?.length || 0,
        cleanup: {
          deletedIds: broken.map(r => r.recommendation_id),
          timestamp: new Date().toISOString()
        }
      }
    })

  } catch (error) {
    console.error('[CLEANUP-DIAGNOSTIC] Cleanup error:', error)
    return NextResponse.json({
      error: 'Diagnostic cleanup failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}