import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../../lib/supabase'

// Freedom Score components
const FREEDOM_COMPONENTS = [
  'time_freedom',
  'money_freedom',
  'impact_freedom',
  'systems_freedom',
  'team_freedom',
  'stress_freedom'
] as const

type FreedomComponent = typeof FREEDOM_COMPONENTS[number]

interface FreedomScores {
  time_freedom: number
  money_freedom: number
  impact_freedom: number
  systems_freedom: number
  team_freedom: number
  stress_freedom: number
}

interface FreedomScoreRecord {
  id: number
  user_id: string
  assessment_date: string
  time_freedom: number
  money_freedom: number
  impact_freedom: number
  systems_freedom: number
  team_freedom: number
  stress_freedom: number
  overall_score: number
  assessment_method: string
  notes?: string
  created_at: string
}

// GET /api/dashboard/freedom-score
export async function GET(request: NextRequest) {
  try {
    console.log('[FREEDOM-SCORE] GET request received')

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30d'
    const includeHistory = searchParams.get('includeHistory') === 'true'
    const includeTrends = searchParams.get('includeTrends') === 'true'

    // Get date range based on period
    const periodDays = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365
    }

    const days = periodDays[period as keyof typeof periodDays] || 30
    const fromDate = new Date()
    fromDate.setDate(fromDate.getDate() - days)

    console.log(`[FREEDOM-SCORE] Fetching scores for period: ${period} (${days} days)`)

    // Get current/latest freedom score
    const { data: latestScore, error: latestError } = await supabase
      .from('freedom_scores')
      .select('*')
      .order('assessment_date', { ascending: false })
      .limit(1)
      .single()

    if (latestError && latestError.code !== 'PGRST116') {
      console.error('[FREEDOM-SCORE] Error fetching latest score:', latestError)
      return NextResponse.json({
        error: 'Failed to fetch freedom score',
        details: latestError.message
      }, { status: 500 })
    }

    // If no scores exist, return default structure
    if (!latestScore) {
      console.log('[FREEDOM-SCORE] No scores found, returning default structure')
      return NextResponse.json({
        success: true,
        data: {
          currentScore: null,
          history: [],
          trends: {},
          insights: [
            {
              type: "info",
              message: "No freedom score assessments recorded yet. Complete your first assessment to see insights.",
              priority: "low"
            }
          ],
          recommendations: [
            {
              sprintKey: "S1",
              title: "Complete Your First Freedom Assessment",
              description: "Record your current freedom levels across all 6 components",
              priority: 1,
              estimatedImpact: "Establish baseline for tracking progress"
            }
          ]
        }
      })
    }

    // Calculate overall score from components
    const componentScores = {
      time_freedom: latestScore.time_freedom,
      money_freedom: latestScore.money_freedom,
      impact_freedom: latestScore.impact_freedom,
      systems_freedom: latestScore.systems_freedom,
      team_freedom: latestScore.team_freedom,
      stress_freedom: latestScore.stress_freedom
    }

    const overallScore = Math.round(
      Object.values(componentScores).reduce((sum, score) => sum + score, 0) / 6
    )

    // Get historical data if requested
    let historyData = []
    let trendsData = {}

    if (includeHistory) {
      const { data: history, error: historyError } = await supabase
        .from('freedom_scores')
        .select('*')
        .gte('assessment_date', fromDate.toISOString().split('T')[0])
        .order('assessment_date', { ascending: true })

      if (!historyError && history) {
        historyData = history.map(record => ({
          date: record.assessment_date,
          score: Math.round(
            (record.time_freedom + record.money_freedom + record.impact_freedom +
             record.systems_freedom + record.team_freedom + record.stress_freedom) / 6
          ),
          components: {
            time_freedom: record.time_freedom,
            money_freedom: record.money_freedom,
            impact_freedom: record.impact_freedom,
            systems_freedom: record.systems_freedom,
            team_freedom: record.team_freedom,
            stress_freedom: record.stress_freedom
          }
        }))
      }
    }

    // Calculate trends if requested
    if (includeTrends && historyData.length > 1) {
      const firstScore = historyData[0].score
      const lastScore = historyData[historyData.length - 1].score
      const scoreDiff = lastScore - firstScore
      const velocity = scoreDiff / historyData.length

      trendsData = {
        overall: {
          direction: scoreDiff > 2 ? 'improving' : scoreDiff < -2 ? 'declining' : 'stable',
          velocity: parseFloat(velocity.toFixed(2)),
          consistency: Math.abs(velocity) < 1 ? 'stable' : 'variable'
        },
        components: {}
      }

      // Calculate component trends
      for (const component of FREEDOM_COMPONENTS) {
        const firstComponentScore = historyData[0].components[component]
        const lastComponentScore = historyData[historyData.length - 1].components[component]
        const componentDiff = lastComponentScore - firstComponentScore
        const componentVelocity = componentDiff / historyData.length

        trendsData.components[component] = {
          direction: componentDiff > 2 ? 'improving' : componentDiff < -2 ? 'declining' : 'stable',
          velocity: parseFloat(componentVelocity.toFixed(2))
        }
      }
    }

    // Calculate comparison with previous score
    let pointsChanged = 0
    let percentageChange = 0
    let trend = 'stable'

    if (historyData.length > 1) {
      const previousScore = historyData[historyData.length - 2].score
      pointsChanged = overallScore - previousScore
      percentageChange = parseFloat(((pointsChanged / previousScore) * 100).toFixed(2))
      trend = pointsChanged > 2 ? 'improving' : pointsChanged < -2 ? 'declining' : 'stable'
    }

    // Generate insights and recommendations
    const insights = generateInsights(componentScores, trendsData)
    const recommendations = generateRecommendations(componentScores, trendsData)

    console.log(`[FREEDOM-SCORE] Returning data for score: ${overallScore}`)

    return NextResponse.json({
      success: true,
      data: {
        currentScore: {
          overall: overallScore,
          scoreDate: latestScore.assessment_date,
          components: componentScores,
          trend,
          pointsChanged,
          percentageChange
        },
        ...(includeHistory && { history: historyData }),
        ...(includeTrends && { trends: trendsData }),
        insights,
        recommendations
      }
    })

  } catch (error) {
    console.error('[FREEDOM-SCORE] Unexpected error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// POST /api/dashboard/freedom-score
export async function POST(request: NextRequest) {
  try {
    console.log('[FREEDOM-SCORE] POST request received')

    const body = await request.json()
    const {
      assessmentDate,
      scores,
      assessmentMethod = 'dashboard_update',
      notes,
      recommendations: userRecommendations
    } = body

    // Validate required fields
    if (!assessmentDate || !scores) {
      return NextResponse.json({
        error: 'Missing required fields',
        details: 'assessmentDate and scores are required'
      }, { status: 400 })
    }

    // Validate score components
    for (const component of FREEDOM_COMPONENTS) {
      if (typeof scores[component] !== 'number' || scores[component] < 0 || scores[component] > 100) {
        return NextResponse.json({
          error: `Invalid score for ${component}`,
          details: `Score must be a number between 0 and 100`
        }, { status: 400 })
      }
    }

    // Calculate overall score
    const overallScore = Math.round(
      Object.values(scores).reduce((sum: number, score) => sum + (score as number), 0) / 6
    )

    console.log(`[FREEDOM-SCORE] Calculated overall score: ${overallScore}`)

    // Get previous score for comparison
    const { data: previousScore } = await supabase
      .from('freedom_scores')
      .select('overall_score, assessment_date')
      .order('assessment_date', { ascending: false })
      .limit(1)
      .single()

    const improvement = previousScore ? overallScore - previousScore.overall_score : 0

    // Insert new freedom score record
    const { data: newScore, error: insertError } = await supabase
      .from('freedom_scores')
      .insert({
        assessment_date: assessmentDate,
        time_freedom: scores.time_freedom,
        money_freedom: scores.money_freedom,
        impact_freedom: scores.impact_freedom,
        systems_freedom: scores.systems_freedom,
        team_freedom: scores.team_freedom,
        stress_freedom: scores.stress_freedom,
        overall_score: overallScore,
        assessment_method: assessmentMethod,
        notes: notes || null
      })
      .select()
      .single()

    if (insertError) {
      console.error('[FREEDOM-SCORE] Insert error:', insertError)
      return NextResponse.json({
        error: 'Failed to save freedom score',
        details: insertError.message
      }, { status: 500 })
    }

    // Generate new recommendations based on scores
    const newRecommendations = generateRecommendations(scores as FreedomScores, {})

    // Calculate next assessment date (7 days from now)
    const nextAssessmentDate = new Date(assessmentDate)
    nextAssessmentDate.setDate(nextAssessmentDate.getDate() + 7)

    console.log(`[FREEDOM-SCORE] Successfully saved score with ID: ${newScore.id}`)

    return NextResponse.json({
      success: true,
      data: {
        scoreId: newScore.id,
        calculatedOverallScore: overallScore,
        previousScore: previousScore?.overall_score || null,
        improvement,
        newRecommendations,
        nextAssessmentDate: nextAssessmentDate.toISOString().split('T')[0]
      }
    })

  } catch (error) {
    console.error('[FREEDOM-SCORE] POST error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Helper function to generate insights
function generateInsights(scores: FreedomScores, trends: any) {
  const insights = []

  // Find highest and lowest scoring components
  const entries = Object.entries(scores)
  const highest = entries.reduce((a, b) => a[1] > b[1] ? a : b)
  const lowest = entries.reduce((a, b) => a[1] < b[1] ? a : b)

  if (highest[1] >= 80) {
    insights.push({
      type: "positive",
      message: `Your ${highest[0].replace('_', ' ')} is excellent at ${highest[1]}%. This is a major strength.`,
      priority: "medium"
    })
  }

  if (lowest[1] <= 50) {
    insights.push({
      type: "warning",
      message: `Your ${lowest[0].replace('_', ' ')} needs attention at ${lowest[1]}%. Focus here for quick wins.`,
      priority: "high"
    })
  }

  // Overall score insights
  const overall = Math.round(Object.values(scores).reduce((sum, score) => sum + score, 0) / 6)
  if (overall >= 80) {
    insights.push({
      type: "positive",
      message: `Outstanding overall freedom score of ${overall}%! You're operating at a high level.`,
      priority: "low"
    })
  } else if (overall <= 60) {
    insights.push({
      type: "action",
      message: `Your freedom score of ${overall}% has room for improvement. Focus on your lowest-scoring areas.`,
      priority: "high"
    })
  }

  return insights.length > 0 ? insights : [{
    type: "info",
    message: "Your freedom assessment is complete. Review recommendations below for improvement opportunities.",
    priority: "low"
  }]
}

// Helper function to generate recommendations
function generateRecommendations(scores: FreedomScores, trends: any) {
  const recommendations = []

  // Find the lowest scoring component for targeted improvement
  const entries = Object.entries(scores)
  const lowest = entries.reduce((a, b) => a[1] < b[1] ? a : b)

  const componentActions = {
    time_freedom: {
      title: "Optimize Time Management Systems",
      description: "Implement time-blocking, delegation, and automation tools",
      estimatedImpact: "15-25 point increase in time_freedom"
    },
    money_freedom: {
      title: "Improve Revenue Streams",
      description: "Diversify income, raise prices, or reduce expenses",
      estimatedImpact: "10-20 point increase in money_freedom"
    },
    impact_freedom: {
      title: "Amplify Your Impact",
      description: "Focus on high-leverage activities and meaningful work",
      estimatedImpact: "10-15 point increase in impact_freedom"
    },
    systems_freedom: {
      title: "Build Better Systems",
      description: "Document processes, automate workflows, create templates",
      estimatedImpact: "15-25 point increase in systems_freedom"
    },
    team_freedom: {
      title: "Strengthen Team Capabilities",
      description: "Hire specialists, improve training, delegate effectively",
      estimatedImpact: "10-20 point increase in team_freedom"
    },
    stress_freedom: {
      title: "Reduce Stress & Burnout",
      description: "Implement boundaries, self-care routines, and workload management",
      estimatedImpact: "10-20 point increase in stress_freedom"
    }
  }

  // Primary recommendation for lowest scoring area
  if (lowest[1] < 70) {
    const action = componentActions[lowest[0] as keyof typeof componentActions]
    recommendations.push({
      sprintKey: "S1",
      title: action.title,
      description: action.description,
      priority: 1,
      estimatedImpact: action.estimatedImpact
    })
  }

  // Secondary recommendations
  const secondLowest = entries.sort((a, b) => a[1] - b[1])[1]
  if (secondLowest && secondLowest[1] < 75) {
    const action = componentActions[secondLowest[0] as keyof typeof componentActions]
    recommendations.push({
      sprintKey: "S2",
      title: action.title,
      description: action.description,
      priority: 2,
      estimatedImpact: action.estimatedImpact
    })
  }

  return recommendations
}