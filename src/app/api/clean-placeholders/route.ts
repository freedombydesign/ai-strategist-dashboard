import { NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

export async function POST() {
  try {
    console.log('[CLEAN-PLACEHOLDERS] Starting cleanup of placeholder templates...')
    
    // First, find all Decision Call related templates
    const { data: decisionCallTemplates, error: searchError } = await supabase
      .from('template_library')
      .select('*')
      .ilike('template_name', '%decision call%')
    
    if (searchError) {
      console.error('[CLEAN-PLACEHOLDERS] Search error:', searchError)
      return NextResponse.json({ error: searchError.message }, { status: 500 })
    }
    
    console.log('[CLEAN-PLACEHOLDERS] Found decision call templates:', decisionCallTemplates?.length || 0)
    
    // Also look for generic placeholder patterns
    const { data: allTemplates, error: allError } = await supabase
      .from('template_library')
      .select('*')
      .order('template_name')
    
    if (allError) {
      return NextResponse.json({ error: allError.message }, { status: 500 })
    }
    
    // Find potential placeholders (templates with generic names or no category)
    const placeholders = allTemplates?.filter(template => 
      template.template_name?.toLowerCase().includes('placeholder') ||
      template.template_name?.toLowerCase().includes('example') ||
      template.template_name?.toLowerCase().includes('sample') ||
      (template.template_name?.toLowerCase().includes('decision call') && !template.resource_url)
    ) || []
    
    console.log('[CLEAN-PLACEHOLDERS] Found potential placeholders:', placeholders.length)
    
    let deletedCount = 0
    const deletedItems = []
    
    // Delete placeholder Decision Call templates (those without resource URLs)
    for (const template of placeholders) {
      if (template.template_name?.toLowerCase().includes('decision call') && !template.resource_url) {
        const { error: deleteError } = await supabase
          .from('template_library')
          .delete()
          .eq('id', template.id)
        
        if (!deleteError) {
          deletedCount++
          deletedItems.push(template.template_name)
          console.log('[CLEAN-PLACEHOLDERS] Deleted placeholder:', template.template_name)
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Cleaned ${deletedCount} placeholder templates`,
      found_decision_call_templates: decisionCallTemplates?.length || 0,
      total_templates_before: allTemplates?.length || 0,
      placeholders_found: placeholders.length,
      deleted_count: deletedCount,
      deleted_items: deletedItems,
      remaining_decision_calls: decisionCallTemplates?.filter(t => !deletedItems.includes(t.template_name)) || []
    })
    
  } catch (error) {
    console.error('[CLEAN-PLACEHOLDERS] Error:', error)
    return NextResponse.json({
      error: 'Cleanup failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}