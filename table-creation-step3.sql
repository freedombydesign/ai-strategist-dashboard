-- STEP 5: Create Business Frameworks
CREATE TABLE IF NOT EXISTS business_frameworks (
  id SERIAL PRIMARY KEY,
  framework_name TEXT NOT NULL,
  category_pillar TEXT,
  description TEXT,
  core_steps_phases TEXT,
  use_cases_scenarios TEXT,
  level_complexity TEXT,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- STEP 6: Create Template Library
CREATE TABLE IF NOT EXISTS template_library (
  id SERIAL PRIMARY KEY,
  template_name TEXT NOT NULL,
  description TEXT,
  resource_link TEXT,
  template_type TEXT,
  category TEXT,
  is_draft BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);