import { NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

export async function GET() {
  try {
    // Check steps table for resource links
    const { data: steps } = await supabase
      .from('steps')
      .select('*')
      .limit(5)

    let stepsAnalysis = null
    if (steps && steps.length > 0) {
      stepsAnalysis = {
        total_count: steps.length,
        columns: Object.keys(steps[0]),
        sample_steps: steps.map(step => ({
          name: step.name || step.step_name || 'No name',
          resource_links: step.resource_links || step.resources || 'No resources',
          description: step.description ? step.description.substring(0, 100) : 'No description'
        }))
      }
    }

    // Get template data with all columns
    const { data: templates } = await supabase
      .from('template_library')
      .select('*')
      .limit(5)

    if (!templates || templates.length === 0) {
      return NextResponse.json({
        message: 'No templates found in template_library table',
        template_count: 0
      })
    }

    // Format the data for easy reading
    const templateAnalysis = {
      total_count: templates.length,
      available_columns: Object.keys(templates[0]),
      sample_templates: templates.map(template => ({
        template_name: template.template_name,
        category: template.category,
        content_preview: template.content ? template.content.substring(0, 200) + '...' : 'No content',
        has_attachments: !!template.attachments,
        attachment_info: template.attachments ? JSON.stringify(template.attachments).substring(0, 300) : 'No attachments',
        all_fields: Object.keys(template)
      }))
    }

    return NextResponse.json({
      success: true,
      steps_analysis: stepsAnalysis,
      template_analysis: templateAnalysis,
      raw_first_template: templates[0],
      raw_first_step: steps?.[0] || null
    })

  } catch (error) {
    console.error('Error analyzing templates:', error)
    return NextResponse.json({
      error: 'Failed to analyze templates',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}