-- MINIMAL MIGRATION - Just the essentials to get admin working

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

INSERT INTO ai_personalities (personality_key, name, description, system_prompt, style_guidelines, example_response) VALUES 
('savage', 'Savage Mode', 'Brutal truth-teller', 'Be direct and specific', 'Natural paragraphs only', 'Try a more specific headline'),
('strategic', 'Strategic Mode', 'Business-focused', 'Focus on ROI', 'Professional tone', 'Consider conversion data'),
('creative', 'Creative Mode', 'Story-driven', 'Use emotional hooks', 'Paint vivid pictures', 'Imagine the transformation'),
('analytical', 'Analytical Mode', 'Data-focused', 'Use metrics', 'Provide testing suggestions', 'A/B test this approach'),
('supportive', 'Supportive Mode', 'Encouraging coach', 'Be supportive', 'Frame as improvements', 'Great start! Small tweak...');

GRANT ALL ON ai_personalities TO postgres, service_role;
GRANT SELECT ON ai_personalities TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE ai_personalities_id_seq TO authenticated;