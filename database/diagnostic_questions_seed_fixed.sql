-- =====================================================
-- DIAGNOSTIC QUESTIONS SEED DATA
-- 12-15 sophisticated behavior-driven questions
-- SAFE VERSION - Does not delete existing data
-- FIXED VERSION - Includes question_id values
-- =====================================================

-- NOTE: This will ADD to existing data, not replace it
-- If you need to replace, manually delete first

-- Category 1: Sales / Money Freedom (3 questions)
INSERT INTO diagnostic_questions (
  question_id, question_order, category, component, question_text, subtitle,
  scale_description, weight, sprint_trigger
) VALUES

-- Q1: Client Pipeline Predictability
(1, 1, 'sales_money', 'money_freedom',
 'How predictable is your monthly flow of new clients?',
 'Consistent client acquisition vs. feast-or-famine cycles',
 '{"1": "No predictability - I scramble to find clients each month", "5": "Some patterns but still unpredictable", "10": "Steady, systemized flow of qualified leads converting to clients"}',
 1.2, 'Acquisition Engine'),

-- Q2: Pricing Power
(2, 2, 'sales_money', 'money_freedom',
 'To what extent do you feel confident your current pricing reflects your value (not leaving money on the table)?',
 'Pricing confidence and value positioning',
 '{"1": "I undercharge significantly and fear losing clients if I raise prices", "5": "Pricing is okay but probably could be higher", "10": "My pricing reflects premium value and clients pay willingly"}',
 1.1, 'Pricing Optimization'),

-- Q3: Revenue Consistency
(3, 3, 'sales_money', 'money_freedom',
 'How steady is your monthly revenue (vs. unpredictable feast/famine swings)?',
 'Revenue stability and financial predictability',
 '{"1": "Wild swings - some months great, others terrible", "5": "Somewhat predictable with occasional dips", "10": "Consistent, reliable revenue I can count on"}',
 1.3, 'Offer Stabilization'),

-- Category 2: Delivery / Systems Freedom (3 questions)
-- Q4: Client Onboarding
(4, 4, 'delivery_systems', 'systems_freedom',
 'When a new client signs on, how automated and consistent is your onboarding process?',
 'Standardized client onboarding experience',
 '{"1": "I manually handle everything and it varies each time", "5": "Some templates but still requires lots of manual work", "10": "Fully systematized - emails, forms, contracts, kickoff all automated"}',
 1.4, 'Onboarding System'),

-- Q5: Project Delivery Consistency
(5, 5, 'delivery_systems', 'systems_freedom',
 'How standardized are your client deliverables (vs. reinventing the wheel each project)?',
 'Consistent service delivery processes',
 '{"1": "Every project is different, I start from scratch each time", "5": "Some templates but lots of customization needed", "10": "Highly standardized process with proven templates and workflows"}',
 1.3, 'Service Delivery Systemization'),

-- Q6: Revision/Feedback Process
(6, 6, 'delivery_systems', 'systems_freedom',
 'How streamlined are your client revisions, approvals, and feedback loops?',
 'Efficient feedback and revision management',
 '{"1": "Chaotic - revisions drag on with unclear processes", "5": "Decent process but could be more efficient", "10": "Clear revision limits, streamlined approval process, quick turnarounds"}',
 1.2, 'Revision System'),

-- Category 3: Team / Delegation Freedom (2 questions)
-- Q7: Delegation Effectiveness
(7, 7, 'team_delegation', 'team_freedom',
 'If you took a week off, how much of client work would still move forward without you?',
 'Business dependency on your direct involvement',
 '{"1": "Nothing would move - everything requires me personally", "5": "Some things would continue but key decisions need me", "10": "90%+ would continue smoothly with minimal disruption"}',
 1.5, 'Delegation Framework'),

