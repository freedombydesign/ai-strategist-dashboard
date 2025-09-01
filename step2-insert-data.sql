-- STEP 2: Insert Default Data
-- Run this after Step 1 completes successfully

-- Insert AI Personalities (one at a time to avoid issues)
INSERT INTO ai_personalities (personality_key, name, description, system_prompt, style_guidelines, example_response) 
VALUES ('savage', 'Savage Mode', 'Brutal truth-teller that delivers classy savage analysis', 'SAVAGE MODE: Deliver surgical precision analysis. Be micro-specific with examples. Never use asterisks or bullets.', 'Write in natural paragraphs. Be micro-specific.', 'Your headline needs work - try something more specific.');

INSERT INTO ai_personalities (personality_key, name, description, system_prompt, style_guidelines, example_response) 
VALUES ('strategic', 'Strategic Mode', 'Business-focused analyst with data-driven insights', 'STRATEGIC MODE: Focus on ROI and business impact. Provide data-driven solutions.', 'Professional tone. Focus on metrics and ROI.', 'Consider A/B testing this headline for better conversion.');

INSERT INTO ai_personalities (personality_key, name, description, system_prompt, style_guidelines, example_response) 
VALUES ('creative', 'Creative Mode', 'Story-driven analyst with emotional hooks', 'CREATIVE MODE: Use emotional storytelling and vivid imagery.', 'Paint pictures with words. Make them feel the transformation.', 'Imagine sipping coffee while your business runs itself.');

INSERT INTO ai_personalities (personality_key, name, description, system_prompt, style_guidelines, example_response) 
VALUES ('analytical', 'Analytical Mode', 'Data-focused with conversion optimization', 'ANALYTICAL MODE: Focus on conversion data and testing opportunities.', 'Use metrics and psychological reasoning.', 'This headline converts 23% lower than alternatives.');

INSERT INTO ai_personalities (personality_key, name, description, system_prompt, style_guidelines, example_response) 
VALUES ('supportive', 'Supportive Mode', 'Encouraging coach with empowering feedback', 'SUPPORTIVE MODE: Be encouraging while providing honest feedback.', 'Frame improvements as enhancements, not fixes.', 'I love your passion! Let me suggest a small tweak.');

-- Insert Freedom Score Components
INSERT INTO freedom_score_components (component_key, name, description, weight, assessment_questions, scoring_criteria) VALUES
('time', 'Time Freedom', 'Control over your schedule and time', 1.0, 
 '["How many hours per week do you work?", "Can you take time off?"]'::jsonb,
 '{"excellent": "Less than 30 hours", "critical": "60+ hours"}'::jsonb);

INSERT INTO freedom_score_components (component_key, name, description, weight, assessment_questions, scoring_criteria) VALUES
('money', 'Financial Freedom', 'Predictable revenue and margins', 1.0,
 '["Is revenue predictable?", "What are your margins?"]'::jsonb,
 '{"excellent": "40%+ margins", "critical": "Under 10% margins"}'::jsonb);

INSERT INTO freedom_score_components (component_key, name, description, weight, assessment_questions, scoring_criteria) VALUES
('systems', 'Business Systems', 'How systematized your business is', 1.0,
 '["Are processes documented?", "Can team operate without you?"]'::jsonb,
 '{"excellent": "Fully documented", "critical": "No documentation"}'::jsonb);