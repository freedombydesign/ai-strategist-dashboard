-- DeliverEase Enterprise Database Schema
-- Sophisticated client delivery management platform for service businesses
-- Designed for 7-figure founders to automate delivery operations

-- ============================================================================
-- CORE DELIVERY MANAGEMENT TABLES
-- ============================================================================

-- Service Delivery Templates - Pre-built workflows for different service types
CREATE TABLE IF NOT EXISTS delivery_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Template Definition
    template_name VARCHAR(255) NOT NULL,
    service_type VARCHAR(100) NOT NULL, -- 'consulting', 'agency', 'coaching', 'done_for_you'
    industry_vertical VARCHAR(100), -- 'marketing', 'business_consulting', 'web_development'
    
    -- Delivery Framework
    methodology VARCHAR(100), -- 'waterfall', 'agile', 'hybrid'
    estimated_duration_days INTEGER NOT NULL,
    complexity_level VARCHAR(20) DEFAULT 'medium', -- 'simple', 'medium', 'complex', 'enterprise'
    
    -- Template Configuration
    phases_config JSONB NOT NULL DEFAULT '[]', -- Detailed phase definitions
    tasks_template JSONB NOT NULL DEFAULT '[]', -- Template task structure
    deliverables_config JSONB NOT NULL DEFAULT '[]', -- Expected deliverables
    quality_gates JSONB NOT NULL DEFAULT '[]', -- Quality checkpoints
    
    -- Pricing and Commercial
    base_price DECIMAL(12,2),
    pricing_model VARCHAR(50) DEFAULT 'fixed', -- 'fixed', 'hourly', 'milestone', 'retainer'
    estimated_hours INTEGER,
    
    -- Performance Metrics
    success_rate DECIMAL(5,2) DEFAULT 0, -- Historical success rate
    average_client_satisfaction DECIMAL(3,1) DEFAULT 0,
    typical_delivery_variance_days INTEGER DEFAULT 0,
    
    -- Automation Settings
    auto_assign_rules JSONB DEFAULT '{}',
    communication_templates JSONB DEFAULT '{}',
    escalation_rules JSONB DEFAULT '{}',
    
    -- Template Metadata
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES auth.users(id),
    version VARCHAR(20) DEFAULT '1.0',
    last_used_at TIMESTAMPTZ,
    usage_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, template_name)
);

-- Client Projects - Main project management entity
CREATE TABLE IF NOT EXISTS client_projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    template_id UUID REFERENCES delivery_templates(id),
    
    -- Project Identification
    project_code VARCHAR(50) UNIQUE NOT NULL,
    project_name VARCHAR(255) NOT NULL,
    
    -- Client Information
    client_id UUID, -- References external client management system
    client_name VARCHAR(255) NOT NULL,
    client_email VARCHAR(255) NOT NULL,
    client_company VARCHAR(255),
    client_industry VARCHAR(100),
    
    -- Project Scope and Commercial
    project_description TEXT,
    project_value DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    pricing_model VARCHAR(50) DEFAULT 'fixed',
    
    -- Timeline Management
    planned_start_date DATE NOT NULL,
    planned_end_date DATE NOT NULL,
    actual_start_date DATE,
    actual_end_date DATE,
    current_phase VARCHAR(100),
    
    -- Status and Health
    project_status VARCHAR(50) DEFAULT 'planning', -- 'planning', 'active', 'on_hold', 'completed', 'cancelled'
    health_score INTEGER DEFAULT 85, -- 0-100 health indicator
    risk_level VARCHAR(20) DEFAULT 'low', -- 'low', 'medium', 'high', 'critical'
    
    -- Team Assignment
    project_manager_id UUID REFERENCES auth.users(id),
    account_manager_id UUID REFERENCES auth.users(id),
    team_lead_id UUID REFERENCES auth.users(id),
    assigned_team_ids UUID[], -- Array of team member IDs
    
    -- Client Relationship
    client_priority VARCHAR(20) DEFAULT 'standard', -- 'low', 'standard', 'high', 'vip'
    client_satisfaction_score DECIMAL(3,1) DEFAULT 0, -- 1-5 rating
    communication_frequency VARCHAR(20) DEFAULT 'weekly', -- 'daily', 'weekly', 'bi_weekly'
    
    -- Financial Tracking
    budget_allocated DECIMAL(12,2),
    budget_spent DECIMAL(12,2) DEFAULT 0,
    revenue_recognized DECIMAL(12,2) DEFAULT 0,
    profitability_score INTEGER DEFAULT 0, -- Calculated metric
    
    -- Performance Metrics
    on_time_delivery_probability INTEGER DEFAULT 85, -- AI-calculated prediction
    scope_creep_risk INTEGER DEFAULT 30, -- Risk assessment
    client_engagement_score INTEGER DEFAULT 75, -- Engagement quality
    
    -- Integration Data
    external_project_urls JSONB DEFAULT '{}', -- Links to external project management tools
    slack_channel_id VARCHAR(100),
    google_drive_folder_id VARCHAR(255),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_activity_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project Tasks - Granular task management with intelligent assignment
