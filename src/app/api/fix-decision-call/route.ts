import { NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

export async function POST() {
  try {
    console.log('[FIX-DECISION-CALL] Updating Decision Call Structure template with resource link...')
    
    // Update the existing Decision Call Structure template (ID 161)
    const { data, error } = await supabase
      .from('template_library')
      .update({ 
        resource_link: 'https://docs.google.com/document/d/1sbyaaiisR91XEeXGooAQ9xVo0e2iyTFg/edit?usp=sharing',
        description: 'How to lead sales calls with an evaluation approach from module four'
      })
      .eq('template_name', 'Decision Call Structure')
      .select()
    
    if (error) {
      console.error('[FIX-DECISION-CALL] Update error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    console.log('[FIX-DECISION-CALL] Template updated successfully:', data)
    
    return NextResponse.json({
      success: true,
      message: 'Decision Call Structure template updated with Google Doc link',
      updated_template: data[0]
    })
    
  } catch (error) {
    console.error('[FIX-DECISION-CALL] Error:', error)
    return NextResponse.json({
      error: 'Failed to update template',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}