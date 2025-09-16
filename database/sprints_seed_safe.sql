-- =====================================================
-- SPRINTS SEED DATA - SAFE VERSION
-- Uses INSERT ... ON CONFLICT to handle existing data
-- =====================================================

INSERT INTO sprints (
  sprint_key, category, sprint_title, description, detailed_outcome,
  estimated_time_hours, difficulty_level, prerequisites, recommended_order,
  assets_generated, tools_required, primary_component, expected_score_improvement
) VALUES
-- Sales & Money Freedom Sprints
('S1', 'sales_money', 'Acquisition Engine',
 'Build a predictable client acquisition system with automated lead generation and qualification.',
 'A complete acquisition funnel with lead magnets, automated email sequences, and tracking systems that generates 5-10 qualified leads per week.',
 16, 'intermediate', '[]', 1,
 '{"templates": ["Lead Magnet Template", "Email Sequence Template", "Lead Scoring Worksheet"], "sops": ["Lead Qualification SOP", "Follow-up Process SOP"], "automations": ["Email Automation", "Lead Scoring Automation"]}',
 '{"required": ["Email Platform", "CRM"], "optional": ["Landing Page Builder", "Analytics Tool"]}',
 'money_freedom', 15),

('S2', 'sales_money', 'Pricing Engine',
 'Create value-based pricing structure with clear packages and automated proposal generation.',
 'Standardized pricing packages with automated proposal system that increases average deal size by 30%.',
 12, 'beginner', '[]', 2,
 '{"templates": ["Pricing Package Template", "Proposal Template", "Value Calculator"], "sops": ["Pricing Discussion SOP", "Proposal Process SOP"], "automations": ["Proposal Generation"]}',
 '{"required": ["Proposal Tool"], "optional": ["Contract Management"]}',
 'money_freedom', 12),

('S3', 'sales_money', 'Offer Stabilization',
 'Standardize service offerings into repeatable packages to eliminate custom work.',
 'Core service packages that deliver consistent results while reducing delivery time by 40%.',
 20, 'intermediate', '["S2"]', 3,
 '{"templates": ["Service Package Template", "Scope Definition Template", "Delivery Timeline"], "sops": ["Service Delivery SOP", "Scope Management SOP"], "automations": ["Service Packaging"]}',
 '{"required": ["Project Management Tool"], "optional": ["Client Portal"]}',
 'systems_freedom', 18),

-- Systems Freedom Sprints
('S4', 'delivery_systems', 'Onboarding Engine',
 'Build automated client onboarding system from first contact to project kickoff.',
 'Seamless onboarding experience that reduces time-to-value by 50% and improves client satisfaction.',
 14, 'beginner', '[]', 4,
 '{"templates": ["Onboarding Checklist", "Welcome Email Series", "Project Brief Template"], "sops": ["Client Onboarding SOP", "Kickoff Meeting SOP"], "automations": ["Onboarding Email Sequence", "Task Automation"]}',
 '{"required": ["Project Management Tool", "Email Platform"], "optional": ["Client Portal", "Video Recording"]}',
 'systems_freedom', 15),

('S5', 'delivery_systems', 'Service Delivery Engine',
 'Create standardized delivery process with quality checkpoints and client communication.',
 'Consistent service delivery with 95% on-time completion and built-in quality assurance.',
 18, 'intermediate', '["S3", "S4"]', 5,
 '{"templates": ["Delivery Workflow Template", "Quality Checklist", "Progress Report Template"], "sops": ["Service Delivery SOP", "Quality Control SOP", "Client Communication SOP"], "automations": ["Progress Tracking", "Quality Alerts"]}',
 '{"required": ["Project Management Tool"], "optional": ["Time Tracking", "Quality Management"]}',
 'systems_freedom', 20),

('S6', 'delivery_systems', 'Quality Engine',
 'Implement quality management system with automated testing and review processes.',
 'Zero-defect delivery system with automated quality checks and continuous improvement.',
 16, 'advanced', '["S5"]', 6,
 '{"templates": ["Quality Standards Template", "Review Checklist", "Improvement Plan"], "sops": ["Quality Assurance SOP", "Review Process SOP"], "automations": ["Quality Monitoring", "Review Scheduling"]}',
 '{"required": ["Quality Management Tool"], "optional": ["Testing Platform", "Feedback System"]}',
 'stress_freedom', 18),

-- Team Freedom Sprints
('S7', 'team_delegation', 'Delegation Engine',
 'Build team delegation system with clear roles, responsibilities, and accountability.',
 'Fully empowered team that operates independently with 90% fewer daily decisions required from you.',
 22, 'intermediate', '["S4", "S5"]', 7,
 '{"templates": ["Role Definition Template", "Delegation Checklist", "Accountability Framework"], "sops": ["Delegation SOP", "Team Meeting SOP", "Performance Review SOP"], "automations": ["Task Assignment", "Progress Tracking"]}',
 '{"required": ["Team Communication Tool", "Project Management"], "optional": ["Performance Management", "Training Platform"]}',
 'team_freedom', 25),

('S8', 'team_delegation', 'Training Engine',
 'Create comprehensive training system for team skills development and knowledge transfer.',
 'Self-sustaining training program that reduces onboarding time by 60% and ensures consistent quality.',
 20, 'intermediate', '["S7"]', 8,
 '{"templates": ["Training Module Template", "Skill Assessment", "Progress Tracker"], "sops": ["Training Delivery SOP", "Assessment SOP"], "automations": ["Training Scheduling", "Progress Monitoring"]}',
 '{"required": ["Learning Management System"], "optional": ["Video Platform", "Assessment Tool"]}',
 'team_freedom', 15),

