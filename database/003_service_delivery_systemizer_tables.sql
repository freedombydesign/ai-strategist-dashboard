-- Service Delivery Systemizer Tables
-- Creates the core tables needed for the Service Delivery Systemizer feature

-- Workflow Templates Table
CREATE TABLE IF NOT EXISTS workflow_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) DEFAULT 'Service Delivery',
  status VARCHAR(50) DEFAULT 'active',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE(name, created_by)
);

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
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workflow_template_id, step_number)
);

-- Template Assets Table (for generated emails, documents, etc.)
CREATE TABLE IF NOT EXISTS template_assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_template_id UUID NOT NULL REFERENCES workflow_templates(id) ON DELETE CASCADE,
  workflow_step_id UUID REFERENCES workflow_steps(id) ON DELETE CASCADE,
  asset_type VARCHAR(50) NOT NULL, -- 'email_template', 'document', 'checklist', 'task_list'
  asset_name VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  status VARCHAR(50) DEFAULT 'generated', -- 'generated', 'reviewed', 'approved', 'archived'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Export Configurations Table (for platform integrations)
CREATE TABLE IF NOT EXISTS export_configurations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_template_id UUID NOT NULL REFERENCES workflow_templates(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL, -- 'asana', 'clickup', 'trello', 'notion', etc.
  configuration JSONB NOT NULL DEFAULT '{}'::jsonb,
  export_format VARCHAR(50) DEFAULT 'json', -- 'json', 'csv', 'xml', 'api'
  status VARCHAR(50) DEFAULT 'configured', -- 'configured', 'tested', 'active', 'inactive'
  last_export_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workflow_template_id, platform)
);

-- Systemizer Analytics Table
CREATE TABLE IF NOT EXISTS systemizer_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_template_id UUID NOT NULL REFERENCES workflow_templates(id) ON DELETE CASCADE,
  total_steps INTEGER DEFAULT 0,
  completion_rate DECIMAL(5,2) DEFAULT 0.0, -- Percentage
  avg_completion_time_hours DECIMAL(8,2) DEFAULT 0.0,
  usage_count INTEGER DEFAULT 0,
  performance_metrics JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workflow_template_id)
);

-- Create indexes for better performance
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

-- Row Level Security (RLS) policies
ALTER TABLE workflow_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE export_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE systemizer_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for workflow_templates
CREATE POLICY IF NOT EXISTS "Users can access their own workflow_templates" ON workflow_templates
  FOR ALL USING (created_by = auth.uid() OR created_by IS NULL);

-- RLS Policies for workflow_steps
CREATE POLICY IF NOT EXISTS "Users can access workflow_steps of their templates" ON workflow_steps
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM workflow_templates
      WHERE workflow_templates.id = workflow_steps.workflow_template_id
      AND (workflow_templates.created_by = auth.uid() OR workflow_templates.created_by IS NULL)
    )
  );

-- RLS Policies for template_assets
CREATE POLICY IF NOT EXISTS "Users can access template_assets of their templates" ON template_assets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM workflow_templates
      WHERE workflow_templates.id = template_assets.workflow_template_id
      AND (workflow_templates.created_by = auth.uid() OR workflow_templates.created_by IS NULL)
    )
  );

-- RLS Policies for export_configurations
CREATE POLICY IF NOT EXISTS "Users can access export_configurations of their templates" ON export_configurations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM workflow_templates
      WHERE workflow_templates.id = export_configurations.workflow_template_id
      AND (workflow_templates.created_by = auth.uid() OR workflow_templates.created_by IS NULL)
    )
  );

-- RLS Policies for systemizer_analytics
CREATE POLICY IF NOT EXISTS "Users can access systemizer_analytics of their templates" ON systemizer_analytics
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM workflow_templates
      WHERE workflow_templates.id = systemizer_analytics.workflow_template_id
      AND (workflow_templates.created_by = auth.uid() OR workflow_templates.created_by IS NULL)
    )
  );

-- Update functions for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
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

-- Insert some sample data for testing (optional)
INSERT INTO workflow_templates (name, description, category, metadata) VALUES
('Sample Client Onboarding', 'Basic client onboarding workflow for testing', 'Service Delivery', '{"source": "sample", "version": "1.0"}')
ON CONFLICT (name, created_by) DO NOTHING;

-- Get the ID of the sample template (if it was inserted)
DO $$
DECLARE
    sample_template_id UUID;
BEGIN
    SELECT id INTO sample_template_id
    FROM workflow_templates
    WHERE name = 'Sample Client Onboarding'
    AND created_by IS NULL
    LIMIT 1;

    IF sample_template_id IS NOT NULL THEN
        -- Insert sample workflow steps
        INSERT INTO workflow_steps (workflow_template_id, step_number, title, description) VALUES
        (sample_template_id, 1, 'Send Welcome Email', 'Send a personalized welcome email to the new client'),
        (sample_template_id, 2, 'Schedule Kickoff Call', 'Schedule and conduct initial kickoff call'),
        (sample_template_id, 3, 'Collect Requirements', 'Gather detailed project requirements and specifications'),
        (sample_template_id, 4, 'Create Project Plan', 'Develop comprehensive project timeline and milestones')
        ON CONFLICT (workflow_template_id, step_number) DO NOTHING;

        -- Insert sample analytics
        INSERT INTO systemizer_analytics (workflow_template_id, total_steps, completion_rate, usage_count) VALUES
        (sample_template_id, 4, 0.0, 0)
        ON CONFLICT (workflow_template_id) DO NOTHING;
    END IF;
END $$;