CREATE TABLE IF NOT EXISTS project_tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES client_projects(id) ON DELETE CASCADE,
    
    -- Task Definition
    task_title VARCHAR(255) NOT NULL,
    task_description TEXT,
    task_type VARCHAR(100), -- 'design', 'development', 'analysis', 'communication', 'review'
    
    -- Assignment and Ownership
    assigned_to UUID REFERENCES auth.users(id),
    assigned_by UUID REFERENCES auth.users(id),
    assignment_date TIMESTAMPTZ DEFAULT NOW(),
    assignment_method VARCHAR(50) DEFAULT 'manual', -- 'manual', 'auto_skill', 'auto_capacity', 'ai_optimized'
    
    -- Timeline and Dependencies
    planned_start_date DATE,
    planned_end_date DATE NOT NULL,
    actual_start_date DATE,
    actual_completion_date DATE,
    estimated_hours INTEGER,
    actual_hours INTEGER DEFAULT 0,
    
    -- Task Dependencies
    dependent_tasks UUID[], -- Tasks that must complete before this one
    blocking_tasks UUID[], -- Tasks that this one blocks
    dependency_type VARCHAR(20) DEFAULT 'finish_to_start', -- 'finish_to_start', 'start_to_start'
    
    -- Status and Progress
    task_status VARCHAR(50) DEFAULT 'not_started', -- 'not_started', 'in_progress', 'in_review', 'completed', 'blocked'
    progress_percentage INTEGER DEFAULT 0,
    quality_score INTEGER DEFAULT 0, -- Post-completion quality assessment
    
    -- Priority and Categorization
    priority_level VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    phase_name VARCHAR(100), -- Which project phase this belongs to
    milestone_marker BOOLEAN DEFAULT FALSE,
    billable BOOLEAN DEFAULT TRUE,
    
    -- Client Visibility
    visible_to_client BOOLEAN DEFAULT FALSE,
    client_approval_required BOOLEAN DEFAULT FALSE,
    client_approved BOOLEAN DEFAULT FALSE,
    client_feedback TEXT,
    
    -- Automation and Intelligence
    auto_generated BOOLEAN DEFAULT FALSE,
    ai_complexity_score INTEGER DEFAULT 50, -- AI assessment of task complexity
    skill_requirements TEXT[], -- Required skills for this task
    
    -- Performance Metrics
    efficiency_score INTEGER DEFAULT 0, -- How efficiently was this completed
    rework_required BOOLEAN DEFAULT FALSE,
    client_satisfaction_impact INTEGER DEFAULT 0, -- Impact on overall satisfaction
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Deliverables Management - Track and version control all client deliverables
CREATE TABLE IF NOT EXISTS project_deliverables (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES client_projects(id) ON DELETE CASCADE,
    task_id UUID REFERENCES project_tasks(id),
    
    -- Deliverable Definition
    deliverable_name VARCHAR(255) NOT NULL,
    deliverable_type VARCHAR(100) NOT NULL, -- 'document', 'design', 'code', 'report', 'presentation'
    description TEXT,
    
    -- File Management
    file_url VARCHAR(500), -- Supabase Storage URL
    file_name VARCHAR(255),
    file_size_bytes BIGINT,
    file_mime_type VARCHAR(100),
    version VARCHAR(20) DEFAULT '1.0',
    
    -- Version Control
    is_current_version BOOLEAN DEFAULT TRUE,
    previous_version_id UUID REFERENCES project_deliverables(id),
    version_notes TEXT,
    
    -- Status and Approval Workflow
    deliverable_status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'internal_review', 'client_review', 'approved', 'revision_requested'
    internal_approved BOOLEAN DEFAULT FALSE,
    internal_approved_by UUID REFERENCES auth.users(id),
    internal_approved_at TIMESTAMPTZ,
    
    -- Client Review Process
    client_approved BOOLEAN DEFAULT FALSE,
    client_reviewed_at TIMESTAMPTZ,
    client_feedback TEXT,
    revision_count INTEGER DEFAULT 0,
    
    -- Quality Control
    quality_checked BOOLEAN DEFAULT FALSE,
    quality_checked_by UUID REFERENCES auth.users(id),
    quality_score INTEGER DEFAULT 0, -- 1-10 quality rating
    quality_notes TEXT,
    
    -- Brand and Standards Compliance
    brand_compliant BOOLEAN DEFAULT FALSE,
    template_used VARCHAR(255),
    style_guide_followed BOOLEAN DEFAULT FALSE,
    
    -- Client Access and Permissions
    client_accessible BOOLEAN DEFAULT FALSE,
    download_count INTEGER DEFAULT 0,
    last_downloaded_at TIMESTAMPTZ,
    
    -- Performance Tracking
    creation_time_hours INTEGER DEFAULT 0,
    review_cycle_days INTEGER DEFAULT 0,
    client_satisfaction_rating INTEGER DEFAULT 0, -- 1-5 rating for this deliverable
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    delivered_at TIMESTAMPTZ
);