-- Q8: Task Management Efficiency
(8, 8, 'team_delegation', 'team_freedom',
 'How efficient is your process for assigning, tracking, and reviewing tasks with your team/contractors?',
 'Team coordination and task management systems',
 '{"1": "No system - I manage everything in my head or scattered notes", "5": "Basic system but requires constant oversight", "10": "Clear systems where tasks are assigned, tracked, and completed without my constant involvement"}',
 1.3, 'Task Management System'),

-- Category 4: Operations / Stress Freedom (2 questions)
-- Q9: Reporting & Updates
(9, 9, 'operations_stress', 'stress_freedom',
 'How automated and consistent is your reporting or client update process?',
 'Client communication and progress reporting',
 '{"1": "I manually create updates and often scramble at the last minute", "5": "Some templates but still time-consuming to create", "10": "Automated dashboards and regular reports that generate themselves"}',
 1.2, 'Reporting Automation'),

-- Q10: Issue Resolution
(10, 10, 'operations_stress', 'stress_freedom',
 'How confident are you that client issues are resolved quickly without needing you directly?',
 'Problem resolution without owner intervention',
 '{"1": "Every issue escalates to me and disrupts my focus", "5": "Team handles some issues but complex ones need me", "10": "Team handles 90%+ of issues with clear escalation protocols"}',
 1.3, 'Client Issue Resolution SOP'),

-- Category 5: Time / Impact Freedom (3 questions)
-- Q11: Zone of Genius Time
(11, 11, 'time_impact', 'time_freedom',
 'What percentage of your working time is spent in your zone of genius vs. admin/coordination?',
 'Time allocation to high-value activities',
 '{"1": "Less than 20% - mostly admin and putting out fires", "5": "About 50/50 between valuable work and admin", "10": "80%+ in my zone of genius - strategy, creation, high-value client work"}',
 1.4, 'Time Reallocation'),

-- Q12: Schedule Flexibility
(12, 12, 'time_impact', 'time_freedom',
 'How much flexibility do you have to set your own hours and step away without disruption?',
 'Control over schedule and availability',
 '{"1": "Always on call - clients and team need constant availability", "5": "Some flexibility but still tethered to business", "10": "Full control over my schedule - can step away for hours/days without issues"}',
 1.2, 'Calendar & Boundaries'),

-- Q13: Business Impact vs Busywork
(13, 13, 'time_impact', 'impact_freedom',
 'How much of your daily work creates long-term business growth vs. short-term busywork?',
 'Strategic vs. tactical work distribution',
 '{"1": "Mostly reactive busywork and maintenance tasks", "5": "Mix of growth work and necessary maintenance", "10": "Majority of time on strategic growth, systems building, and high-impact activities"}',
 1.3, 'Growth Priority System'),

-- Q14: Energy and Motivation
(14, 14, 'operations_stress', 'stress_freedom',
 'How energized vs. drained do you feel at the end of a typical work day?',
 'Work sustainability and energy management',
 '{"1": "Completely drained and burnt out most days", "5": "Tired but manageable - some good days, some bad", "10": "Energized and excited about the work I''m doing"}',
 1.1, 'Energy Management System'),

-- Q15: Vision and Direction
(15, 15, 'time_impact', 'impact_freedom',
 'How clear and aligned is your daily work with your bigger business vision and goals?',
 'Strategic alignment and purposeful work',
 '{"1": "No clear vision - just trying to survive day-to-day", "5": "Some goals but daily work often feels disconnected", "10": "Crystal clear vision and every action moves me toward bigger goals"}',
 1.2, 'Vision & Goal Alignment System');

-- =====================================================
-- SPRINT DEFINITIONS
-- =====================================================

-- NOTE: Adding sprints to existing data

INSERT INTO sprints (
  sprint_key, category, sprint_title, description, detailed_outcome,
  estimated_time_hours, difficulty_level, recommended_order,
  primary_component, expected_score_improvement,
  assets_generated, tools_required, prerequisites
) VALUES

