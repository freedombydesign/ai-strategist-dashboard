-- STEP 1: Create Framework Steps Table
CREATE TABLE IF NOT EXISTS framework_steps (
  id SERIAL PRIMARY KEY,
  step_title TEXT NOT NULL,
  sprint_key TEXT,
  step_number INTEGER,
  task_description TEXT,
  resource_link TEXT,
  validation_rule TEXT,
  is_optional BOOLEAN DEFAULT FALSE,
  master_step_order INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- STEP 2: Create Freedom Diagnostic Questions
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