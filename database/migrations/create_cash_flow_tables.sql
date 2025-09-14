-- Cash Flow Command Database Schema
-- This stores historical cash flow data and alerts

-- Cash flow snapshots table for historical tracking
CREATE TABLE IF NOT EXISTS cash_flow_snapshots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    current_balance DECIMAL(12,2) NOT NULL DEFAULT 0,
    monthly_recurring DECIMAL(12,2) NOT NULL DEFAULT 0,
    pending_invoices DECIMAL(12,2) NOT NULL DEFAULT 0,
    overdue_invoices DECIMAL(12,2) NOT NULL DEFAULT 0,
    cash_runway DECIMAL(8,2) NOT NULL DEFAULT 0,
    health_score INTEGER NOT NULL DEFAULT 0,
    revenue_growth DECIMAL(8,2) NOT NULL DEFAULT 0,
    avg_transaction_value DECIMAL(10,2) NOT NULL DEFAULT 0,
    customers_count INTEGER NOT NULL DEFAULT 0,
    churn_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
    snapshot_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cash flow alerts table
CREATE TABLE IF NOT EXISTS cash_flow_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    alert_type VARCHAR(20) NOT NULL CHECK (alert_type IN ('warning', 'info', 'success', 'critical')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    urgency VARCHAR(20) NOT NULL CHECK (urgency IN ('low', 'medium', 'high', 'critical')),
    amount DECIMAL(12,2),
    due_date TIMESTAMP WITH TIME ZONE,
    customer_id VARCHAR(255),
    stripe_invoice_id VARCHAR(255),
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stripe transactions cache (to avoid repeated API calls)
CREATE TABLE IF NOT EXISTS stripe_transactions (
    id VARCHAR(255) PRIMARY KEY, -- Stripe transaction ID
    amount DECIMAL(12,2) NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_timestamp INTEGER NOT NULL,
    description TEXT,
    customer_id VARCHAR(255),
    currency VARCHAR(3) NOT NULL DEFAULT 'usd',
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('payment', 'refund', 'payout', 'invoice')),
    stripe_data JSONB, -- Store full Stripe object for reference
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stripe customers cache
CREATE TABLE IF NOT EXISTS stripe_customers (
    id VARCHAR(255) PRIMARY KEY, -- Stripe customer ID
    email VARCHAR(255),
    name VARCHAR(255),
    description TEXT,
    balance INTEGER DEFAULT 0,
    currency VARCHAR(3),
    delinquent BOOLEAN DEFAULT FALSE,
    invoice_prefix VARCHAR(50),
    stripe_data JSONB, -- Store full Stripe customer object
    last_synced TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cash flow forecasting data
CREATE TABLE IF NOT EXISTS cash_flow_forecasts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    forecast_date DATE NOT NULL,
    predicted_revenue DECIMAL(12,2) NOT NULL DEFAULT 0,
    predicted_expenses DECIMAL(12,2) NOT NULL DEFAULT 0,
    predicted_balance DECIMAL(12,2) NOT NULL DEFAULT 0,
    confidence_score INTEGER NOT NULL DEFAULT 0,
    forecast_type VARCHAR(20) NOT NULL DEFAULT 'weekly' CHECK (forecast_type IN ('daily', 'weekly', 'monthly')),
    model_version VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_cash_flow_snapshots_date ON cash_flow_snapshots(snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_cash_flow_alerts_created ON cash_flow_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cash_flow_alerts_resolved ON cash_flow_alerts(is_resolved, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stripe_transactions_created ON stripe_transactions(created_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_stripe_transactions_customer ON stripe_transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_stripe_customers_email ON stripe_customers(email);
CREATE INDEX IF NOT EXISTS idx_cash_flow_forecasts_date ON cash_flow_forecasts(forecast_date DESC);

-- Row Level Security (RLS) policies
ALTER TABLE cash_flow_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_flow_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_flow_forecasts ENABLE ROW LEVEL SECURITY;

-- RLS policies - allow all operations for authenticated users
-- In production, you'd want more granular policies based on user roles
CREATE POLICY "Allow all for authenticated users" ON cash_flow_snapshots FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON cash_flow_alerts FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON stripe_transactions FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON stripe_customers FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON cash_flow_forecasts FOR ALL TO authenticated USING (true);

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates
DROP TRIGGER IF EXISTS update_cash_flow_snapshots_updated_at ON cash_flow_snapshots;
CREATE TRIGGER update_cash_flow_snapshots_updated_at
    BEFORE UPDATE ON cash_flow_snapshots
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_cash_flow_alerts_updated_at ON cash_flow_alerts;
CREATE TRIGGER update_cash_flow_alerts_updated_at
    BEFORE UPDATE ON cash_flow_alerts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_stripe_transactions_updated_at ON stripe_transactions;
CREATE TRIGGER update_stripe_transactions_updated_at
    BEFORE UPDATE ON stripe_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_stripe_customers_updated_at ON stripe_customers;
CREATE TRIGGER update_stripe_customers_updated_at
    BEFORE UPDATE ON stripe_customers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();