-- Money Freedom Sprints
('S1', 'Sales & Marketing', 'Acquisition Engine',
 'Build a predictable client acquisition system',
 'Systematic lead generation, qualification, and conversion process that runs without constant attention',
 20, 'intermediate', 1, 'money_freedom', 15,
 '{"templates": ["Lead Magnet Template", "Email Sequence Templates"], "sops": ["Lead Qualification SOP", "Sales Process SOP"], "automations": ["Lead Scoring System", "Follow-up Sequences"]}',
 '{"required": ["Email Platform", "CRM"], "optional": ["Landing Page Builder", "Analytics Tool"]}',
 '[]'),

('S2', 'Sales & Marketing', 'Pricing Optimization',
 'Develop confident, value-based pricing strategy',
 'Clear pricing structure that reflects your value and converts well',
 12, 'beginner', 2, 'money_freedom', 12,
 '{"templates": ["Pricing Calculator", "Value Proposition Framework"], "sops": ["Price Increase Communication SOP"], "automations": []}',
 '{"required": ["Market Research Tools"], "optional": ["Competitive Analysis Tools"]}',
 '[]'),

('S3', 'Sales & Marketing', 'Offer Stabilization',
 'Create consistent, repeatable service offerings',
 'Standardized packages that deliver predictable results and revenue',
 16, 'intermediate', 3, 'money_freedom', 18,
 '{"templates": ["Service Package Templates", "Scope Documents"], "sops": ["Package Delivery SOP"], "automations": []}',
 '{"required": ["Documentation Tools"], "optional": ["Project Management System"]}',
 '["S2"]'),

-- Systems Freedom Sprints
('S4', 'Operations', 'Onboarding System',
 'Automate and systematize client onboarding',
 'Seamless, professional onboarding that impresses clients and saves time',
 14, 'intermediate', 4, 'systems_freedom', 20,
 '{"templates": ["Welcome Email Sequence", "Onboarding Checklist", "Contract Templates"], "sops": ["Onboarding Process SOP"], "automations": ["Welcome Automation", "Document Collection"]}',
 '{"required": ["Email Automation", "Document Management"], "optional": ["E-signature Tool", "Client Portal"]}',
 '["S3"]'),

('S5', 'Operations', 'Service Delivery Systemization',
 'Standardize your core service delivery process',
 'Consistent, high-quality deliverables with minimal reinvention',
 24, 'advanced', 5, 'systems_freedom', 22,
 '{"templates": ["Project Templates", "Deliverable Templates", "Quality Checklists"], "sops": ["Service Delivery SOP", "Quality Control SOP"], "automations": ["Progress Tracking", "Milestone Notifications"]}',
 '{"required": ["Project Management Tool", "Template Storage"], "optional": ["Time Tracking", "Client Portal"]}',
 '["S4"]'),

('S6', 'Operations', 'Revision System',
 'Streamline feedback and revision processes',
 'Efficient feedback loops with clear boundaries and fast turnarounds',
 10, 'beginner', 6, 'systems_freedom', 15,
 '{"templates": ["Revision Request Forms", "Feedback Templates"], "sops": ["Revision Policy SOP", "Feedback Collection SOP"], "automations": ["Revision Tracking", "Approval Workflows"]}',
 '{"required": ["Feedback Tool"], "optional": ["Approval Software", "Version Control"]}',
 '["S5"]'),

-- Team Freedom Sprints
('S7', 'Team & Delegation', 'Delegation Framework',
 'Build effective delegation and oversight systems',
 'Team that operates independently with clear accountability',
 18, 'intermediate', 7, 'team_freedom', 25,
 '{"templates": ["Role Descriptions", "Delegation Checklists"], "sops": ["Delegation SOP", "Team Communication SOP"], "automations": ["Task Assignment", "Progress Reporting"]}',
 '{"required": ["Task Management System"], "optional": ["Team Communication Tool", "Performance Tracking"]}',
 '["S5"]'),

('S8', 'Team & Delegation', 'Task Management System',
 'Implement efficient task coordination and tracking',
 'Clear task assignment, tracking, and completion without constant oversight',
 12, 'beginner', 8, 'team_freedom', 18,
 '{"templates": ["Task Templates", "Project Briefs"], "sops": ["Task Management SOP"], "automations": ["Task Notifications", "Progress Updates"]}',
 '{"required": ["Project Management Tool"], "optional": ["Time Tracking", "Reporting Dashboard"]}',
 '["S7"]'),

