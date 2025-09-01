-- Fix missing columns in tables to match import script expectations

-- 1. Add missing columns to sprints table
ALTER TABLE sprints 
ADD COLUMN IF NOT EXISTS full_title TEXT;

-- Update existing sprints to have full_title = name if it's empty
UPDATE sprints SET full_title = name WHERE full_title IS NULL OR full_title = '';

-- 2. Add missing columns to sop_library table  
ALTER TABLE sop_library
ADD COLUMN IF NOT EXISTS content_steps TEXT;

-- 3. Add missing columns to freedom_diagnostic_questions table
ALTER TABLE freedom_diagnostic_questions
ADD COLUMN IF NOT EXISTS field_name TEXT;