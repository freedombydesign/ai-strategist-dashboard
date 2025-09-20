import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../../lib/supabase'

// GET /api/diagnostic/questions - Get all diagnostic questions
export async function GET(request: NextRequest) {
  try {
    console.log('[DIAGNOSTIC-QUESTIONS] GET request received')

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const component = searchParams.get('component')

    let query = supabase
      .from('diagnostic_questions')
      .select('*')
      .eq('is_active', true)
      .order('question_order')

    // Apply filters if provided
    if (category) {
      query = query.eq('category', category)
    }

    if (component) {
      query = query.eq('component', component)
    }

    const { data: questions, error } = await query

    if (error) {
      console.error('[DIAGNOSTIC-QUESTIONS] Error fetching questions:', error)
      return NextResponse.json({
        error: 'Failed to fetch questions',
        details: error.message
      }, { status: 500 })
    }

    if (!questions || questions.length === 0) {
      return NextResponse.json({
        error: 'No questions found',
        details: 'The diagnostic question database may not be initialized'
      }, { status: 404 })
    }

    // Group questions by category for better organization
    const questionsByCategory = questions.reduce((acc: any, question) => {
      if (!acc[question.category]) {
        acc[question.category] = []
      }
      acc[question.category].push(question)
      return acc
    }, {})

    console.log(`[DIAGNOSTIC-QUESTIONS] Returning ${questions.length} questions`)

    return NextResponse.json({
      success: true,
      data: {
        questions,
        questionsByCategory,
        categories: Object.keys(questionsByCategory),
        totalQuestions: questions.length,
        metadata: {
          components: ['money_freedom', 'systems_freedom', 'team_freedom', 'stress_freedom', 'time_freedom', 'impact_freedom'],
          scaleRange: { min: 1, max: 10 },
          estimatedTimeMinutes: questions.length * 2 // ~2 minutes per question
        }
      }
    })

  } catch (error) {
    console.error('[DIAGNOSTIC-QUESTIONS] Unexpected error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET /api/diagnostic/questions/[id] - Get specific question
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { questionId } = body

    if (!questionId) {
      return NextResponse.json({
        error: 'Missing questionId',
        details: 'questionId is required'
      }, { status: 400 })
    }

    const { data: question, error } = await supabase
      .from('diagnostic_questions')
      .select('*')
      .eq('question_id', questionId)
      .eq('is_active', true)
      .single()

    if (error) {
      return NextResponse.json({
        error: 'Question not found',
        details: error.message
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: question
    })

  } catch (error) {
    console.error('[DIAGNOSTIC-QUESTIONS] POST error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}