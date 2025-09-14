-- Platform Connections Table for OAuth Integration
-- This table stores OAuth tokens and connection data for external platforms

CREATE TABLE IF NOT EXISTS platform_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID, -- Will be populated when user system is implemented
  platform VARCHAR(50) NOT NULL CHECK (platform IN ('asana', 'clickup', 'monday', 'trello', 'notion')),

  -- OAuth Token Data
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_type VARCHAR(50) DEFAULT 'Bearer',
  expires_at TIMESTAMP WITH TIME ZONE,
  scope TEXT,

  -- Platform-specific metadata
  platform_user_id TEXT,
  platform_username TEXT,
  platform_workspace_id TEXT,
  platform_workspace_name TEXT,

  -- Connection metadata
  connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,

  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_platform_connections_user_platform ON platform_connections(user_id, platform);
CREATE INDEX IF NOT EXISTS idx_platform_connections_platform ON platform_connections(platform);
CREATE INDEX IF NOT EXISTS idx_platform_connections_active ON platform_connections(is_active);

-- RLS Policies (for when user authentication is implemented)
ALTER TABLE platform_connections ENABLE ROW LEVEL SECURITY;

-- Drop policy if it exists, then create it (compatible with older PostgreSQL versions)
DROP POLICY IF EXISTS "Allow all operations on platform_connections" ON platform_connections;
CREATE POLICY "Allow all operations on platform_connections" ON platform_connections
  FOR ALL USING (true);

-- Update trigger function
CREATE OR REPLACE FUNCTION update_platform_connections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists, then create it
DROP TRIGGER IF EXISTS trigger_update_platform_connections_updated_at ON platform_connections;
CREATE TRIGGER trigger_update_platform_connections_updated_at
  BEFORE UPDATE ON platform_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_platform_connections_updated_at();

-- Comments
COMMENT ON TABLE platform_connections IS 'Stores OAuth tokens and connection data for external platforms';
COMMENT ON COLUMN platform_connections.platform IS 'The external platform name (asana, clickup, monday, trello, notion)';
COMMENT ON COLUMN platform_connections.access_token IS 'OAuth access token for API calls';
COMMENT ON COLUMN platform_connections.refresh_token IS 'OAuth refresh token for token renewal';
COMMENT ON COLUMN platform_connections.expires_at IS 'When the access token expires (null for non-expiring tokens)';
COMMENT ON COLUMN platform_connections.scope IS 'OAuth scopes granted';
COMMENT ON COLUMN platform_connections.platform_user_id IS 'User ID on the external platform';
COMMENT ON COLUMN platform_connections.platform_workspace_id IS 'Workspace/team ID on the external platform';
COMMENT ON COLUMN platform_connections.last_used_at IS 'Last time this connection was used for an export';