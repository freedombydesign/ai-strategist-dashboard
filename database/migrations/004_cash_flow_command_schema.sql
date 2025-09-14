-- Cash Flow Command Enterprise Database Schema
-- Sophisticated cash flow forecasting and management system for service businesses

-- Core Cash Flow Forecasting Tables
CREATE TABLE IF NOT EXISTS cash_flow_forecasts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Forecast Period
    week_ending DATE NOT NULL,
    forecast_type VARCHAR(50) DEFAULT 'realistic', -- 'conservative', 'realistic', 'optimistic'
    
    -- Cash Flow Components
    projected_inflow DECIMAL(12,2) DEFAULT 0,
    projected_outflow DECIMAL(12,2) DEFAULT 0,
    net_position DECIMAL(12,2) DEFAULT 0,
    cumulative_position DECIMAL(12,2) DEFAULT 0,
    
    -- Confidence and Risk Metrics
    confidence_score INTEGER DEFAULT 85,
    risk_level VARCHAR(20) DEFAULT 'low', -- 'low', 'medium', 'high', 'critical'
    cash_runway_days INTEGER DEFAULT 0,
    
    -- Seasonal and Contextual Factors
    seasonal_adjustment_factor DECIMAL(3,2) DEFAULT 1.0,
    market_conditions_factor DECIMAL(3,2) DEFAULT 1.0,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    forecast_accuracy DECIMAL(5,2), -- Actual vs predicted (filled after week passes)
    
    UNIQUE(user_id, week_ending, forecast_type)
);

-- Advanced Invoice Management and Tracking
CREATE TABLE IF NOT EXISTS cash_flow_invoices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Invoice Basic Info
    invoice_number VARCHAR(100) NOT NULL,
    client_id UUID, -- Will reference clients table
    client_name VARCHAR(255) NOT NULL,
    client_email VARCHAR(255),
    
    -- Financial Details
    amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Important Dates
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    paid_date DATE,
    
    -- Payment Intelligence
    payment_probability INTEGER DEFAULT 50, -- 0-100 percentage
    predicted_payment_date DATE,
    payment_speed_score INTEGER DEFAULT 50, -- Based on client history
    
    -- Risk Assessment
    risk_factors TEXT[],
    collection_difficulty VARCHAR(20) DEFAULT 'normal', -- 'easy', 'normal', 'difficult', 'problematic'
    
    -- Status and Classification
    status VARCHAR(50) DEFAULT 'sent', -- 'draft', 'sent', 'viewed', 'overdue', 'paid', 'cancelled'
    invoice_type VARCHAR(50) DEFAULT 'standard', -- 'standard', 'milestone', 'retainer', 'recurring'
    
    -- Payment Details
    payment_method VARCHAR(50),
    payment_reference VARCHAR(255),
    partial_payments JSONB DEFAULT '[]',
    
    -- Integration Data
    quickbooks_id VARCHAR(100),
    stripe_payment_intent_id VARCHAR(255),
    
    -- Audit Trail
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_reminder_sent TIMESTAMPTZ,
    collection_attempts INTEGER DEFAULT 0
);

