-- STEP 3: Set Up Permissions and Indexes
-- Run this after Step 2 completes successfully

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_personalities_key ON ai_personalities(personality_key);
CREATE INDEX IF NOT EXISTS idx_freedom_components_key ON freedom_score_components(component_key);
CREATE INDEX IF NOT EXISTS idx_user_sprint_assignments_user ON user_sprint_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_content_library_user_type ON content_library(user_id, content_type);

-- Enable Row Level Security
ALTER TABLE ai_personalities ENABLE ROW LEVEL SECURITY;
ALTER TABLE freedom_score_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sprint_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_library ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "ai_personalities_read_all" ON ai_personalities FOR SELECT USING (true);
CREATE POLICY "freedom_components_read_all" ON freedom_score_components FOR SELECT USING (true);
CREATE POLICY "user_sprint_assignments_own_data" ON user_sprint_assignments FOR ALL USING (true);
CREATE POLICY "content_library_own_data" ON content_library FOR ALL USING (true);

-- Grant permissions
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