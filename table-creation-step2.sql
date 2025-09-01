-- STEP 3: Create SOP Library
CREATE TABLE IF NOT EXISTS sop_library (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT,
  keywords TEXT,
  content_steps TEXT,
  format TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- STEP 4: Create AI Prompt Library
CREATE TABLE IF NOT EXISTS ai_prompt_library (
  id SERIAL PRIMARY KEY,
  prompt_name TEXT NOT NULL,
  prompt_text TEXT NOT NULL,
  category TEXT,
  variables_needed TEXT,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);