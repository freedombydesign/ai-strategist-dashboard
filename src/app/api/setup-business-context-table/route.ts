import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase-client'

export async function POST(request: NextRequest) {
  try {
    console.log('[SETUP-BUSINESS-CONTEXT] Creating business_context table...')
    
    // Create the business_context table
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS business_context (
        id SERIAL PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        business_name TEXT,
        business_model TEXT,
        revenue_model TEXT,
        current_revenue TEXT,
        team_size TEXT,
        growth_stage TEXT,
        target_market TEXT,
        ideal_client_profile JSONB,
        unique_value_proposition TEXT,
        main_competitors TEXT,
        competitive_advantage TEXT,
        top_bottlenecks TEXT[],
        biggest_challenge TEXT,
        previous_frameworks TEXT,
        primary_goal TEXT,
        success_metrics TEXT,
        timeframe TEXT,
        industry TEXT,
        business_age TEXT,
        website_url TEXT,
        additional_context TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id)
      );

      -- Create indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_business_context_user_id ON business_context(user_id);
      CREATE INDEX IF NOT EXISTS idx_business_context_industry ON business_context(industry);
      CREATE INDEX IF NOT EXISTS idx_business_context_growth_stage ON business_context(growth_stage);
    `

    // Execute using Supabase RPC call to run raw SQL
    const { error } = await supabase.rpc('exec_sql', { 
      sql_query: createTableSQL 
    })

    if (error) {
      console.error('[SETUP-BUSINESS-CONTEXT] Error creating table:', error)
      return NextResponse.json({
        success: false,
        error: 'Failed to create business_context table',
        message: 'You may need to run this SQL manually in your Supabase SQL editor',
        sql: createTableSQL,
        details: error
      }, { status: 500 })
    }

    console.log('[SETUP-BUSINESS-CONTEXT] Table created successfully')
    return NextResponse.json({
      success: true,
      message: 'business_context table created successfully',
      details: {
        table: 'business_context',
        indexes: ['idx_business_context_user_id', 'idx_business_context_industry', 'idx_business_context_growth_stage']
      }
    })

  } catch (error) {
    console.error('[SETUP-BUSINESS-CONTEXT] Setup error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to setup business_context table',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}