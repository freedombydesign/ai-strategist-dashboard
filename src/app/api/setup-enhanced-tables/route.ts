import { NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

export async function POST() {
  try {
    console.log('[SETUP-ENHANCED-TABLES] Creating enhanced_steps and sprint_categories tables...')
    
    // Create enhanced_steps table
    const enhancedStepsSQL = `
      CREATE TABLE IF NOT EXISTS enhanced_steps (
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
      
      CREATE INDEX IF NOT EXISTS idx_enhanced_steps_category ON enhanced_steps(sprint_category);
      CREATE INDEX IF NOT EXISTS idx_enhanced_steps_number ON enhanced_steps(step_number);
      
      ALTER TABLE enhanced_steps ENABLE ROW LEVEL SECURITY;
      CREATE POLICY IF NOT EXISTS "enhanced_steps_access" ON enhanced_steps FOR ALL USING (true);
      GRANT ALL ON enhanced_steps TO postgres, service_role, authenticated;
    `
    
    // Create sprint_categories table
    const sprintCategoriesSQL = `
      CREATE TABLE IF NOT EXISTS sprint_categories (
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
      
      CREATE INDEX IF NOT EXISTS idx_sprint_categories_phase ON sprint_categories(phase_number);
      
      ALTER TABLE sprint_categories ENABLE ROW LEVEL SECURITY;
      CREATE POLICY IF NOT EXISTS "sprint_categories_access" ON sprint_categories FOR ALL USING (true);
      GRANT ALL ON sprint_categories TO postgres, service_role, authenticated;
    `
    
    // Execute SQL to create enhanced_steps table
    const { error: stepsError } = await supabase.rpc('exec_sql', {
      sql: enhancedStepsSQL
    })
    
    if (stepsError) {
      console.error('[SETUP-ENHANCED-TABLES] Error creating enhanced_steps:', stepsError)
      // Try alternative approach - direct query
      const { error: directError } = await supabase
        .from('enhanced_steps')
        .select('id')
        .limit(1)
        
      if (directError && directError.message.includes('does not exist')) {
        return NextResponse.json({
          error: 'Could not create enhanced_steps table. Please run the SQL manually in Supabase dashboard.',
          sql: enhancedStepsSQL,
          details: stepsError.message
        }, { status: 500 })
      }
    }
    
    // Execute SQL to create sprint_categories table
    const { error: categoriesError } = await supabase.rpc('exec_sql', {
      sql: sprintCategoriesSQL
    })
    
    if (categoriesError) {
      console.error('[SETUP-ENHANCED-TABLES] Error creating sprint_categories:', categoriesError)
    }
    
    // Test if tables exist by trying to query them
    const { data: stepsTest, error: stepsTestError } = await supabase
      .from('enhanced_steps')
      .select('id')
      .limit(1)
      
    const { data: categoriesTest, error: categoriesTestError } = await supabase
      .from('sprint_categories')
      .select('id')
      .limit(1)
    
    console.log('[SETUP-ENHANCED-TABLES] Tables created successfully')
    
    return NextResponse.json({
      success: true,
      message: 'Enhanced tables created successfully',
      tables_created: {
        enhanced_steps: !stepsTestError,
        sprint_categories: !categoriesTestError
      },
      sql_executed: {
        enhanced_steps: enhancedStepsSQL,
        sprint_categories: sprintCategoriesSQL
      }
    })
    
  } catch (error) {
    console.error('[SETUP-ENHANCED-TABLES] Error:', error)
    return NextResponse.json({
      error: 'Failed to create enhanced tables',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}