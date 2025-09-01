-- STEP 9: Create User Progress Tracking
CREATE TABLE IF NOT EXISTS enhanced_user_progress (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  step_id INTEGER,
  sprint_key TEXT,
  status TEXT DEFAULT 'assigned',
  completion_date DATE,
  notes TEXT,
  progress_percentage DECIMAL(5,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- STEP 10: Create Diagnostic Responses
CREATE TABLE IF NOT EXISTS freedom_diagnostic_responses (
  id SERIAL PRIMARY KEY,
  response_id INTEGER,
  question_id TEXT,
  respondent_name TEXT,
  respondent_email TEXT,
  response_value TEXT,
  date_submitted DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);