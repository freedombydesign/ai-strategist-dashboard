import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const category = url.searchParams.get('category')

    console.log('[CONVERSATION-TAGS] Getting conversation tags, category:', category)

    let query = supabase
      .from('conversation_tags')
      .select('*')
      .order('tag_category', { ascending: true })

    if (category) {
      query = query.eq('tag_category', category)
    }

    const { data: tags, error } = await query

    if (error) {
      console.error('[CONVERSATION-TAGS] Error getting tags:', error)
      return NextResponse.json({
        success: false,
        error: 'Failed to get conversation tags',
        details: error.message
      }, { status: 500 })
    }

    // Group tags by category
    const groupedTags = (tags || []).reduce((acc, tag) => {
      if (!acc[tag.tag_category]) {
        acc[tag.tag_category] = []
      }
      acc[tag.tag_category].push(tag)
      return acc
    }, {} as Record<string, any[]>)

    return NextResponse.json({
      success: true,
      tags: tags || [],
      grouped_tags: groupedTags,
      total: tags?.length || 0
    })

  } catch (error) {
    console.error('[CONVERSATION-TAGS] Error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to get conversation tags',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { tag_name, tag_category, description, color_hex = '#6B7280' } = body

    if (!tag_name || !tag_category) {
      return NextResponse.json({ 
        error: 'tag_name and tag_category are required' 
      }, { status: 400 })
    }

    console.log('[CONVERSATION-TAGS] Creating new tag:', tag_name, tag_category)

    const { data, error } = await supabase
      .from('conversation_tags')
      .insert({
        tag_name,
        tag_category,
        description,
        color_hex
      })
      .select()
      .single()

    if (error) {
      console.error('[CONVERSATION-TAGS] Error creating tag:', error)
      return NextResponse.json({
        success: false,
        error: 'Failed to create conversation tag',
        details: error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      tag: data,
      message: 'Conversation tag created successfully'
    })

  } catch (error) {
    console.error('[CONVERSATION-TAGS] Error creating tag:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to create conversation tag',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}