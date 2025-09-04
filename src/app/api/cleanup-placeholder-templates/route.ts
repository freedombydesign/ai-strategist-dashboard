import { NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

export async function POST() {
  try {
    console.log('[CLEANUP-PLACEHOLDERS] Starting cleanup of placeholder templates...')
    
    // First, get all templates to see what we're working with
    const { data: allTemplates, error: fetchError } = await supabase
      .from('template_library')
      .select('*')
      .order('template_name')
    
    if (fetchError) {
      console.error('[CLEANUP-PLACEHOLDERS] Fetch error:', fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }
    
    console.log(`[CLEANUP-PLACEHOLDERS] Found ${allTemplates?.length || 0} total templates`)
    
    // Identify templates to keep (have resource_link OR substantial content)
    const templatesToKeep = allTemplates?.filter(template => {
      const hasResourceLink = template.resource_link && template.resource_link.trim().length > 10
      const hasContent = template.content && template.content.trim().length > 50
      const hasDescription = template.description && template.description.trim().length > 50
      
      return hasResourceLink || hasContent || hasDescription
    }) || []
    
    // Identify templates to remove (placeholders without meaningful content)
    const templatesToRemove = allTemplates?.filter(template => {
      const hasResourceLink = template.resource_link && template.resource_link.trim().length > 10
      const hasContent = template.content && template.content.trim().length > 50
      const hasDescription = template.description && template.description.trim().length > 50
      
      return !(hasResourceLink || hasContent || hasDescription)
    }) || []
    
    console.log(`[CLEANUP-PLACEHOLDERS] Templates to keep: ${templatesToKeep.length}`)
    console.log(`[CLEANUP-PLACEHOLDERS] Templates to remove: ${templatesToRemove.length}`)
    
    // Log templates with resource links for reference
    const templatesWithLinks = templatesToKeep.filter(t => t.resource_link)
    console.log(`[CLEANUP-PLACEHOLDERS] Templates with resource links: ${templatesWithLinks.length}`)
    templatesWithLinks.forEach(t => {
      console.log(`  - ${t.template_name}: ${t.resource_link}`)
    })
    
    // Remove placeholder templates
    if (templatesToRemove.length > 0) {
      const idsToRemove = templatesToRemove.map(t => t.id)
      
      const { error: deleteError } = await supabase
        .from('template_library')
        .delete()
        .in('id', idsToRemove)
      
      if (deleteError) {
        console.error('[CLEANUP-PLACEHOLDERS] Delete error:', deleteError)
        return NextResponse.json({ error: deleteError.message }, { status: 500 })
      }
      
      console.log(`[CLEANUP-PLACEHOLDERS] Successfully removed ${templatesToRemove.length} placeholder templates`)
    }
    
    return NextResponse.json({
      success: true,
      message: `Cleanup complete! Kept ${templatesToKeep.length} templates with content, removed ${templatesToRemove.length} placeholders`,
      templates_kept: templatesToKeep.length,
      templates_removed: templatesToRemove.length,
      templates_with_links: templatesWithLinks.length,
      sample_kept_templates: templatesToKeep.slice(0, 5).map(t => ({
        name: t.template_name,
        has_resource_link: !!t.resource_link,
        category: t.category
      }))
    })
    
  } catch (error) {
    console.error('[CLEANUP-PLACEHOLDERS] Error:', error)
    return NextResponse.json({
      error: 'Failed to cleanup placeholder templates',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}