-- ============================================================================
-- CLIENT COMMUNICATION AND RELATIONSHIP MANAGEMENT
-- ============================================================================

-- Client Communications - Automated and manual communication tracking
CREATE TABLE IF NOT EXISTS client_communications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES client_projects(id) ON DELETE CASCADE,
    
    -- Communication Details
    communication_type VARCHAR(50) NOT NULL, -- 'email', 'call', 'meeting', 'slack', 'update', 'alert'
    subject_line VARCHAR(255),
    message_content TEXT,
    
    -- Participants
    sent_by UUID REFERENCES auth.users(id),
    sent_to_emails TEXT[] NOT NULL,
    cc_emails TEXT[] DEFAULT ARRAY[]::TEXT[],
    
    -- Timing and Automation
    scheduled_send_time TIMESTAMPTZ,
    actual_send_time TIMESTAMPTZ,
    is_automated BOOLEAN DEFAULT FALSE,
    automation_trigger VARCHAR(100), -- What triggered this communication
    
    -- Delivery and Engagement
    delivery_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'opened', 'clicked', 'replied'
    opened_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    replied_at TIMESTAMPTZ,
    
    -- Response and Follow-up
    response_required BOOLEAN DEFAULT FALSE,
    response_deadline TIMESTAMPTZ,
    follow_up_scheduled TIMESTAMPTZ,
    follow_up_completed BOOLEAN DEFAULT FALSE,
    
    -- Communication Quality
    tone VARCHAR(50) DEFAULT 'professional', -- 'formal', 'professional', 'friendly', 'urgent'
    client_sentiment VARCHAR(50) DEFAULT 'neutral', -- 'positive', 'neutral', 'negative'
    urgency_level VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
    
    -- Integration Data
    email_provider_id VARCHAR(255), -- Gmail/Outlook message ID
    external_thread_id VARCHAR(255),
    
    -- Performance Metrics
    client_satisfaction_impact INTEGER DEFAULT 0, -- -5 to +5 impact on satisfaction
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quality Control Checkpoints - Systematic quality assurance
CREATE TABLE IF NOT EXISTS quality_checkpoints (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES client_projects(id) ON DELETE CASCADE,
    deliverable_id UUID REFERENCES project_deliverables(id),
    
    -- Checkpoint Definition
    checkpoint_name VARCHAR(255) NOT NULL,
    checkpoint_type VARCHAR(50) NOT NULL, -- 'phase_gate', 'deliverable_review', 'client_approval', 'quality_audit'
    phase_name VARCHAR(100),
    
    -- Review Criteria
    review_criteria JSONB NOT NULL DEFAULT '[]', -- List of things to check
    quality_standards JSONB DEFAULT '{}', -- Expected quality benchmarks
    
    -- Assignment and Timeline
    assigned_reviewer UUID REFERENCES auth.users(id),
    backup_reviewer UUID REFERENCES auth.users(id),
    review_deadline DATE NOT NULL,
    
    -- Status and Results
    checkpoint_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'in_progress', 'passed', 'failed', 'conditional_pass'
    overall_score INTEGER DEFAULT 0, -- 1-10 overall quality score
    individual_scores JSONB DEFAULT '{}', -- Scores for each criterion
    
    -- Review Process
    review_started_at TIMESTAMPTZ,
    review_completed_at TIMESTAMPTZ,
    review_time_hours INTEGER DEFAULT 0,
    
    -- Findings and Actions
    findings TEXT,
    issues_found TEXT[],
    recommendations TEXT[],
    required_actions TEXT[],
    
    -- Approval and Sign-off
    approved BOOLEAN DEFAULT FALSE,
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMPTZ,
    approval_notes TEXT,
    
    -- Escalation
    escalated BOOLEAN DEFAULT FALSE,
    escalated_to UUID REFERENCES auth.users(id),
    escalation_reason TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TEAM MANAGEMENT AND CAPACITY PLANNING
-- ============================================================================

-- Team Capacity Management - Track team workload and availability
CREATE TABLE IF NOT EXISTS team_capacity (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    team_member_id UUID REFERENCES auth.users(id) NOT NULL,
    
    -- Capacity Configuration
    max_concurrent_projects INTEGER DEFAULT 3,
    max_weekly_hours INTEGER DEFAULT 40,
    preferred_project_types TEXT[], -- Types of projects they prefer
    skill_specializations TEXT[], -- Their key skills
    
    -- Current Workload
    current_active_projects INTEGER DEFAULT 0,
    current_weekly_hours INTEGER DEFAULT 0,
    utilization_percentage DECIMAL(5,2) DEFAULT 0, -- Current capacity utilization
    
    -- Performance Metrics
    average_task_completion_days DECIMAL(5,2) DEFAULT 0,
    quality_score_average DECIMAL(3,1) DEFAULT 0,
    client_satisfaction_average DECIMAL(3,1) DEFAULT 0,
    on_time_delivery_rate DECIMAL(5,2) DEFAULT 0,
    
    -- Availability and Scheduling
    availability_status VARCHAR(50) DEFAULT 'available', -- 'available', 'busy', 'overloaded', 'unavailable'
    next_available_date DATE,
    planned_time_off JSONB DEFAULT '[]', -- Vacation/time off schedule
    
    -- Work Preferences
    preferred_communication_method VARCHAR(50) DEFAULT 'email',
    preferred_assignment_method VARCHAR(50) DEFAULT 'manual',
    timezone VARCHAR(50) DEFAULT 'UTC',
    working_hours JSONB DEFAULT '{}', -- Daily working hour preferences
    
    -- Growth and Development
    development_goals TEXT[],
    training_needed TEXT[],
    career_interests TEXT[],
    
    -- Team Lead Assessment
    leadership_potential INTEGER DEFAULT 0, -- 1-10 scale
    mentoring_capability INTEGER DEFAULT 0, -- 1-10 scale
    technical_expertise_level VARCHAR(20) DEFAULT 'intermediate', -- 'junior', 'intermediate', 'senior', 'expert'
    
    last_capacity_update TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, team_member_id)
);

