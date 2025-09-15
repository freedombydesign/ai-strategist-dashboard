-- Freedom Scores Table
-- Tracks user freedom assessments across 6 core components
CREATE TABLE IF NOT EXISTS freedom_scores (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  assessment_date DATE NOT NULL,

  -- Freedom Components (0-100 scale)
  time_freedom INTEGER NOT NULL CHECK (time_freedom >= 0 AND time_freedom <= 100),
  money_freedom INTEGER NOT NULL CHECK (money_freedom >= 0 AND money_freedom <= 100),
  impact_freedom INTEGER NOT NULL CHECK (impact_freedom >= 0 AND impact_freedom <= 100),
  systems_freedom INTEGER NOT NULL CHECK (systems_freedom >= 0 AND systems_freedom <= 100),
  team_freedom INTEGER NOT NULL CHECK (team_freedom >= 0 AND team_freedom <= 100),
  stress_freedom INTEGER NOT NULL CHECK (stress_freedom >= 0 AND stress_freedom <= 100),

  -- Calculated overall score
  overall_score INTEGER GENERATED ALWAYS AS (
    ROUND((time_freedom + money_freedom + impact_freedom + systems_freedom + team_freedom + stress_freedom)::NUMERIC / 6)
  ) STORED,

  -- Metadata
  assessment_method VARCHAR(50) DEFAULT 'dashboard_update',
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_freedom_scores_user_id ON freedom_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_freedom_scores_assessment_date ON freedom_scores(assessment_date);
CREATE INDEX IF NOT EXISTS idx_freedom_scores_user_date ON freedom_scores(user_id, assessment_date);
CREATE INDEX IF NOT EXISTS idx_freedom_scores_overall_score ON freedom_scores(overall_score);

-- RLS (Row Level Security) Policy
ALTER TABLE freedom_scores ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own freedom scores
CREATE POLICY "Users can manage their own freedom scores" ON freedom_scores
  FOR ALL
  USING (auth.uid() = user_id);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_freedom_scores_updated_at
  BEFORE UPDATE ON freedom_scores
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Sample data for testing (replace with your user ID)
-- INSERT INTO freedom_scores (
--   user_id,
--   assessment_date,
--   time_freedom,
--   money_freedom,
--   impact_freedom,
--   systems_freedom,
--   team_freedom,
--   stress_freedom,
--   assessment_method,
--   notes
-- ) VALUES
-- ('your-user-id-here', '2024-01-15', 82, 68, 75, 71, 79, 85, 'dashboard_update', 'Initial assessment'),
-- ('your-user-id-here', '2024-01-08', 79, 65, 72, 68, 76, 82, 'dashboard_update', 'Weekly check-in');

COMMENT ON TABLE freedom_scores IS 'Stores user freedom assessments across 6 core components';
COMMENT ON COLUMN freedom_scores.time_freedom IS 'Time freedom score (0-100): Control over schedule and time';
COMMENT ON COLUMN freedom_scores.money_freedom IS 'Money freedom score (0-100): Financial independence and cash flow';
COMMENT ON COLUMN freedom_scores.impact_freedom IS 'Impact freedom score (0-100): Meaningful work and influence';
COMMENT ON COLUMN freedom_scores.systems_freedom IS 'Systems freedom score (0-100): Automated processes and efficiency';
COMMENT ON COLUMN freedom_scores.team_freedom IS 'Team freedom score (0-100): Delegation and team capability';
COMMENT ON COLUMN freedom_scores.stress_freedom IS 'Stress freedom score (0-100): Low stress and high well-being';