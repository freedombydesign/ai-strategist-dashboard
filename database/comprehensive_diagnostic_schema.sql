-- =====================================================
-- COMPREHENSIVE FREEDOM DIAGNOSTIC SYSTEM
-- Complete database schema for diagnostic + sprint recommender
-- =====================================================

-- 1. USERS TABLE
-- Extended user profile with business context
CREATE TABLE IF NOT EXISTS users (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255),
  email VARCHAR(255) UNIQUE,
  business_type VARCHAR(50) CHECK (business_type IN (
    'coach', 'agency', 'va', 'consultant', 'freelancer',
    'service_provider', 'course_creator', 'other'
  )),
  revenue_level VARCHAR(50) CHECK (revenue_level IN (
    'under_5k', '5k_10k', '10k_25k', '25k_50k',
    '50k_100k', '100k_250k', '250k_500k', 'over_500k'
  )),
  team_size INTEGER DEFAULT 1,
  years_in_business INTEGER,
  primary_service VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ASSESSMENTS TABLE
-- Each diagnostic session
CREATE TABLE IF NOT EXISTS assessments (
  assessment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  date_taken TIMESTAMPTZ DEFAULT NOW(),
  overall_score NUMERIC(5,2) CHECK (overall_score >= 0 AND overall_score <= 100),

  -- Component scores (calculated from responses)
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
  completion_status VARCHAR(20) DEFAULT 'in_progress' CHECK (completion_status IN ('in_progress', 'completed', 'abandoned')),
  total_questions INTEGER,
  questions_answered INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. DIAGNOSTIC QUESTIONS TABLE
-- Sophisticated behavior-driven questions
CREATE TABLE IF NOT EXISTS diagnostic_questions (
  question_id INTEGER PRIMARY KEY,
  question_order INTEGER UNIQUE,
  category VARCHAR(50) NOT NULL CHECK (category IN (
    'sales_money', 'delivery_systems', 'team_delegation',
    'operations_stress', 'time_impact'
  )),
  component VARCHAR(50) NOT NULL CHECK (component IN (
    'money_freedom', 'systems_freedom', 'team_freedom',
    'stress_freedom', 'time_freedom', 'impact_freedom'
  )),
  question_text TEXT NOT NULL,
  subtitle TEXT, -- Additional context
  scale_description JSONB, -- {1: "description", 10: "description"}
  weight NUMERIC(3,2) DEFAULT 1.0, -- Question importance multiplier
  sprint_trigger VARCHAR(100), -- Which sprint this question recommends
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. DIAGNOSTIC RESPONSES TABLE
-- Individual question answers
CREATE TABLE IF NOT EXISTS diagnostic_responses (
  response_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID REFERENCES assessments(assessment_id) ON DELETE CASCADE,
  question_id INTEGER REFERENCES diagnostic_questions(question_id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 10),
  response_time_seconds INTEGER, -- How long they took to answer
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(assessment_id, question_id) -- One response per question per assessment
);

-- 5. SPRINTS TABLE
-- System-building sprint definitions
CREATE TABLE IF NOT EXISTS sprints (
  sprint_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sprint_key VARCHAR(20) UNIQUE NOT NULL, -- S1, S2, etc.
  category VARCHAR(50) NOT NULL,
  sprint_title VARCHAR(255) NOT NULL,
  description TEXT,
  detailed_outcome TEXT,
  estimated_time_hours INTEGER,
  difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),

  -- Sprint prerequisites and sequencing
  prerequisites JSONB, -- Array of required sprint_keys
  recommended_order INTEGER,

  -- Assets this sprint generates
  assets_generated JSONB, -- {templates: [], sops: [], automations: []}
  tools_required JSONB, -- {required: [], optional: []}

  -- Business impact
  primary_component VARCHAR(50) CHECK (primary_component IN (
    'money_freedom', 'systems_freedom', 'team_freedom',
    'stress_freedom', 'time_freedom', 'impact_freedom'
  )),
  expected_score_improvement INTEGER, -- How much this sprint should improve scores

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. RECOMMENDATIONS TABLE
-- AI-generated sprint recommendations per assessment
CREATE TABLE IF NOT EXISTS recommendations (
  recommendation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID REFERENCES assessments(assessment_id) ON DELETE CASCADE,
  sprint_id UUID REFERENCES sprints(sprint_id) ON DELETE CASCADE,
  priority_rank INTEGER NOT NULL, -- 1 = highest priority
  confidence_score NUMERIC(3,2), -- AI confidence in recommendation (0-1)
  reasoning TEXT, -- Why this sprint was recommended

  -- Projected impact
  estimated_impact_points INTEGER, -- Expected score improvement
  estimated_time_to_complete INTEGER, -- Days/weeks

  -- User interaction
  status VARCHAR(20) DEFAULT 'recommended' CHECK (status IN (
    'recommended', 'accepted', 'in_progress', 'completed',
    'skipped', 'deferred'
  )),
  user_notes TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(assessment_id, sprint_id) -- One recommendation per sprint per assessment
);

-- 7. ARCHETYPE DEFINITIONS TABLE
-- Business freedom archetypes for categorization
CREATE TABLE IF NOT EXISTS archetypes (
  archetype_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  archetype_name VARCHAR(100) UNIQUE NOT NULL,
  archetype_title VARCHAR(150),
  description TEXT,
  characteristics JSONB, -- Key traits and patterns
  common_scores JSONB, -- Typical component score ranges
  primary_challenges JSONB, -- Array of common challenges
  growth_path JSONB, -- Recommended progression
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- User indexes
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_users_business_type ON users(business_type);
CREATE INDEX IF NOT EXISTS idx_users_revenue_level ON users(revenue_level);

-- Assessment indexes
CREATE INDEX IF NOT EXISTS idx_assessments_user_id ON assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_assessments_date_taken ON assessments(date_taken);
CREATE INDEX IF NOT EXISTS idx_assessments_overall_score ON assessments(overall_score);
CREATE INDEX IF NOT EXISTS idx_assessments_archetype ON assessments(archetype);

-- Question indexes
CREATE INDEX IF NOT EXISTS idx_questions_category ON diagnostic_questions(category);
CREATE INDEX IF NOT EXISTS idx_questions_component ON diagnostic_questions(component);
CREATE INDEX IF NOT EXISTS idx_questions_order ON diagnostic_questions(question_order);
CREATE INDEX IF NOT EXISTS idx_questions_active ON diagnostic_questions(is_active);

-- Response indexes
CREATE INDEX IF NOT EXISTS idx_responses_assessment_id ON diagnostic_responses(assessment_id);
CREATE INDEX IF NOT EXISTS idx_responses_question_id ON diagnostic_responses(question_id);
CREATE INDEX IF NOT EXISTS idx_responses_score ON diagnostic_responses(score);

-- Sprint indexes
CREATE INDEX IF NOT EXISTS idx_sprints_category ON sprints(category);
CREATE INDEX IF NOT EXISTS idx_sprints_component ON sprints(primary_component);
CREATE INDEX IF NOT EXISTS idx_sprints_order ON sprints(recommended_order);
CREATE INDEX IF NOT EXISTS idx_sprints_active ON sprints(is_active);

-- Recommendation indexes
CREATE INDEX IF NOT EXISTS idx_recommendations_assessment_id ON recommendations(assessment_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_sprint_id ON recommendations(sprint_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_priority ON recommendations(priority_rank);
CREATE INDEX IF NOT EXISTS idx_recommendations_status ON recommendations(status);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnostic_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users can manage their own profile" ON users
  FOR ALL USING (auth_user_id = auth.uid());

CREATE POLICY "Users can manage their own assessments" ON assessments
  FOR ALL USING (user_id IN (SELECT user_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can manage their own responses" ON diagnostic_responses
  FOR ALL USING (assessment_id IN (
    SELECT assessment_id FROM assessments
    WHERE user_id IN (SELECT user_id FROM users WHERE auth_user_id = auth.uid())
  ));

CREATE POLICY "Users can view their own recommendations" ON recommendations
  FOR SELECT USING (assessment_id IN (
    SELECT assessment_id FROM assessments
    WHERE user_id IN (SELECT user_id FROM users WHERE auth_user_id = auth.uid())
  ));

-- Public read access for questions, sprints, and archetypes
CREATE POLICY "Anyone can view questions" ON diagnostic_questions FOR SELECT USING (true);
CREATE POLICY "Anyone can view sprints" ON sprints FOR SELECT USING (true);
CREATE POLICY "Anyone can view archetypes" ON archetypes FOR SELECT USING (true);

-- =====================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- =====================================================

-- Update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assessments_updated_at
  BEFORE UPDATE ON assessments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sprints_updated_at
  BEFORE UPDATE ON sprints
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recommendations_updated_at
  BEFORE UPDATE ON recommendations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE users IS 'Extended user profiles with business context';
COMMENT ON TABLE assessments IS 'Diagnostic assessment sessions with calculated scores';
COMMENT ON TABLE diagnostic_questions IS 'Sophisticated behavior-driven diagnostic questions';
COMMENT ON TABLE diagnostic_responses IS 'Individual question responses from assessments';
COMMENT ON TABLE sprints IS 'System-building sprint definitions with generated assets';
COMMENT ON TABLE recommendations IS 'AI-generated sprint recommendations per assessment';
COMMENT ON TABLE archetypes IS 'Business freedom archetype definitions for categorization';