-- Operations & Stress Freedom Sprints
('S9', 'operations_stress', 'Reporting Engine',
 'Build automated reporting system for business metrics and performance tracking.',
 'Real-time business dashboard with automated reports that provide complete visibility into all key metrics.',
 14, 'beginner', '[]', 9,
 '{"templates": ["KPI Dashboard Template", "Report Template", "Metrics Framework"], "sops": ["Reporting SOP", "Data Analysis SOP"], "automations": ["Report Generation", "Alert System"]}',
 '{"required": ["Analytics Platform"], "optional": ["BI Tool", "Data Visualization"]}',
 'stress_freedom', 12),

('S10', 'operations_stress', 'Communication Engine',
 'Standardize internal and external communication with templates and automation.',
 'Streamlined communication system that reduces email volume by 70% and improves response times.',
 12, 'beginner', '[]', 10,
 '{"templates": ["Communication Templates", "Meeting Agenda", "Status Update Format"], "sops": ["Communication SOP", "Meeting Management SOP"], "automations": ["Status Updates", "Meeting Scheduling"]}',
 '{"required": ["Communication Platform"], "optional": ["Meeting Scheduler", "Video Conferencing"]}',
 'stress_freedom', 10),

('S11', 'operations_stress', 'Time Management Engine',
 'Implement time blocking and priority management system for maximum productivity.',
 'Optimized schedule with protected focus time that increases productive hours by 40%.',
 10, 'beginner', '[]', 11,
 '{"templates": ["Time Block Template", "Priority Matrix", "Weekly Planning Sheet"], "sops": ["Time Management SOP", "Priority Setting SOP"], "automations": ["Calendar Blocking", "Priority Alerts"]}',
 '{"required": ["Calendar System"], "optional": ["Time Tracking", "Focus App"]}',
 'time_freedom', 15),

-- Time & Impact Freedom Sprints
('S12', 'time_impact', 'Analytics Engine',
 'Build comprehensive business analytics for data-driven decision making.',
 'Complete business intelligence system providing insights that improve decision speed by 80%.',
 18, 'advanced', '["S9"]', 12,
 '{"templates": ["Analytics Framework", "Decision Tree", "Performance Metrics"], "sops": ["Data Analysis SOP", "Decision Making SOP"], "automations": ["Data Collection", "Insight Generation"]}',
 '{"required": ["Analytics Platform", "BI Tool"], "optional": ["AI Analytics", "Predictive Modeling"]}',
 'impact_freedom', 20),

('S13', 'time_impact', 'Growth Priority Engine',
 'Create systematic approach to identifying and executing high-impact growth opportunities.',
 'Strategic growth framework that identifies opportunities worth 2x current revenue within 6 months.',
 16, 'advanced', '["S12"]', 13,
 '{"templates": ["Opportunity Assessment", "Growth Plan Template", "Impact Calculator"], "sops": ["Opportunity Evaluation SOP", "Growth Execution SOP"], "automations": ["Opportunity Tracking", "Impact Measurement"]}',
 '{"required": ["Strategic Planning Tool"], "optional": ["Market Research", "Competitive Analysis"]}',
 'impact_freedom', 25),

('S14', 'time_impact', 'Innovation Engine',
 'Build system for continuous innovation and service evolution.',
 'Innovation pipeline that generates 3-5 new revenue opportunities per quarter.',
 20, 'advanced', '["S13"]', 14,
 '{"templates": ["Innovation Framework", "Idea Evaluation", "Development Plan"], "sops": ["Innovation Process SOP", "Development SOP"], "automations": ["Idea Tracking", "Development Monitoring"]}',
 '{"required": ["Innovation Platform"], "optional": ["Research Tools", "Prototyping Tools"]}',
 'impact_freedom', 18),

('S15', 'time_impact', 'Vision Engine',
 'Create long-term vision system with strategic planning and goal cascading.',
 'Clear 3-year vision with quarterly milestones that aligns entire organization toward ambitious goals.',
 14, 'intermediate', '[]', 15,
 '{"templates": ["Vision Statement Template", "Strategic Plan", "Goal Cascade Framework"], "sops": ["Vision Planning SOP", "Goal Setting SOP"], "automations": ["Goal Tracking", "Vision Alignment"]}',
 '{"required": ["Strategic Planning Tool"], "optional": ["Vision Board", "Goal Tracking"]}',
 'impact_freedom', 15)

-- Handle conflicts by updating existing records
ON CONFLICT (sprint_key)
DO UPDATE SET
  category = EXCLUDED.category,
  sprint_title = EXCLUDED.sprint_title,
  description = EXCLUDED.description,
  detailed_outcome = EXCLUDED.detailed_outcome,
  estimated_time_hours = EXCLUDED.estimated_time_hours,
  difficulty_level = EXCLUDED.difficulty_level,
  prerequisites = EXCLUDED.prerequisites,
  recommended_order = EXCLUDED.recommended_order,
  assets_generated = EXCLUDED.assets_generated,
  tools_required = EXCLUDED.tools_required,
  primary_component = EXCLUDED.primary_component,
  expected_score_improvement = EXCLUDED.expected_score_improvement,
  updated_at = NOW();

-- Update table stats
SELECT 'Sprints updated successfully. Total sprints: ' || COUNT(*) as result FROM sprints;