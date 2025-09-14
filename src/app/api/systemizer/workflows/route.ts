import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../../lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Fetch all workflow templates with basic information
    const { data: workflows, error } = await supabase
      .from('service_workflow_templates')
      .select('id, name, description, category, created_at, updated_at')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[WORKFLOWS] Database error:', error)
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch workflows',
        details: error.message
      }, { status: 500 })
    }

    // Get step counts for each workflow
    const workflowsWithCounts = await Promise.all(
      workflows.map(async (workflow) => {
        const { data: steps, error: stepsError } = await supabase
          .from('service_workflow_steps')
          .select('id')
          .eq('workflow_template_id', workflow.id)

        const { data: templates, error: templatesError } = await supabase
          .from('service_template_assets')
          .select('id')
          .eq('workflow_template_id', workflow.id)

        return {
          ...workflow,
          step_count: stepsError ? 0 : (steps?.length || 0),
          template_count: templatesError ? 0 : (templates?.length || 0)
        }
      })
    )

    return NextResponse.json({
      success: true,
      workflows: workflowsWithCounts,
      total: workflowsWithCounts.length
    })

  } catch (error) {
    console.error('[WORKFLOWS] Unexpected error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch workflows',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, category } = body

    if (!name?.trim()) {
      return NextResponse.json({
        success: false,
        error: 'Workflow name is required'
      }, { status: 400 })
    }

    const { data: workflow, error } = await supabase
      .from('service_workflow_templates')
      .insert({
        name: name.trim(),
        description: description?.trim() || '',
        category: category?.trim() || 'general',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('[WORKFLOWS] Create error:', error)
      return NextResponse.json({
        success: false,
        error: 'Failed to create workflow',
        details: error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      workflow: {
        ...workflow,
        step_count: 0,
        template_count: 0
      }
    })

  } catch (error) {
    console.error('[WORKFLOWS] Create unexpected error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to create workflow',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}