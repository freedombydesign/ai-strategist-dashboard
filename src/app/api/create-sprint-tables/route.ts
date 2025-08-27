import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('[CHECK-TABLES] Checking existing database tables')

    // Try to list existing tables
    const queries = [
      { name: 'users', query: supabase.from('users').select('id').limit(1) },
      { name: 'sprints', query: supabase.from('sprints').select('id').limit(1) },
      { name: 'steps', query: supabase.from('steps').select('id').limit(1) },
      { name: 'user_steps', query: supabase.from('user_steps').select('id').limit(1) },
      { name: 'user_sprint_progress', query: supabase.from('user_sprint_progress').select('id').limit(1) },
      { name: 'user_step_progress', query: supabase.from('user_step_progress').select('id').limit(1) },
      { name: 'freedom_responses', query: supabase.from('freedom_responses').select('id').limit(1) },
      { name: 'freedom_diagnostic_questions', query: supabase.from('freedom_diagnostic_questions').select('id').limit(1) }
    ]

    const results: Record<string, any> = {}

    for (const { name, query } of queries) {
      try {
        const { data, error } = await query
        results[name] = error ? { error: error.message, code: error.code } : { exists: true, count: data?.length || 0 }
      } catch (err) {
        results[name] = { error: err instanceof Error ? err.message : 'Unknown error' }
      }
    }

    console.log('[CHECK-TABLES] Table check results:', results)

    return NextResponse.json({
      success: true,
      tables: results,
      message: 'Table check completed'
    })

  } catch (error) {
    console.error('[CHECK-TABLES] Unexpected error:', error)
    return NextResponse.json({
      error: 'Failed to check tables',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}