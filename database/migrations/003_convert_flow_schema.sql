-- ConvertFlow Enterprise Database Schema
-- Sophisticated lead conversion and funnel management system for 7-figure businesses

-- Lead Management Tables
CREATE TABLE IF NOT EXISTS convert_flow_leads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Basic Information
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    company VARCHAR(255),
    title VARCHAR(150),
    
    -- Lead Intelligence
    lead_source VARCHAR(100) NOT NULL DEFAULT 'unknown',
    referral_source VARCHAR(255),
    utm_campaign VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_source VARCHAR(100),
    utm_content VARCHAR(255),
    
    -- Qualification & Scoring
    lead_score INTEGER DEFAULT 0,
    qualification_status VARCHAR(50) DEFAULT 'unqualified',
    budget_range VARCHAR(100),
    decision_timeline VARCHAR(100),
    pain_points TEXT[],
    
    -- Behavioral Data
    website_sessions INTEGER DEFAULT 0,
    page_views INTEGER DEFAULT 0,
    content_downloads INTEGER DEFAULT 0,
    email_opens INTEGER DEFAULT 0,
    email_clicks INTEGER DEFAULT 0,
    last_activity_at TIMESTAMPTZ,
    
    -- Business Context
    industry VARCHAR(100),
    company_size VARCHAR(50),
    annual_revenue VARCHAR(100),
    current_solutions TEXT[],
    
    -- Pipeline Status
    stage VARCHAR(50) DEFAULT 'new',
    status VARCHAR(50) DEFAULT 'active',
    assigned_to VARCHAR(255),
    probability INTEGER DEFAULT 0,
    expected_close_date DATE,
    estimated_value DECIMAL(12,2),
    
    -- Integration Data
    hubspot_contact_id VARCHAR(50),
    mailchimp_subscriber_id VARCHAR(50),
    stripe_customer_id VARCHAR(50),
    
    -- Audit Trail
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_contacted_at TIMESTAMPTZ,
    next_followup_at TIMESTAMPTZ
);

