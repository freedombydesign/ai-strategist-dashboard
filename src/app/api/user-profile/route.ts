import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');

    if (!user_id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Get user profile from Supabase
    const { data: profile, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user_id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      profile: profile || null
    });

  } catch (error) {
    console.error('User profile API error:', error);
    return NextResponse.json({
      error: 'Failed to fetch user profile',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user_id, name, business_type, preferences } = await request.json();

    if (!user_id || !name) {
      return NextResponse.json({ error: 'User ID and name are required' }, { status: 400 });
    }

    // Upsert user profile to Supabase
    const { data: profile, error } = await supabase
      .from('users')
      .upsert({
        id: user_id,
        name,
        business_type: business_type || null,
        preferences: preferences || {},
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase upsert error:', error);
      return NextResponse.json({ error: 'Failed to save user profile' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      profile: profile,
      message: 'User profile saved successfully'
    });

  } catch (error) {
    console.error('Save user profile API error:', error);
    return NextResponse.json({
      error: 'Failed to save user profile',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}