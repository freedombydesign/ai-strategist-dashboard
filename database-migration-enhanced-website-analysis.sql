-- Migration: Add enhanced analysis columns to website_intelligence table
-- Run this in your Supabase SQL editor to fix the website analyzer issue

-- Check if website_intelligence table exists, if not create it
CREATE TABLE IF NOT EXISTS website_intelligence (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  website_url TEXT NOT NULL,
  page_content TEXT,
  extracted_messaging JSONB DEFAULT '{}',
  brand_voice_analysis JSONB DEFAULT '{}',
  competitive_positioning TEXT,
  target_audience_signals TEXT[] DEFAULT ARRAY[]::TEXT[],
  service_offerings TEXT[] DEFAULT ARRAY[]::TEXT[],
  pricing_signals JSONB DEFAULT '{}',
  social_proof_elements TEXT[] DEFAULT ARRAY[]::TEXT[],
  content_themes TEXT[] DEFAULT ARRAY[]::TEXT[],
  seo_keywords TEXT[] DEFAULT ARRAY[]::TEXT[],
  status TEXT DEFAULT 'active',
  last_analyzed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add enhanced analysis columns (these will store the detailed analysis)
ALTER TABLE website_intelligence 
ADD COLUMN IF NOT EXISTS page_structure_analysis JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS messaging_gaps JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS conversion_optimization JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS audience_insights JSONB DEFAULT '{}';

-- Create unique constraint on user_id and website_url to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_website_intelligence_user_url 
ON website_intelligence(user_id, website_url);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_website_intelligence_user_id 
ON website_intelligence(user_id);

CREATE INDEX IF NOT EXISTS idx_website_intelligence_status 
ON website_intelligence(status);

CREATE INDEX IF NOT EXISTS idx_website_intelligence_last_analyzed 
ON website_intelligence(last_analyzed);

-- Enable Row Level Security
ALTER TABLE website_intelligence ENABLE ROW LEVEL SECURITY;

-- Create policy for website intelligence
CREATE POLICY "Users can manage their own website intelligence" ON website_intelligence
FOR ALL USING (true);

-- Update trigger for updated_at column
CREATE OR REPLACE FUNCTION update_website_intelligence_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_website_intelligence_updated_at
    BEFORE UPDATE ON website_intelligence
    FOR EACH ROW
    EXECUTE FUNCTION update_website_intelligence_updated_at();

-- Grant necessary permissions
GRANT ALL ON website_intelligence TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON website_intelligence TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE website_intelligence_id_seq TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE website_intelligence IS 'Stores website analysis data for AI-powered insights';
COMMENT ON COLUMN website_intelligence.page_structure_analysis IS 'Analysis of page structure and missing elements for conversion optimization';
COMMENT ON COLUMN website_intelligence.messaging_gaps IS 'Identified gaps in problem statements, solutions, benefits, and urgency';
COMMENT ON COLUMN website_intelligence.conversion_optimization IS 'CTA strength, trust signals, and optimization recommendations';
COMMENT ON COLUMN website_intelligence.audience_insights IS 'Pain points, demographics, psychographics, and buying stage analysis';