import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { userId, sprintKey, stepNumber, stepTitle, status, notes } = await request.json()
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    console.log('[SPRINT-PROGRESS] Updating progress:', {
      userId, sprintKey, stepNumber, stepTitle, status
    })

    // Get the sprint ID first
    let sprintId = null
    if (sprintKey) {
      const { data: sprintData, error: sprintError } = await supabase
        .from('sprints')
        .select('id')
        .eq('sprint_key', sprintKey)
        .single()

      if (sprintError) {
        console.error('[SPRINT-PROGRESS] Error finding sprint:', sprintError)
        return NextResponse.json({ error: 'Sprint not found' }, { status: 404 })
      }
      sprintId = sprintData.id
    }

    // Update or create user progress
    const progressData = {
      user_id: userId,
      sprint_id: sprintId,
      step_number: stepNumber || null,
      step_title: stepTitle || null,
      status: status || 'started',
      notes: notes || null,
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('user_steps')
      .upsert(progressData, {
        onConflict: 'user_id,sprint_id'
      })
      .select()

    if (error) {
      console.error('[SPRINT-PROGRESS] Error updating progress:', error)
      return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 })
    }

    console.log('[SPRINT-PROGRESS] Progress updated successfully:', data?.[0])

    return NextResponse.json({
      success: true,
      data: data?.[0]
    })

  } catch (error) {
    console.error('[SPRINT-PROGRESS] API error:', error)
    return NextResponse.json({
      error: 'Failed to update sprint progress',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const sprintKey = searchParams.get('sprintKey')
    const debug = searchParams.get('debug')
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    console.log('[SPRINT-PROGRESS] Getting progress for:', { userId, sprintKey, debug })

    // First, get all user_steps for debugging
    const { data: allSteps, error: allError } = await supabase
      .from('user_steps')
      .select('*, sprints(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      
    console.log('[SPRINT-PROGRESS] All user steps found:', allSteps?.length || 0)
    if (allSteps) {
      console.log('[SPRINT-PROGRESS] Step details:', allSteps.map(s => ({
        id: s.id,
        sprint_id: s.sprint_id,
        step_number: s.step_number,
        step_title: s.step_title,
        status: s.status,
        sprint_name: s.sprints?.name
      })))
    }

    if (debug === 'true') {
      return NextResponse.json({
        success: true,
        debug: true,
        userId,
        totalSteps: allSteps?.length || 0,
        allSteps: allSteps?.map(s => ({
          id: s.id,
          sprint_id: s.sprint_id,
          step_number: s.step_number,
          step_title: s.step_title,
          status: s.status,
          created_at: s.created_at,
          sprint: s.sprints
        })) || []
      })
    }

    // Regular query logic
    let query = supabase
      .from('user_steps')
      .select('*, sprints(*)')
      .eq('user_id', userId)

    if (sprintKey) {
      query = query.eq('sprints.sprint_key', sprintKey)
    }

    const { data, error } = await query
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('[SPRINT-PROGRESS] Error fetching progress:', error)
      return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 })
    }

    // If no data found, try to fix the most recent sprint
    if (!data || data.length === 0) {
      console.log('[SPRINT-PROGRESS] No progress found, checking if we can fix latest sprint...')
      
      if (allSteps && allSteps.length > 0) {
        const latestSprint = allSteps[0]
        console.log('[SPRINT-PROGRESS] Found latest sprint to fix:', latestSprint.id)
        
        // Update it with proper step tracking
        const { data: fixed, error: fixError } = await supabase
          .from('user_steps')
          .update({
            step_number: latestSprint.step_number || 1,
            step_title: latestSprint.step_title || 'Getting Started',
            status: 'started',
            updated_at: new Date().toISOString()
          })
          .eq('id', latestSprint.id)
          .select('*, sprints(*)')
          
        if (fixError) {
          console.error('[SPRINT-PROGRESS] Error fixing sprint:', fixError)
        } else {
          console.log('[SPRINT-PROGRESS] Sprint fixed successfully')
          return NextResponse.json({
            success: true,
            fixed: true,
            data: fixed || []
          })
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: data || []
    })

  } catch (error) {
    console.error('[SPRINT-PROGRESS] API error:', error)
    return NextResponse.json({
      error: 'Failed to fetch sprint progress',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}