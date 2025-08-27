# Database Setup Instructions

Your AI strategist application needs these database tables to work fully. The conversation will work without them, but you'll get enhanced strategic guidance with the tables created.

## Step 1: Access Your Supabase Database

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sign in to your account
3. Select your project: `kmpdmofcqdfqwcsvrwvv`
4. Go to the "SQL Editor" tab in the left sidebar

## Step 2: Run the SQL Commands

Copy and paste the following SQL commands into the SQL Editor and run them:

```sql
-- Strategic guidance content table (MISSING - REQUIRED)
CREATE TABLE IF NOT EXISTS strategic_guidance (
  id SERIAL PRIMARY KEY,
  guidance_type TEXT NOT NULL,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  context_tags JSONB DEFAULT '[]',
  related_sprint_key TEXT,
  related_module_key TEXT,
  priority INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Framework modules table (recommended)
CREATE TABLE IF NOT EXISTS framework_modules (
  id SERIAL PRIMARY KEY,
  module_key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  full_title TEXT NOT NULL,
  description TEXT NOT NULL,
  focus_area TEXT NOT NULL,
  assessment_criteria JSONB DEFAULT '[]',
  improvement_strategies JSONB DEFAULT '[]',
  related_sprint_key TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_strategic_guidance_category ON strategic_guidance(category);
CREATE INDEX IF NOT EXISTS idx_strategic_guidance_priority ON strategic_guidance(priority);
CREATE INDEX IF NOT EXISTS idx_framework_modules_module_key ON framework_modules(module_key);

-- Insert sample strategic guidance data
INSERT INTO strategic_guidance (guidance_type, category, title, content, context_tags, related_sprint_key, priority) VALUES
('challenge', 'positioning', 'Underpricing and Commoditization', 'When businesses compete primarily on price, they erode profit margins and position themselves as commodities. This creates a race to the bottom that makes sustainable growth impossible.', '["pricing", "positioning", "competition", "margins"]'::jsonb, 'S1', 1),
('solution', 'positioning', 'Premium Positioning Strategy', 'Develop a unique value proposition that justifies premium pricing. Focus on outcomes delivered rather than time spent or features provided. Position as the expert solution for specific client types.', '["premium", "value_proposition", "expert_positioning"]'::jsonb, 'S1', 1),
('challenge', 'sales', 'Owner-Dependent Sales Process', 'Many businesses rely entirely on the owner for sales conversations, creating a bottleneck that prevents scaling and limits growth potential.', '["owner_dependency", "sales_bottleneck", "scaling"]'::jsonb, 'S3', 1),
('solution', 'sales', 'Systematized Sales Framework', 'Create repeatable sales processes with documented scripts, objection handling, and closing techniques that team members can execute consistently.', '["sales_systems", "team_training", "process_documentation"]'::jsonb, 'S3', 1),
('challenge', 'delivery', 'Delivery Bottlenecks', 'When business owners are involved in every client delivery, it creates capacity constraints and prevents the business from scaling beyond their personal involvement.', '["delivery_bottleneck", "capacity_constraints", "owner_involvement"]'::jsonb, 'S4', 1),
('solution', 'delivery', 'Scalable Delivery Systems', 'Document all delivery processes, train team members, and implement quality controls that maintain standards without requiring owner oversight for every project.', '["delivery_systems", "process_documentation", "quality_control"]'::jsonb, 'S4', 1);
```

## Step 3: Verify Setup

After running the SQL, test your database connection by visiting:
`http://localhost:3008/api/test-db`

You should see:
- `basicConnection`: true
- `sprintsTable.exists`: true  
- `guidanceTable.exists`: true ✅ (this should now be true)

## Step 4: Initialize Framework Data

Once the tables are created, call the initialization API:
`http://localhost:3008/api/init-database`

This will populate the tables with strategic framework data.

---

## What This Enables

With these tables created, your AI strategist will provide:
- Context-aware strategic guidance based on your specific challenges
- Framework-based insights tied to your Freedom Score results  
- Sophisticated business recommendations using the Freedom by Design methodology
- Personalized advice that adapts to your business situation

## Troubleshooting

If you get permission errors, make sure you're using the SQL Editor in Supabase (not trying to run SQL through the API). The Supabase SQL Editor has the necessary permissions to create tables.

The conversation will work without these tables, but you'll get much better strategic guidance with them in place!