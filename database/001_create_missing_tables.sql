-- Create missing tables for implementation tracking
-- These are the core tables needed for the platform to function

-- Daily check-ins table
CREATE TABLE IF NOT EXISTS daily_checkins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  checkin_date DATE NOT NULL,
  completed_tasks JSONB DEFAULT '[]'::jsonb,
  obstacles TEXT DEFAULT '',
  energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 10),
  business_updates JSONB DEFAULT '{}'::jsonb,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, checkin_date)
);

-- Implementation progress table
CREATE TABLE IF NOT EXISTS implementation_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sprint_id TEXT NOT NULL,
  total_tasks INTEGER DEFAULT 0,
  completed_tasks INTEGER DEFAULT 0,
  completion_percentage INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  last_activity_date DATE,
  momentum_score INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, sprint_id)
);

-- User achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL,
  progress INTEGER DEFAULT 0,
  unlocked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- Business snapshots table
CREATE TABLE IF NOT EXISTS business_snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  monthly_revenue DECIMAL(12,2) DEFAULT 0,
  monthly_expenses DECIMAL(12,2) DEFAULT 0,
  profit_margin DECIMAL(5,2) DEFAULT 0,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, snapshot_date)
);

-- Add missing updated_at column to user_steps if it doesn't exist
ALTER TABLE user_steps 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_daily_checkins_user_date ON daily_checkins(user_id, checkin_date);
CREATE INDEX IF NOT EXISTS idx_implementation_progress_user ON implementation_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_business_snapshots_user_date ON business_snapshots(user_id, snapshot_date);

-- Row Level Security (RLS) policies
ALTER TABLE daily_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE implementation_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_snapshots ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY IF NOT EXISTS "Users can access their own daily_checkins" ON daily_checkins
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can access their own implementation_progress" ON implementation_progress
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can access their own user_achievements" ON user_achievements
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can access their own business_snapshots" ON business_snapshots
  FOR ALL USING (auth.uid() = user_id);

-- Update functions for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_daily_checkins_updated_at ON daily_checkins;
CREATE TRIGGER update_daily_checkins_updated_at
  BEFORE UPDATE ON daily_checkins
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_implementation_progress_updated_at ON implementation_progress;
CREATE TRIGGER update_implementation_progress_updated_at
  BEFORE UPDATE ON implementation_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_business_snapshots_updated_at ON business_snapshots;
CREATE TRIGGER update_business_snapshots_updated_at
  BEFORE UPDATE ON business_snapshots
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_steps_updated_at ON user_steps;
CREATE TRIGGER update_user_steps_updated_at
  BEFORE UPDATE ON user_steps
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();