-- Funnel Management
CREATE TABLE IF NOT EXISTS convert_flow_funnels (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    name VARCHAR(255) NOT NULL,
    description TEXT,
    funnel_type VARCHAR(100) NOT NULL, -- 'lead_magnet', 'webinar', 'consultation', 'product_demo'
    industry VARCHAR(100),
    
    -- Funnel Configuration
    pages JSONB NOT NULL DEFAULT '[]',
    automation_rules JSONB NOT NULL DEFAULT '{}',
    integrations JSONB NOT NULL DEFAULT '{}',
    
    -- Performance Metrics
    total_visitors INTEGER DEFAULT 0,
    total_leads INTEGER DEFAULT 0,
    total_conversions INTEGER DEFAULT 0,
    conversion_rate DECIMAL(5,2) DEFAULT 0,
    
    -- Status & Settings
    status VARCHAR(50) DEFAULT 'draft',
    is_published BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Funnel Performance Analytics
CREATE TABLE IF NOT EXISTS convert_flow_funnel_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    funnel_id UUID REFERENCES convert_flow_funnels(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    
    -- Traffic Metrics
    unique_visitors INTEGER DEFAULT 0,
    page_views INTEGER DEFAULT 0,
    bounce_rate DECIMAL(5,2) DEFAULT 0,
    avg_session_duration INTEGER DEFAULT 0,
    
    -- Conversion Metrics
    opt_ins INTEGER DEFAULT 0,
    opt_in_rate DECIMAL(5,2) DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    conversion_rate DECIMAL(5,2) DEFAULT 0,
    
    -- Revenue Metrics
    revenue DECIMAL(12,2) DEFAULT 0,
    avg_order_value DECIMAL(10,2) DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(funnel_id, date)
);

-- Lead Activities & Interactions
CREATE TABLE IF NOT EXISTS convert_flow_lead_activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id UUID REFERENCES convert_flow_leads(id) ON DELETE CASCADE,
    
    activity_type VARCHAR(100) NOT NULL, -- 'email_open', 'page_visit', 'form_submit', 'call_scheduled'
    activity_data JSONB NOT NULL DEFAULT '{}',
    
    -- Context
    page_url VARCHAR(500),
    campaign_id VARCHAR(100),
    source VARCHAR(100),
    
    -- Scoring Impact
    score_change INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email Automation Campaigns
CREATE TABLE IF NOT EXISTS convert_flow_email_campaigns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    name VARCHAR(255) NOT NULL,
    campaign_type VARCHAR(100) NOT NULL, -- 'nurture', 'onboarding', 'promotion', 'reactivation'
    
    -- Campaign Setup
    trigger_conditions JSONB NOT NULL DEFAULT '{}',
    email_sequence JSONB NOT NULL DEFAULT '[]',
    
    -- Targeting
    target_segments JSONB NOT NULL DEFAULT '[]',
    exclusion_rules JSONB NOT NULL DEFAULT '{}',
    
    -- Performance
    total_sent INTEGER DEFAULT 0,
    total_opened INTEGER DEFAULT 0,
    total_clicked INTEGER DEFAULT 0,
    total_conversions INTEGER DEFAULT 0,
    open_rate DECIMAL(5,2) DEFAULT 0,
    click_rate DECIMAL(5,2) DEFAULT 0,
    conversion_rate DECIMAL(5,2) DEFAULT 0,
    
    -- Status
    status VARCHAR(50) DEFAULT 'draft',
    is_active BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email Campaign Interactions
CREATE TABLE IF NOT EXISTS convert_flow_email_interactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID REFERENCES convert_flow_email_campaigns(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES convert_flow_leads(id) ON DELETE CASCADE,
    
    email_subject VARCHAR(255),
    interaction_type VARCHAR(50) NOT NULL, -- 'sent', 'opened', 'clicked', 'replied', 'unsubscribed'
    
    -- Interaction Details
    link_clicked VARCHAR(500),
    device_type VARCHAR(50),
    location VARCHAR(100),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Proposal & Quote Management
CREATE TABLE IF NOT EXISTS convert_flow_proposals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES convert_flow_leads(id) ON DELETE CASCADE,
    
    -- Proposal Details
    proposal_number VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Pricing
    line_items JSONB NOT NULL DEFAULT '[]',
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    
    -- Terms & Conditions
    payment_terms VARCHAR(100),
    valid_until DATE,
    terms_conditions TEXT,
    
    -- Status Tracking
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired'
    sent_at TIMESTAMPTZ,
    viewed_at TIMESTAMPTZ,
    responded_at TIMESTAMPTZ,
    
    -- Client Interactions
    view_count INTEGER DEFAULT 0,
    last_viewed_at TIMESTAMPTZ,
    client_notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lead Scoring Rules
CREATE TABLE IF NOT EXISTS convert_flow_scoring_rules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    rule_name VARCHAR(255) NOT NULL,
    rule_type VARCHAR(100) NOT NULL, -- 'demographic', 'behavioral', 'engagement', 'firmographic'
    
    -- Rule Configuration
    conditions JSONB NOT NULL DEFAULT '{}',
    score_value INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Priority and Order
    priority INTEGER DEFAULT 100,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Integration Sync Status
CREATE TABLE IF NOT EXISTS convert_flow_sync_status (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    integration_type VARCHAR(100) NOT NULL, -- 'hubspot', 'mailchimp', 'stripe'
    entity_type VARCHAR(100) NOT NULL, -- 'leads', 'campaigns', 'deals'
    entity_id UUID NOT NULL,
    external_id VARCHAR(255),
    
    -- Sync Details
    sync_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'synced', 'error', 'conflict'
    last_synced_at TIMESTAMPTZ,
    sync_error TEXT,
    retry_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, integration_type, entity_type, entity_id)
);

-- Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_convert_flow_leads_user_id ON convert_flow_leads(user_id);
CREATE INDEX IF NOT EXISTS idx_convert_flow_leads_email ON convert_flow_leads(email);
CREATE INDEX IF NOT EXISTS idx_convert_flow_leads_stage ON convert_flow_leads(stage);
CREATE INDEX IF NOT EXISTS idx_convert_flow_leads_score ON convert_flow_leads(lead_score DESC);
CREATE INDEX IF NOT EXISTS idx_convert_flow_leads_created_at ON convert_flow_leads(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_convert_flow_funnels_user_id ON convert_flow_funnels(user_id);
CREATE INDEX IF NOT EXISTS idx_convert_flow_funnels_status ON convert_flow_funnels(status);

CREATE INDEX IF NOT EXISTS idx_convert_flow_funnel_analytics_funnel_id ON convert_flow_funnel_analytics(funnel_id);
CREATE INDEX IF NOT EXISTS idx_convert_flow_funnel_analytics_date ON convert_flow_funnel_analytics(date DESC);

CREATE INDEX IF NOT EXISTS idx_convert_flow_lead_activities_lead_id ON convert_flow_lead_activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_convert_flow_lead_activities_created_at ON convert_flow_lead_activities(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_convert_flow_email_campaigns_user_id ON convert_flow_email_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_convert_flow_email_campaigns_status ON convert_flow_email_campaigns(status);

CREATE INDEX IF NOT EXISTS idx_convert_flow_proposals_user_id ON convert_flow_proposals(user_id);
CREATE INDEX IF NOT EXISTS idx_convert_flow_proposals_lead_id ON convert_flow_proposals(lead_id);
CREATE INDEX IF NOT EXISTS idx_convert_flow_proposals_status ON convert_flow_proposals(status);

-- Row Level Security Policies
ALTER TABLE convert_flow_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE convert_flow_funnels ENABLE ROW LEVEL SECURITY;
ALTER TABLE convert_flow_funnel_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE convert_flow_lead_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE convert_flow_email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE convert_flow_email_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE convert_flow_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE convert_flow_scoring_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE convert_flow_sync_status ENABLE ROW LEVEL SECURITY;

-- Security Policies
CREATE POLICY "Users can manage their own leads" ON convert_flow_leads FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own funnels" ON convert_flow_funnels FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view their funnel analytics" ON convert_flow_funnel_analytics FOR SELECT USING (
    EXISTS (SELECT 1 FROM convert_flow_funnels WHERE id = funnel_id AND user_id = auth.uid())
);
CREATE POLICY "Users can manage their lead activities" ON convert_flow_lead_activities FOR ALL USING (
    EXISTS (SELECT 1 FROM convert_flow_leads WHERE id = lead_id AND user_id = auth.uid())
);
CREATE POLICY "Users can manage their email campaigns" ON convert_flow_email_campaigns FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view their email interactions" ON convert_flow_email_interactions FOR SELECT USING (
    EXISTS (SELECT 1 FROM convert_flow_email_campaigns WHERE id = campaign_id AND user_id = auth.uid())
);
CREATE POLICY "Users can manage their proposals" ON convert_flow_proposals FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their scoring rules" ON convert_flow_scoring_rules FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their sync status" ON convert_flow_sync_status FOR ALL USING (auth.uid() = user_id);