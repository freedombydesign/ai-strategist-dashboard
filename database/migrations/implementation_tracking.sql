-- Implementation Tracking Platform Database Schema
-- Created: Day 1 of 48-hour sprint

-- Daily check-ins table for accountability
CREATE TABLE IF NOT EXISTS daily_checkins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  checkin_date DATE NOT NULL DEFAULT CURRENT_DATE,
  completed_tasks TEXT[] DEFAULT ARRAY[]::TEXT[],
  obstacles TEXT,
  energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 10),
  business_updates JSONB DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, checkin_date)
);

-- Enhanced implementation progress tracking
CREATE TABLE IF NOT EXISTS implementation_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sprint_id TEXT NOT NULL, -- Maps to existing sprint system
  total_tasks INTEGER DEFAULT 0,
  completed_tasks INTEGER DEFAULT 0,
  completion_percentage DECIMAL(5,2) DEFAULT 0.00,
  streak_days INTEGER DEFAULT 0,
  last_activity_date DATE DEFAULT CURRENT_DATE,
  momentum_score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, sprint_id)
);

-- Simple business health tracking
CREATE TABLE IF NOT EXISTS business_snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  record_date DATE NOT NULL DEFAULT CURRENT_DATE,
  monthly_revenue DECIMAL(12,2),
  monthly_expenses DECIMAL(12,2),
  profit_margin DECIMAL(5,2),
  client_count INTEGER,
  founder_hours_per_week INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_daily_checkins_user_date ON daily_checkins(user_id, checkin_date DESC);
CREATE INDEX IF NOT EXISTS idx_implementation_progress_user_sprint ON implementation_progress(user_id, sprint_id);
CREATE INDEX IF NOT EXISTS idx_business_snapshots_user_date ON business_snapshots(user_id, record_date DESC);

-- Enable Row Level Security
ALTER TABLE daily_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE implementation_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_snapshots ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Users can only access their own data
CREATE POLICY "Users can view their own daily checkins" ON daily_checkins
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own daily checkins" ON daily_checkins
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own daily checkins" ON daily_checkins
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own implementation progress" ON implementation_progress
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own implementation progress" ON implementation_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own implementation progress" ON implementation_progress
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own business snapshots" ON business_snapshots
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own business snapshots" ON business_snapshots
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own business snapshots" ON business_snapshots
  FOR UPDATE USING (auth.uid() = user_id);