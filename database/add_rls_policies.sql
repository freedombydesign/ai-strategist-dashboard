-- Add RLS policies for Service Delivery Systemizer tables
-- These policies allow anonymous access for testing

-- RLS Policy for service_workflow_templates
DROP POLICY IF EXISTS "Allow anonymous access" ON service_workflow_templates;
CREATE POLICY "Allow anonymous access" ON service_workflow_templates
  FOR ALL USING (true)
  WITH CHECK (true);

-- RLS Policy for service_workflow_steps
DROP POLICY IF EXISTS "Allow anonymous access" ON service_workflow_steps;
CREATE POLICY "Allow anonymous access" ON service_workflow_steps
  FOR ALL USING (true)
  WITH CHECK (true);

-- RLS Policy for service_template_assets
DROP POLICY IF EXISTS "Allow anonymous access" ON service_template_assets;
CREATE POLICY "Allow anonymous access" ON service_template_assets
  FOR ALL USING (true)
  WITH CHECK (true);

-- RLS Policy for service_export_configurations
DROP POLICY IF EXISTS "Allow anonymous access" ON service_export_configurations;
CREATE POLICY "Allow anonymous access" ON service_export_configurations
  FOR ALL USING (true)
  WITH CHECK (true);

-- RLS Policy for service_systemizer_analytics
DROP POLICY IF EXISTS "Allow anonymous access" ON service_systemizer_analytics;
CREATE POLICY "Allow anonymous access" ON service_systemizer_analytics
  FOR ALL USING (true)
  WITH CHECK (true);