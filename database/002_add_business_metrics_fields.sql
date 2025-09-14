-- Add additional business metrics fields to business_snapshots table

-- Add new columns for enhanced business tracking
ALTER TABLE business_snapshots 
ADD COLUMN IF NOT EXISTS active_clients INTEGER,
ADD COLUMN IF NOT EXISTS avg_project_value DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS avg_delivery_days INTEGER;

-- Create indexes for the new fields (optional, for performance)
CREATE INDEX IF NOT EXISTS idx_business_snapshots_active_clients ON business_snapshots(active_clients);
CREATE INDEX IF NOT EXISTS idx_business_snapshots_avg_project_value ON business_snapshots(avg_project_value);
CREATE INDEX IF NOT EXISTS idx_business_snapshots_avg_delivery_days ON business_snapshots(avg_delivery_days);

-- Add comments to document the new fields
COMMENT ON COLUMN business_snapshots.active_clients IS 'Number of active clients during this snapshot period';
COMMENT ON COLUMN business_snapshots.avg_project_value IS 'Average project value in dollars';
COMMENT ON COLUMN business_snapshots.avg_delivery_days IS 'Average delivery time in days';