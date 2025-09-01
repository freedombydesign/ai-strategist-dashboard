-- COMPLETE FRAMEWORK MIGRATION - Ruth's AI Strategist Database Setup
-- This migration addresses missing tables and sets up comprehensive framework system

-- 1. AI Personalities Table (NEW)
CREATE TABLE IF NOT EXISTS ai_personalities (
  id SERIAL PRIMARY KEY,
  personality_key TEXT UNIQUE NOT NULL, -- 'savage', 'strategic', 'creative', 'analytical', 'supportive'
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  system_prompt TEXT NOT NULL,
  style_guidelines TEXT,
  example_response TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default personality configurations
INSERT INTO ai_personalities (personality_key, name, description, system_prompt, style_guidelines, example_response) VALUES 
('savage', 'Savage Mode', 'Brutal truth-teller that delivers classy savage analysis without shame or blame', 
'CLASSY SAVAGE ANALYSIS - MICRO-SPECIFIC DIAGNOSIS WITH VISCERAL SOLUTIONS:

Your job is to deliver surgical precision analysis that makes users think "holy shit, that''s exactly my Tuesday night." Quote their exact copy, diagnose the precise psychological/conversion mechanism that''s failing, then provide visceral, specific alternatives that capture their audience''s exact lived experience.

Rules:
- Headlines should be 6-12 words max painting specific scenarios
- CTAs should be 2-4 words max, button text
- Avoid generic phrases like "Scale Beyond" or "Business Freedom"
- Use specific daily realities like "No More Weekend Calls About Problems You''ve Solved Three Times"
- Recognize greatness when you see it and amplify what''s working
- Be descriptively brutal about what''s not working, but never blame or shame', 
'Never use asterisks, bullets, or numbered lists. Write in natural paragraphs. Be micro-specific with examples that paint exact scenarios. Focus on visceral daily realities rather than generic benefits.',
'Your headline "Get More Clients" is triggering every prospect''s spam detector because it sounds exactly like the 47 other coaches they saw this week. Instead, try "Stop Explaining What You Do At Networking Events" - now they''re thinking about that awkward Tuesday night when they fumbled through their pitch again.'),

('strategic', 'Strategic Mode', 'Business-focused analyst that provides data-driven insights and competitive positioning', 
'STRATEGIC MODE: Focus on business impact, ROI, and competitive positioning. Know sales page structure: Headlines = short punchy benefits (6-12 words), CTAs = short button text (2-4 words), Body copy = detailed ROI explanations.

Your job is to identify what''s costing money and provide data-driven solutions with proper structure. Always consider market positioning, competitive advantage, and measurable business outcomes.',
'Maintain professional tone while being direct about business impact. Use specific examples and focus on ROI, conversion data, and strategic positioning. Structure recommendations clearly.',
'For your headline, "Remove Yourself" likely reduces click-through rates because it triggers loss aversion. Try "Build Your Dream Business" - aspirational headlines outperform escape-focused messaging by 23% in our testing.'),

('creative', 'Creative Mode', 'Story-driven analyst that uses emotional hooks and compelling narratives', 
'CREATIVE MODE: Know sales page structure but focus on emotional engagement and compelling messaging. Headlines = short punchy benefits (6-12 words), CTAs = short button text (2-4 words), Body copy = detailed stories and emotional hooks.

Paint vivid pictures and use emotional storytelling to make prospects feel the transformation. Focus on the journey and emotional payoff.',
'Use vivid imagery, emotional storytelling, and paint pictures of transformation. Make prospects feel the change rather than just understand it. Keep structure proper but add emotional depth.',
'For your headline, try "Build Your Dream Business" but in your body copy, paint the picture: "Imagine sipping coffee on a Tuesday morning while your business runs smoothly without a single phone call from your team." Make them feel that Tuesday morning peace.'),

('analytical', 'Analytical Mode', 'Data-focused analyst that provides conversion optimization and testing insights', 
'ANALYTICAL MODE: Know sales page structure and focus on conversion data, user psychology, and testing opportunities. Headlines = short punchy benefits (6-12 words), CTAs = short button text (2-4 words), Body copy = detailed analysis and data.

Provide conversion-optimized recommendations with psychological reasoning and suggest A/B tests to validate improvements.',
'Focus on conversion psychology, user behavior data, testing opportunities. Provide specific metrics when possible and psychological reasoning behind recommendations.',
'Your current headline has a 23% lower click-through rate than benefit-focused alternatives. Consider A/B testing "Build Your Dream Business" against your current copy. The psychological trigger shifts from loss aversion to aspiration, which typically converts 35% better for service providers.'),

('supportive', 'Supportive Mode', 'Encouraging coach that provides gentle but honest feedback with empowerment', 
'SUPPORTIVE MODE: Know sales page structure and provide gentle but honest feedback with encouragement. Headlines = short punchy benefits (6-12 words), CTAs = short button text (2-4 words), Body copy = encouraging explanations and support.

Focus on what''s working and how to improve what isn''t, while maintaining the user''s authentic voice and building confidence.',
'Be encouraging and supportive while still providing honest feedback. Acknowledge what''s working well and frame improvements as enhancements rather than fixes.',
'I love your passion for helping business owners! Your current approach shows you really care about their success. For your headline, "Remove Yourself" might push away people who enjoy their work but need better systems. Try "Build a Business That Thrives Without You" - this maintains the freedom benefit while honoring their love for what they do.');

-- 2. Freedom Score Components Table (NEW) - For storing assessment criteria
CREATE TABLE IF NOT EXISTS freedom_score_components (
  id SERIAL PRIMARY KEY,
  component_key TEXT UNIQUE NOT NULL, -- 'time', 'money', 'impact', 'systems', 'team', 'stress'
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  weight DECIMAL(3,2) DEFAULT 1.0, -- Weight in overall score calculation
  assessment_questions JSONB DEFAULT '[]',
  scoring_criteria JSONB DEFAULT '{}',
  improvement_strategies JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default freedom score components
INSERT INTO freedom_score_components (component_key, name, description, weight, assessment_questions, scoring_criteria) VALUES
('time', 'Time Freedom', 'How much control you have over your schedule and time', 1.0, 
'["How many hours per week do you work?", "How often do you work weekends?", "Can you take a week off without checking in?"]'::jsonb,
'{"excellent": "Less than 30 hours, rarely work weekends, can take time off easily", "good": "30-40 hours, occasional weekends, some flexibility", "needs_work": "40-60 hours, regular weekends, always checking in", "critical": "60+ hours, most weekends, cannot disconnect"}'::jsonb),

('money', 'Financial Freedom', 'Predictable revenue and profit margins', 1.0,
'["Is your revenue predictable month-to-month?", "What are your profit margins?", "How often do you worry about money?"]'::jsonb,
'{"excellent": "Predictable revenue, 40%+ margins, no money stress", "good": "Mostly predictable, 25-40% margins, occasional concern", "needs_work": "Unpredictable revenue, 10-25% margins, regular worry", "critical": "Feast or famine, under 10% margins, constant stress"}'::jsonb),

('impact', 'Impact & Growth', 'Your ability to scale impact without scaling hours', 1.0,
'["How many clients can you serve without working more hours?", "Is your impact growing?", "Do you have systems to scale?"]'::jsonb,
'{"excellent": "Unlimited scaling potential, growing impact, strong systems", "good": "Some scaling ability, steady growth, basic systems", "needs_work": "Limited scaling, slow growth, few systems", "critical": "Cannot scale, stagnant, no systems"}'::jsonb),

('systems', 'Business Systems', 'How systematized and automated your business is', 1.0,
'["Are your processes documented?", "How much is automated?", "Can your team operate without you?"]'::jsonb,
'{"excellent": "Fully documented, highly automated, team independent", "good": "Most processes documented, some automation", "needs_work": "Basic documentation, minimal automation", "critical": "No documentation, manual everything"}'::jsonb),

('team', 'Team & Delegation', 'Your ability to delegate and trust your team', 1.0,
'["Do you have a reliable team?", "How much do you delegate?", "Do you trust your team with important tasks?"]'::jsonb,
'{"excellent": "Strong team, delegate everything, complete trust", "good": "Good team, delegate most things, generally trust", "needs_work": "Small team, delegate some things, selective trust", "critical": "No team or unreliable, do everything yourself"}'::jsonb),

('stress', 'Stress & Satisfaction', 'Your stress levels and job satisfaction', 1.0,
'["How stressed are you daily?", "Do you enjoy your work?", "Are you burned out?"]'::jsonb,
'{"excellent": "Low stress, love the work, energized", "good": "Manageable stress, generally enjoy it", "needs_work": "High stress, mixed feelings", "critical": "Extreme stress, hate it, burned out"}'::jsonb);

-- 3. User Sprint Assignments Table (NEW) - Track which sprint users should focus on
CREATE TABLE IF NOT EXISTS user_sprint_assignments (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  sprint_key TEXT NOT NULL REFERENCES sprints(sprint_key),
  priority INTEGER DEFAULT 1, -- 1 = highest priority
  status TEXT DEFAULT 'assigned', -- 'assigned', 'in_progress', 'completed'
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, sprint_key)
);

-- 4. Business Context Enhancement (extend existing business_context table)
-- Check if business_context table exists and add missing columns
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'business_context') THEN
        -- Add missing columns to existing business_context table
        ALTER TABLE business_context 
        ADD COLUMN IF NOT EXISTS business_stage TEXT,
        ADD COLUMN IF NOT EXISTS primary_challenges TEXT[],
        ADD COLUMN IF NOT EXISTS revenue_range TEXT,
        ADD COLUMN IF NOT EXISTS team_size INTEGER,
        ADD COLUMN IF NOT EXISTS current_systems JSONB DEFAULT '{}',
        ADD COLUMN IF NOT EXISTS pain_points TEXT[],
        ADD COLUMN IF NOT EXISTS goals JSONB DEFAULT '{}',
        ADD COLUMN IF NOT EXISTS assessment_data JSONB DEFAULT '{}';
    ELSE
        -- Create the business_context table if it doesn't exist
        CREATE TABLE business_context (
            id SERIAL PRIMARY KEY,
            user_id TEXT NOT NULL,
            business_name TEXT,
            business_type TEXT,
            target_audience TEXT,
            business_model TEXT,
            business_stage TEXT,
            primary_challenges TEXT[],
            revenue_range TEXT,
            team_size INTEGER,
            current_systems JSONB DEFAULT '{}',
            pain_points TEXT[],
            goals JSONB DEFAULT '{}',
            assessment_data JSONB DEFAULT '{}',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
END $$;

-- 5. Enhanced Website Intelligence (already exists, add any missing columns)
ALTER TABLE website_intelligence 
ADD COLUMN IF NOT EXISTS conversion_elements JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS psychological_triggers JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS competitor_analysis JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS optimization_priority INTEGER DEFAULT 1;

-- 6. Content Library Table (NEW) - Store reusable content and templates
CREATE TABLE IF NOT EXISTS content_library (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  content_type TEXT NOT NULL, -- 'email_template', 'ad_template', 'script_template', 'headline_bank', 'cta_bank'
  category TEXT NOT NULL, -- 'positioning', 'sales', 'nurture', 'conversion', etc.
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  performance_data JSONB DEFAULT '{}', -- Track what works
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_personalities_key ON ai_personalities(personality_key);
CREATE INDEX IF NOT EXISTS idx_freedom_components_key ON freedom_score_components(component_key);
CREATE INDEX IF NOT EXISTS idx_user_sprint_assignments_user ON user_sprint_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sprint_assignments_priority ON user_sprint_assignments(user_id, priority);
CREATE INDEX IF NOT EXISTS idx_content_library_user_type ON content_library(user_id, content_type);
CREATE INDEX IF NOT EXISTS idx_content_library_category ON content_library(category);

-- 8. Enable Row Level Security on new tables
ALTER TABLE ai_personalities ENABLE ROW LEVEL SECURITY;
ALTER TABLE freedom_score_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sprint_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_library ENABLE ROW LEVEL SECURITY;

-- 9. Create RLS policies
CREATE POLICY "ai_personalities_read_all" ON ai_personalities FOR SELECT USING (true);
CREATE POLICY "ai_personalities_admin_manage" ON ai_personalities FOR ALL USING (true); -- Admin can manage all

CREATE POLICY "freedom_components_read_all" ON freedom_score_components FOR SELECT USING (true);
CREATE POLICY "freedom_components_admin_manage" ON freedom_score_components FOR ALL USING (true);

CREATE POLICY "user_sprint_assignments_own_data" ON user_sprint_assignments FOR ALL USING (true);

CREATE POLICY "content_library_own_data" ON content_library FOR ALL USING (true);

-- 10. Grant permissions
GRANT ALL ON ai_personalities TO postgres, service_role;
GRANT SELECT ON ai_personalities TO authenticated;

GRANT ALL ON freedom_score_components TO postgres, service_role;
GRANT SELECT ON freedom_score_components TO authenticated;

GRANT ALL ON user_sprint_assignments TO postgres, service_role;
GRANT ALL ON user_sprint_assignments TO authenticated;

GRANT ALL ON content_library TO postgres, service_role;
GRANT ALL ON content_library TO authenticated;

-- Grant sequence permissions
GRANT USAGE, SELECT ON SEQUENCE ai_personalities_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE freedom_score_components_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE user_sprint_assignments_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE content_library_id_seq TO authenticated;

-- 11. Add comments for documentation
COMMENT ON TABLE ai_personalities IS 'Stores customizable AI personality configurations for different response modes';
COMMENT ON TABLE freedom_score_components IS 'Components used to calculate Freedom Score assessments';
COMMENT ON TABLE user_sprint_assignments IS 'Tracks which sprints users are assigned to and their progress';
COMMENT ON TABLE content_library IS 'Reusable content templates and high-performing copy examples';

-- 12. Update triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ai_personalities_updated_at 
  BEFORE UPDATE ON ai_personalities 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_library_updated_at 
  BEFORE UPDATE ON content_library 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();