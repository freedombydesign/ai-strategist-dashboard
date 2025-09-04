-- FINAL FIX: Add all missing columns and fix data types

-- 1. Add methodology column to sprints table
ALTER TABLE sprints 
ADD COLUMN IF NOT EXISTS methodology TEXT;

-- 2. Add options_text column to freedom_diagnostic_questions table
ALTER TABLE freedom_diagnostic_questions
ADD COLUMN IF NOT EXISTS options_text TEXT;

-- 3. Fix sop_library keywords column type (change from TEXT[] to TEXT)
-- First, check if the column exists as an array and change it to text
DO $$
BEGIN
    -- Check if keywords column exists as array type and change it
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'sop_library' 
        AND column_name = 'keywords' 
        AND data_type = 'ARRAY'
    ) THEN
        -- Drop the array constraint and change to text
        ALTER TABLE sop_library ALTER COLUMN keywords TYPE TEXT;
    END IF;
    
    -- If keywords column doesn't exist, add it as TEXT
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'sop_library' 
        AND column_name = 'keywords'
    ) THEN
        ALTER TABLE sop_library ADD COLUMN keywords TEXT;
    END IF;
END $$;