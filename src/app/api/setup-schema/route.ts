import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase-client'

export async function POST(request: NextRequest) {
  try {
    console.log('[SETUP-SCHEMA] Starting database schema setup...')
    
    // Use centralized supabase client
    const supabaseAdmin = supabase
    
    // First, let's create the strategic_guidance table since that's what's missing
    const createStrategicGuidanceTable = `
      CREATE TABLE IF NOT EXISTS strategic_guidance (
        id SERIAL PRIMARY KEY,
        guidance_type TEXT NOT NULL,
        category TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        context_tags JSONB DEFAULT '[]',
        related_sprint_key TEXT,
        related_module_key TEXT,
        priority INTEGER DEFAULT 1,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS idx_strategic_guidance_category ON strategic_guidance(category);
      CREATE INDEX IF NOT EXISTS idx_strategic_guidance_priority ON strategic_guidance(priority);
    `
    
    console.log('[SETUP-SCHEMA] Creating strategic_guidance table...')
    const { data, error } = await supabaseAdmin.rpc('exec_sql', { 
      sql_query: createStrategicGuidanceTable 
    })
    
    if (error) {
      console.error('[SETUP-SCHEMA] Error creating strategic_guidance table:', error)
      
      // If exec_sql doesn't work, try with simple table creation approach
      return NextResponse.json({
        success: false,
        error: 'Database schema setup failed',
        message: `You need to manually create the missing 'strategic_guidance' table in your Supabase database. Please run the SQL commands from setup-database.sql in your Supabase SQL editor.`,
        sqlNeeded: createStrategicGuidanceTable,
        details: error
      }, { status: 500 })
    }
    
    console.log('[SETUP-SCHEMA] strategic_guidance table created successfully')
    
    return NextResponse.json({
      success: true,
      message: 'Database schema setup completed successfully',
      details: {
        tablesCreated: ['strategic_guidance'],
        indexesCreated: ['idx_strategic_guidance_category', 'idx_strategic_guidance_priority']
      }
    })
    
  } catch (error) {
    console.error('[SETUP-SCHEMA] Setup error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to setup database schema',
      sqlInstructions: `Please manually run the SQL from setup-database.sql in your Supabase SQL editor to create the missing tables.`,
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}