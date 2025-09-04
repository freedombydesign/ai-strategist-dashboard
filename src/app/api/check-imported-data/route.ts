import { NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

export async function GET() {
  try {
    // Check what data was imported
    const results: any = {}
    
    // Check sprints
    const { data: sprints } = await supabase
      .from('sprints')
      .select('*')
      .limit(3)
    results.sprints = {
      count: sprints?.length || 0,
      sample: sprints?.[0] || null,
      columns: sprints?.[0] ? Object.keys(sprints[0]) : []
    }
    
    // Check SOP library  
    const { data: sops } = await supabase
      .from('sop_library')
      .select('*')
      .limit(3)
    results.sop_library = {
      count: sops?.length || 0,
      sample: sops?.[0] || null,
      columns: sops?.[0] ? Object.keys(sops[0]) : []
    }
    
    // Check template_library (correct table name)
    const { data: templates } = await supabase
      .from('template_library')
      .select('*')
      .limit(3)
    results.template_library = {
      count: templates?.length || 0,
      sample: templates?.[0] || null,
      columns: templates?.[0] ? Object.keys(templates[0]) : []
    }
    
    // Check framework_modules
    const { data: modules } = await supabase
      .from('framework_modules')
      .select('*')
      .limit(3)
    results.framework_modules = {
      count: modules?.length || 0,
      sample: modules?.[0] || null,
      columns: modules?.[0] ? Object.keys(modules[0]) : []
    }
    
    // Check strategic_guidance
    const { data: guidance } = await supabase
      .from('strategic_guidance')  
      .select('*')
      .limit(3)
    results.strategic_guidance = {
      count: guidance?.length || 0,
      sample: guidance?.[0] || null,
      columns: guidance?.[0] ? Object.keys(guidance[0]) : []
    }
    
    // Check business frameworks
    const { data: frameworks } = await supabase
      .from('business_frameworks')
      .select('*')
      .limit(3)
    results.business_frameworks = {
      count: frameworks?.length || 0,
      sample: frameworks?.[0] || null,
      columns: frameworks?.[0] ? Object.keys(frameworks[0]) : []
    }
    
    // Check questions
    const { data: questions } = await supabase
      .from('freedom_diagnostic_questions')
      .select('*')
      .limit(3)
    results.freedom_diagnostic_questions = {
      count: questions?.length || 0,
      sample: questions?.[0] || null,
      columns: questions?.[0] ? Object.keys(questions[0]) : []
    }
    
    // Search for decision call structure specifically
    const { data: decisionCall } = await supabase
      .from('template_library')
      .select('*')
      .ilike('template_name', '%decision call%')
    
    const { data: decisionFramework } = await supabase
      .from('business_frameworks')
      .select('*')  
      .ilike('name', '%decision%')
      
    // Also search in strategic guidance
    const { data: decisionGuidance } = await supabase
      .from('strategic_guidance')
      .select('*')
      .ilike('content', '%decision call%')
      
    results.decision_call_search = {
      templates: decisionCall || [],
      frameworks: decisionFramework || [],
      guidance: decisionGuidance || []
    }

    return NextResponse.json({
      success: true,
      imported_data: results,
      summary: {
        total_tables: Object.keys(results).length - 1, // -1 for search
        has_decision_call_data: (decisionCall?.length || 0) + (decisionFramework?.length || 0) + (decisionGuidance?.length || 0) > 0
      }
    })

  } catch (error) {
    console.error('Error checking imported data:', error)
    return NextResponse.json({
      error: 'Failed to check data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}