-- Comprehensive Payment History Analytics
CREATE TABLE IF NOT EXISTS cash_flow_payment_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    invoice_id UUID REFERENCES cash_flow_invoices(id) ON DELETE CASCADE,
    client_id UUID,
    
    -- Payment Details
    amount DECIMAL(12,2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_method VARCHAR(50),
    payment_reference VARCHAR(255),
    
    -- Timing Analysis
    days_to_payment INTEGER, -- Days from invoice date to payment
    days_from_due INTEGER, -- Positive = late, negative = early
    invoice_amount DECIMAL(12,2), -- Original invoice amount for partial payment analysis
    
    -- Context and Performance
    payment_type VARCHAR(50) DEFAULT 'full', -- 'full', 'partial', 'final_partial'
    early_payment_discount DECIMAL(5,2) DEFAULT 0,
    late_payment_fee DECIMAL(8,2) DEFAULT 0,
    
    -- Behavioral Insights
    client_communication_quality INTEGER DEFAULT 5, -- 1-10 scale
    payment_negotiation_required BOOLEAN DEFAULT FALSE,
    dispute_occurred BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sophisticated Client Payment Behavior Profiles
CREATE TABLE IF NOT EXISTS cash_flow_client_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    client_id UUID,
    
    -- Client Information
    client_name VARCHAR(255) NOT NULL,
    client_email VARCHAR(255),
    client_industry VARCHAR(100),
    client_size VARCHAR(50), -- 'small', 'medium', 'large', 'enterprise'
    
    -- Payment Behavior Metrics
    avg_payment_days DECIMAL(5,2) DEFAULT 30,
    payment_reliability_score INTEGER DEFAULT 50, -- 0-100
    early_payment_frequency DECIMAL(5,2) DEFAULT 0, -- Percentage of payments made early
    
    -- Risk Assessment
    risk_factors TEXT[],
    credit_score_estimate INTEGER, -- If available
    financial_stability_score INTEGER DEFAULT 50, -- 0-100
    communication_responsiveness INTEGER DEFAULT 5, -- 1-10
    
    -- Business Relationship Context
    relationship_length_months INTEGER DEFAULT 0,
    total_business_value DECIMAL(12,2) DEFAULT 0,
    project_complexity_preference VARCHAR(50), -- 'simple', 'moderate', 'complex'
    
    -- Payment Pattern Analysis
    seasonal_payment_variations JSONB DEFAULT '{}',
    preferred_payment_methods TEXT[],
    typical_dispute_types TEXT[],
    
    -- Optimization Insights
    optimal_payment_terms VARCHAR(20),
    early_payment_discount_responsiveness DECIMAL(5,2) DEFAULT 0,
    collection_effort_required VARCHAR(20) DEFAULT 'standard',
    
    -- Statistical Data
    total_invoices_sent INTEGER DEFAULT 0,
    total_payments_received INTEGER DEFAULT 0,
    average_invoice_amount DECIMAL(12,2) DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, client_id)
);

-- Recurring Expenses and Fixed Costs
CREATE TABLE IF NOT EXISTS cash_flow_recurring_expenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Expense Details
    description VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL, -- 'payroll', 'rent', 'software', 'utilities', 'marketing', etc.
    amount DECIMAL(12,2) NOT NULL,
    
    -- Recurrence Pattern
    frequency VARCHAR(20) NOT NULL, -- 'weekly', 'bi_weekly', 'monthly', 'quarterly', 'annually'
    frequency_multiplier INTEGER DEFAULT 1, -- For "every 2 weeks" = 2
    
    -- Payment Schedule
    next_due_date DATE NOT NULL,
    last_paid_date DATE,
    typical_payment_day INTEGER, -- Day of month for monthly expenses
    
    -- Flexibility and Options
    is_fixed BOOLEAN DEFAULT TRUE,
    is_essential BOOLEAN DEFAULT TRUE,
    can_be_delayed BOOLEAN DEFAULT FALSE,
    maximum_delay_days INTEGER DEFAULT 0,
    
    -- Optimization Context
    early_payment_discount DECIMAL(5,2) DEFAULT 0,
    late_payment_penalty DECIMAL(5,2) DEFAULT 0,
    seasonal_variations JSONB DEFAULT '{}',
    
    -- Status and Control
    is_active BOOLEAN DEFAULT TRUE,
    auto_pay_enabled BOOLEAN DEFAULT FALSE,
    
    -- Integration Data
    quickbooks_id VARCHAR(100),
    bank_account_id VARCHAR(100),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Advanced Scenario Planning and Modeling
