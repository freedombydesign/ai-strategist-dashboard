import { NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

export async function GET() {
  try {
    // Get all templates to see their structure
    const { data: templates, error } = await supabase
      .from('template_library')
      .select('*')
      .limit(5)

    if (error) {
      return NextResponse.json({ 
        error: 'Failed to fetch templates',
        details: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      total_templates: templates?.length || 0,
      columns: templates?.[0] ? Object.keys(templates[0]) : [],
      sample_templates: templates?.map(t => ({
        id: t.id,
        template_name: t.template_name,
        category: t.category,
        all_fields: Object.keys(t)
      })) || []
    })

  } catch (error) {
    console.error('Error viewing templates:', error)
    return NextResponse.json({
      error: 'Failed to view templates',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}