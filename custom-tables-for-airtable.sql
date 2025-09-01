-- CUSTOM TABLES TO MATCH RUTH'S AIRTABLE STRUCTURE
-- Based on diagnostic results showing 12 complex tables with relationships

-- 1. Steps table (to match Airtable Steps)
CREATE TABLE IF NOT EXISTS framework_steps (
  id SERIAL PRIMARY KEY,
  step_title TEXT NOT NULL,
  sprint_key TEXT REFERENCES sprints(sprint_key),
  step_number INTEGER,
  task_description TEXT,
  resource_link TEXT,
  validation_rule TEXT,
  is_optional BOOLEAN DEFAULT FALSE,
  master_step_order INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Freedom Diagnostic Questions
CREATE TABLE IF NOT EXISTS freedom_diagnostic_questions (
  id SERIAL PRIMARY KEY,
  question_id TEXT UNIQUE NOT NULL,
  module TEXT,
  sprint_title TEXT,
  field_name TEXT,
  question_text TEXT NOT NULL,
  options_text TEXT,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Freedom Diagnostic Responses  
CREATE TABLE IF NOT EXISTS freedom_diagnostic_responses (
  id SERIAL PRIMARY KEY,
  response_id INTEGER,
  question_id TEXT REFERENCES freedom_diagnostic_questions(question_id),
  respondent_name TEXT,
  respondent_email TEXT,
  response_value TEXT,
  date_submitted DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. SOP Library (Standard Operating Procedures)
CREATE TABLE IF NOT EXISTS sop_library (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT,
  keywords TEXT,
  content_steps TEXT,
  format TEXT, -- 'Checklist', 'Process', 'Template'
  attachment_summary JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Categories (for organizing SOPs, Templates, etc.)
CREATE TABLE IF NOT EXISTS content_categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 1,
  keywords TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Enhanced AI Prompt Library (more detailed than personalities)
CREATE TABLE IF NOT EXISTS ai_prompt_library (
  id SERIAL PRIMARY KEY,
  prompt_name TEXT NOT NULL,
  prompt_text TEXT NOT NULL,
  category TEXT,
  variables_needed TEXT,
  tags TEXT[],
  linked_sprint_key TEXT REFERENCES sprints(sprint_key),
  linked_step_id INTEGER REFERENCES framework_steps(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Enhanced Framework table (broader than strategic_guidance)
CREATE TABLE IF NOT EXISTS business_frameworks (
  id SERIAL PRIMARY KEY,
  framework_name TEXT NOT NULL,
  category_pillar TEXT,
  description TEXT,
  core_steps_phases TEXT,
  use_cases_scenarios TEXT,
  level_complexity TEXT,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Template System (combining Templates and Templates Draft)
CREATE TABLE IF NOT EXISTS template_library (
  id SERIAL PRIMARY KEY,
  template_name TEXT NOT NULL,
  description TEXT,
  resource_link TEXT,
  template_type TEXT, -- 'Checklist', 'Worksheet', 'Email', etc.
  category TEXT,
  file_attachments JSONB DEFAULT '[]',
  linked_framework_id INTEGER REFERENCES business_frameworks(id),
  is_draft BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Enhanced User Sprint Assignments (matches your User Steps Progress Tracking)
CREATE TABLE IF NOT EXISTS enhanced_user_progress (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  step_id INTEGER REFERENCES framework_steps(id),
  sprint_key TEXT REFERENCES sprints(sprint_key),
  status TEXT DEFAULT 'assigned', -- 'assigned', 'in_progress', 'completed'
  completion_date DATE,
  notes TEXT,
  progress_percentage DECIMAL(5,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Enhanced Users table (to match your Users data)
CREATE TABLE IF NOT EXISTS framework_users (
  id SERIAL PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  name TEXT,
  email TEXT,
  business_size TEXT,
  niche TEXT,
  freedom_score DECIMAL(5,2),
  start_date DATE,
  current_sprint_key TEXT REFERENCES sprints(sprint_key),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create relationship linking tables for many-to-many relationships

-- Framework-SOP relationships
CREATE TABLE IF NOT EXISTS framework_sop_links (
  framework_id INTEGER REFERENCES business_frameworks(id),
  sop_id INTEGER REFERENCES sop_library(id),
  PRIMARY KEY (framework_id, sop_id)
);

-- Framework-Template relationships  
CREATE TABLE IF NOT EXISTS framework_template_links (
  framework_id INTEGER REFERENCES business_frameworks(id),
  template_id INTEGER REFERENCES template_library(id),
  PRIMARY KEY (framework_id, template_id)
);

-- Framework-Prompt relationships
CREATE TABLE IF NOT EXISTS framework_prompt_links (
  framework_id INTEGER REFERENCES business_frameworks(id),
  prompt_id INTEGER REFERENCES ai_prompt_library(id),
  PRIMARY KEY (framework_id, prompt_id)
);

-- Category relationships
CREATE TABLE IF NOT EXISTS category_content_links (
  category_id INTEGER REFERENCES content_categories(id),
  content_type TEXT NOT NULL, -- 'sop', 'template', 'question'
  content_id INTEGER NOT NULL,
  PRIMARY KEY (category_id, content_type, content_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_framework_steps_sprint ON framework_steps(sprint_key);
CREATE INDEX IF NOT EXISTS idx_framework_steps_order ON framework_steps(master_step_order);
CREATE INDEX IF NOT EXISTS idx_diagnostic_questions_module ON freedom_diagnostic_questions(module);
CREATE INDEX IF NOT EXISTS idx_diagnostic_responses_question ON freedom_diagnostic_responses(question_id);
CREATE INDEX IF NOT EXISTS idx_sop_library_category ON sop_library(category);
CREATE INDEX IF NOT EXISTS idx_prompt_library_category ON ai_prompt_library(category);
CREATE INDEX IF NOT EXISTS idx_frameworks_category ON business_frameworks(category_pillar);
CREATE INDEX IF NOT EXISTS idx_templates_type ON template_library(template_type);
CREATE INDEX IF NOT EXISTS idx_user_progress_user ON enhanced_user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_step ON enhanced_user_progress(step_id);

-- Enable RLS on all tables
ALTER TABLE framework_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE freedom_diagnostic_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE freedom_diagnostic_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE sop_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_prompt_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_frameworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE enhanced_user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE framework_users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allowing all access for now, can be refined later)
CREATE POLICY "framework_steps_access" ON framework_steps FOR ALL USING (true);
CREATE POLICY "diagnostic_questions_access" ON freedom_diagnostic_questions FOR ALL USING (true);
CREATE POLICY "diagnostic_responses_access" ON freedom_diagnostic_responses FOR ALL USING (true);
CREATE POLICY "sop_library_access" ON sop_library FOR ALL USING (true);
CREATE POLICY "content_categories_access" ON content_categories FOR ALL USING (true);
CREATE POLICY "prompt_library_access" ON ai_prompt_library FOR ALL USING (true);
CREATE POLICY "business_frameworks_access" ON business_frameworks FOR ALL USING (true);
CREATE POLICY "template_library_access" ON template_library FOR ALL USING (true);
CREATE POLICY "user_progress_access" ON enhanced_user_progress FOR ALL USING (true);
CREATE POLICY "framework_users_access" ON framework_users FOR ALL USING (true);

-- Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;