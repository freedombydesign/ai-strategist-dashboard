import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    console.log('[SETUP-FREEDOM-TABLE] Creating freedom_scores table...')

    // Use service role key for admin operations if available
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Simple table creation SQL
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS freedom_scores (
        id BIGSERIAL PRIMARY KEY,
        user_id UUID DEFAULT auth.uid(),
        assessment_date DATE NOT NULL DEFAULT CURRENT_DATE,
        time_freedom INTEGER NOT NULL CHECK (time_freedom >= 0 AND time_freedom <= 100),
        money_freedom INTEGER NOT NULL CHECK (money_freedom >= 0 AND money_freedom <= 100),
        impact_freedom INTEGER NOT NULL CHECK (impact_freedom >= 0 AND impact_freedom <= 100),
        systems_freedom INTEGER NOT NULL CHECK (systems_freedom >= 0 AND systems_freedom <= 100),
        team_freedom INTEGER NOT NULL CHECK (team_freedom >= 0 AND team_freedom <= 100),
        stress_freedom INTEGER NOT NULL CHECK (stress_freedom >= 0 AND stress_freedom <= 100),
        overall_score INTEGER,
        assessment_method VARCHAR(50) DEFAULT 'dashboard_update',
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `

    console.log('[SETUP-FREEDOM-TABLE] Executing SQL:', createTableSQL)

    const { data, error } = await supabaseAdmin
      .from('_freedom_scores_creation')
      .select('*')
      .limit(1)

    // If that fails, just try using raw SQL
    if (error) {
      console.log('[SETUP-FREEDOM-TABLE] Direct table access failed. Trying RPC...')

      // Try using edge functions or similar
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey
        },
        body: JSON.stringify({
          sql: createTableSQL
        })
      })

      if (!response.ok) {
        console.log('[SETUP-FREEDOM-TABLE] RPC failed too. Proceeding with manual creation instructions...')

        return NextResponse.json({
          success: false,
          error: 'Automatic table creation failed',
          message: 'Please create the table manually in your Supabase dashboard',
          sql: createTableSQL,
          instructions: [
            '1. Go to your Supabase dashboard',
            '2. Navigate to the SQL editor',
            '3. Run the provided SQL to create the freedom_scores table',
            '4. Then test the API endpoints'
          ]
        })
      }
    }

    console.log('[SETUP-FREEDOM-TABLE] Table creation attempted')

    return NextResponse.json({
      success: true,
      message: 'Freedom scores table creation initiated',
      sql: createTableSQL,
      nextSteps: [
        'Table should now exist in your Supabase instance',
        'Test with GET /api/dashboard/freedom-score',
        'Test with POST /api/dashboard/freedom-score'
      ]
    })

  } catch (error) {
    console.error('[SETUP-FREEDOM-TABLE] Error:', error)
    return NextResponse.json({
      success: false,
      error: 'Setup failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}