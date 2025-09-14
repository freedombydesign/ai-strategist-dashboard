import { NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

export async function POST() {
  try {
    console.log('[CREATE-ENHANCED-STEPS] Checking if enhanced steps table exists...')
    
    // Check if the table exists by trying to query it
    const { data: existingData, error: checkError } = await supabase
      .from('enhanced_steps')
      .select('id')
      .limit(1);
    
    if (checkError && (checkError.message.includes('does not exist') || checkError.message.includes('schema cache'))) {
      console.log('[CREATE-ENHANCED-STEPS] Table does not exist in schema cache');
      
      return NextResponse.json({
        success: false,
        table_missing: true,
        message: 'The enhanced_steps table needs to be created in your Supabase database first.',
        sql_to_run_manually: {
          enhanced_steps: `CREATE TABLE enhanced_steps (
  id SERIAL PRIMARY KEY,
  step_name TEXT NOT NULL,
  sprint_category TEXT NOT NULL,
  step_number DECIMAL(3,1) NOT NULL,
  task_description TEXT,
  resource_link TEXT,
  deliverable TEXT,
  sprint_outcome TEXT,
  connected_ai_prompt TEXT,
  completion_status TEXT DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS and set permissions
ALTER TABLE enhanced_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "enhanced_steps_access" ON enhanced_steps FOR ALL USING (true);
GRANT ALL ON enhanced_steps TO postgres, service_role, authenticated;`,
          
          sprint_categories: `CREATE TABLE sprint_categories (
  id SERIAL PRIMARY KEY,
  category_name TEXT NOT NULL,
  description TEXT,
  outcome TEXT,
  phase_number DECIMAL(3,1) NOT NULL,
  time_saved_hours DECIMAL(5,2),
  included_steps TEXT,
  step_numbers TEXT,
  connected_ai_prompts TEXT,
  step_range_start DECIMAL(3,1),
  step_range_end DECIMAL(3,1),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS and set permissions
ALTER TABLE sprint_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sprint_categories_access" ON sprint_categories FOR ALL USING (true);
GRANT ALL ON sprint_categories TO postgres, service_role, authenticated;`
        },
        instructions: [
          '1. Go to your Supabase dashboard',
          '2. Click on SQL Editor in the left sidebar',
          '3. Copy and paste the enhanced_steps SQL above',
          '4. Click "Run" to execute',
          '5. Copy and paste the sprint_categories SQL above', 
          '6. Click "Run" to execute',
          '7. Return here and try the import again'
        ]
      });
    } else if (checkError) {
      console.error('[CREATE-ENHANCED-STEPS] Unexpected error checking table:', checkError);
      return NextResponse.json({ 
        error: 'Error checking enhanced steps table',
        details: checkError.message 
      }, { status: 500 });
    } else {
      // Table exists and is accessible
      console.log('[CREATE-ENHANCED-STEPS] Enhanced steps table exists and is ready');
      return NextResponse.json({
        success: true,
        message: 'Enhanced steps table exists and is ready for data import.',
        table_ready: true,
        existing_rows: existingData?.length || 0
      });
    }
    
  } catch (error) {
    console.error('[CREATE-ENHANCED-STEPS] Error:', error);
    return NextResponse.json({
      error: 'Failed to check enhanced steps table',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}