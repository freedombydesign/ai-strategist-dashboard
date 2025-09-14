import { NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

export async function POST() {
  try {
    console.log('[CLEANUP] Starting template deduplication...')
    
    // Get all templates
    const { data: allTemplates } = await supabase
      .from('template_library')
      .select('*')
      .order('id')
    
    if (!allTemplates) {
      return NextResponse.json({ error: 'No templates found' })
    }
    
    console.log('[CLEANUP] Found', allTemplates.length, 'total templates')
    
    // Group by template name to find duplicates
    const templateGroups = allTemplates.reduce((groups, template) => {
      const name = template.template_name || 'unnamed'
      if (!groups[name]) groups[name] = []
      groups[name].push(template)
      return groups
    }, {})
    
    const duplicateGroups = Object.entries(templateGroups).filter(([name, templates]) => templates.length > 1)
    console.log('[CLEANUP] Found', duplicateGroups.length, 'duplicate groups')
    
    let deletedCount = 0
    
    // For each duplicate group, keep the first one and delete the rest
    for (const [name, templates] of duplicateGroups) {
      const toDelete = templates.slice(1) // Keep first, delete rest
      
      for (const template of toDelete) {
        const { error } = await supabase
          .from('template_library')
          .delete()
          .eq('id', template.id)
        
        if (error) {
          console.error('[CLEANUP] Error deleting template', template.id, ':', error)
        } else {
          deletedCount++
          console.log('[CLEANUP] Deleted duplicate:', template.template_name)
        }
      }
    }
    
    // Get final count
    const { data: finalTemplates } = await supabase
      .from('template_library')
      .select('id')
    
    return NextResponse.json({
      success: true,
      message: `Cleanup complete! Deleted ${deletedCount} duplicates.`,
      before: allTemplates.length,
      after: finalTemplates?.length || 0,
      deleted: deletedCount
    })

  } catch (error) {
    console.error('[CLEANUP] Error:', error)
    return NextResponse.json({
      error: 'Cleanup failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}