import { NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

export async function GET() {
  try {
    console.log('[DEBUG-DECISION-CALL] Checking Decision Call Structure template...')
    
    // Get Decision Call Structure template directly
    const { data: template, error } = await supabase
      .from('template_library')
      .select('*')
      .eq('template_name', 'Decision Call Structure')
      .single()
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    console.log('[DEBUG-DECISION-CALL] Found template:', {
      id: template.id,
      name: template.template_name,
      has_resource_link: !!template.resource_link,
      resource_link: template.resource_link,
      description: template.description
    })
    
    return NextResponse.json({
      success: true,
      template: template,
      test_message: template.resource_link ? 
        `✅ Decision Call Structure template found with Google Doc link: ${template.resource_link}` :
        `❌ Decision Call Structure template found but missing resource link`
    })
    
  } catch (error) {
    console.error('[DEBUG-DECISION-CALL] Error:', error)
    return NextResponse.json({
      error: 'Debug failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}