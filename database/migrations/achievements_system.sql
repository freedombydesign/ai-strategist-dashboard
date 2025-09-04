-- Achievements System Migration
-- Run this in your Supabase SQL editor

-- User Achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    achievement_id TEXT NOT NULL,
    progress INTEGER DEFAULT 0,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, achievement_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON user_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_unlocked_at ON user_achievements(unlocked_at);

-- Row Level Security
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own achievements"
ON user_achievements FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own achievements"
ON user_achievements FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own achievements"
ON user_achievements FOR UPDATE
USING (auth.uid() = user_id);

-- Achievement Points History (for tracking point accumulation over time)
CREATE TABLE IF NOT EXISTS achievement_points_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    achievement_id TEXT NOT NULL,
    points_earned INTEGER NOT NULL,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    FOREIGN KEY (user_id, achievement_id) REFERENCES user_achievements(user_id, achievement_id)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_achievement_points_user_id ON achievement_points_history(user_id);
CREATE INDEX IF NOT EXISTS idx_achievement_points_earned_at ON achievement_points_history(earned_at);

-- RLS for points history
ALTER TABLE achievement_points_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own points history"
ON achievement_points_history FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own points history"
ON achievement_points_history FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Streak Milestones table (for advanced streak tracking)
CREATE TABLE IF NOT EXISTS streak_milestones (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    streak_length INTEGER NOT NULL,
    reached_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    streak_type TEXT DEFAULT 'daily_checkin',
    
    UNIQUE(user_id, streak_length, streak_type)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_streak_milestones_user_id ON streak_milestones(user_id);
CREATE INDEX IF NOT EXISTS idx_streak_milestones_length ON streak_milestones(streak_length);

-- RLS for streak milestones
ALTER TABLE streak_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own streak milestones"
ON streak_milestones FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own streak milestones"
ON streak_milestones FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Add momentum_score column to implementation_progress if it doesn't exist
ALTER TABLE implementation_progress 
ADD COLUMN IF NOT EXISTS momentum_score INTEGER DEFAULT 0;

-- Update existing records with calculated momentum scores
UPDATE implementation_progress 
SET momentum_score = GREATEST(
    (completed_tasks * 20) + (streak_days * 5),
    0
) 
WHERE momentum_score = 0 OR momentum_score IS NULL;

-- Function to automatically update achievement progress
CREATE OR REPLACE FUNCTION update_achievement_progress()
RETURNS TRIGGER AS $$
BEGIN
    -- This function would be called on various triggers to update achievement progress
    -- For now, we'll handle this in the application code for flexibility
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Sample achievement data insert (optional - handled by application)
/*
INSERT INTO user_achievements (user_id, achievement_id, progress, unlocked_at)
VALUES 
  -- Add sample achievements for testing
  ((SELECT id FROM auth.users LIMIT 1), 'first_steps', 1, NOW())
ON CONFLICT (user_id, achievement_id) DO NOTHING;
*/

-- Create a view for easy achievement stats
CREATE OR REPLACE VIEW user_achievement_stats AS
SELECT 
    ua.user_id,
    COUNT(*) as total_achievements_unlocked,
    COALESCE(SUM(
        CASE 
            WHEN ua.achievement_id = 'first_steps' THEN 10
            WHEN ua.achievement_id = 'getting_started' THEN 25
            WHEN ua.achievement_id = 'week_warrior' THEN 50
            WHEN ua.achievement_id = 'task_master' THEN 75
            WHEN ua.achievement_id = 'profit_tracker' THEN 100
            WHEN ua.achievement_id = 'unstoppable' THEN 150
            WHEN ua.achievement_id = 'productivity_king' THEN 200
            WHEN ua.achievement_id = 'sprint_finisher' THEN 200
            WHEN ua.achievement_id = 'growth_hacker' THEN 250
            WHEN ua.achievement_id = 'momentum_master' THEN 300
            WHEN ua.achievement_id = 'energy_champion' THEN 100
            WHEN ua.achievement_id = 'serial_implementer' THEN 500
            WHEN ua.achievement_id = 'business_champion' THEN 750
            WHEN ua.achievement_id = 'implementation_legend' THEN 1000
            WHEN ua.achievement_id = 'transformation_master' THEN 2000
            WHEN ua.achievement_id = 'legendary_consistency' THEN 500
            ELSE 0
        END
    ), 0) as total_points,
    MAX(ua.unlocked_at) as last_achievement_date
FROM user_achievements ua
GROUP BY ua.user_id;

-- Grant permissions
GRANT SELECT ON user_achievement_stats TO authenticated;

COMMENT ON TABLE user_achievements IS 'Tracks individual user achievement unlocks';
COMMENT ON TABLE achievement_points_history IS 'Historical record of points earned from achievements';  
COMMENT ON TABLE streak_milestones IS 'Tracks when users reach specific streak milestones';
COMMENT ON VIEW user_achievement_stats IS 'Aggregated achievement statistics per user';