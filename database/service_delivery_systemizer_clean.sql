-- Service Delivery Systemizer Tables (Clean New Names)
-- Uses completely new table names to avoid conflicts

-- Service Delivery Workflow Templates
CREATE TABLE service_workflow_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) DEFAULT 'Service Delivery',
  status VARCHAR(50) DEFAULT 'active',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Service Delivery Workflow Steps
CREATE TABLE service_workflow_steps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_template_id UUID NOT NULL REFERENCES service_workflow_templates(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  estimated_duration_hours DECIMAL(5,2) DEFAULT 1.0,
  dependencies JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workflow_template_id, step_number)
);

-- Service Delivery Template Assets
CREATE TABLE service_template_assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_template_id UUID NOT NULL REFERENCES service_workflow_templates(id) ON DELETE CASCADE,
  workflow_step_id UUID REFERENCES service_workflow_steps(id) ON DELETE CASCADE,
  asset_type VARCHAR(50) NOT NULL, -- 'email_template', 'document', 'checklist', 'task_list'
  asset_name VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  status VARCHAR(50) DEFAULT 'generated',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Service Delivery Export Configurations
CREATE TABLE service_export_configurations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_template_id UUID NOT NULL REFERENCES service_workflow_templates(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL, -- 'asana', 'clickup', 'trello', 'notion', etc.
  configuration JSONB NOT NULL DEFAULT '{}'::jsonb,
  export_format VARCHAR(50) DEFAULT 'json',
  status VARCHAR(50) DEFAULT 'configured',
  last_export_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workflow_template_id, platform)
);

-- Service Delivery Analytics
CREATE TABLE service_systemizer_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_template_id UUID NOT NULL REFERENCES service_workflow_templates(id) ON DELETE CASCADE,
  total_steps INTEGER DEFAULT 0,
  completion_rate DECIMAL(5,2) DEFAULT 0.0,
  avg_completion_time_hours DECIMAL(8,2) DEFAULT 0.0,
  usage_count INTEGER DEFAULT 0,
  performance_metrics JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workflow_template_id)
);

-- Create indexes
CREATE INDEX idx_service_workflow_templates_category ON service_workflow_templates(category);
CREATE INDEX idx_service_workflow_templates_status ON service_workflow_templates(status);
CREATE INDEX idx_service_workflow_templates_created_by ON service_workflow_templates(created_by);

CREATE INDEX idx_service_workflow_steps_template_id ON service_workflow_steps(workflow_template_id);
CREATE INDEX idx_service_workflow_steps_step_number ON service_workflow_steps(workflow_template_id, step_number);

CREATE INDEX idx_service_template_assets_template_id ON service_template_assets(workflow_template_id);
CREATE INDEX idx_service_template_assets_step_id ON service_template_assets(workflow_step_id);
CREATE INDEX idx_service_template_assets_type ON service_template_assets(asset_type);

CREATE INDEX idx_service_export_configs_template_id ON service_export_configurations(workflow_template_id);
CREATE INDEX idx_service_export_configs_platform ON service_export_configurations(platform);

CREATE INDEX idx_service_analytics_template_id ON service_systemizer_analytics(workflow_template_id);

-- Enable Row Level Security
ALTER TABLE service_workflow_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_workflow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_template_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_export_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_systemizer_analytics ENABLE ROW LEVEL SECURITY;

-- Create the update function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
CREATE TRIGGER update_service_workflow_templates_updated_at
  BEFORE UPDATE ON service_workflow_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_workflow_steps_updated_at
  BEFORE UPDATE ON service_workflow_steps
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_template_assets_updated_at
  BEFORE UPDATE ON service_template_assets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_export_configurations_updated_at
  BEFORE UPDATE ON service_export_configurations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_systemizer_analytics_updated_at
  BEFORE UPDATE ON service_systemizer_analytics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data
INSERT INTO service_workflow_templates (name, description, category, metadata) VALUES
('Sample Client Onboarding', 'Basic client onboarding workflow for testing', 'Service Delivery', '{"source": "sample", "version": "1.0"}');

-- Get the sample template ID and add steps
INSERT INTO service_workflow_steps (workflow_template_id, step_number, title, description)
SELECT
  id,
  1,
  'Send Welcome Email',
  'Send a personalized welcome email to the new client'
FROM service_workflow_templates
WHERE name = 'Sample Client Onboarding'
LIMIT 1;

INSERT INTO service_workflow_steps (workflow_template_id, step_number, title, description)
SELECT
  id,
  2,
  'Schedule Kickoff Call',
  'Schedule and conduct initial kickoff call'
FROM service_workflow_templates
WHERE name = 'Sample Client Onboarding'
LIMIT 1;