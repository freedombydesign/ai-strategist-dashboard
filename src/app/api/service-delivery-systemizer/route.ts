import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { workflowName, workflowSteps } = await request.json()

    // Validate input
    if (!workflowName?.trim()) {
      return NextResponse.json({ error: 'Workflow name is required' }, { status: 400 })
    }

    if (!workflowSteps?.trim()) {
      return NextResponse.json({ error: 'Workflow steps are required' }, { status: 400 })
    }

    console.log('[SERVICE-DELIVERY-SYSTEMIZER] Processing workflow:', workflowName)

    // First, create the workflow template record
    const workflowTemplateData = {
      name: workflowName.trim(),
      description: `AI-processed workflow: ${workflowName}`,
      category: 'Service Delivery',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      metadata: {
        source: 'user_upload',
        original_steps: workflowSteps.trim(),
        processing_status: 'pending'
      }
    }

    const { data: workflowTemplate, error: templateError } = await supabase
      .from('service_workflow_templates')
      .insert(workflowTemplateData)
      .select()
      .single()

    if (templateError) {
      console.error('[SERVICE-DELIVERY-SYSTEMIZER] Template insert error:', templateError)
      return NextResponse.json({
        error: 'Failed to create workflow template',
        details: templateError.message
      }, { status: 500 })
    }

    console.log('[SERVICE-DELIVERY-SYSTEMIZER] Workflow template created:', workflowTemplate.id)

    // Parse workflow steps and create individual step records
    const steps = workflowSteps
      .split('\n')
      .map((step: string, index: number) => step.trim())
      .filter((step: string) => step.length > 0)
      .map((step: string, index: number) => ({
        workflow_template_id: workflowTemplate.id,
        step_number: index + 1,
        title: step.length > 100 ? step.substring(0, 100) + '...' : step,
        description: step,
        estimated_duration_hours: 1, // Default duration
        dependencies: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }))

    if (steps.length > 0) {
      const { error: stepsError } = await supabase
        .from('service_workflow_steps')
        .insert(steps)

      if (stepsError) {
        console.error('[SERVICE-DELIVERY-SYSTEMIZER] Steps insert error:', stepsError)
        // Continue processing even if steps fail to insert
        console.log('[SERVICE-DELIVERY-SYSTEMIZER] Continuing without step details due to error')
      } else {
        console.log('[SERVICE-DELIVERY-SYSTEMIZER] Workflow steps created:', steps.length)
      }
    }

    // Create initial analytics record
    try {
      const analyticsData = {
        workflow_template_id: workflowTemplate.id,
        total_steps: steps.length,
        completion_rate: 0,
        avg_completion_time_hours: 0,
        usage_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      await supabase
        .from('service_systemizer_analytics')
        .insert(analyticsData)

      console.log('[SERVICE-DELIVERY-SYSTEMIZER] Analytics record created')
    } catch (analyticsError) {
      console.log('[SERVICE-DELIVERY-SYSTEMIZER] Analytics creation failed, continuing...', analyticsError)
    }

    // TODO: In the future, this is where we would:
    // 1. Send workflow to AI for processing (email templates, documents, task lists)
    // 2. Generate template assets
    // 3. Create export configurations

    console.log('[SERVICE-DELIVERY-SYSTEMIZER] Workflow processing completed successfully')

    return NextResponse.json({
      success: true,
      message: `Workflow "${workflowName}" uploaded successfully!`,
      data: {
        workflowId: workflowTemplate.id,
        stepsCount: steps.length,
        processingStatus: 'uploaded'
      }
    })

  } catch (error) {
    console.error('[SERVICE-DELIVERY-SYSTEMIZER] Unexpected error:', error)
    return NextResponse.json({
      error: 'Failed to process workflow',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET endpoint to retrieve workflows
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const workflowId = searchParams.get('id')

    if (workflowId) {
      // Get specific workflow with steps
      const { data: workflow, error: workflowError } = await supabase
        .from('service_workflow_templates')
        .select('*')
        .eq('id', workflowId)
        .single()

      if (workflowError) {
        return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
      }

      const { data: steps, error: stepsError } = await supabase
        .from('service_workflow_steps')
        .select('*')
        .eq('workflow_template_id', workflowId)
        .order('step_number')

      return NextResponse.json({
        success: true,
        data: {
          workflow,
          steps: steps || []
        }
      })
    } else {
      // Get all workflows
      const { data: workflows, error } = await supabase
        .from('service_workflow_templates')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('[SERVICE-DELIVERY-SYSTEMIZER] Get workflows error:', error)
        return NextResponse.json({
          error: 'Failed to fetch workflows',
          details: error.message
        }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        data: workflows || []
      })
    }
  } catch (error) {
    console.error('[SERVICE-DELIVERY-SYSTEMIZER] GET error:', error)
    return NextResponse.json({
      error: 'Failed to fetch workflows',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}