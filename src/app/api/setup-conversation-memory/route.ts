import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST() {
  try {
    console.log('[SETUP-CONVERSATION-MEMORY] Creating enhanced conversation memory tables...')
    
    // Enhanced conversation memory schema
    const createTablesSQL = `
      -- Enhanced conversation memory with context tags and metadata
      CREATE TABLE IF NOT EXISTS conversation_memory (
        id SERIAL PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        conversation_id TEXT NOT NULL, -- Group related exchanges
        message TEXT NOT NULL,
        response TEXT NOT NULL,
        context_tags JSONB DEFAULT '[]'::jsonb, -- ["strategic_planning", "bottleneck_analysis", "asset_creation"]
        interaction_type TEXT DEFAULT 'general', -- general, strategic_advice, asset_generation, troubleshooting
        business_stage TEXT, -- From business_context at time of conversation
        key_insights JSONB DEFAULT '{}'::jsonb, -- Extracted key insights for future reference
        referenced_decisions TEXT[], -- Previous decisions this conversation references
        generated_assets TEXT[], -- IDs of assets created in this conversation
        priority_score INTEGER DEFAULT 1, -- 1-5, how important this context is for future conversations
        expires_at TIMESTAMP WITH TIME ZONE, -- Optional expiration for temporary context
        metadata JSONB DEFAULT '{}'::jsonb, -- Sprint info, completed tasks, etc.
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Website intelligence storage
      CREATE TABLE IF NOT EXISTS website_intelligence (
        id SERIAL PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        website_url TEXT NOT NULL,
        scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        page_content TEXT,
        extracted_messaging JSONB DEFAULT '{}'::jsonb, -- Headlines, value props, etc.
        brand_voice_analysis JSONB DEFAULT '{}'::jsonb, -- Tone, style, personality
        competitive_positioning TEXT,
        target_audience_signals TEXT[],
        service_offerings TEXT[],
        pricing_signals JSONB DEFAULT '{}'::jsonb,
        social_proof_elements TEXT[],
        content_themes TEXT[],
        seo_keywords TEXT[],
        last_analyzed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        analysis_version TEXT DEFAULT '1.0',
        status TEXT DEFAULT 'active' -- active, outdated, failed
      );

      -- Enhanced asset generation tracking
      CREATE TABLE IF NOT EXISTS generated_assets (
        id SERIAL PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        conversation_memory_id INTEGER REFERENCES conversation_memory(id),
        asset_type TEXT NOT NULL, -- email_sequence, landing_page, sales_script, etc.
        asset_title TEXT NOT NULL,
        asset_content TEXT NOT NULL,
        personalization_factors JSONB DEFAULT '{}'::jsonb, -- What business context was used
        business_context_snapshot JSONB DEFAULT '{}'::jsonb, -- Snapshot of business_context at creation time
        website_context_snapshot JSONB DEFAULT '{}'::jsonb, -- Snapshot of website intelligence at creation time
        referenced_conversations TEXT[], -- Which conversation IDs informed this asset
        performance_metrics JSONB DEFAULT '{}'::jsonb, -- Future tracking of how well assets perform
        version INTEGER DEFAULT 1,
        status TEXT DEFAULT 'active', -- active, archived, superseded
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Conversation context tags for better organization
      CREATE TABLE IF NOT EXISTS conversation_tags (
        id SERIAL PRIMARY KEY,
        tag_name TEXT UNIQUE NOT NULL,
        tag_category TEXT NOT NULL, -- topic, priority, asset_type, business_area
        description TEXT,
        color_hex TEXT DEFAULT '#6B7280',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create indexes for performance
      CREATE INDEX IF NOT EXISTS idx_conversation_memory_user_id ON conversation_memory(user_id);
      CREATE INDEX IF NOT EXISTS idx_conversation_memory_conversation_id ON conversation_memory(conversation_id);
      CREATE INDEX IF NOT EXISTS idx_conversation_memory_context_tags ON conversation_memory USING gin(context_tags);
      CREATE INDEX IF NOT EXISTS idx_conversation_memory_interaction_type ON conversation_memory(interaction_type);
      CREATE INDEX IF NOT EXISTS idx_conversation_memory_priority ON conversation_memory(priority_score DESC);
      CREATE INDEX IF NOT EXISTS idx_conversation_memory_created_at ON conversation_memory(created_at DESC);

      CREATE INDEX IF NOT EXISTS idx_website_intelligence_user_id ON website_intelligence(user_id);
      CREATE INDEX IF NOT EXISTS idx_website_intelligence_url ON website_intelligence(website_url);
      CREATE INDEX IF NOT EXISTS idx_website_intelligence_status ON website_intelligence(status);

      CREATE INDEX IF NOT EXISTS idx_generated_assets_user_id ON generated_assets(user_id);
      CREATE INDEX IF NOT EXISTS idx_generated_assets_type ON generated_assets(asset_type);
      CREATE INDEX IF NOT EXISTS idx_generated_assets_conversation ON generated_assets(conversation_memory_id);
      CREATE INDEX IF NOT EXISTS idx_generated_assets_status ON generated_assets(status);

      -- Enable Row Level Security
      ALTER TABLE conversation_memory ENABLE ROW LEVEL SECURITY;
      ALTER TABLE website_intelligence ENABLE ROW LEVEL SECURITY;
      ALTER TABLE generated_assets ENABLE ROW LEVEL SECURITY;
      ALTER TABLE conversation_tags ENABLE ROW LEVEL SECURITY;

      -- RLS Policies
      CREATE POLICY "Users can manage their own conversation memory" ON conversation_memory
      FOR ALL USING (auth.uid() = user_id);

      CREATE POLICY "Users can manage their own website intelligence" ON website_intelligence
      FOR ALL USING (auth.uid() = user_id);

      CREATE POLICY "Users can manage their own generated assets" ON generated_assets
      FOR ALL USING (auth.uid() = user_id);

      CREATE POLICY "Users can view conversation tags" ON conversation_tags
      FOR SELECT USING (true);

      -- Insert default conversation tags
      INSERT INTO conversation_tags (tag_name, tag_category, description, color_hex) VALUES
      ('strategic_planning', 'topic', 'Strategic business planning discussions', '#3B82F6'),
      ('bottleneck_analysis', 'topic', 'Identifying and solving business bottlenecks', '#EF4444'),
      ('asset_creation', 'topic', 'Creating marketing or business assets', '#10B981'),
      ('sprint_guidance', 'topic', 'Sprint-related advice and task completion', '#8B5CF6'),
      ('business_model', 'topic', 'Business model optimization discussions', '#F59E0B'),
      ('high_priority', 'priority', 'High importance for future reference', '#DC2626'),
      ('medium_priority', 'priority', 'Medium importance for future reference', '#D97706'),
      ('low_priority', 'priority', 'Low importance for future reference', '#059669'),
      ('email_sequence', 'asset_type', 'Email marketing sequence creation', '#6366F1'),
      ('landing_page', 'asset_type', 'Landing page copy creation', '#EC4899'),
      ('sales_script', 'asset_type', 'Sales script or pitch creation', '#14B8A6'),
      ('content_strategy', 'asset_type', 'Content marketing strategy', '#F97316')
      ON CONFLICT (tag_name) DO NOTHING;

      -- Update triggers
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ language 'plpgsql';

      DROP TRIGGER IF EXISTS update_conversation_memory_updated_at ON conversation_memory;
      CREATE TRIGGER update_conversation_memory_updated_at
        BEFORE UPDATE ON conversation_memory
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();

      DROP TRIGGER IF EXISTS update_generated_assets_updated_at ON generated_assets;
      CREATE TRIGGER update_generated_assets_updated_at
        BEFORE UPDATE ON generated_assets
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `

    // Execute using raw SQL
    const { error } = await supabase.rpc('exec_sql', { sql: createTablesSQL })

    if (error) {
      console.error('[SETUP-CONVERSATION-MEMORY] Error creating tables:', error)
      return NextResponse.json({
        error: 'Failed to create conversation memory tables',
        message: 'You may need to run this SQL manually in your Supabase SQL editor',
        sql: createTablesSQL,
        details: error
      }, { status: 500 })
    }

    console.log('[SETUP-CONVERSATION-MEMORY] Enhanced conversation memory tables created successfully!')
    
    return NextResponse.json({
      success: true,
      message: 'Enhanced conversation memory system created successfully',
      details: {
        tables: ['conversation_memory', 'website_intelligence', 'generated_assets', 'conversation_tags'],
        indexes: ['Performance indexes created'],
        policies: ['Row Level Security enabled'],
        default_tags: '12 conversation tags added'
      }
    })

  } catch (error) {
    console.error('[SETUP-CONVERSATION-MEMORY] Error:', error)
    return NextResponse.json({
      error: 'Failed to setup enhanced conversation memory system',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}