-- Stress Freedom Sprints
('S9', 'Operations', 'Reporting Automation',
 'Automate client reporting and progress updates',
 'Regular, professional reports that generate automatically',
 14, 'intermediate', 9, 'stress_freedom', 20,
 '{"templates": ["Report Templates", "Dashboard Templates"], "sops": ["Reporting Schedule SOP"], "automations": ["Report Generation", "Data Collection"]}',
 '{"required": ["Reporting Tool", "Data Source"], "optional": ["Dashboard Software", "Analytics Platform"]}',
 '["S6"]'),

('S10', 'Operations', 'Client Issue Resolution SOP',
 'Create systematic issue resolution processes',
 'Team handles most issues independently with clear escalation paths',
 8, 'beginner', 10, 'stress_freedom', 16,
 '{"templates": ["Issue Tracking Templates", "Resolution Scripts"], "sops": ["Issue Resolution SOP", "Escalation SOP"], "automations": ["Issue Tracking", "Escalation Alerts"]}',
 '{"required": ["Issue Tracking System"], "optional": ["Knowledge Base", "Customer Support Tool"]}',
 '["S8"]'),

-- Time & Impact Freedom Sprints
('S11', 'Personal Systems', 'Time Reallocation',
 'Optimize time allocation to high-value activities',
 'Clear boundaries and systems that protect your highest-value time',
 10, 'beginner', 11, 'time_freedom', 20,
 '{"templates": ["Time Audit Template", "Calendar Templates"], "sops": ["Time Management SOP", "Priority Matrix SOP"], "automations": ["Calendar Blocking", "Task Prioritization"]}',
 '{"required": ["Calendar System"], "optional": ["Time Tracking", "Focus Apps"]}',
 '["S7"]'),

('S12', 'Personal Systems', 'Calendar & Boundaries',
 'Establish healthy work boundaries and schedule control',
 'Protected time for deep work and personal life without business disruption',
 6, 'beginner', 12, 'time_freedom', 15,
 '{"templates": ["Boundary Communication Templates", "Out of Office Templates"], "sops": ["Boundary Setting SOP"], "automations": ["Calendar Protection", "Communication Boundaries"]}',
 '{"required": ["Calendar System"], "optional": ["Communication Tools"]}',
 '["S11"]'),

('S13', 'Strategy', 'Growth Priority System',
 'Focus daily work on strategic, high-impact activities',
 'Clear system for identifying and prioritizing growth-driving activities',
 12, 'intermediate', 13, 'impact_freedom', 18,
 '{"templates": ["Goal Framework", "Priority Matrix"], "sops": ["Strategic Planning SOP", "Priority Assessment SOP"], "automations": ["Goal Tracking", "Progress Monitoring"]}',
 '{"required": ["Goal Tracking System"], "optional": ["Analytics Dashboard", "KPI Tracking"]}',
 '["S9"]'),

('S14', 'Personal Systems', 'Energy Management System',
 'Optimize daily energy and prevent burnout',
 'Sustainable work rhythm that maintains high energy and motivation',
 8, 'beginner', 14, 'stress_freedom', 12,
 '{"templates": ["Energy Audit Template", "Recovery Planning Template"], "sops": ["Energy Management SOP"], "automations": ["Break Reminders", "Workload Monitoring"]}',
 '{"required": ["Schedule Management"], "optional": ["Wellness Apps", "Productivity Tracking"]}',
 '["S12"]'),

('S15', 'Strategy', 'Vision & Goal Alignment System',
 'Align daily actions with long-term business vision',
 'Clear connection between daily work and bigger business goals',
 10, 'intermediate', 15, 'impact_freedom', 15,
 '{"templates": ["Vision Canvas", "Goal Alignment Framework"], "sops": ["Vision Review SOP", "Goal Setting SOP"], "automations": ["Progress Tracking", "Alignment Checking"]}',
 '{"required": ["Planning System"], "optional": ["Vision Board Tool", "Progress Dashboard"]}',
 '["S13"]');

