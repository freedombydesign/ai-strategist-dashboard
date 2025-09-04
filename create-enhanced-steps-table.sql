-- Create enhanced_steps table for Ruth's Airtable step data
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

-- Create sprint_categories table for Ruth's Airtable category data
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_enhanced_steps_category ON enhanced_steps(sprint_category);
CREATE INDEX IF NOT EXISTS idx_enhanced_steps_number ON enhanced_steps(step_number);
CREATE INDEX IF NOT EXISTS idx_enhanced_steps_completion ON enhanced_steps(completion_status);
CREATE INDEX IF NOT EXISTS idx_sprint_categories_phase ON sprint_categories(phase_number);

-- Enable RLS
ALTER TABLE enhanced_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE sprint_categories ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allowing all access)
CREATE POLICY "enhanced_steps_access" ON enhanced_steps FOR ALL USING (true);
CREATE POLICY "sprint_categories_access" ON sprint_categories FOR ALL USING (true);

-- Grant permissions
GRANT ALL ON enhanced_steps TO postgres, service_role, authenticated;
GRANT ALL ON sprint_categories TO postgres, service_role, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role, authenticated;