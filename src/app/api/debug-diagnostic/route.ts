import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('[DEBUG-DIAGNOSTIC] Checking database setup...')

    // Check if tables exist and have data
    const checks = []

    // Check diagnostic_questions table
    const { data: questions, error: questionsError } = await supabase
      .from('diagnostic_questions')
      .select('count')
      .limit(1)

    checks.push({
      table: 'diagnostic_questions',
      exists: !questionsError,
      error: questionsError?.message,
      hasData: questions && questions.length > 0
    })

    // Check sprints table
    const { data: sprints, error: sprintsError } = await supabase
      .from('sprints')
      .select('count')
      .limit(1)

    checks.push({
      table: 'sprints',
      exists: !sprintsError,
      error: sprintsError?.message,
      hasData: sprints && sprints.length > 0
    })

    // Check assessments table
    const { data: assessments, error: assessmentsError } = await supabase
      .from('assessments')
      .select('count')
      .limit(1)

    checks.push({
      table: 'assessments',
      exists: !assessmentsError,
      error: assessmentsError?.message,
      hasData: assessments && assessments.length > 0
    })

    // Try to get actual question count
    let questionCount = 0
    if (!questionsError) {
      const { count } = await supabase
        .from('diagnostic_questions')
        .select('*', { count: 'exact' })

      questionCount = count || 0
    }

    return NextResponse.json({
      success: true,
      data: {
        checks,
        questionCount,
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
        hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('[DEBUG-DIAGNOSTIC] Error:', error)
    return NextResponse.json({
      error: 'Debug check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}