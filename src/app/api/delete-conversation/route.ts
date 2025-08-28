import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    const userId = searchParams.get('userId')
    
    if (!sessionId || !userId) {
      return NextResponse.json({ error: 'Session ID and User ID are required' }, { status: 400 })
    }

    console.log('[DELETE-CONVERSATION] Deleting conversation:', sessionId, 'for user:', userId)

    // Delete all conversation entries for this session
    // Try multiple approaches since session storage may vary
    const { data: conversations, error: fetchError } = await supabase
      .from('ai_conversations')
      .select('id, user_id, created_at')
      .or(`user_id.eq.${sessionId},user_id.eq.${userId}`)
      .order('created_at', { ascending: false })

    console.log('[DELETE-CONVERSATION] Found conversations:', conversations?.length || 0)

    if (fetchError) {
      console.error('[DELETE-CONVERSATION] Fetch error:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 })
    }

    if (conversations && conversations.length > 0) {
      const conversationIds = conversations.map(c => c.id)
      console.log('[DELETE-CONVERSATION] Deleting conversation IDs:', conversationIds)
      
      const { error: deleteError } = await supabase
        .from('ai_conversations')
        .delete()
        .in('id', conversationIds)

      if (deleteError) {
        console.error('[DELETE-CONVERSATION] Delete error:', deleteError)
        return NextResponse.json({ error: 'Failed to delete conversations' }, { status: 500 })
      }
    } else {
      console.log('[DELETE-CONVERSATION] No conversations found to delete')
    }

    console.log('[DELETE-CONVERSATION] Successfully deleted conversation')
    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('[DELETE-CONVERSATION] Error:', error)
    return NextResponse.json({ 
      error: 'Failed to delete conversation',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}