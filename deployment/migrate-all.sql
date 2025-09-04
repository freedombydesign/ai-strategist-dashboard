-- Freedom by Design Suite - Complete Database Migration
-- Execute this file in your premium Supabase instance

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Helper function to check if user is premium
CREATE OR REPLACE FUNCTION is_premium_user(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Implement your premium user logic here
  -- For now, return true for all users
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SYSTEM 1: CASH FLOW COMMAND - Add to existing schema
-- ============================================================================

-- Cash Flow Projections Table
CREATE TABLE IF NOT EXISTS cash_flow_projections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    projection_name TEXT NOT NULL,
    projection_period TEXT NOT NULL CHECK (projection_period IN ('weekly', 'monthly', 'quarterly')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    base_scenario JSONB NOT NULL,
    optimistic_scenario JSONB,
    pessimistic_scenario JSONB,
    confidence_score DECIMAL(3,1) CHECK (confidence_score >= 0 AND confidence_score <= 10),
    key_assumptions TEXT[],
    risk_factors TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment Predictions Table
CREATE TABLE IF NOT EXISTS payment_predictions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    invoice_id UUID NOT NULL,
    predicted_payment_date DATE NOT NULL,
    probability DECIMAL(5,2) CHECK (probability >= 0 AND probability <= 100),
    factors JSONB,
    model_version TEXT DEFAULT 'v1.0',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- SYSTEM 8: EXECUTIVE INTELLIGENCE ENGINE
-- ============================================================================

-- Executive Briefings Table
CREATE TABLE IF NOT EXISTS executive_briefings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    briefing_date DATE NOT NULL,
    briefing_type TEXT NOT NULL CHECK (briefing_type IN ('daily', 'weekly', 'monthly')),
    top_priority_item TEXT,
    key_win TEXT,
    main_concern TEXT,
    business_health_score DECIMAL(3,1) CHECK (business_health_score >= 0 AND business_health_score <= 10),
    health_trend TEXT CHECK (health_trend IN ('improving', 'stable', 'declining')),
    revenue_trajectory TEXT,
    profit_health TEXT,
    cash_flow_status TEXT,
    delivery_performance TEXT,
    pipeline_analysis TEXT,
    immediate_actions JSONB,
    weekly_focus_areas JSONB,
    analysis_confidence DECIMAL(5,2) CHECK (analysis_confidence >= 0 AND analysis_confidence <= 100),
    briefing_status TEXT NOT NULL DEFAULT 'generated' CHECK (briefing_status IN ('generated', 'acknowledged', 'acted_upon')),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    acknowledged_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Predictive Alerts Table
CREATE TABLE IF NOT EXISTS predictive_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    alert_id TEXT NOT NULL UNIQUE,
    alert_category TEXT NOT NULL,
    alert_type TEXT NOT NULL DEFAULT 'prediction',
    alert_severity TEXT NOT NULL CHECK (alert_severity IN ('low', 'medium', 'high', 'critical')),
    alert_title TEXT NOT NULL,
    alert_message TEXT NOT NULL,
    detailed_explanation TEXT,
    prediction_confidence DECIMAL(5,2) CHECK (prediction_confidence >= 0 AND prediction_confidence <= 100),
    time_to_impact TEXT,
    predicted_impact_severity TEXT,
    probability_percentage DECIMAL(5,2) CHECK (probability_percentage >= 0 AND probability_percentage <= 100),
    affected_revenue DECIMAL(10,2) DEFAULT 0,
    recommended_actions JSONB,
    action_urgency TEXT CHECK (action_urgency IN ('immediate', 'this-week', 'this-month', 'this-quarter')),
    alert_status TEXT NOT NULL DEFAULT 'active' CHECK (alert_status IN ('active', 'acknowledged', 'resolved', 'dismissed')),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    acknowledged_by TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_actions TEXT,
    investigation_notes TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on new tables
ALTER TABLE cash_flow_projections ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE executive_briefings ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictive_alerts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Premium users can access their projections" ON cash_flow_projections
FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Premium users can access payment predictions" ON payment_predictions
FOR ALL USING (EXISTS (SELECT 1 FROM invoices WHERE invoices.id = payment_predictions.invoice_id AND invoices.user_id = auth.uid()));

CREATE POLICY "Premium users can access their briefings" ON executive_briefings
FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Premium users can access their alerts" ON predictive_alerts
FOR ALL USING (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_cash_flow_projections_user_id ON cash_flow_projections(user_id);
CREATE INDEX IF NOT EXISTS idx_executive_briefings_user_id ON executive_briefings(user_id);
CREATE INDEX IF NOT EXISTS idx_executive_briefings_date ON executive_briefings(briefing_date);
CREATE INDEX IF NOT EXISTS idx_predictive_alerts_user_id ON predictive_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_predictive_alerts_status ON predictive_alerts(alert_status);

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Freedom by Design Suite - Executive Intelligence tables created successfully!';
    RAISE NOTICE 'Ready for deployment to premium subdomains.';
END $$;