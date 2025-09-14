import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const userId = url.searchParams.get('user_id')
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const contextTags = url.searchParams.get('context_tags')?.split(',') || []
    const interactionType = url.searchParams.get('interaction_type')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    console.log('[CONVERSATION-MEMORY] Getting conversation memory for user:', userId)

    // Build query
    let query = supabase
      .from('conversation_memory')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    // Apply filters
    if (contextTags.length > 0) {
      query = query.contains('context_tags', contextTags)
    }

    if (interactionType) {
      query = query.eq('interaction_type', interactionType)
    }

    const { data: conversations, error } = await query

    if (error) {
      console.error('[CONVERSATION-MEMORY] Error getting conversations:', error)
      return NextResponse.json({
        success: false,
        error: 'Failed to get conversation memory',
        details: error.message
      }, { status: 500 })
    }

    // Get conversation stats
    const { data: statsData, error: statsError } = await supabase
      .from('conversation_memory')
      .select('interaction_type, priority_score, context_tags, created_at')
      .eq('user_id', userId)

    const stats = {
      total_conversations: conversations?.length || 0,
      high_priority_count: conversations?.filter(c => c.priority_score >= 4).length || 0,
      unique_topics: statsData ? new Set(statsData.flatMap(c => c.context_tags)).size : 0,
      asset_generations: conversations?.filter(c => c.interaction_type === 'asset_generation').length || 0,
      last_30_days: conversations?.filter(c => 
        new Date(c.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      ).length || 0
    }

    return NextResponse.json({
      success: true,
      conversations: conversations || [],
      stats,
      total: conversations?.length || 0
    })

  } catch (error) {
    console.error('[CONVERSATION-MEMORY] Error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to get conversation memory',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { 
      user_id, 
      conversation_id, 
      message, 
      response, 
      context_tags = [], 
      interaction_type = 'general',
      business_stage,
      key_insights = {},
      referenced_decisions = [],
      generated_assets = [],
      priority_score = 1,
      metadata = {}
    } = body

    if (!user_id || !conversation_id || !message || !response) {
      return NextResponse.json({ 
        error: 'user_id, conversation_id, message, and response are required' 
      }, { status: 400 })
    }

    console.log('[CONVERSATION-MEMORY] Storing conversation memory:', {
      user_id,
      conversation_id,
      context_tags,
      interaction_type,
      priority_score
    })

    const { data, error } = await supabase
      .from('conversation_memory')
      .insert({
        user_id,
        conversation_id,
        message,
        response,
        context_tags,
        interaction_type,
        business_stage,
        key_insights,
        referenced_decisions,
        generated_assets,
        priority_score,
        metadata
      })
      .select()
      .single()

    if (error) {
      console.error('[CONVERSATION-MEMORY] Error storing conversation:', error)
      return NextResponse.json({
        success: false,
        error: 'Failed to store conversation memory',
        details: error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      conversation: data,
      message: 'Conversation memory stored successfully'
    })

  } catch (error) {
    console.error('[CONVERSATION-MEMORY] Error storing conversation:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to store conversation memory',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}