-- Service Delivery Systemizer Tables (Ultra Safe Migration)
-- This version handles ALL existing table structures safely

-- Handle workflow_templates table
DO $$
BEGIN
  -- Create workflow_templates if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='workflow_templates') THEN
    CREATE TABLE workflow_templates (
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
  ELSE
    -- Add missing columns to existing workflow_templates table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='workflow_templates' AND column_name='name') THEN
      ALTER TABLE workflow_templates ADD COLUMN name VARCHAR(255);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='workflow_templates' AND column_name='description') THEN
      ALTER TABLE workflow_templates ADD COLUMN description TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='workflow_templates' AND column_name='category') THEN
      ALTER TABLE workflow_templates ADD COLUMN category VARCHAR(100) DEFAULT 'Service Delivery';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='workflow_templates' AND column_name='status') THEN
      ALTER TABLE workflow_templates ADD COLUMN status VARCHAR(50) DEFAULT 'active';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='workflow_templates' AND column_name='metadata') THEN
      ALTER TABLE workflow_templates ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='workflow_templates' AND column_name='created_by') THEN
      ALTER TABLE workflow_templates ADD COLUMN created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='workflow_templates' AND column_name='created_at') THEN
      ALTER TABLE workflow_templates ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='workflow_templates' AND column_name='updated_at') THEN
      ALTER TABLE workflow_templates ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
  END IF;
END $$;

-- Handle workflow_steps table
DO $$
BEGIN
  -- Create workflow_steps if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='workflow_steps') THEN
    CREATE TABLE workflow_steps (
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
  ELSE
    -- Add missing columns to existing workflow_steps table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='workflow_steps' AND column_name='workflow_template_id') THEN
      ALTER TABLE workflow_steps ADD COLUMN workflow_template_id UUID REFERENCES workflow_templates(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='workflow_steps' AND column_name='step_number') THEN
      ALTER TABLE workflow_steps ADD COLUMN step_number INTEGER;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='workflow_steps' AND column_name='title') THEN
      ALTER TABLE workflow_steps ADD COLUMN title VARCHAR(255);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='workflow_steps' AND column_name='description') THEN
      ALTER TABLE workflow_steps ADD COLUMN description TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='workflow_steps' AND column_name='estimated_duration_hours') THEN
      ALTER TABLE workflow_steps ADD COLUMN estimated_duration_hours DECIMAL(5,2) DEFAULT 1.0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='workflow_steps' AND column_name='dependencies') THEN
      ALTER TABLE workflow_steps ADD COLUMN dependencies JSONB DEFAULT '[]'::jsonb;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='workflow_steps' AND column_name='metadata') THEN
      ALTER TABLE workflow_steps ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='workflow_steps' AND column_name='created_at') THEN
      ALTER TABLE workflow_steps ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='workflow_steps' AND column_name='updated_at') THEN
      ALTER TABLE workflow_steps ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
  END IF;
END $$;

-- Template Assets Table
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

-- Export Configurations Table
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

-- Create indexes (these will fail silently if they already exist)
CREATE INDEX IF NOT EXISTS idx_workflow_templates_category ON workflow_templates(category);
CREATE INDEX IF NOT EXISTS idx_workflow_templates_status ON workflow_templates(status);
CREATE INDEX IF NOT EXISTS idx_workflow_templates_created_by ON workflow_templates(created_by);

-- Only create indexes if the columns exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='workflow_steps' AND column_name='workflow_template_id') THEN
    CREATE INDEX IF NOT EXISTS idx_workflow_steps_template_id ON workflow_steps(workflow_template_id);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='workflow_steps' AND column_name='workflow_template_id') AND
     EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='workflow_steps' AND column_name='step_number') THEN
    CREATE INDEX IF NOT EXISTS idx_workflow_steps_step_number ON workflow_steps(workflow_template_id, step_number);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_template_assets_template_id ON template_assets(workflow_template_id);
CREATE INDEX IF NOT EXISTS idx_template_assets_step_id ON template_assets(workflow_step_id);
CREATE INDEX IF NOT EXISTS idx_template_assets_type ON template_assets(asset_type);

CREATE INDEX IF NOT EXISTS idx_export_configs_template_id ON export_configurations(workflow_template_id);
CREATE INDEX IF NOT EXISTS idx_export_configs_platform ON export_configurations(platform);

CREATE INDEX IF NOT EXISTS idx_systemizer_analytics_template_id ON systemizer_analytics(workflow_template_id);

-- Enable Row Level Security
ALTER TABLE workflow_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE export_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE systemizer_analytics ENABLE ROW LEVEL SECURITY;

-- Create the update function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers (drop first to avoid conflicts)
DROP TRIGGER IF EXISTS update_workflow_templates_updated_at ON workflow_templates;
DROP TRIGGER IF EXISTS update_workflow_steps_updated_at ON workflow_steps;
DROP TRIGGER IF EXISTS update_template_assets_updated_at ON template_assets;
DROP TRIGGER IF EXISTS update_export_configurations_updated_at ON export_configurations;
DROP TRIGGER IF EXISTS update_systemizer_analytics_updated_at ON systemizer_analytics;

-- Only create triggers if the updated_at columns exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='workflow_templates' AND column_name='updated_at') THEN
    CREATE TRIGGER update_workflow_templates_updated_at
      BEFORE UPDATE ON workflow_templates
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='workflow_steps' AND column_name='updated_at') THEN
    CREATE TRIGGER update_workflow_steps_updated_at
      BEFORE UPDATE ON workflow_steps
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

CREATE TRIGGER update_template_assets_updated_at
  BEFORE UPDATE ON template_assets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_export_configurations_updated_at
  BEFORE UPDATE ON export_configurations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_systemizer_analytics_updated_at
  BEFORE UPDATE ON systemizer_analytics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();