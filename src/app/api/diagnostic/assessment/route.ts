import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../../lib/supabase'

// Types for diagnostic system
interface DiagnosticQuestion {
  question_id: string
  question_order: number
  category: string
  component: string
  question_text: string
  subtitle?: string
  scale_description: any
  weight: number
  sprint_trigger: string
}

interface DiagnosticResponse {
  question_id: string
  score: number
  response_time_seconds?: number
}

interface ComponentScores {
  money_freedom: number
  systems_freedom: number
  team_freedom: number
  stress_freedom: number
  time_freedom: number
  impact_freedom: number
}

// GET /api/diagnostic/assessment - Get or create current assessment
export async function GET(request: NextRequest) {
  try {
    console.log('[DIAGNOSTIC-ASSESSMENT] GET request received')

    const { searchParams } = new URL(request.url)
    const assessmentId = searchParams.get('assessmentId')

    if (assessmentId) {
      // Get specific assessment with responses
      const { data: assessment, error: assessmentError } = await supabase
        .from('assessments')
        .select(`
          *,
          diagnostic_responses (
            response_id,
            question_id,
            score,
            response_time_seconds
          )
        `)
        .eq('assessment_id', assessmentId)
        .single()

      if (assessmentError) {
        return NextResponse.json({
          error: 'Assessment not found',
          details: assessmentError.message
        }, { status: 404 })
      }

      return NextResponse.json({
        success: true,
        data: assessment
      })
    }

    // Get user's latest assessment or create new one
    const { data: latestAssessment, error: latestError } = await supabase
      .from('assessments')
      .select('*')
      .eq('completion_status', 'in_progress')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (latestError && latestError.code !== 'PGRST116') {
      console.error('[DIAGNOSTIC-ASSESSMENT] Error fetching latest assessment:', latestError)
      return NextResponse.json({
        error: 'Failed to fetch assessment',
        details: latestError.message
      }, { status: 500 })
    }

    if (latestAssessment) {
      // Return existing in-progress assessment
      return NextResponse.json({
        success: true,
        data: latestAssessment,
        message: 'Resuming existing assessment'
      })
    }

    // Create new assessment
    const { data: newAssessment, error: createError } = await supabase
      .from('assessments')
      .insert({
        completion_status: 'in_progress',
        total_questions: 15, // Based on our question set
        questions_answered: 0
      })
      .select()
      .single()

    if (createError) {
      console.error('[DIAGNOSTIC-ASSESSMENT] Error creating assessment:', createError)
      return NextResponse.json({
        error: 'Failed to create assessment',
        details: createError.message
      }, { status: 500 })
    }

    console.log(`[DIAGNOSTIC-ASSESSMENT] Created new assessment: ${newAssessment.assessment_id}`)

    return NextResponse.json({
      success: true,
      data: newAssessment,
      message: 'New assessment created'
    })

  } catch (error) {
    console.error('[DIAGNOSTIC-ASSESSMENT] Unexpected error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// POST /api/diagnostic/assessment - Submit responses and complete assessment
export async function POST(request: NextRequest) {
  try {
    console.log('[DIAGNOSTIC-ASSESSMENT] POST request received')

    const body = await request.json()
    const { assessmentId, responses, userProfile } = body

    if (!assessmentId || !responses) {
      return NextResponse.json({
        error: 'Missing required fields',
        details: 'assessmentId and responses are required'
      }, { status: 400 })
    }

    // Validate responses format
    if (!Array.isArray(responses) || responses.length === 0) {
      return NextResponse.json({
        error: 'Invalid responses format',
        details: 'responses must be a non-empty array'
      }, { status: 400 })
    }

    // Get all questions for validation and calculation
    const { data: questions, error: questionsError } = await supabase
      .from('diagnostic_questions')
      .select('*')
      .eq('is_active', true)
      .order('question_order')

    if (questionsError || !questions) {
      return NextResponse.json({
        error: 'Failed to load questions',
        details: questionsError?.message || 'No questions found'
      }, { status: 500 })
    }

    // Insert all responses
    const responseInserts = responses.map((resp: DiagnosticResponse) => ({
      assessment_id: assessmentId,
      question_id: resp.question_id,
      score: resp.score,
      response_time_seconds: resp.response_time_seconds || null
    }))

    const { error: responseError } = await supabase
      .from('diagnostic_responses')
      .upsert(responseInserts, { onConflict: 'assessment_id,question_id' })

    if (responseError) {
      console.error('[DIAGNOSTIC-ASSESSMENT] Error saving responses:', responseError)
      return NextResponse.json({
        error: 'Failed to save responses',
        details: responseError.message
      }, { status: 500 })
    }

    // Calculate component scores
    const componentScores = calculateComponentScores(responses, questions)
    const overallScore = Object.values(componentScores).reduce((sum, score) => sum + score, 0) / 6

    // Detect archetype
    const archetype = detectArchetype(componentScores, responses, questions)

    // Update assessment with calculated scores
    const { data: updatedAssessment, error: updateError } = await supabase
      .from('assessments')
      .update({
        overall_score: overallScore,
        money_freedom_score: componentScores.money_freedom,
        systems_freedom_score: componentScores.systems_freedom,
        team_freedom_score: componentScores.team_freedom,
        stress_freedom_score: componentScores.stress_freedom,
        time_freedom_score: componentScores.time_freedom,
        impact_freedom_score: componentScores.impact_freedom,
        archetype: archetype.name,
        archetype_confidence: archetype.confidence,
        completion_status: 'completed',
        questions_answered: responses.length
      })
      .eq('assessment_id', assessmentId)
      .select()
      .single()

    if (updateError) {
      console.error('[DIAGNOSTIC-ASSESSMENT] Error updating assessment:', updateError)
      return NextResponse.json({
        error: 'Failed to update assessment',
        details: updateError.message
      }, { status: 500 })
    }

    // Generate sprint recommendations
    const recommendations = await generateSprintRecommendations(
      assessmentId,
      componentScores,
      archetype,
      questions
    )

    console.log(`[DIAGNOSTIC-ASSESSMENT] Assessment completed: ${assessmentId}`)
    console.log(`[DIAGNOSTIC-ASSESSMENT] Overall score: ${overallScore.toFixed(1)}`)
    console.log(`[DIAGNOSTIC-ASSESSMENT] Archetype: ${archetype.name}`)

    return NextResponse.json({
      success: true,
      data: {
        assessment: updatedAssessment,
        componentScores,
        archetype,
        recommendations,
        summary: {
          overallScore: parseFloat(overallScore.toFixed(1)),
          questionsAnswered: responses.length,
          completionDate: new Date().toISOString(),
          strongestComponent: Object.entries(componentScores)
            .reduce((a, b) => a[1] > b[1] ? a : b)[0],
          weakestComponent: Object.entries(componentScores)
            .reduce((a, b) => a[1] < b[1] ? a : b)[0]
        }
      }
    })

  } catch (error) {
    console.error('[DIAGNOSTIC-ASSESSMENT] POST error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Helper function to calculate component scores
function calculateComponentScores(
  responses: DiagnosticResponse[],
  questions: DiagnosticQuestion[]
): ComponentScores {
  const componentTotals: { [key: string]: { sum: number, weightSum: number } } = {
    money_freedom: { sum: 0, weightSum: 0 },
    systems_freedom: { sum: 0, weightSum: 0 },
    team_freedom: { sum: 0, weightSum: 0 },
    stress_freedom: { sum: 0, weightSum: 0 },
    time_freedom: { sum: 0, weightSum: 0 },
    impact_freedom: { sum: 0, weightSum: 0 }
  }

  // Map responses for quick lookup
  const responseMap = new Map(responses.map(r => [r.question_id, r.score]))

  // Calculate weighted scores for each component
  questions.forEach(question => {
    const response = responseMap.get(question.question_id)
    if (response !== undefined) {
      const component = question.component
      if (componentTotals[component]) {
        // Convert 1-10 scale to 0-100 scale: (score-1) * 100/9
        const normalizedScore = ((response - 1) * 100) / 9
        componentTotals[component].sum += normalizedScore * question.weight
        componentTotals[component].weightSum += question.weight
      }
    }
  })

  // Calculate final scores
  const componentScores: ComponentScores = {
    money_freedom: Math.round(componentTotals.money_freedom.sum / componentTotals.money_freedom.weightSum),
    systems_freedom: Math.round(componentTotals.systems_freedom.sum / componentTotals.systems_freedom.weightSum),
    team_freedom: Math.round(componentTotals.team_freedom.sum / componentTotals.team_freedom.weightSum),
    stress_freedom: Math.round(componentTotals.stress_freedom.sum / componentTotals.stress_freedom.weightSum),
    time_freedom: Math.round(componentTotals.time_freedom.sum / componentTotals.time_freedom.weightSum),
    impact_freedom: Math.round(componentTotals.impact_freedom.sum / componentTotals.impact_freedom.weightSum)
  }

  return componentScores
}

// Helper function to detect archetype based on score patterns
function detectArchetype(
  scores: ComponentScores,
  responses: DiagnosticResponse[],
  questions: DiagnosticQuestion[]
): { name: string, confidence: number, description: string } {
  const overall = Object.values(scores).reduce((sum, score) => sum + score, 0) / 6

  // Analyze score patterns
  const highScores = Object.entries(scores).filter(([_, score]) => score >= 70)
  const lowScores = Object.entries(scores).filter(([_, score]) => score <= 50)

  const systemsScore = scores.systems_freedom
  const teamScore = scores.team_freedom
  const timeScore = scores.time_freedom
  const impactScore = scores.impact_freedom

  // Archetype detection logic
  if (impactScore >= 65 && (systemsScore <= 50 || teamScore <= 40)) {
    return {
      name: 'bottleneck_boss',
      confidence: 0.85,
      description: 'High-achieving entrepreneur who has become the limiting factor in their own business growth.'
    }
  }

  if (impactScore >= 70 && systemsScore <= 45 && overall >= 45) {
    return {
      name: 'custom_queen',
      confidence: 0.80,
      description: 'Service provider who creates bespoke solutions for every client, limiting scalability.'
    }
  }

  if (overall <= 55 && lowScores.length >= 3) {
    return {
      name: 'scattered_starter',
      confidence: 0.75,
      description: 'Early-stage entrepreneur juggling multiple priorities without clear systems.'
    }
  }

  if (overall >= 60 && overall <= 75 && highScores.length >= 3) {
    return {
      name: 'steady_operator',
      confidence: 0.70,
      description: 'Established business owner with decent systems but lacking growth edge.'
    }
  }

  if (overall >= 75 && highScores.length >= 4) {
    return {
      name: 'freedom_achiever',
      confidence: 0.90,
      description: 'Advanced entrepreneur who has achieved significant business freedom but wants optimization.'
    }
  }

  // Default fallback
  return {
    name: 'steady_operator',
    confidence: 0.60,
    description: 'Balanced business owner with room for improvement across multiple areas.'
  }
}

// Helper function to generate sprint recommendations
async function generateSprintRecommendations(
  assessmentId: string,
  scores: ComponentScores,
  archetype: { name: string, confidence: number },
  questions: DiagnosticQuestion[]
) {
  try {
    // Get all available sprints
    const { data: sprints, error: sprintsError } = await supabase
      .from('sprints')
      .select('*')
      .eq('is_active', true)
      .order('recommended_order')

    if (sprintsError || !sprints) {
      console.error('[GENERATE-RECOMMENDATIONS] Error fetching sprints:', sprintsError)
      return []
    }

    // Find lowest scoring components for targeted recommendations
    const sortedComponents = Object.entries(scores)
      .sort((a, b) => a[1] - b[1])
      .slice(0, 3) // Top 3 lowest scores

    const recommendations = []
    let priorityRank = 1

    // Primary recommendations based on lowest scores
    for (const [component, score] of sortedComponents) {
      if (score < 70) { // Only recommend if score needs improvement
        const componentSprints = sprints.filter(sprint =>
          sprint.primary_component === component
        )

        if (componentSprints.length > 0) {
          const sprint = componentSprints[0] // Take first (usually most important)

          recommendations.push({
            assessment_id: assessmentId,
            sprint_id: sprint.sprint_id,
            priority_rank: priorityRank,
            confidence_score: 0.85,
            reasoning: `Your ${component.replace('_', ' ')} score of ${score}% indicates significant room for improvement. This sprint targets the core systems needed to boost this area.`,
            estimated_impact_points: sprint.expected_score_improvement,
            estimated_time_to_complete: Math.ceil(sprint.estimated_time_hours / 8), // Convert hours to days
            status: 'recommended'
          })

          priorityRank++
        }
      }
    }

    // Archetype-specific recommendations
    const archetypeSprintMap: { [key: string]: string[] } = {
      bottleneck_boss: ['S7', 'S4', 'S5'], // Delegation, Onboarding, Service Delivery
      custom_queen: ['S3', 'S5', 'S2'], // Offer Stabilization, Service Delivery, Pricing
      scattered_starter: ['S1', 'S4', 'S11'], // Acquisition, Onboarding, Time Management
      steady_operator: ['S13', 'S1', 'S15'], // Growth Priority, Acquisition, Vision
      freedom_achiever: ['S13', 'S15', 'S9'] // Growth Priority, Vision, Reporting
    }

    const archetypeRecommendedSprints = archetypeSprintMap[archetype.name] || []

    for (const sprintKey of archetypeRecommendedSprints) {
      const sprint = sprints.find(s => s.sprint_key === sprintKey)
      if (sprint && !recommendations.find(r => r.sprint_id === sprint.sprint_id)) {
        recommendations.push({
          assessment_id: assessmentId,
          sprint_id: sprint.sprint_id,
          priority_rank: priorityRank,
          confidence_score: 0.75,
          reasoning: `As a ${archetype.name.replace('_', ' ')}, this sprint addresses common growth patterns for your archetype.`,
          estimated_impact_points: sprint.expected_score_improvement,
          estimated_time_to_complete: Math.ceil(sprint.estimated_time_hours / 8),
          status: 'recommended'
        })

        priorityRank++
        if (priorityRank > 5) break // Limit to top 5 recommendations
      }
    }

    // Save recommendations to database
    if (recommendations.length > 0) {
      const { error: saveError } = await supabase
        .from('recommendations')
        .insert(recommendations)

      if (saveError) {
        console.error('[GENERATE-RECOMMENDATIONS] Error saving recommendations:', saveError)
      }
    }

    // Fetch the saved recommendations with sprint data for return
    if (recommendations.length > 0) {
      const { data: fullRecommendations, error: fetchError } = await supabase
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
        .eq('assessment_id', assessmentId)
        .order('priority_rank')

      if (fetchError) {
        console.error('[GENERATE-RECOMMENDATIONS] Error fetching full recommendations:', fetchError)
        return recommendations
      }

      return fullRecommendations || recommendations
    }

    return recommendations

  } catch (error) {
    console.error('[GENERATE-RECOMMENDATIONS] Error:', error)
    return []
  }
}