-- ============================================================================
-- AUTOMATION AND INTELLIGENCE ENGINE
-- ============================================================================

-- Automation Rules - AI-powered business rules engine
CREATE TABLE IF NOT EXISTS automation_rules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Rule Definition
    rule_name VARCHAR(255) NOT NULL,
    rule_category VARCHAR(100) NOT NULL, -- 'task_assignment', 'communication', 'escalation', 'quality_control'
    description TEXT,
    
    -- Trigger Conditions
    trigger_event VARCHAR(100) NOT NULL, -- 'project_created', 'task_overdue', 'client_satisfaction_drop'
    trigger_conditions JSONB NOT NULL DEFAULT '{}', -- Complex condition logic
    
    -- Actions to Execute
    actions JSONB NOT NULL DEFAULT '[]', -- Array of actions to perform
    action_sequence INTEGER DEFAULT 1, -- Order of execution
    
    -- Rule Logic
    condition_logic VARCHAR(20) DEFAULT 'AND', -- 'AND', 'OR', 'COMPLEX'
    priority_level INTEGER DEFAULT 5, -- 1-10 priority for rule execution
    
    -- Execution Control
    is_active BOOLEAN DEFAULT TRUE,
    execution_frequency VARCHAR(50) DEFAULT 'immediate', -- 'immediate', 'daily', 'weekly'
    max_executions_per_day INTEGER DEFAULT 100,
    
    -- Performance Tracking
    execution_count INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2) DEFAULT 0,
    last_executed_at TIMESTAMPTZ,
    
    -- AI Learning
    ai_confidence_score DECIMAL(5,2) DEFAULT 0.75, -- How confident AI is in this rule
    learning_enabled BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, rule_name)
);

