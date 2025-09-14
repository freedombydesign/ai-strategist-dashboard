import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  audioUrl?: string;
  insights?: string[];
  suggestions?: string[];
  downloadableDocuments?: Array<{
    title: string;
    type: string;
    downloadUrl: string;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const { user_id, messages } = await request.json();

    if (!user_id || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'User ID and messages array are required' }, { status: 400 });
    }

    console.log(`[SYNC] Syncing ${messages.length} messages for user: ${user_id}`);

    // Clear existing conversation for this user first
    const { error: deleteError } = await supabase
      .from('ai_conversations')
      .delete()
      .eq('user_id', user_id);

    if (deleteError) {
      console.error('Error clearing existing conversation:', deleteError);
      return NextResponse.json({ 
        error: 'Failed to clear existing conversation',
        details: deleteError.message 
      }, { status: 500 });
    }

    // Insert new conversation messages
    const conversationRecords = messages.map((message: Message, index: number) => ({
      user_id: user_id,
      message: message.role === 'user' ? message.content : '',
      response: message.role === 'assistant' ? message.content : '',
      created_at: new Date(message.timestamp).toISOString(),
      message_order: index
    }));

    // Only insert records that have either a message or response
    const validRecords = conversationRecords.filter(record => 
      record.message.trim() || record.response.trim()
    );

    if (validRecords.length > 0) {
      const { error: insertError } = await supabase
        .from('ai_conversations')
        .insert(validRecords);

      if (insertError) {
        console.error('Error inserting conversation:', insertError);
        return NextResponse.json({ 
          error: 'Failed to sync conversation',
          details: insertError.message 
        }, { status: 500 });
      }
    }

    return NextResponse.json({ 
      success: true,
      synced_messages: validRecords.length,
      message: 'Conversation synced successfully'
    });

  } catch (error) {
    console.error('Conversation sync error:', error);
    return NextResponse.json({
      error: 'Failed to sync conversation',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}