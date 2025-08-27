-- User profiles table for storing user information and preferences
CREATE TABLE IF NOT EXISTS user_profiles (
  id SERIAL PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  name TEXT,
  email TEXT,
  business_type TEXT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policy for user_profiles
CREATE POLICY "Users can manage their own profile" ON user_profiles
FOR ALL USING (true);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

-- AI conversations table (should already exist, but let's ensure it's correct)
CREATE TABLE IF NOT EXISTS ai_conversations (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  message TEXT NOT NULL,
  response TEXT NOT NULL,
  freedom_score JSONB,
  has_file_context BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security for conversations
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;

-- Create policy for ai_conversations
CREATE POLICY "Users can manage their own conversations" ON ai_conversations
FOR ALL USING (true);

-- Index for faster conversation history retrieval
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_created_at ON ai_conversations(created_at);

-- Update function for user_profiles
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_user_profiles_updated_at 
  BEFORE UPDATE ON user_profiles 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Strategic Framework Tables for AI Enhancement

-- Freedom by Design Sprints table
CREATE TABLE IF NOT EXISTS sprints (
  id SERIAL PRIMARY KEY,
  sprint_key TEXT UNIQUE NOT NULL, -- S1, S2, S3, S4, S5
  name TEXT NOT NULL,
  full_title TEXT NOT NULL,
  description TEXT NOT NULL,
  methodology TEXT NOT NULL,
  week_number INTEGER,
  objectives JSONB DEFAULT '[]',
  key_strategies JSONB DEFAULT '[]',
  common_challenges JSONB DEFAULT '[]',
  success_indicators JSONB DEFAULT '[]',
  tools_resources JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Business Framework Modules table
CREATE TABLE IF NOT EXISTS framework_modules (
  id SERIAL PRIMARY KEY,
  module_key TEXT UNIQUE NOT NULL, -- M1, M2, M3, M4, M5, M6
  name TEXT NOT NULL,
  full_title TEXT NOT NULL,
  description TEXT NOT NULL,
  focus_area TEXT NOT NULL,
  assessment_criteria JSONB DEFAULT '[]',
  improvement_strategies JSONB DEFAULT '[]',
  related_sprint_key TEXT REFERENCES sprints(sprint_key),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Strategic guidance content table
CREATE TABLE IF NOT EXISTS strategic_guidance (
  id SERIAL PRIMARY KEY,
  guidance_type TEXT NOT NULL, -- 'challenge', 'solution', 'methodology', 'best_practice'
  category TEXT NOT NULL, -- 'positioning', 'sales', 'delivery', 'systems', etc.
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  context_tags JSONB DEFAULT '[]', -- For AI matching: ['overwhelm', 'scaling', 'delegation']
  related_sprint_key TEXT REFERENCES sprints(sprint_key),
  related_module_key TEXT REFERENCES framework_modules(module_key),
  priority INTEGER DEFAULT 1, -- 1=high, 2=medium, 3=low
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert core sprint data
INSERT INTO sprints (sprint_key, name, full_title, description, methodology, week_number, objectives, key_strategies, common_challenges, success_indicators) VALUES
('S1', 'zone', 'Lock In Your Most Profitable Service Zone', 'Establish clear positioning and optimal pricing to maximize profitability and market demand', 'Position for Profit methodology focusing on service clarity and premium positioning', 1, 
 '["Define your most profitable service offering", "Establish premium pricing strategy", "Create clear market positioning", "Develop compelling value proposition"]'::jsonb,
 '["Service audit and profitability analysis", "Competitive positioning research", "Premium pricing framework", "Value proposition development"]'::jsonb,
 '["Underpricing services", "Unclear positioning", "Commoditization pressure", "Difficulty articulating value"]'::jsonb,
 '["Higher profit margins", "Clearer client inquiries", "Reduced price objections", "Stronger market position"]'::jsonb),

('S2', 'path', 'Create a Smooth Path from First Contact to Commitment', 'Engineer a streamlined buyer journey that converts prospects efficiently without manual intervention', 'Engineer the Buyer Journey methodology for conversion optimization', 2,
 '["Map current buyer journey", "Identify conversion bottlenecks", "Automate key touchpoints", "Optimize for commitment"]'::jsonb,
 '["Journey mapping and gap analysis", "Conversion funnel optimization", "Automated nurturing sequences", "Decision-making facilitation"]'::jsonb,
 '["Low conversion rates", "Manual follow-up processes", "Unclear next steps for prospects", "Long sales cycles"]'::jsonb,
 '["Higher conversion rates", "Automated prospect nurturing", "Shorter sales cycles", "Predictable pipeline"]'::jsonb),

('S3', 'sell', 'Sell Without Being a Bottleneck', 'Build scalable sales systems that convert prospects without requiring your direct involvement', 'Sales System That Converts methodology for delegation-ready sales', 3,
 '["Systematize sales conversations", "Create sales assets and tools", "Train team on sales process", "Implement CRM and tracking"]'::jsonb,
 '["Sales script and conversation frameworks", "Proposal and closing systems", "Team training and certification", "Sales performance tracking"]'::jsonb,
 '["Owner dependency in sales", "Inconsistent sales results", "Team cant close deals", "Time trapped in sales activities"]'::jsonb,
 '["Sales team independence", "Consistent conversion rates", "Scalable revenue growth", "Owner time freedom"]'::jsonb),

('S4', 'delivery', 'Streamline Client Delivery without Losing Your Personal Touch', 'Create efficient delivery systems that maintain quality while reducing your hands-on involvement', 'Deliver Without Doing It All methodology for scalable fulfillment', 4,
 '["Document delivery processes", "Train delivery team", "Implement quality controls", "Maintain client satisfaction"]'::jsonb,
 '["Process documentation and SOPs", "Team training and delegation", "Quality assurance systems", "Client communication protocols"]'::jsonb,
 '["Delivery bottlenecks", "Quality control issues", "Client dissatisfaction", "Owner involvement in every project"]'::jsonb,
 '["Consistent delivery quality", "Team independence", "Client satisfaction maintenance", "Scalable operations"]'::jsonb),

('S5', 'improve', 'Continuously Improve without Burning It Down', 'Establish systematic improvement processes that optimize without disrupting successful operations', 'Refine, Release, Repeat methodology for sustainable growth', 5,
 '["Create improvement frameworks", "Establish review cycles", "Implement feedback systems", "Optimize continuously"]'::jsonb,
 '["Regular system audits", "Performance metrics tracking", "Feedback collection and analysis", "Iterative improvement processes"]'::jsonb,
 '["Stagnant systems", "Lack of optimization", "No improvement processes", "Fear of changing working systems"]'::jsonb,
 '["Continuous optimization", "Data-driven improvements", "Systematic growth", "Sustainable scaling"]'::jsonb);

-- Insert framework modules data
INSERT INTO framework_modules (module_key, name, full_title, description, focus_area, assessment_criteria, improvement_strategies, related_sprint_key) VALUES
('M1', 'Position for Profit', 'Position for Profit', 'Establish clear service positioning and optimal pricing for maximum profitability', 'positioning_pricing',
 '["Service clarity and focus", "Pricing strategy optimization", "Market positioning strength", "Value proposition clarity"]'::jsonb,
 '["Service audit and refinement", "Competitive analysis", "Premium positioning development", "Value-based pricing implementation"]'::jsonb, 'S1'),

('M2', 'Engineer Buyer Journey', 'Engineer the Buyer Journey', 'Create systematic buyer experience from awareness to commitment', 'buyer_journey',
 '["Conversion funnel efficiency", "Touchpoint optimization", "Decision facilitation", "Journey automation"]'::jsonb,
 '["Journey mapping", "Conversion optimization", "Automated sequences", "Touchpoint enhancement"]'::jsonb, 'S2'),

('M3', 'Systems Support', 'Set Up Systems That Support You', 'Implement foundational systems for operational efficiency', 'operational_systems',
 '["Process documentation", "System integration", "Automation level", "Operational efficiency"]'::jsonb,
 '["Process mapping", "System implementation", "Automation development", "Integration optimization"]'::jsonb, 'S4'),

('M4', 'Sales System', 'Build a Sales System That Converts Without You', 'Create scalable sales processes independent of owner involvement', 'sales_systems',
 '["Sales process systemization", "Team sales capability", "Conversion consistency", "Owner independence"]'::jsonb,
 '["Sales systemization", "Team training", "Process documentation", "Performance tracking"]'::jsonb, 'S3'),

('M5', 'Delivery Systems', 'Deliver Without Doing It All', 'Establish delivery systems that maintain quality without owner involvement', 'delivery_systems',
 '["Delivery process efficiency", "Quality consistency", "Team capability", "Client satisfaction"]'::jsonb,
 '["Process documentation", "Team development", "Quality systems", "Delegation frameworks"]'::jsonb, 'S4'),

('M6', 'Continuous Improvement', 'Refine, Release, Repeat', 'Implement ongoing optimization and improvement processes', 'improvement_systems',
 '["Review cycle effectiveness", "Improvement implementation", "System optimization", "Growth sustainability"]'::jsonb,
 '["Review framework establishment", "Metrics implementation", "Feedback systems", "Optimization processes"]'::jsonb, 'S5');

-- Insert strategic guidance content
INSERT INTO strategic_guidance (guidance_type, category, title, content, context_tags, related_sprint_key, related_module_key, priority) VALUES
('challenge', 'positioning', 'Underpricing and Commoditization', 'When businesses compete primarily on price, they erode profit margins and position themselves as commodities. This creates a race to the bottom that makes sustainable growth impossible.', '["pricing", "positioning", "competition", "margins"]'::jsonb, 'S1', 'M1', 1),

('solution', 'positioning', 'Premium Positioning Strategy', 'Develop a unique value proposition that justifies premium pricing. Focus on outcomes delivered rather than time spent or features provided. Position as the expert solution for specific client types.', '["premium", "value_proposition", "expert_positioning"]'::jsonb, 'S1', 'M1', 1),

('challenge', 'sales', 'Owner-Dependent Sales Process', 'Many businesses rely entirely on the owner for sales conversations, creating a bottleneck that prevents scaling and limits growth potential.', '["owner_dependency", "sales_bottleneck", "scaling"]'::jsonb, 'S3', 'M4', 1),

('solution', 'sales', 'Systematized Sales Framework', 'Create repeatable sales processes with documented scripts, objection handling, and closing techniques that team members can execute consistently.', '["sales_systems", "team_training", "process_documentation"]'::jsonb, 'S3', 'M4', 1),

('methodology', 'buyer_journey', 'Conversion Funnel Optimization', 'Map every touchpoint in your buyer journey and identify conversion leaks. Optimize each stage with clear next steps and value delivery at every interaction.', '["conversion", "funnel", "optimization", "buyer_journey"]'::jsonb, 'S2', 'M2', 1),

('challenge', 'delivery', 'Delivery Bottlenecks', 'When business owners are involved in every client delivery, it creates capacity constraints and prevents the business from scaling beyond their personal involvement.', '["delivery_bottleneck", "capacity_constraints", "owner_involvement"]'::jsonb, 'S4', 'M5', 1),

('solution', 'delivery', 'Scalable Delivery Systems', 'Document all delivery processes, train team members, and implement quality controls that maintain standards without requiring owner oversight for every project.', '["delivery_systems", "process_documentation", "quality_control"]'::jsonb, 'S4', 'M5', 1),

('best_practice', 'systems', 'Systematic Improvement Framework', 'Implement regular review cycles to assess system performance, gather feedback, and make incremental improvements without disrupting successful operations.', '["continuous_improvement", "system_optimization", "review_cycles"]'::jsonb, 'S5', 'M6', 2);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_sprints_sprint_key ON sprints(sprint_key);
CREATE INDEX IF NOT EXISTS idx_framework_modules_module_key ON framework_modules(module_key);
CREATE INDEX IF NOT EXISTS idx_strategic_guidance_category ON strategic_guidance(category);
CREATE INDEX IF NOT EXISTS idx_strategic_guidance_context_tags ON strategic_guidance USING gin(context_tags);
CREATE INDEX IF NOT EXISTS idx_strategic_guidance_priority ON strategic_guidance(priority);