-- Rule Execution Log - Track automation performance
CREATE TABLE IF NOT EXISTS automation_execution_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    rule_id UUID REFERENCES automation_rules(id) ON DELETE CASCADE,
    
    -- Execution Context
    triggered_by VARCHAR(100) NOT NULL, -- What caused this rule to execute
    execution_context JSONB DEFAULT '{}', -- Context data at time of execution
    
    -- Execution Results
    execution_status VARCHAR(50) NOT NULL, -- 'success', 'failed', 'partial', 'skipped'
    actions_attempted INTEGER DEFAULT 0,
    actions_successful INTEGER DEFAULT 0,
    
    -- Performance Metrics
    execution_time_ms INTEGER DEFAULT 0,
    error_details TEXT,
    
    -- Impact Assessment
    business_impact VARCHAR(50), -- 'positive', 'neutral', 'negative'
    impact_description TEXT,
    
    executed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- CLIENT PORTAL AND SELF-SERVICE
-- ============================================================================

-- Client Portal Access - Manage client access to their projects
CREATE TABLE IF NOT EXISTS client_portal_access (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES client_projects(id) ON DELETE CASCADE,
    
    -- Access Credentials
    client_email VARCHAR(255) NOT NULL,
    access_token VARCHAR(255) UNIQUE NOT NULL,
    portal_password_hash VARCHAR(255),
    
    -- Access Control
    access_level VARCHAR(50) DEFAULT 'standard', -- 'view_only', 'standard', 'admin'
    allowed_features TEXT[] DEFAULT ARRAY['view_progress', 'download_files', 'submit_feedback'],
    
    -- Portal Customization
    portal_branding JSONB DEFAULT '{}', -- Custom branding for this client
    dashboard_layout VARCHAR(50) DEFAULT 'standard',
    
    -- Usage Tracking
    last_login_at TIMESTAMPTZ,
    login_count INTEGER DEFAULT 0,
    session_duration_minutes INTEGER DEFAULT 0,
    
    -- Security
    failed_login_attempts INTEGER DEFAULT 0,
    account_locked BOOLEAN DEFAULT FALSE,
    locked_until TIMESTAMPTZ,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    access_expires_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, project_id, client_email)
);