CREATE TABLE IF NOT EXISTS cash_flow_scenarios (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Scenario Definition
    scenario_name VARCHAR(255) NOT NULL,
    scenario_type VARCHAR(50) DEFAULT 'custom', -- 'conservative', 'realistic', 'optimistic', 'stress_test', 'custom'
    description TEXT,
    
    -- Scenario Parameters
    assumptions JSONB NOT NULL DEFAULT '{}',
    variable_adjustments JSONB DEFAULT '{}',
    
    -- Impact Analysis
    projected_impact DECIMAL(12,2),
    probability_percentage DECIMAL(5,2) DEFAULT 50,
    impact_timeline_weeks INTEGER DEFAULT 13,
    
    -- Risk Assessment
    risk_level VARCHAR(20) DEFAULT 'medium',
    mitigation_strategies TEXT[],
    contingency_plans JSONB DEFAULT '{}',
    
    -- Metadata
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_modeled_at TIMESTAMPTZ
);

-- Intelligent Cash Flow Alerts System
CREATE TABLE IF NOT EXISTS cash_flow_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Alert Configuration
    alert_name VARCHAR(255) NOT NULL,
    alert_type VARCHAR(50) NOT NULL, -- 'cash_shortage', 'overdue_payment', 'opportunity', 'seasonal'
    
    -- Trigger Conditions
    threshold_amount DECIMAL(12,2),
    threshold_days INTEGER,
    trigger_conditions JSONB NOT NULL DEFAULT '{}',
    
    -- Notification Settings
    notification_channels TEXT[] DEFAULT ARRAY['email'], -- 'email', 'sms', 'slack', 'webhook'
    notification_recipients TEXT[],
    escalation_rules JSONB DEFAULT '{}',
    
    -- Alert Behavior
    priority_level VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    snooze_duration_hours INTEGER DEFAULT 24,
    max_alerts_per_day INTEGER DEFAULT 3,
    
    -- Status and Control
    is_active BOOLEAN DEFAULT TRUE,
    last_triggered_at TIMESTAMPTZ,
    trigger_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Emergency Cash Action Plans
CREATE TABLE IF NOT EXISTS cash_flow_emergency_actions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Emergency Context
    trigger_scenario VARCHAR(50) NOT NULL, -- 'cash_shortage', 'large_payment_delay', 'unexpected_expense'
    cash_shortfall_amount DECIMAL(12,2),
    urgency_level VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    
    -- Recommended Actions
    recommended_actions JSONB NOT NULL DEFAULT '[]',
    priority_order INTEGER[],
    estimated_cash_impact DECIMAL(12,2),
    implementation_time_hours INTEGER,
    
    -- Action Categories
    action_categories TEXT[], -- 'collection', 'payment_delay', 'emergency_funding', 'expense_reduction'
    automation_level VARCHAR(20) DEFAULT 'manual', -- 'automatic', 'semi_automatic', 'manual'
    
    -- Execution Tracking
    is_executed BOOLEAN DEFAULT FALSE,
    execution_date TIMESTAMPTZ,
    actual_cash_impact DECIMAL(12,2),
    execution_notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cash Flow Intelligence and Insights
