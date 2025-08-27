import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

export async function GET(request: NextRequest) {
  try {
    console.log('[TEST-DB] Testing database connection...');

    // Test basic connection
    const { data: testData, error: testError } = await supabase
      .from('ai_conversations')
      .select('count')
      .limit(1);

    if (testError) {
      console.error('[TEST-DB] Database connection error:', testError);
      return NextResponse.json({
        success: false,
        message: 'Database connection failed',
        error: testError.message,
        details: testError
      }, { status: 500 });
    }

    // Test if sprints table exists
    const { data: sprintsData, error: sprintsError } = await supabase
      .from('sprints')
      .select('count')
      .limit(1);

    // Test if strategic_guidance table exists  
    const { data: guidanceData, error: guidanceError } = await supabase
      .from('strategic_guidance')
      .select('count')
      .limit(1);

    return NextResponse.json({
      success: true,
      message: 'Database connection test completed',
      results: {
        basicConnection: !testError,
        sprintsTable: {
          exists: !sprintsError,
          error: sprintsError?.message || null
        },
        guidanceTable: {
          exists: !guidanceError,
          error: guidanceError?.message || null
        }
      }
    });

  } catch (error) {
    console.error('[TEST-DB] Test error:', error);
    return NextResponse.json({
      success: false,
      message: 'Database test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}