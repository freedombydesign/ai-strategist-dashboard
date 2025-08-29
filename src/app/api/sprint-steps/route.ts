import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sprintId = searchParams.get('sprintId')
    const sprintKey = searchParams.get('sprintKey')
    
    if (!sprintId && !sprintKey) {
      return NextResponse.json({ error: 'Sprint ID or Key is required' }, { status: 400 })
    }

    console.log('[SPRINT-STEPS] Getting steps for:', { sprintId, sprintKey })

    let query = supabase
      .from('steps')
      .select('*')
      .order('day_number')
      .order('order_index')

    if (sprintId) {
      query = query.eq('sprint_id', sprintId)
    } else if (sprintKey) {
      // First get sprint ID from sprint key
      const { data: sprintData, error: sprintError } = await supabase
        .from('sprints')
        .select('id')
        .eq('sprint_key', sprintKey)
        .single()

      if (sprintError) {
        console.error('[SPRINT-STEPS] Error finding sprint:', sprintError)
        return NextResponse.json({ error: 'Sprint not found' }, { status: 404 })
      }
      
      query = query.eq('sprint_id', sprintData.id)
    }

    const { data, error } = await query

    if (error) {
      console.error('[SPRINT-STEPS] Error fetching steps:', error)
      return NextResponse.json({ error: 'Failed to fetch sprint steps' }, { status: 500 })
    }

    console.log('[SPRINT-STEPS] Found', data?.length || 0, 'steps')

    return NextResponse.json({
      success: true,
      data: data || []
    })

  } catch (error) {
    console.error('[SPRINT-STEPS] API error:', error)
    return NextResponse.json({
      error: 'Failed to fetch sprint steps',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// POST endpoint to create/update sprint steps
export async function POST(request: NextRequest) {
  try {
    const { sprintId, steps } = await request.json()
    
    if (!sprintId || !Array.isArray(steps)) {
      return NextResponse.json({ error: 'Sprint ID and steps array are required' }, { status: 400 })
    }

    console.log('[SPRINT-STEPS] Creating/updating steps for sprint:', sprintId)

    // Insert steps with proper ordering
    const stepsData = steps.map((step, index) => ({
      ...step,
      sprint_id: sprintId,
      order_index: step.order_index || index,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }))

    const { data, error } = await supabase
      .from('steps')
      .upsert(stepsData, {
        onConflict: 'sprint_id,order_index'
      })
      .select()

    if (error) {
      console.error('[SPRINT-STEPS] Error creating steps:', error)
      return NextResponse.json({ error: 'Failed to create sprint steps' }, { status: 500 })
    }

    console.log('[SPRINT-STEPS] Created/updated', data?.length || 0, 'steps')

    return NextResponse.json({
      success: true,
      data: data
    })

  } catch (error) {
    console.error('[SPRINT-STEPS] API error:', error)
    return NextResponse.json({
      error: 'Failed to create sprint steps',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}