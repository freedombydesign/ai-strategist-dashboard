import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    console.log('[CLEAR-ALL-CONVERSATIONS] Clearing all conversations for user:', userId)

    // Delete ALL conversations for this user (including session-based ones)
    const { data: conversations, error: fetchError } = await supabase
      .from('ai_conversations')
      .select('id, user_id')
      .or(`user_id.eq.${userId},user_id.like.${userId}-%`) // Matches user_id and session_id patterns like user_id-timestamp

    console.log('[CLEAR-ALL-CONVERSATIONS] Found conversations to delete:', conversations?.length || 0)

    if (fetchError) {
      console.error('[CLEAR-ALL-CONVERSATIONS] Fetch error:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 })
    }

    if (conversations && conversations.length > 0) {
      const conversationIds = conversations.map(c => c.id)
      console.log('[CLEAR-ALL-CONVERSATIONS] Deleting conversation IDs:', conversationIds.slice(0, 5), '...') // Log first 5
      
      const { error: deleteError } = await supabase
        .from('ai_conversations')
        .delete()
        .in('id', conversationIds)

      if (deleteError) {
        console.error('[CLEAR-ALL-CONVERSATIONS] Delete error:', deleteError)
        return NextResponse.json({ error: 'Failed to delete conversations' }, { status: 500 })
      }
      
      console.log('[CLEAR-ALL-CONVERSATIONS] Successfully deleted', conversationIds.length, 'conversations')
    } else {
      console.log('[CLEAR-ALL-CONVERSATIONS] No conversations found to delete')
    }

    return NextResponse.json({ 
      success: true, 
      deleted: conversations?.length || 0 
    })

  } catch (error) {
    console.error('[CLEAR-ALL-CONVERSATIONS] Error:', error)
    return NextResponse.json({ 
      error: 'Failed to clear conversations',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}