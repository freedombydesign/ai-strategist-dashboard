-- ProfitPulse Database Schema
-- Real-time service business profitability tracking and optimization

-- Core Tables for ProfitPulse System

-- 1. Team Members & Cost Tracking
CREATE TABLE IF NOT EXISTS team_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    role VARCHAR(100) NOT NULL,
    hourly_rate DECIMAL(10,2) NOT NULL DEFAULT 0,
    salary_annual DECIMAL(12,2),
    benefits_cost DECIMAL(10,2) DEFAULT 0,
    overhead_allocation DECIMAL(5,2) DEFAULT 25.00, -- percentage
    true_hourly_cost DECIMAL(10,2) GENERATED ALWAYS AS (
        CASE 
            WHEN salary_annual > 0 THEN (salary_annual + benefits_cost) / 2080 * (1 + overhead_allocation/100)
            ELSE hourly_rate * (1 + overhead_allocation/100)
        END
    ) STORED,
    efficiency_score DECIMAL(5,2) DEFAULT 100.00,
    active BOOLEAN DEFAULT true,
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Acquisition Channels for CAC Tracking
CREATE TABLE IF NOT EXISTS acquisition_channels (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    channel_type VARCHAR(50) NOT NULL, -- google_ads, facebook_ads, linkedin, referral, content, direct, etc.
    cost_allocation_method VARCHAR(50) DEFAULT 'equal_split', -- equal_split, weighted, attribution_window
    monthly_budget DECIMAL(10,2) DEFAULT 0,
    attribution_window_days INTEGER DEFAULT 30,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Marketing Costs & Campaign Tracking
CREATE TABLE IF NOT EXISTS marketing_costs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    channel_id UUID REFERENCES acquisition_channels(id) ON DELETE CASCADE,
    campaign_name VARCHAR(255),
    amount DECIMAL(10,2) NOT NULL,
    cost_type VARCHAR(50) DEFAULT 'advertising', -- advertising, tools, content_creation, events, etc.
    spend_date DATE NOT NULL,
    clicks INTEGER DEFAULT 0,
    impressions INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    external_campaign_id VARCHAR(255), -- Google Ads, Facebook campaign ID, etc.
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Sales Costs & Team Allocation
CREATE TABLE IF NOT EXISTS sales_costs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    cost_type VARCHAR(100) NOT NULL, -- sales_team_salary, crm_tools, sales_training, travel, etc.
    amount DECIMAL(10,2) NOT NULL,
    allocation_period VARCHAR(20) DEFAULT 'monthly', -- monthly, quarterly, yearly
    cost_date DATE NOT NULL,
    allocated_to_period DATE, -- Which period this cost should be allocated to
    description TEXT,
    recurring BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Clients with Full CAC Integration
CREATE TABLE IF NOT EXISTS profit_clients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    company VARCHAR(255),
    hourly_rate DECIMAL(10,2) NOT NULL,
    retainer_amount DECIMAL(10,2) DEFAULT 0,
    billing_type VARCHAR(50) DEFAULT 'hourly', -- hourly, project, retainer, value_based
    health_score DECIMAL(5,2) DEFAULT 100.00,
    profitability_status VARCHAR(20) DEFAULT 'healthy', -- healthy, warning, critical, unprofitable
    lifetime_value DECIMAL(12,2) DEFAULT 0,
    predicted_ltv DECIMAL(12,2) DEFAULT 0,
    acquisition_cost DECIMAL(10,2) DEFAULT 0,
    acquisition_channel_id UUID REFERENCES acquisition_channels(id) ON DELETE SET NULL,
    acquisition_date DATE,
    cac_ltv_ratio DECIMAL(5,2) DEFAULT 0, -- LTV:CAC ratio
    cac_health_score VARCHAR(20) DEFAULT 'unknown', -- excellent, good, acceptable, poor, critical
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    last_invoice_date DATE,
    next_review_date DATE,
    notes TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Client Acquisition Tracking
CREATE TABLE IF NOT EXISTS client_acquisition (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    client_id UUID REFERENCES profit_clients(id) ON DELETE CASCADE,
    acquisition_channel_id UUID REFERENCES acquisition_channels(id) ON DELETE CASCADE,
    acquisition_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
    attributed_marketing_cost DECIMAL(10,2) DEFAULT 0,
    attributed_sales_cost DECIMAL(10,2) DEFAULT 0,
    acquisition_date DATE NOT NULL,
    ltv_estimate DECIMAL(12,2) DEFAULT 0,
    ltv_actual DECIMAL(12,2) DEFAULT 0,
    payback_period_months INTEGER DEFAULT 0,
    source_campaign VARCHAR(255),
    referrer_client_id UUID REFERENCES profit_clients(id) ON DELETE SET NULL,
    conversion_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Projects & Service Lines
CREATE TABLE IF NOT EXISTS profit_projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    client_id UUID REFERENCES profit_clients(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    service_type VARCHAR(100) NOT NULL, -- Strategy, Implementation, Consulting, etc.
    project_type VARCHAR(50) DEFAULT 'time_and_materials', -- fixed_price, time_and_materials, retainer
    budget DECIMAL(12,2),
    estimated_hours DECIMAL(8,2),
    actual_hours DECIMAL(8,2) DEFAULT 0,
    hourly_rate DECIMAL(10,2),
    total_revenue DECIMAL(12,2) DEFAULT 0,
    total_costs DECIMAL(12,2) DEFAULT 0,
    allocated_cac DECIMAL(10,2) DEFAULT 0, -- CAC allocated to this project
    profit_margin DECIMAL(5,2) DEFAULT 0,
    true_profit_margin DECIMAL(5,2) DEFAULT 0, -- Including CAC
    status VARCHAR(50) DEFAULT 'active', -- active, completed, on_hold, cancelled
    start_date DATE NOT NULL,
    end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Time Tracking Entries
CREATE TABLE IF NOT EXISTS time_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES profit_projects(id) ON DELETE CASCADE,
    team_member_id UUID REFERENCES team_members(id) ON DELETE SET NULL,
    external_id VARCHAR(255), -- for integration with Toggl, Harvest, etc.
    integration_source VARCHAR(50), -- toggl, harvest, manual, etc.
    date DATE NOT NULL,
    hours DECIMAL(6,2) NOT NULL,
    description TEXT,
    billable BOOLEAN DEFAULT true,
    billed BOOLEAN DEFAULT false,
    hourly_rate DECIMAL(10,2),
    revenue DECIMAL(10,2),
    cost DECIMAL(10,2),
    allocated_cac_portion DECIMAL(10,2) DEFAULT 0, -- CAC allocated to this time entry
    profit DECIMAL(10,2),
    true_profit DECIMAL(10,2), -- Profit including CAC allocation
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Business Expenses & Overhead Allocation
CREATE TABLE IF NOT EXISTS business_expenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    allocation_type VARCHAR(50) DEFAULT 'all_clients', -- all_clients, specific_client, specific_project
    allocated_to_id UUID, -- client_id or project_id based on allocation_type
    expense_date DATE NOT NULL,
    recurring BOOLEAN DEFAULT false,
    recurring_frequency VARCHAR(20), -- monthly, quarterly, yearly
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Enhanced Profitability Snapshots with CAC
CREATE TABLE IF NOT EXISTS profitability_snapshots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    client_id UUID REFERENCES profit_clients(id) ON DELETE CASCADE,
    snapshot_date DATE NOT NULL,
    total_revenue DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_costs DECIMAL(12,2) NOT NULL DEFAULT 0,
    allocated_cac DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_profit DECIMAL(12,2) NOT NULL DEFAULT 0,
    true_profit DECIMAL(12,2) NOT NULL DEFAULT 0, -- Profit including CAC
    profit_margin DECIMAL(5,2) NOT NULL DEFAULT 0,
    true_profit_margin DECIMAL(5,2) NOT NULL DEFAULT 0, -- Margin including CAC
    hours_worked DECIMAL(8,2) NOT NULL DEFAULT 0,
    profit_per_hour DECIMAL(10,2) DEFAULT 0,
    true_profit_per_hour DECIMAL(10,2) DEFAULT 0, -- Per hour including CAC
    revenue_per_hour DECIMAL(10,2) DEFAULT 0,
    cost_per_hour DECIMAL(10,2) DEFAULT 0,
    cac_per_hour DECIMAL(10,2) DEFAULT 0,
    ltv_cac_ratio DECIMAL(5,2) DEFAULT 0,
    payback_months DECIMAL(4,1) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, client_id, snapshot_date)
);

-- 11. AI Insights & Recommendations with CAC Intelligence
CREATE TABLE IF NOT EXISTS profit_insights (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    insight_type VARCHAR(100) NOT NULL, -- cac_alert, profitability_alert, pricing_recommendation, channel_optimization, etc.
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    severity VARCHAR(20) DEFAULT 'info', -- critical, warning, info, success
    related_entity_type VARCHAR(50), -- client, project, team_member, service_line, channel
    related_entity_id UUID,
    data_points JSONB, -- Supporting data for the insight
    recommendations JSONB, -- Array of actionable recommendations
    cac_impact JSONB, -- CAC-specific impact analysis
    ltv_implications JSONB, -- LTV implications of recommendations
    actions_taken JSONB DEFAULT '[]'::jsonb, -- Track which actions were executed
    impact_score DECIMAL(5,2) DEFAULT 0, -- Potential business impact 0-100
    priority DECIMAL(3,1) DEFAULT 5.0, -- Priority 1-10
    status VARCHAR(20) DEFAULT 'active', -- active, resolved, dismissed
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. Integration Settings & API Connections
CREATE TABLE IF NOT EXISTS profit_integrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    integration_type VARCHAR(50) NOT NULL, -- toggl, harvest, quickbooks, hubspot, google_ads, facebook_ads, etc.
    integration_name VARCHAR(100) NOT NULL,
    api_credentials JSONB, -- Encrypted API keys and tokens
    settings JSONB DEFAULT '{}'::jsonb,
    last_sync TIMESTAMP WITH TIME ZONE,
    sync_status VARCHAR(20) DEFAULT 'pending', -- active, error, disabled, pending
    error_message TEXT,
    records_synced INTEGER DEFAULT 0,
    cac_sync_enabled BOOLEAN DEFAULT false, -- Enable CAC data syncing
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_acquisition_channels_user_id ON acquisition_channels(user_id);
CREATE INDEX IF NOT EXISTS idx_marketing_costs_user_id ON marketing_costs(user_id);
CREATE INDEX IF NOT EXISTS idx_marketing_costs_channel ON marketing_costs(channel_id, spend_date);
CREATE INDEX IF NOT EXISTS idx_sales_costs_user_id ON sales_costs(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_costs_date ON sales_costs(user_id, cost_date);
CREATE INDEX IF NOT EXISTS idx_profit_clients_user_id ON profit_clients(user_id);
CREATE INDEX IF NOT EXISTS idx_profit_clients_status ON profit_clients(user_id, profitability_status);
CREATE INDEX IF NOT EXISTS idx_profit_clients_cac_health ON profit_clients(user_id, cac_health_score);
CREATE INDEX IF NOT EXISTS idx_client_acquisition_user_id ON client_acquisition(user_id);
CREATE INDEX IF NOT EXISTS idx_client_acquisition_client ON client_acquisition(client_id);
CREATE INDEX IF NOT EXISTS idx_client_acquisition_channel ON client_acquisition(acquisition_channel_id, acquisition_date);
CREATE INDEX IF NOT EXISTS idx_profit_projects_user_id ON profit_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_profit_projects_client_id ON profit_projects(client_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_user_id ON time_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_project_id ON time_entries(project_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_date ON time_entries(user_id, date);
CREATE INDEX IF NOT EXISTS idx_business_expenses_user_id ON business_expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_profitability_snapshots_composite ON profitability_snapshots(user_id, client_id, snapshot_date);
CREATE INDEX IF NOT EXISTS idx_profit_insights_user_id ON profit_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_profit_insights_type ON profit_insights(user_id, insight_type);
CREATE INDEX IF NOT EXISTS idx_profit_integrations_user_id ON profit_integrations(user_id);

-- Row Level Security (RLS) Policies
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE acquisition_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE profit_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_acquisition ENABLE ROW LEVEL SECURITY;
ALTER TABLE profit_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE profitability_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE profit_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE profit_integrations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user data isolation
DO $$ 
BEGIN
    -- Team Members
    CREATE POLICY "Users can only access their own team members" ON team_members
        FOR ALL USING (auth.uid() = user_id);
    
    -- Acquisition Channels
    CREATE POLICY "Users can only access their own acquisition channels" ON acquisition_channels
        FOR ALL USING (auth.uid() = user_id);
    
    -- Marketing Costs
    CREATE POLICY "Users can only access their own marketing costs" ON marketing_costs
        FOR ALL USING (auth.uid() = user_id);
    
    -- Sales Costs
    CREATE POLICY "Users can only access their own sales costs" ON sales_costs
        FOR ALL USING (auth.uid() = user_id);
    
    -- Profit Clients
    CREATE POLICY "Users can only access their own clients" ON profit_clients
        FOR ALL USING (auth.uid() = user_id);
    
    -- Client Acquisition
    CREATE POLICY "Users can only access their own client acquisition data" ON client_acquisition
        FOR ALL USING (auth.uid() = user_id);
    
    -- Profit Projects
    CREATE POLICY "Users can only access their own projects" ON profit_projects
        FOR ALL USING (auth.uid() = user_id);
    
    -- Time Entries
    CREATE POLICY "Users can only access their own time entries" ON time_entries
        FOR ALL USING (auth.uid() = user_id);
    
    -- Business Expenses
    CREATE POLICY "Users can only access their own expenses" ON business_expenses
        FOR ALL USING (auth.uid() = user_id);
    
    -- Profitability Snapshots
    CREATE POLICY "Users can only access their own snapshots" ON profitability_snapshots
        FOR ALL USING (auth.uid() = user_id);
    
    -- Profit Insights
    CREATE POLICY "Users can only access their own insights" ON profit_insights
        FOR ALL USING (auth.uid() = user_id);
    
    -- Profit Integrations
    CREATE POLICY "Users can only access their own integrations" ON profit_integrations
        FOR ALL USING (auth.uid() = user_id);

EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Functions for automated calculations

-- Function to calculate true hourly cost including overhead
CREATE OR REPLACE FUNCTION calculate_true_hourly_cost(
    salary DECIMAL,
    benefits DECIMAL,
    hourly DECIMAL,
    overhead_pct DECIMAL
) RETURNS DECIMAL AS $$
BEGIN
    IF salary > 0 THEN
        RETURN (salary + benefits) / 2080 * (1 + overhead_pct/100);
    ELSE
        RETURN hourly * (1 + overhead_pct/100);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to update profitability snapshots
CREATE OR REPLACE FUNCTION refresh_profitability_snapshot(client_uuid UUID, snapshot_date_param DATE)
RETURNS VOID AS $$
DECLARE
    user_uuid UUID;
    revenue_total DECIMAL := 0;
    cost_total DECIMAL := 0;
    hours_total DECIMAL := 0;
BEGIN
    -- Get user_id from client
    SELECT user_id INTO user_uuid FROM profit_clients WHERE id = client_uuid;
    
    -- Calculate totals from time entries
    SELECT 
        COALESCE(SUM(revenue), 0),
        COALESCE(SUM(cost), 0),
        COALESCE(SUM(hours), 0)
    INTO revenue_total, cost_total, hours_total
    FROM time_entries te
    JOIN profit_projects pp ON te.project_id = pp.id
    WHERE pp.client_id = client_uuid 
    AND te.date = snapshot_date_param;
    
    -- Insert or update snapshot
    INSERT INTO profitability_snapshots (
        user_id, client_id, snapshot_date, total_revenue, total_costs, 
        total_profit, profit_margin, hours_worked, profit_per_hour,
        revenue_per_hour, cost_per_hour
    ) VALUES (
        user_uuid, client_uuid, snapshot_date_param, revenue_total, cost_total,
        revenue_total - cost_total,
        CASE WHEN revenue_total > 0 THEN ((revenue_total - cost_total) / revenue_total) * 100 ELSE 0 END,
        hours_total,
        CASE WHEN hours_total > 0 THEN (revenue_total - cost_total) / hours_total ELSE 0 END,
        CASE WHEN hours_total > 0 THEN revenue_total / hours_total ELSE 0 END,
        CASE WHEN hours_total > 0 THEN cost_total / hours_total ELSE 0 END
    ) ON CONFLICT (user_id, client_id, snapshot_date) 
    DO UPDATE SET
        total_revenue = EXCLUDED.total_revenue,
        total_costs = EXCLUDED.total_costs,
        total_profit = EXCLUDED.total_profit,
        profit_margin = EXCLUDED.profit_margin,
        hours_worked = EXCLUDED.hours_worked,
        profit_per_hour = EXCLUDED.profit_per_hour,
        revenue_per_hour = EXCLUDED.revenue_per_hour,
        cost_per_hour = EXCLUDED.cost_per_hour;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-calculate profit on time entry insert/update
CREATE OR REPLACE FUNCTION calculate_time_entry_profit()
RETURNS TRIGGER AS $$
DECLARE
    team_cost DECIMAL := 0;
BEGIN
    -- Get team member's true hourly cost
    IF NEW.team_member_id IS NOT NULL THEN
        SELECT true_hourly_cost INTO team_cost 
        FROM team_members 
        WHERE id = NEW.team_member_id;
    END IF;
    
    -- Calculate revenue, cost, and profit
    NEW.cost := NEW.hours * COALESCE(team_cost, 0);
    NEW.revenue := NEW.hours * COALESCE(NEW.hourly_rate, 0);
    NEW.profit := NEW.revenue - NEW.cost;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_time_entry_profit
    BEFORE INSERT OR UPDATE ON time_entries
    FOR EACH ROW
    EXECUTE FUNCTION calculate_time_entry_profit();

-- Enhanced CAC calculation functions
CREATE OR REPLACE FUNCTION calculate_channel_cac(
    channel_uuid UUID,
    period_start DATE,
    period_end DATE
) RETURNS DECIMAL AS $$
DECLARE
    total_marketing_cost DECIMAL := 0;
    total_sales_cost DECIMAL := 0;
    new_clients_count INTEGER := 0;
    channel_cac DECIMAL := 0;
BEGIN
    -- Get marketing costs for the channel in the period
    SELECT COALESCE(SUM(amount), 0) INTO total_marketing_cost
    FROM marketing_costs
    WHERE channel_id = channel_uuid
    AND spend_date BETWEEN period_start AND period_end;
    
    -- Get allocated sales costs for the period
    SELECT COALESCE(SUM(amount), 0) INTO total_sales_cost
    FROM sales_costs
    WHERE allocated_to_period BETWEEN period_start AND period_end;
    
    -- Get number of new clients acquired through this channel
    SELECT COUNT(*) INTO new_clients_count
    FROM client_acquisition
    WHERE acquisition_channel_id = channel_uuid
    AND acquisition_date BETWEEN period_start AND period_end;
    
    -- Calculate CAC
    IF new_clients_count > 0 THEN
        channel_cac := (total_marketing_cost + (total_sales_cost / GREATEST(
            (SELECT COUNT(*) FROM client_acquisition WHERE acquisition_date BETWEEN period_start AND period_end), 1
        ))) / new_clients_count;
    END IF;
    
    RETURN channel_cac;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate LTV:CAC health score
CREATE OR REPLACE FUNCTION calculate_cac_health_score(ltv DECIMAL, cac DECIMAL)
RETURNS VARCHAR AS $$
BEGIN
    IF cac = 0 THEN RETURN 'unknown';
    END IF;
    
    CASE 
        WHEN ltv / cac >= 5 THEN RETURN 'excellent';
        WHEN ltv / cac >= 3 THEN RETURN 'good';
        WHEN ltv / cac >= 2 THEN RETURN 'acceptable';
        WHEN ltv / cac >= 1 THEN RETURN 'poor';
        ELSE RETURN 'critical';
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Function to update client CAC metrics
CREATE OR REPLACE FUNCTION update_client_cac_metrics(client_uuid UUID)
RETURNS VOID AS $$
DECLARE
    client_ltv DECIMAL := 0;
    client_cac DECIMAL := 0;
    cac_ratio DECIMAL := 0;
    health_score VARCHAR := 'unknown';
BEGIN
    -- Get client's LTV (sum of all revenue)
    SELECT COALESCE(pc.lifetime_value, 0) INTO client_ltv
    FROM profit_clients pc
    WHERE pc.id = client_uuid;
    
    -- Get client's CAC
    SELECT COALESCE(ca.acquisition_cost, 0) INTO client_cac
    FROM client_acquisition ca
    WHERE ca.client_id = client_uuid;
    
    -- Calculate ratio and health score
    IF client_cac > 0 THEN
        cac_ratio := client_ltv / client_cac;
        health_score := calculate_cac_health_score(client_ltv, client_cac);
    END IF;
    
    -- Update client record
    UPDATE profit_clients
    SET 
        cac_ltv_ratio = cac_ratio,
        cac_health_score = health_score,
        updated_at = NOW()
    WHERE id = client_uuid;
END;
$$ LANGUAGE plpgsql;

-- Sample data for development/testing
INSERT INTO acquisition_channels (user_id, name, channel_type, monthly_budget) VALUES
    ('00000000-0000-0000-0000-000000000000', 'Google Ads', 'google_ads', 5000.00),
    ('00000000-0000-0000-0000-000000000000', 'LinkedIn Advertising', 'linkedin', 3000.00),
    ('00000000-0000-0000-0000-000000000000', 'Referral Program', 'referral', 1000.00),
    ('00000000-0000-0000-0000-000000000000', 'Content Marketing', 'content', 2000.00),
    ('00000000-0000-0000-0000-000000000000', 'Direct Outreach', 'direct', 500.00)
ON CONFLICT DO NOTHING;

INSERT INTO team_members (user_id, name, role, hourly_rate, overhead_allocation, efficiency_score) VALUES
    ('00000000-0000-0000-0000-000000000000', 'Senior Consultant', 'senior_consultant', 150.00, 35.00, 95.5),
    ('00000000-0000-0000-0000-000000000000', 'Junior Analyst', 'analyst', 75.00, 25.00, 88.2),
    ('00000000-0000-0000-0000-000000000000', 'Project Manager', 'project_manager', 120.00, 30.00, 92.8)
ON CONFLICT DO NOTHING;

INSERT INTO profit_clients (user_id, name, company, hourly_rate, billing_type, health_score, profitability_status, lifetime_value, acquisition_cost, cac_health_score) VALUES
    ('00000000-0000-0000-0000-000000000000', 'TechCorp Solutions', 'TechCorp Inc', 200.00, 'hourly', 85.5, 'healthy', 45000.00, 3500.00, 'excellent'),
    ('00000000-0000-0000-0000-000000000000', 'StartupX', 'StartupX Ltd', 150.00, 'project', 65.2, 'warning', 18000.00, 4200.00, 'good'),
    ('00000000-0000-0000-0000-000000000000', 'Enterprise Global', 'Enterprise Corp', 300.00, 'retainer', 92.8, 'healthy', 120000.00, 2800.00, 'excellent')
ON CONFLICT DO NOTHING;