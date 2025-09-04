-- Add the final two missing columns to complete table structure

-- 1. Add sprint_key column to sprints table
ALTER TABLE sprints 
ADD COLUMN IF NOT EXISTS sprint_key VARCHAR(10) UNIQUE;

-- 2. Add question_id column to freedom_diagnostic_questions table  
ALTER TABLE freedom_diagnostic_questions
ADD COLUMN IF NOT EXISTS question_id VARCHAR(10) UNIQUE;