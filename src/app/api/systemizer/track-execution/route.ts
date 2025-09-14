import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../../lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      workflowId,
      timeSavedMinutes,
      automationPercentage,
      status = 'completed',
      executionContext = {}
    } = body

    console.log('[Track Execution] Recording workflow execution:', {
      workflowId,
      timeSavedMinutes,
      automationPercentage,
      status
    })

    // Validate required fields
    if (!workflowId) {
      return NextResponse.json({
        success: false,
        error: 'Missing required field: workflowId'
      }, { status: 400 })
    }

    // Verify workflow exists
    const { data: workflow, error: workflowError } = await supabase
      .from('systemizer_workflows')
      .select('id, name, usage_count')
      .eq('id', workflowId)
      .single()

    if (workflowError || !workflow) {
      return NextResponse.json({
        success: false,
        error: 'Workflow not found'
      }, { status: 404 })
    }

    // Insert execution record
    const { data: execution, error: executionError } = await supabase
      .from('systemizer_workflow_executions')
      .insert({
        workflow_id: workflowId,
        executed_at: new Date().toISOString(),
        time_saved_minutes: timeSavedMinutes || 0,
        automation_percentage: automationPercentage || workflow.automation_percentage || 0,
        status,
        execution_context: executionContext
      })
      .select()
      .single()

    if (executionError) {
      console.error('[Track Execution] Error inserting execution:', executionError)
      return NextResponse.json({
        success: false,
        error: 'Failed to record workflow execution'
      }, { status: 500 })
    }

    // Update workflow usage count
    const newUsageCount = (workflow.usage_count || 0) + 1
    const { error: updateError } = await supabase
      .from('systemizer_workflows')
      .update({
        usage_count: newUsageCount,
        last_executed_at: new Date().toISOString()
      })
      .eq('id', workflowId)

    if (updateError) {
      console.log('[Track Execution] Warning: Could not update usage count:', updateError.message)
    }

    // Update freedom score if significant time was saved
    if (timeSavedMinutes && timeSavedMinutes > 60) {
      // Calculate freedom score impact (simplified calculation)
      const freedomScoreIncrease = Math.floor(timeSavedMinutes / 60 * 0.5) // 0.5 points per hour saved

      const { error: scoreError } = await supabase
        .from('freedom_score_components')
        .update({
          current_score: supabase.raw(`current_score + ${freedomScoreIncrease}`),
          updated_at: new Date().toISOString()
        })
        .eq('component_name', 'Process Automation')

      if (scoreError) {
        console.log('[Track Execution] Warning: Could not update freedom score:', scoreError.message)
      } else {
        console.log('[Track Execution] Updated freedom score by', freedomScoreIncrease, 'points')
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        execution,
        workflowName: workflow.name,
        newUsageCount,
        timeSavedMinutes: timeSavedMinutes || 0,
        executionId: execution.id
      }
    })

  } catch (error) {
    console.error('[Track Execution] Unexpected error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error while tracking execution'
    }, { status: 500 })
  }
}

// GET endpoint to retrieve execution history for a workflow
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const workflowId = searchParams.get('workflowId')
    const limit = parseInt(searchParams.get('limit') || '50')

    if (!workflowId) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameter: workflowId'
      }, { status: 400 })
    }

    const { data: executions, error } = await supabase
      .from('systemizer_workflow_executions')
      .select(`
        id,
        executed_at,
        time_saved_minutes,
        automation_percentage,
        status,
        execution_context
      `)
      .eq('workflow_id', workflowId)
      .order('executed_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('[Track Execution] Error fetching executions:', error)
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch execution history'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: {
        executions: executions || [],
        total: executions?.length || 0
      }
    })

  } catch (error) {
    console.error('[Track Execution] Unexpected error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error while fetching executions'
    }, { status: 500 })
  }
}