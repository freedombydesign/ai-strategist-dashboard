-- Service Delivery Systemizer Tables (Safe Migration)
-- Handles existing tables and adds missing columns

-- First, let's create the tables with a safe approach
-- Only create if they don't exist, and handle missing columns

-- Workflow Templates Table (create if not exists)
CREATE TABLE IF NOT EXISTS workflow_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns to workflow_templates if they don't exist
DO $$
BEGIN
  -- Add category column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='workflow_templates' AND column_name='category') THEN
    ALTER TABLE workflow_templates ADD COLUMN category VARCHAR(100) DEFAULT 'Service Delivery';
  END IF;

  -- Add status column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='workflow_templates' AND column_name='status') THEN
    ALTER TABLE workflow_templates ADD COLUMN status VARCHAR(50) DEFAULT 'active';
  END IF;

  -- Add metadata column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='workflow_templates' AND column_name='metadata') THEN
    ALTER TABLE workflow_templates ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
  END IF;

  -- Add created_by column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='workflow_templates' AND column_name='created_by') THEN
    ALTER TABLE workflow_templates ADD COLUMN created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Workflow Steps Table
CREATE TABLE IF NOT EXISTS workflow_steps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_template_id UUID NOT NULL REFERENCES workflow_templates(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  estimated_duration_hours DECIMAL(5,2) DEFAULT 1.0,
  dependencies JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Template Assets Table (for generated emails, documents, etc.)
CREATE TABLE IF NOT EXISTS template_assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_template_id UUID NOT NULL REFERENCES workflow_templates(id) ON DELETE CASCADE,
  workflow_step_id UUID REFERENCES workflow_steps(id) ON DELETE CASCADE,
  asset_type VARCHAR(50) NOT NULL,
  asset_name VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  status VARCHAR(50) DEFAULT 'generated',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Export Configurations Table (for platform integrations)
CREATE TABLE IF NOT EXISTS export_configurations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_template_id UUID NOT NULL REFERENCES workflow_templates(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL,
  configuration JSONB NOT NULL DEFAULT '{}'::jsonb,
  export_format VARCHAR(50) DEFAULT 'json',
  status VARCHAR(50) DEFAULT 'configured',
  last_export_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Systemizer Analytics Table
CREATE TABLE IF NOT EXISTS systemizer_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_template_id UUID NOT NULL REFERENCES workflow_templates(id) ON DELETE CASCADE,
  total_steps INTEGER DEFAULT 0,
  completion_rate DECIMAL(5,2) DEFAULT 0.0,
  avg_completion_time_hours DECIMAL(8,2) DEFAULT 0.0,
  usage_count INTEGER DEFAULT 0,
  performance_metrics JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create unique constraints (only if they don't exist)
DO $$
BEGIN
  -- Add unique constraint for workflow_templates name and created_by
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'workflow_templates_name_created_by_key') THEN
    ALTER TABLE workflow_templates ADD CONSTRAINT workflow_templates_name_created_by_key UNIQUE(name, created_by);
  END IF;

  -- Add unique constraint for workflow_steps
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'workflow_steps_workflow_template_id_step_number_key') THEN
    ALTER TABLE workflow_steps ADD CONSTRAINT workflow_steps_workflow_template_id_step_number_key UNIQUE(workflow_template_id, step_number);
  END IF;

  -- Add unique constraint for export_configurations
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'export_configurations_workflow_template_id_platform_key') THEN
    ALTER TABLE export_configurations ADD CONSTRAINT export_configurations_workflow_template_id_platform_key UNIQUE(workflow_template_id, platform);
  END IF;

  -- Add unique constraint for systemizer_analytics
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'systemizer_analytics_workflow_template_id_key') THEN
    ALTER TABLE systemizer_analytics ADD CONSTRAINT systemizer_analytics_workflow_template_id_key UNIQUE(workflow_template_id);
  END IF;
END $$;

-- Create indexes for better performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_workflow_templates_category ON workflow_templates(category);
CREATE INDEX IF NOT EXISTS idx_workflow_templates_status ON workflow_templates(status);
CREATE INDEX IF NOT EXISTS idx_workflow_templates_created_by ON workflow_templates(created_by);

CREATE INDEX IF NOT EXISTS idx_workflow_steps_template_id ON workflow_steps(workflow_template_id);
CREATE INDEX IF NOT EXISTS idx_workflow_steps_step_number ON workflow_steps(workflow_template_id, step_number);

CREATE INDEX IF NOT EXISTS idx_template_assets_template_id ON template_assets(workflow_template_id);
CREATE INDEX IF NOT EXISTS idx_template_assets_step_id ON template_assets(workflow_step_id);
CREATE INDEX IF NOT EXISTS idx_template_assets_type ON template_assets(asset_type);

CREATE INDEX IF NOT EXISTS idx_export_configs_template_id ON export_configurations(workflow_template_id);
CREATE INDEX IF NOT EXISTS idx_export_configs_platform ON export_configurations(platform);

CREATE INDEX IF NOT EXISTS idx_systemizer_analytics_template_id ON systemizer_analytics(workflow_template_id);

-- Enable Row Level Security (RLS)
ALTER TABLE workflow_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE export_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE systemizer_analytics ENABLE ROW LEVEL SECURITY;

-- Create or replace the update function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at (drop existing ones first)
DROP TRIGGER IF EXISTS update_workflow_templates_updated_at ON workflow_templates;
CREATE TRIGGER update_workflow_templates_updated_at
  BEFORE UPDATE ON workflow_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_workflow_steps_updated_at ON workflow_steps;
CREATE TRIGGER update_workflow_steps_updated_at
  BEFORE UPDATE ON workflow_steps
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_template_assets_updated_at ON template_assets;
CREATE TRIGGER update_template_assets_updated_at
  BEFORE UPDATE ON template_assets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_export_configurations_updated_at ON export_configurations;
CREATE TRIGGER update_export_configurations_updated_at
  BEFORE UPDATE ON export_configurations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_systemizer_analytics_updated_at ON systemizer_analytics;
CREATE TRIGGER update_systemizer_analytics_updated_at
  BEFORE UPDATE ON systemizer_analytics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data (safe insert)
INSERT INTO workflow_templates (name, description, category, metadata)
VALUES ('Sample Client Onboarding', 'Basic client onboarding workflow for testing', 'Service Delivery', '{"source": "sample", "version": "1.0"}')
ON CONFLICT (name, created_by) DO NOTHING;