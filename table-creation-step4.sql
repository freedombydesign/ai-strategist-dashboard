-- STEP 7: Create Content Categories
CREATE TABLE IF NOT EXISTS content_categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 1,
  keywords TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- STEP 8: Create Enhanced Users table
CREATE TABLE IF NOT EXISTS framework_users (
  id SERIAL PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  name TEXT,
  email TEXT,
  business_size TEXT,
  niche TEXT,
  freedom_score DECIMAL(5,2),
  start_date DATE,
  current_sprint_key TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);