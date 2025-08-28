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
    const { error } = await supabase
      .from('ai_conversations')
      .delete()
      .eq('user_id', sessionId) // sessionId is stored as user_id for conversation threads
      .or(`user_id.eq.${userId}`) // Also delete any entries with the original user ID

    if (error) {
      console.error('[DELETE-CONVERSATION] Database error:', error)
      return NextResponse.json({ error: 'Failed to delete conversation' }, { status: 500 })
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