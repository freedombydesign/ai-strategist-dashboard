import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('[DEBUG-DIAGNOSTIC] Testing complete diagnostic data pipeline...')

    // EMERGENCY CLEANUP: Delete broken recommendations first
    const { data: brokenRecommendations, error: checkError } = await supabase
      .from('recommendations')
      .select(`
        recommendation_id,
        sprint_id,
        sprints (
          sprint_id,
          sprint_key
        )
      `)

    if (!checkError && brokenRecommendations) {
      const broken = brokenRecommendations.filter(rec => !rec.sprints)
      if (broken.length > 0) {
        console.log('[DEBUG-DIAGNOSTIC] CLEANING UP broken recommendations:', broken.length)
        const { error: deleteError } = await supabase
          .from('recommendations')
          .delete()
          .in('recommendation_id', broken.map(r => r.recommendation_id))

        if (!deleteError) {
          console.log('[DEBUG-DIAGNOSTIC] Successfully deleted broken recommendations:', broken.length)
        }
      }
    }

    // 1. Check if sprints table has data
    const { data: sprintsData, error: sprintsError } = await supabase
      .from('sprints')
      .select('*')
      .limit(5)

    console.log('[DEBUG-DIAGNOSTIC] Sprints query result:', {
      data: sprintsData,
      error: sprintsError,
      count: sprintsData?.length
    })

    // 2. Check if we have any assessments
    const { data: assessments, error: assessmentError } = await supabase
      .from('assessments')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(3)

    console.log('[DEBUG-DIAGNOSTIC] Latest assessments:', {
      data: assessments,
      error: assessmentError,
      count: assessments?.length
    })

    // 3. Check if we have any recommendations
    const { data: recommendations, error: recommendationsError } = await supabase
      .from('recommendations')
      .select('*')
      .limit(5)

    console.log('[DEBUG-DIAGNOSTIC] Raw recommendations:', {
      data: recommendations,
      error: recommendationsError,
      count: recommendations?.length
    })

    // 4. Test the JOIN query that's failing
    const { data: joinedRecommendations, error: joinError } = await supabase
      .from('recommendations')
      .select(`
        *,
        sprints (
          sprint_id,
          sprint_key,
          category,
          sprint_title,
          description,
          detailed_outcome,
          estimated_time_hours,
          difficulty_level,
          assets_generated,
          tools_required,
          primary_component,
          expected_score_improvement
        )
      `)
      .limit(5)

    console.log('[DEBUG-DIAGNOSTIC] Joined recommendations with sprints:', {
      data: joinedRecommendations,
      error: joinError,
      count: joinedRecommendations?.length
    })

    return NextResponse.json({
      success: true,
      data: {
        sprints: { data: sprintsData, error: sprintsError },
        assessments: { data: assessments, error: assessmentError },
        recommendations: { data: recommendations, error: recommendationsError },
        joinedRecommendations: { data: joinedRecommendations, error: joinError }
      }
    })

  } catch (error) {
    console.error('[DEBUG-DIAGNOSTIC] Error:', error)
    return NextResponse.json({
      error: 'Debug test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}