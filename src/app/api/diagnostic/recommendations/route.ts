import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../../lib/supabase'

// GET /api/diagnostic/recommendations - Get recommendations for assessment
export async function GET(request: NextRequest) {
  try {
    console.log('[DIAGNOSTIC-RECOMMENDATIONS] GET request received')

    const { searchParams } = new URL(request.url)
    const assessmentId = searchParams.get('assessmentId')

    if (!assessmentId) {
      return NextResponse.json({
        error: 'Missing assessmentId',
        details: 'assessmentId parameter is required'
      }, { status: 400 })
    }

    // Get recommendations with sprint details
    const { data: recommendations, error: recError } = await supabase
      .from('recommendations')
      .select(`
        *,
        sprints (
          sprint_key,
          category,
          sprint_title,
          description,
          detailed_outcome,
          estimated_time_hours,
          difficulty_level,
          assets_generated,
          tools_required,
          prerequisites,
          primary_component,
          expected_score_improvement
        )
      `)
      .eq('assessment_id', assessmentId)
      .order('priority_rank')

    if (recError) {
      console.error('[DIAGNOSTIC-RECOMMENDATIONS] Error fetching recommendations:', recError)
      return NextResponse.json({
        error: 'Failed to fetch recommendations',
        details: recError.message
      }, { status: 500 })
    }

    // Get assessment details for context
    const { data: assessment, error: assessmentError } = await supabase
      .from('assessments')
      .select('*')
      .eq('assessment_id', assessmentId)
      .single()

    if (assessmentError) {
      return NextResponse.json({
        error: 'Assessment not found',
        details: assessmentError.message
      }, { status: 404 })
    }

    // Group recommendations by priority and status
    const groupedRecommendations = {
      high_priority: recommendations?.filter(r => r.priority_rank <= 2) || [],
      medium_priority: recommendations?.filter(r => r.priority_rank > 2 && r.priority_rank <= 4) || [],
      low_priority: recommendations?.filter(r => r.priority_rank > 4) || [],
      in_progress: recommendations?.filter(r => r.status === 'in_progress') || [],
      completed: recommendations?.filter(r => r.status === 'completed') || []
    }

    // Calculate potential impact
    const totalPotentialImpact = recommendations?.reduce((sum, rec) =>
      sum + (rec.estimated_impact_points || 0), 0
    ) || 0

    console.log(`[DIAGNOSTIC-RECOMMENDATIONS] Returning ${recommendations?.length || 0} recommendations`)

    return NextResponse.json({
      success: true,
      data: {
        assessment: {
          assessment_id: assessment.assessment_id,
          overall_score: assessment.overall_score,
          archetype: assessment.archetype,
          date_taken: assessment.date_taken,
          component_scores: {
            money_freedom: assessment.money_freedom_score,
            systems_freedom: assessment.systems_freedom_score,
            team_freedom: assessment.team_freedom_score,
            stress_freedom: assessment.stress_freedom_score,
            time_freedom: assessment.time_freedom_score,
            impact_freedom: assessment.impact_freedom_score
          }
        },
        recommendations: recommendations || [],
        grouped: groupedRecommendations,
        summary: {
          total_recommendations: recommendations?.length || 0,
          high_priority_count: groupedRecommendations.high_priority.length,
          in_progress_count: groupedRecommendations.in_progress.length,
          completed_count: groupedRecommendations.completed.length,
          total_potential_impact: totalPotentialImpact,
          estimated_total_time_hours: recommendations?.reduce((sum, rec) =>
            sum + (rec.sprints?.estimated_time_hours || 0), 0
          ) || 0
        }
      }
    })

  } catch (error) {
    console.error('[DIAGNOSTIC-RECOMMENDATIONS] Unexpected error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// POST /api/diagnostic/recommendations - Update recommendation status
export async function POST(request: NextRequest) {
  try {
    console.log('[DIAGNOSTIC-RECOMMENDATIONS] POST request received')

    const body = await request.json()
    const { recommendationId, status, userNotes, action } = body

    if (!recommendationId) {
      return NextResponse.json({
        error: 'Missing recommendationId',
        details: 'recommendationId is required'
      }, { status: 400 })
    }

    const validStatuses = ['recommended', 'accepted', 'in_progress', 'completed', 'skipped', 'deferred']
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({
        error: 'Invalid status',
        details: `Status must be one of: ${validStatuses.join(', ')}`
      }, { status: 400 })
    }

    // Handle different actions
    let updateData: any = {}

    switch (action) {
      case 'start':
        updateData = {
          status: 'in_progress',
          started_at: new Date().toISOString()
        }
        break

      case 'complete':
        updateData = {
          status: 'completed',
          completed_at: new Date().toISOString()
        }
        break

      case 'skip':
        updateData = {
          status: 'skipped'
        }
        break

      case 'defer':
        updateData = {
          status: 'deferred'
        }
        break

      default:
        // Manual status update
        if (status) updateData.status = status
        if (userNotes) updateData.user_notes = userNotes
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({
        error: 'No updates provided',
        details: 'Either provide status/userNotes or a valid action'
      }, { status: 400 })
    }

    // Update the recommendation
    const { data: updatedRecommendation, error } = await supabase
      .from('recommendations')
      .update(updateData)
      .eq('recommendation_id', recommendationId)
      .select(`
        *,
        sprints (
          sprint_key,
          sprint_title,
          category,
          expected_score_improvement
        )
      `)
      .single()

    if (error) {
      console.error('[DIAGNOSTIC-RECOMMENDATIONS] Error updating recommendation:', error)
      return NextResponse.json({
        error: 'Failed to update recommendation',
        details: error.message
      }, { status: 500 })
    }

    console.log(`[DIAGNOSTIC-RECOMMENDATIONS] Updated recommendation ${recommendationId} to status: ${updateData.status || 'unknown'}`)

    return NextResponse.json({
      success: true,
      data: updatedRecommendation,
      message: `Recommendation ${action || 'updated'} successfully`
    })

  } catch (error) {
    console.error('[DIAGNOSTIC-RECOMMENDATIONS] POST error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET /api/diagnostic/recommendations/sprints - Get all available sprints
export async function PUT(request: NextRequest) {
  try {
    console.log('[DIAGNOSTIC-RECOMMENDATIONS] Getting all sprints')

    const { data: sprints, error } = await supabase
      .from('sprints')
      .select('*')
      .eq('is_active', true)
      .order('recommended_order')

    if (error) {
      return NextResponse.json({
        error: 'Failed to fetch sprints',
        details: error.message
      }, { status: 500 })
    }

    // Group sprints by category
    const sprintsByCategory = sprints?.reduce((acc: any, sprint) => {
      if (!acc[sprint.category]) {
        acc[sprint.category] = []
      }
      acc[sprint.category].push(sprint)
      return acc
    }, {}) || {}

    return NextResponse.json({
      success: true,
      data: {
        sprints: sprints || [],
        sprintsByCategory,
        categories: Object.keys(sprintsByCategory),
        summary: {
          total_sprints: sprints?.length || 0,
          categories_count: Object.keys(sprintsByCategory).length,
          difficulty_breakdown: {
            beginner: sprints?.filter(s => s.difficulty_level === 'beginner').length || 0,
            intermediate: sprints?.filter(s => s.difficulty_level === 'intermediate').length || 0,
            advanced: sprints?.filter(s => s.difficulty_level === 'advanced').length || 0
          }
        }
      }
    })

  } catch (error) {
    console.error('[DIAGNOSTIC-RECOMMENDATIONS] PUT error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}