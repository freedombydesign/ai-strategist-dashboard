-- STEP 1: Create Basic Tables First
-- Run this first to create the foundation tables

-- 1. AI Personalities Table
CREATE TABLE IF NOT EXISTS ai_personalities (
  id SERIAL PRIMARY KEY,
  personality_key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  system_prompt TEXT NOT NULL,
  style_guidelines TEXT,
  example_response TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Freedom Score Components Table
CREATE TABLE IF NOT EXISTS freedom_score_components (
  id SERIAL PRIMARY KEY,
  component_key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  weight DECIMAL(3,2) DEFAULT 1.0,
  assessment_questions JSONB DEFAULT '[]',
  scoring_criteria JSONB DEFAULT '{}',
  improvement_strategies JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. User Sprint Assignments Table
CREATE TABLE IF NOT EXISTS user_sprint_assignments (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  sprint_key TEXT NOT NULL,
  priority INTEGER DEFAULT 1,
  status TEXT DEFAULT 'assigned',
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, sprint_key)
);

-- 4. Content Library Table
CREATE TABLE IF NOT EXISTS content_library (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  content_type TEXT NOT NULL,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  performance_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);