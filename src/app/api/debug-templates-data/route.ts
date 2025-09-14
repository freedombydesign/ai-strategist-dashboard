import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const workflowId = searchParams.get('workflowId') || 'f9f92a34-5341-4870-b2ca-b03e347f28ae'

    const { data, error } = await supabase
      .from('service_template_assets')
      .select('*')
      .eq('workflow_template_id', workflowId)
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const analysis = data.map(template => {
      let parsedContent
      let hasBlankFields = false
      let parseErrors = []

      try {
        parsedContent = JSON.parse(template.content)

        // Check for blank fields based on template type
        if (template.asset_type === 'email_template') {
          if (!parsedContent.subject || parsedContent.subject.trim() === '') {
            hasBlankFields = true
            parseErrors.push('Missing subject')
          }
          if (!parsedContent.body || parsedContent.body.trim() === '') {
            hasBlankFields = true
            parseErrors.push('Missing body')
          }
        }

      } catch (e) {
        parseErrors.push('JSON parse failed: ' + e.message)
        parsedContent = { raw: template.content }
      }

      return {
        id: template.id,
        asset_type: template.asset_type,
        created_at: template.created_at,
        content_length: template.content.length,
        has_blank_fields: hasBlankFields,
        parse_errors: parseErrors,
        sample_content: template.asset_type === 'email_template' ? {
          subject: parsedContent.subject || '[MISSING]',
          body_preview: parsedContent.body ? parsedContent.body.substring(0, 100) + '...' : '[MISSING]'
        } : null,
        raw_content_preview: template.content.substring(0, 200) + '...',
        metadata: template.metadata
      }
    })

    return NextResponse.json({
      success: true,
      total_templates: data.length,
      templates: analysis,
      summary: {
        blank_field_count: analysis.filter(t => t.has_blank_fields).length,
        parse_error_count: analysis.filter(t => t.parse_errors.length > 0).length
      }
    })

  } catch (error) {
    console.error('[DEBUG-TEMPLATES-DATA] Error:', error)
    return NextResponse.json({
      error: 'Failed to analyze templates',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}