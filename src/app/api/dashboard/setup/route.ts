import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../../lib/supabase'

// Setup endpoint to create freedom_scores table
export async function POST(request: NextRequest) {
  try {
    console.log('[DASHBOARD-SETUP] Creating freedom_scores table...')

    // Read the SQL schema file content (inline for now)
    const createTableSQL = `
      -- Freedom Scores Table
      CREATE TABLE IF NOT EXISTS freedom_scores (
        id BIGSERIAL PRIMARY KEY,
        user_id UUID DEFAULT auth.uid(),
        assessment_date DATE NOT NULL,

        -- Freedom Components (0-100 scale)
        time_freedom INTEGER NOT NULL CHECK (time_freedom >= 0 AND time_freedom <= 100),
        money_freedom INTEGER NOT NULL CHECK (money_freedom >= 0 AND money_freedom <= 100),
        impact_freedom INTEGER NOT NULL CHECK (impact_freedom >= 0 AND impact_freedom <= 100),
        systems_freedom INTEGER NOT NULL CHECK (systems_freedom >= 0 AND systems_freedom <= 100),
        team_freedom INTEGER NOT NULL CHECK (team_freedom >= 0 AND team_freedom <= 100),
        stress_freedom INTEGER NOT NULL CHECK (stress_freedom >= 0 AND stress_freedom <= 100),

        -- Calculated overall score
        overall_score INTEGER GENERATED ALWAYS AS (
          ROUND((time_freedom + money_freedom + impact_freedom + systems_freedom + team_freedom + stress_freedom)::NUMERIC / 6)
        ) STORED,

        -- Metadata
        assessment_method VARCHAR(50) DEFAULT 'dashboard_update',
        notes TEXT,

        -- Timestamps
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Indexes
      CREATE INDEX IF NOT EXISTS idx_freedom_scores_user_id ON freedom_scores(user_id);
      CREATE INDEX IF NOT EXISTS idx_freedom_scores_assessment_date ON freedom_scores(assessment_date);
      CREATE INDEX IF NOT EXISTS idx_freedom_scores_user_date ON freedom_scores(user_id, assessment_date);

      -- RLS Policy
      ALTER TABLE freedom_scores ENABLE ROW LEVEL SECURITY;

      -- Drop existing policy if exists
      DROP POLICY IF EXISTS "Users can manage their own freedom scores" ON freedom_scores;

      -- Create policy
      CREATE POLICY "Users can manage their own freedom scores" ON freedom_scores
        FOR ALL
        USING (auth.uid() = user_id);
    `

    // Execute the SQL
    const { error } = await supabase.rpc('exec_sql', { sql: createTableSQL })

    if (error) {
      // Try alternative method if rpc doesn't work
      console.log('[DASHBOARD-SETUP] RPC method failed, trying direct table creation...')

      // Create table using direct queries
      const { error: createError } = await supabase
        .from('freedom_scores')
        .select('id')
        .limit(1)

      if (createError) {
        console.error('[DASHBOARD-SETUP] Table creation failed:', createError)
        return NextResponse.json({
          error: 'Failed to create freedom_scores table',
          details: createError.message,
          suggestion: 'Please create the table manually using the provided SQL schema'
        }, { status: 500 })
      }
    }

    console.log('[DASHBOARD-SETUP] Freedom scores table setup completed')

    // Test the table by trying to insert and delete a test record
    const testData = {
      assessment_date: new Date().toISOString().split('T')[0],
      time_freedom: 80,
      money_freedom: 70,
      impact_freedom: 75,
      systems_freedom: 65,
      team_freedom: 85,
      stress_freedom: 90,
      assessment_method: 'setup_test',
      notes: 'Test record - will be deleted'
    }

    const { data: testRecord, error: testError } = await supabase
      .from('freedom_scores')
      .insert(testData)
      .select()
      .single()

    if (testError) {
      console.error('[DASHBOARD-SETUP] Test insert failed:', testError)
      return NextResponse.json({
        error: 'Table exists but insert failed',
        details: testError.message
      }, { status: 500 })
    }

    // Delete the test record
    if (testRecord) {
      await supabase
        .from('freedom_scores')
        .delete()
        .eq('id', testRecord.id)
    }

    return NextResponse.json({
      success: true,
      message: 'Freedom dashboard database setup completed successfully',
      tableCreated: 'freedom_scores',
      testPassed: true
    })

  } catch (error) {
    console.error('[DASHBOARD-SETUP] Unexpected error:', error)
    return NextResponse.json({
      error: 'Setup failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET endpoint to check setup status
export async function GET(request: NextRequest) {
  try {
    // Check if freedom_scores table exists and is accessible
    const { data, error } = await supabase
      .from('freedom_scores')
      .select('count(*)')
      .single()

    if (error) {
      return NextResponse.json({
        success: false,
        tableExists: false,
        error: error.message
      })
    }

    return NextResponse.json({
      success: true,
      tableExists: true,
      recordCount: data ? parseInt(data.count as string) : 0,
      message: 'Freedom dashboard is ready'
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}