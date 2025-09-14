import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');

    if (!user_id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Get conversation history from Supabase
    const { data: conversations, error } = await supabase
      .from('ai_conversations')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: true })
      .limit(50); // Last 50 exchanges

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Failed to fetch conversation history' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      conversations: conversations || [],
      count: conversations?.length || 0
    });

  } catch (error) {
    console.error('Chat history API error:', error);
    return NextResponse.json({
      error: 'Failed to fetch chat history',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { user_id } = await request.json();

    if (!user_id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Delete all conversations for the user
    const { error } = await supabase
      .from('ai_conversations')
      .delete()
      .eq('user_id', user_id);

    if (error) {
      console.error('Supabase delete error:', error);
      return NextResponse.json({ error: 'Failed to clear conversation history' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Conversation history cleared'
    });

  } catch (error) {
    console.error('Clear chat history API error:', error);
    return NextResponse.json({
      error: 'Failed to clear chat history',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}