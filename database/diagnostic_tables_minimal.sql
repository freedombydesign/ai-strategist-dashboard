-- =====================================================
-- MINIMAL DIAGNOSTIC TABLES
-- Just the essential tables for assessment to work
-- =====================================================

-- 1. ASSESSMENTS TABLE
CREATE TABLE IF NOT EXISTS assessments (
  assessment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  date_taken TIMESTAMPTZ DEFAULT NOW(),
  overall_score NUMERIC(5,2),

  -- Component scores
  money_freedom_score NUMERIC(5,2),
  systems_freedom_score NUMERIC(5,2),
  team_freedom_score NUMERIC(5,2),
  stress_freedom_score NUMERIC(5,2),
  time_freedom_score NUMERIC(5,2),
  impact_freedom_score NUMERIC(5,2),

  -- Archetype detection
  archetype VARCHAR(100),
  archetype_confidence NUMERIC(3,2),

  -- Assessment metadata
  completion_status VARCHAR(20) DEFAULT 'in_progress',
  total_questions INTEGER,
  questions_answered INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. DIAGNOSTIC RESPONSES TABLE
CREATE TABLE IF NOT EXISTS diagnostic_responses (
  response_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID REFERENCES assessments(assessment_id) ON DELETE CASCADE,
  question_id TEXT,
  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 10),
  response_time_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(assessment_id, question_id)
);

-- 3. RECOMMENDATIONS TABLE
CREATE TABLE IF NOT EXISTS recommendations (
  recommendation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID REFERENCES assessments(assessment_id) ON DELETE CASCADE,
  sprint_id UUID REFERENCES sprints(sprint_id) ON DELETE CASCADE,
  priority_rank INTEGER NOT NULL,
  confidence_score NUMERIC(3,2),
  reasoning TEXT,

  estimated_impact_points INTEGER,
  estimated_time_to_complete INTEGER,

  status VARCHAR(20) DEFAULT 'recommended',
  user_notes TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(assessment_id, sprint_id)
);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_assessments_updated_at
  BEFORE UPDATE ON assessments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recommendations_updated_at
  BEFORE UPDATE ON recommendations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

SELECT 'Diagnostic tables created successfully' AS result;