-- Client Feedback - Systematic feedback collection
CREATE TABLE IF NOT EXISTS client_feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES client_projects(id) ON DELETE CASCADE,
    deliverable_id UUID REFERENCES project_deliverables(id),
    
    -- Feedback Context
    feedback_type VARCHAR(50) NOT NULL, -- 'milestone', 'deliverable', 'overall', 'service_quality'
    feedback_stage VARCHAR(50) NOT NULL, -- 'planning', 'in_progress', 'completion', 'post_delivery'
    
    -- Ratings and Scores
    overall_rating DECIMAL(3,1), -- 1-5 star rating
    quality_rating DECIMAL(3,1), -- 1-5 rating
    communication_rating DECIMAL(3,1), -- 1-5 rating
    timeliness_rating DECIMAL(3,1), -- 1-5 rating
    
    -- Detailed Feedback
    positive_feedback TEXT,
    improvement_areas TEXT,
    specific_comments TEXT,
    
    -- Sentiment Analysis
    sentiment_score DECIMAL(3,2), -- -1 to +1 sentiment
    satisfaction_level VARCHAR(50) DEFAULT 'satisfied', -- 'very_dissatisfied', 'dissatisfied', 'neutral', 'satisfied', 'very_satisfied'
    
    -- Response and Actions
    internal_response TEXT,
    action_items TEXT[],
    response_sent_at TIMESTAMPTZ,
    
    -- Follow-up
    follow_up_required BOOLEAN DEFAULT FALSE,
    follow_up_scheduled_at TIMESTAMPTZ,
    follow_up_completed BOOLEAN DEFAULT FALSE,
    
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PERFORMANCE ANALYTICS AND REPORTING
-- ============================================================================

-- Performance Metrics - Aggregate business performance data
CREATE TABLE IF NOT EXISTS delivery_performance_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Time Period
    metric_period VARCHAR(50) NOT NULL, -- 'daily', 'weekly', 'monthly', 'quarterly'
    period_start_date DATE NOT NULL,
    period_end_date DATE NOT NULL,
    
    -- Delivery Performance
    projects_started INTEGER DEFAULT 0,
    projects_completed INTEGER DEFAULT 0,
    projects_on_time INTEGER DEFAULT 0,
    projects_delayed INTEGER DEFAULT 0,
    
    -- Quality Metrics
    average_client_satisfaction DECIMAL(3,1) DEFAULT 0,
    quality_score_average DECIMAL(3,1) DEFAULT 0,
    revision_requests_total INTEGER DEFAULT 0,
    
    -- Team Performance
    team_utilization_percentage DECIMAL(5,2) DEFAULT 0,
    average_task_completion_time DECIMAL(5,2) DEFAULT 0,
    team_satisfaction_score DECIMAL(3,1) DEFAULT 0,
    
    -- Financial Performance
    total_revenue DECIMAL(12,2) DEFAULT 0,
    total_costs DECIMAL(12,2) DEFAULT 0,
    profit_margin DECIMAL(5,2) DEFAULT 0,
    
    -- Client Relationship
    client_retention_rate DECIMAL(5,2) DEFAULT 0,
    new_clients_acquired INTEGER DEFAULT 0,
    upsell_revenue DECIMAL(12,2) DEFAULT 0,
    
    -- Operational Efficiency
    automation_success_rate DECIMAL(5,2) DEFAULT 0,
    manual_interventions_required INTEGER DEFAULT 0,
    process_efficiency_score INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, metric_period, period_start_date)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- ============================================================================

