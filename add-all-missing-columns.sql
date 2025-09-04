-- Add ALL missing columns to complete the table structures

-- 1. Add missing columns to sprints table
ALTER TABLE sprints 
ADD COLUMN IF NOT EXISTS week_number INTEGER,
ADD COLUMN IF NOT EXISTS objectives JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS key_strategies JSONB DEFAULT '[]', 
ADD COLUMN IF NOT EXISTS common_challenges JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS success_indicators JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS tools_resources JSONB DEFAULT '[]';

-- 2. Add missing column to sop_library table
ALTER TABLE sop_library
ADD COLUMN IF NOT EXISTS format TEXT;

-- 3. Add missing column to freedom_diagnostic_questions table
ALTER TABLE freedom_diagnostic_questions
ADD COLUMN IF NOT EXISTS module TEXT;