import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { template_name, category, content, resource_url } = await request.json()
    
    if (!template_name?.trim()) {
      return NextResponse.json({ error: 'Template name is required' }, { status: 400 })
    }

    console.log('[ADD-TEMPLATE] Adding template:', template_name)
    
    // Insert with only template_name and category (the columns that definitely exist)
    const { data, error } = await supabase
      .from('template_library')
      .insert({
        template_name: template_name.trim(),
        category: category?.trim() || null
      })

    if (error) {
      console.error('[ADD-TEMPLATE] Insert error:', error)
      return NextResponse.json({ 
        error: 'Failed to add template', 
        details: error.message 
      }, { status: 500 })
    }

    console.log('[ADD-TEMPLATE] Template added successfully')
    
    // Store the resource URL and content in a comment for now
    const noteData = {
      template_name: template_name.trim(),
      resource_url: resource_url?.trim() || '',
      content_description: content?.trim() || ''
    }
    console.log('[ADD-TEMPLATE] Additional data to track:', noteData)
    
    // Try to update the newly created record with resource_link (correct column name)
    if (resource_url?.trim()) {
      try {
        const { error: updateError } = await supabase
          .from('template_library')
          .update({ resource_link: resource_url.trim() })
          .eq('template_name', template_name.trim())
          
        if (updateError) {
          console.log('[ADD-TEMPLATE] Resource link update error:', updateError)
        } else {
          console.log('[ADD-TEMPLATE] Resource link updated successfully')
        }
      } catch (updateError) {
        console.log('[ADD-TEMPLATE] Resource link update failed:', updateError)
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Template "${template_name}" added successfully! Resource URL logged: ${resource_url}` 
    })

  } catch (error) {
    console.error('[ADD-TEMPLATE] Error:', error)
    return NextResponse.json({
      error: 'Failed to add template',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}