-- Core Performance Indexes
CREATE INDEX IF NOT EXISTS idx_delivery_templates_user_active ON delivery_templates(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_client_projects_user_status ON client_projects(user_id, project_status);
CREATE INDEX IF NOT EXISTS idx_client_projects_health_score ON client_projects(health_score DESC, risk_level);
CREATE INDEX IF NOT EXISTS idx_project_tasks_assigned ON project_tasks(assigned_to, task_status, planned_end_date);
CREATE INDEX IF NOT EXISTS idx_project_tasks_project_status ON project_tasks(project_id, task_status);
CREATE INDEX IF NOT EXISTS idx_deliverables_project_status ON project_deliverables(project_id, deliverable_status);
CREATE INDEX IF NOT EXISTS idx_deliverables_client_access ON project_deliverables(client_accessible, deliverable_status);
CREATE INDEX IF NOT EXISTS idx_communications_project_time ON client_communications(project_id, actual_send_time DESC);
CREATE INDEX IF NOT EXISTS idx_quality_checkpoints_reviewer ON quality_checkpoints(assigned_reviewer, checkpoint_status);
CREATE INDEX IF NOT EXISTS idx_team_capacity_member ON team_capacity(team_member_id, availability_status);
CREATE INDEX IF NOT EXISTS idx_automation_rules_active ON automation_rules(user_id, is_active, rule_category);
CREATE INDEX IF NOT EXISTS idx_client_feedback_project_rating ON client_feedback(project_id, overall_rating DESC, submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_user_period ON delivery_performance_metrics(user_id, metric_period, period_start_date DESC);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE delivery_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_checkpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_capacity ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_execution_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_portal_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_performance_metrics ENABLE ROW LEVEL SECURITY;

-- Security Policies - Users can only access their own data
CREATE POLICY "Users can manage their delivery templates" ON delivery_templates FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their projects" ON client_projects FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their tasks" ON project_tasks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their deliverables" ON project_deliverables FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their communications" ON client_communications FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage quality checkpoints" ON quality_checkpoints FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage team capacity" ON team_capacity FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage automation rules" ON automation_rules FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view execution logs" ON automation_execution_log FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage portal access" ON client_portal_access FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view client feedback" ON client_feedback FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view performance metrics" ON delivery_performance_metrics FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- ADVANCED BUSINESS LOGIC FUNCTIONS
-- ============================================================================

-- Calculate Project Health Score based on multiple factors
CREATE OR REPLACE FUNCTION calculate_project_health_score(
    project_uuid UUID
) RETURNS INTEGER AS $$
DECLARE
    project_record RECORD;
    health_score INTEGER := 85; -- Start with base score
    overdue_tasks INTEGER := 0;
    total_tasks INTEGER := 0;
    client_satisfaction DECIMAL;
    budget_variance DECIMAL;
BEGIN
    -- Get project details
    SELECT * INTO project_record FROM client_projects WHERE id = project_uuid;
    
    -- Count overdue tasks
    SELECT COUNT(*) INTO overdue_tasks
    FROM project_tasks
    WHERE project_id = project_uuid 
    AND task_status NOT IN ('completed', 'cancelled')
    AND planned_end_date < CURRENT_DATE;
    
    -- Count total active tasks
    SELECT COUNT(*) INTO total_tasks
    FROM project_tasks
    WHERE project_id = project_uuid 
    AND task_status NOT IN ('cancelled');
    
    -- Adjust for overdue tasks
    IF total_tasks > 0 THEN
        health_score := health_score - (overdue_tasks * 100 / total_tasks * 0.3)::INTEGER;
    END IF;
    
    -- Adjust for client satisfaction
    SELECT AVG(overall_rating) INTO client_satisfaction
    FROM client_feedback
    WHERE project_id = project_uuid;
    
    IF client_satisfaction IS NOT NULL THEN
        health_score := health_score + ((client_satisfaction - 3) * 10)::INTEGER;
    END IF;
    
    -- Adjust for budget variance
    IF project_record.budget_allocated > 0 THEN
        budget_variance := (project_record.budget_spent / project_record.budget_allocated - 1) * 100;
        IF budget_variance > 10 THEN
            health_score := health_score - ((budget_variance - 10) * 0.5)::INTEGER;
        END IF;
    END IF;
    
    -- Ensure score stays within bounds
    health_score := LEAST(100, GREATEST(0, health_score));
    
    -- Update project record
    UPDATE client_projects 
    SET health_score = health_score,
        updated_at = NOW()
    WHERE id = project_uuid;
    
    RETURN health_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Smart Task Assignment based on team capacity and skills
CREATE OR REPLACE FUNCTION assign_task_intelligently(
    task_uuid UUID
) RETURNS UUID AS $$
DECLARE
    task_record RECORD;
    best_assignee UUID;
    min_workload INTEGER := 999;
    candidate RECORD;
BEGIN
    -- Get task details
    SELECT * INTO task_record FROM project_tasks WHERE id = task_uuid;
    
    -- Find best assignee based on capacity and skills
    FOR candidate IN
        SELECT tc.team_member_id, tc.current_weekly_hours, tc.skill_specializations
        FROM team_capacity tc
        WHERE tc.user_id = task_record.user_id
        AND tc.availability_status = 'available'
        AND tc.current_weekly_hours + COALESCE(task_record.estimated_hours, 8) <= tc.max_weekly_hours
        ORDER BY tc.current_weekly_hours ASC
    LOOP
        -- Check if candidate has required skills (if specified)
        IF task_record.skill_requirements IS NULL 
           OR array_length(task_record.skill_requirements, 1) IS NULL
           OR candidate.skill_specializations && task_record.skill_requirements THEN
            
            IF candidate.current_weekly_hours < min_workload THEN
                min_workload := candidate.current_weekly_hours;
                best_assignee := candidate.team_member_id;
            END IF;
        END IF;
    END LOOP;
    
    -- Assign the task if we found someone
    IF best_assignee IS NOT NULL THEN
        UPDATE project_tasks 
        SET assigned_to = best_assignee,
            assignment_method = 'ai_optimized',
            updated_at = NOW()
        WHERE id = task_uuid;
        
        -- Update team capacity
        UPDATE team_capacity 
        SET current_weekly_hours = current_weekly_hours + COALESCE(task_record.estimated_hours, 8),
            updated_at = NOW()
        WHERE team_member_id = best_assignee;
    END IF;
    
    RETURN best_assignee;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Generate automated project insights
CREATE OR REPLACE FUNCTION generate_project_insights(
    project_uuid UUID
) RETURNS JSONB AS $$
DECLARE
    insights JSONB := '[]';
    project_record RECORD;
    overdue_count INTEGER;
    satisfaction_avg DECIMAL;
    budget_utilization DECIMAL;
BEGIN
    -- Get project data
    SELECT * INTO project_record FROM client_projects WHERE id = project_uuid;
    
    -- Check for overdue tasks
    SELECT COUNT(*) INTO overdue_count
    FROM project_tasks
    WHERE project_id = project_uuid 
    AND task_status NOT IN ('completed', 'cancelled')
    AND planned_end_date < CURRENT_DATE;
    
    IF overdue_count > 0 THEN
        insights := insights || jsonb_build_object(
            'type', 'risk',
            'priority', 'high',
            'title', 'Overdue Tasks Detected',
            'message', overdue_count || ' tasks are overdue and may impact delivery timeline',
            'action', 'Review task assignments and deadlines'
        );
    END IF;
    
    -- Check client satisfaction
    SELECT AVG(overall_rating) INTO satisfaction_avg
    FROM client_feedback
    WHERE project_id = project_uuid
    AND submitted_at > NOW() - INTERVAL '30 days';
    
    IF satisfaction_avg IS NOT NULL AND satisfaction_avg < 3.5 THEN
        insights := insights || jsonb_build_object(
            'type', 'warning',
            'priority', 'high',
            'title', 'Client Satisfaction Below Target',
            'message', 'Recent client satisfaction is ' || satisfaction_avg || '/5',
            'action', 'Schedule client check-in call to address concerns'
        );
    END IF;
    
    -- Check budget utilization
    IF project_record.budget_allocated > 0 THEN
        budget_utilization := (project_record.budget_spent / project_record.budget_allocated) * 100;
        
        IF budget_utilization > 90 THEN
            insights := insights || jsonb_build_object(
                'type', 'warning',
                'priority', 'medium',
                'title', 'Budget Nearly Exhausted',
                'message', 'Project has used ' || budget_utilization::INTEGER || '% of allocated budget',
                'action', 'Review remaining scope and consider budget adjustment'
            );
        END IF;
    END IF;
    
    RETURN insights;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;