CREATE TABLE IF NOT EXISTS cash_flow_insights (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Insight Details
    insight_type VARCHAR(50) NOT NULL, -- 'pattern', 'opportunity', 'risk', 'optimization'
    insight_category VARCHAR(50), -- 'payment_timing', 'client_behavior', 'seasonal_trend'
    
    -- Content
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    recommended_actions TEXT[],
    
    -- Impact Assessment
    potential_cash_impact DECIMAL(12,2),
    confidence_level INTEGER DEFAULT 75, -- 0-100
    implementation_difficulty VARCHAR(20) DEFAULT 'medium',
    
    -- Context and Data
    supporting_data JSONB DEFAULT '{}',
    related_clients TEXT[],
    affected_time_period DATERANGE,
    
    -- Status and Engagement
    status VARCHAR(20) DEFAULT 'new', -- 'new', 'viewed', 'action_taken', 'dismissed'
    user_feedback INTEGER, -- 1-5 rating
    is_actionable BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment Terms and Optimization Rules
CREATE TABLE IF NOT EXISTS cash_flow_payment_terms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Terms Configuration  
    terms_name VARCHAR(100) NOT NULL,
    net_days INTEGER NOT NULL DEFAULT 30,
    early_payment_discount_percentage DECIMAL(5,2) DEFAULT 0,
    early_payment_days INTEGER DEFAULT 10,
    
    -- Late Payment Rules
    late_fee_type VARCHAR(20) DEFAULT 'none', -- 'none', 'flat_fee', 'percentage', 'daily'
    late_fee_amount DECIMAL(8,2) DEFAULT 0,
    grace_period_days INTEGER DEFAULT 0,
    
    -- Application Rules
    default_terms BOOLEAN DEFAULT FALSE,
    client_types TEXT[], -- Which client types these terms apply to
    project_types TEXT[], -- Which project types use these terms
    minimum_invoice_amount DECIMAL(12,2),
    
    -- Performance Tracking
    average_payment_days DECIMAL(5,2),
    early_payment_rate DECIMAL(5,2) DEFAULT 0,
    late_payment_rate DECIMAL(5,2) DEFAULT 0,
    
    -- Optimization Metrics
    cash_flow_impact_score INTEGER DEFAULT 50, -- How these terms affect cash flow
    client_satisfaction_score INTEGER DEFAULT 5, -- 1-10 scale
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cash Flow Dashboard Widgets and Preferences
CREATE TABLE IF NOT EXISTS cash_flow_dashboard_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Dashboard Layout
    widget_layout JSONB NOT NULL DEFAULT '[]',
    preferred_view VARCHAR(50) DEFAULT 'weekly', -- 'daily', 'weekly', 'monthly'
    
    -- Display Preferences
    currency VARCHAR(3) DEFAULT 'USD',
    number_format VARCHAR(20) DEFAULT 'standard',
    date_format VARCHAR(20) DEFAULT 'MM/dd/yyyy',
    
    -- Risk and Alert Preferences
    risk_tolerance VARCHAR(20) DEFAULT 'moderate', -- 'conservative', 'moderate', 'aggressive'
    minimum_cash_buffer DECIMAL(12,2) DEFAULT 25000,
    critical_cash_threshold DECIMAL(12,2) DEFAULT 10000,
    
    -- Notification Preferences
    daily_summary_enabled BOOLEAN DEFAULT TRUE,
    weekly_forecast_enabled BOOLEAN DEFAULT TRUE,
    critical_alerts_enabled BOOLEAN DEFAULT TRUE,
    
    -- Integration Settings
    quickbooks_sync_frequency INTEGER DEFAULT 24, -- Hours
    bank_sync_frequency INTEGER DEFAULT 4, -- Hours
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Performance Indexes for Cash Flow Operations
CREATE INDEX IF NOT EXISTS idx_cash_flow_forecasts_user_week ON cash_flow_forecasts(user_id, week_ending);
CREATE INDEX IF NOT EXISTS idx_cash_flow_forecasts_risk ON cash_flow_forecasts(risk_level, week_ending);
CREATE INDEX IF NOT EXISTS idx_cash_flow_invoices_user_status ON cash_flow_invoices(user_id, status);
CREATE INDEX IF NOT EXISTS idx_cash_flow_invoices_due_date ON cash_flow_invoices(due_date, status);
CREATE INDEX IF NOT EXISTS idx_cash_flow_invoices_payment_prob ON cash_flow_invoices(payment_probability DESC);
CREATE INDEX IF NOT EXISTS idx_cash_flow_payment_history_client ON cash_flow_payment_history(client_id, payment_date DESC);
CREATE INDEX IF NOT EXISTS idx_cash_flow_client_profiles_user ON cash_flow_client_profiles(user_id, payment_reliability_score DESC);
CREATE INDEX IF NOT EXISTS idx_cash_flow_expenses_next_due ON cash_flow_recurring_expenses(user_id, next_due_date);
CREATE INDEX IF NOT EXISTS idx_cash_flow_alerts_active ON cash_flow_alerts(user_id, is_active, alert_type);
CREATE INDEX IF NOT EXISTS idx_cash_flow_insights_user_status ON cash_flow_insights(user_id, status, created_at DESC);

-- Row Level Security Policies
ALTER TABLE cash_flow_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_flow_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_flow_payment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_flow_client_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_flow_recurring_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_flow_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_flow_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_flow_emergency_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_flow_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_flow_payment_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_flow_dashboard_config ENABLE ROW LEVEL SECURITY;

-- Security Policies - Users can only access their own cash flow data
CREATE POLICY "Users can manage their own cash flow forecasts" ON cash_flow_forecasts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own invoices" ON cash_flow_invoices FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view their payment history" ON cash_flow_payment_history FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their client profiles" ON cash_flow_client_profiles FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their recurring expenses" ON cash_flow_recurring_expenses FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their scenarios" ON cash_flow_scenarios FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their alerts" ON cash_flow_alerts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their emergency actions" ON cash_flow_emergency_actions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view their insights" ON cash_flow_insights FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their payment terms" ON cash_flow_payment_terms FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their dashboard config" ON cash_flow_dashboard_config FOR ALL USING (auth.uid() = user_id);

-- Functions for Cash Flow Calculations
CREATE OR REPLACE FUNCTION calculate_cash_runway_days(
    user_uuid UUID,
    current_cash_position DECIMAL
) RETURNS INTEGER AS $$
DECLARE
    monthly_burn_rate DECIMAL;
    runway_days INTEGER;
BEGIN
    -- Calculate average monthly expenses from recurring expenses
    SELECT COALESCE(SUM(
        CASE 
            WHEN frequency = 'weekly' THEN amount * 4.33
            WHEN frequency = 'bi_weekly' THEN amount * 2.17
            WHEN frequency = 'monthly' THEN amount
            WHEN frequency = 'quarterly' THEN amount / 3
            WHEN frequency = 'annually' THEN amount / 12
            ELSE 0
        END
    ), 0) INTO monthly_burn_rate
    FROM cash_flow_recurring_expenses
    WHERE user_id = user_uuid AND is_active = true;
    
    -- Calculate runway in days
    IF monthly_burn_rate > 0 THEN
        runway_days := (current_cash_position / monthly_burn_rate * 30)::INTEGER;
    ELSE
        runway_days := 999; -- Infinite runway if no expenses
    END IF;
    
    RETURN GREATEST(0, runway_days);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update payment probability based on client history
CREATE OR REPLACE FUNCTION update_payment_probability(
    invoice_uuid UUID
) RETURNS INTEGER AS $$
DECLARE
    client_profile RECORD;
    invoice_record RECORD;
    base_probability INTEGER := 50;
    adjusted_probability INTEGER;
BEGIN
    -- Get invoice details
    SELECT * INTO invoice_record FROM cash_flow_invoices WHERE id = invoice_uuid;
    
    -- Get client payment profile
    SELECT * INTO client_profile 
    FROM cash_flow_client_profiles 
    WHERE user_id = invoice_record.user_id AND client_name = invoice_record.client_name;
    
    -- Start with client reliability score if available
    IF client_profile.payment_reliability_score IS NOT NULL THEN
        base_probability := client_profile.payment_reliability_score;
    END IF;
    
    -- Adjust based on invoice age
    adjusted_probability := base_probability - GREATEST(0, (CURRENT_DATE - invoice_record.due_date) * 2);
    
    -- Ensure probability stays within bounds
    adjusted_probability := LEAST(95, GREATEST(5, adjusted_probability));
    
    -- Update the invoice
    UPDATE cash_flow_invoices 
    SET payment_probability = adjusted_probability,
        updated_at = NOW()
    WHERE id = invoice_uuid;
    
    RETURN adjusted_probability;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;