-- =====================================================
-- BUSINESS FREEDOM ARCHETYPES
-- =====================================================

-- NOTE: Adding archetypes to existing data

INSERT INTO archetypes (
  archetype_name, archetype_title, description, characteristics,
  common_scores, primary_challenges, growth_path
) VALUES

('bottleneck_boss', 'The Bottleneck Boss',
 'High-achieving entrepreneur who has become the limiting factor in their own business growth.',
 '["High personal performance", "Everything flows through them", "Difficulty delegating", "Control-oriented", "Works long hours"]',
 '{"money_freedom": "60-75", "systems_freedom": "30-50", "team_freedom": "20-40", "stress_freedom": "30-55", "time_freedom": "25-45", "impact_freedom": "65-80"}',
 '["Delegation resistance", "Time scarcity", "Burnout risk", "Team dependency", "Growth limitations"]',
 '{"primary_focus": "Delegation and systems", "key_sprints": ["S7", "S4", "S5"], "timeline": "6-12 months"}'),

('custom_queen', 'The Custom Queen/King',
 'Service provider who creates bespoke solutions for every client, limiting scalability.',
 '["High-quality deliverables", "Client-focused", "Creative problem solver", "Perfectionist tendencies", "Customization-heavy"]',
 '{"money_freedom": "45-65", "systems_freedom": "25-45", "team_freedom": "40-60", "stress_freedom": "40-60", "time_freedom": "35-55", "impact_freedom": "70-85"}',
 '["Scalability issues", "Time inefficiency", "Pricing challenges", "Standardization resistance"]',
 '{"primary_focus": "Systematization and packaging", "key_sprints": ["S3", "S5", "S2"], "timeline": "4-8 months"}'),

('scattered_starter', 'The Scattered Starter',
 'Early-stage entrepreneur juggling multiple priorities without clear systems.',
 '["High energy", "Multiple interests", "Reactive mode", "Limited systems", "Growth-oriented but unfocused"]',
 '{"money_freedom": "35-55", "systems_freedom": "20-40", "team_freedom": "30-50", "stress_freedom": "35-55", "time_freedom": "30-50", "impact_freedom": "45-65"}',
 '["Priority confusion", "System gaps", "Time management", "Focus issues", "Overwhelm"]',
 '{"primary_focus": "Foundation building", "key_sprints": ["S1", "S4", "S11"], "timeline": "3-6 months"}'),

('steady_operator', 'The Steady Operator',
 'Established business owner with decent systems but lacking growth edge.',
 '["Consistent performance", "Reliable systems", "Stable team", "Risk-averse", "Incremental improvement mindset"]',
 '{"money_freedom": "65-80", "systems_freedom": "60-75", "team_freedom": "55-70", "stress_freedom": "60-75", "time_freedom": "50-70", "impact_freedom": "55-70"}',
 '["Growth stagnation", "Innovation gaps", "Competitive threats", "Complacency risk"]',
 '{"primary_focus": "Growth acceleration", "key_sprints": ["S13", "S1", "S15"], "timeline": "4-10 months"}'),

('freedom_achiever', 'The Freedom Achiever',
 'Advanced entrepreneur who has achieved significant business freedom but wants optimization.',
 '["Strong systems", "Effective delegation", "Strategic focus", "Good work-life balance", "Growth-minded"]',
 '{"money_freedom": "75-90", "systems_freedom": "70-85", "team_freedom": "70-85", "stress_freedom": "70-85", "time_freedom": "65-85", "impact_freedom": "70-90"}',
 '["Optimization opportunities", "Scale challenges", "Innovation needs", "Market evolution"]',
 '{"primary_focus": "Optimization and scale", "key_sprints": ["S13", "S15", "S9"], "timeline": "6-12 months"}');