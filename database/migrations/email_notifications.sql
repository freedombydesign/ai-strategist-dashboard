-- Email Notifications System Database Schema
-- Run this in Supabase SQL Editor

-- Table: email_notifications
-- Tracks all email notifications to be sent or already sent
CREATE TABLE IF NOT EXISTS email_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL, -- 'diagnostic_results', 'missed_checkin_day2', 'milestone_celebration', 'weekly_summary', 'ai_insights'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'cancelled'
  scheduled_for TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  failure_reason TEXT,
  email_data JSONB, -- Dynamic data for email template (user name, scores, etc.)
  resend_message_id TEXT, -- Store Resend's message ID for tracking
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: email_preferences 
-- User preferences for different types of emails
CREATE TABLE IF NOT EXISTS email_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  diagnostic_results BOOLEAN DEFAULT true, -- Cannot be disabled, always true
  missed_checkins BOOLEAN DEFAULT true,
  milestone_celebrations BOOLEAN DEFAULT true,
  weekly_summaries BOOLEAN DEFAULT true,
  ai_insights BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: email_templates
-- Store email template configurations
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template_name TEXT NOT NULL UNIQUE,
  subject_template TEXT NOT NULL,
  html_template TEXT,
  text_template TEXT,
  template_variables JSONB, -- Available variables for this template
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: user_timezones
-- Store user timezone preferences for scheduled emails
CREATE TABLE IF NOT EXISTS user_timezones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  timezone TEXT NOT NULL DEFAULT 'UTC', -- e.g., 'America/New_York', 'Europe/London'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: email_analytics
-- Track email performance metrics
CREATE TABLE IF NOT EXISTS email_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  notification_id UUID NOT NULL REFERENCES email_notifications(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'delivered', 'opened', 'clicked', 'bounced', 'complained'
  event_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_agent TEXT,
  ip_address INET,
  click_url TEXT, -- For click events, which URL was clicked
  metadata JSONB -- Additional tracking data
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_notifications_user_id ON email_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_email_notifications_status ON email_notifications(status);
CREATE INDEX IF NOT EXISTS idx_email_notifications_scheduled ON email_notifications(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_email_notifications_type ON email_notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_email_preferences_user_id ON email_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_timezones_user_id ON user_timezones(user_id);
CREATE INDEX IF NOT EXISTS idx_email_analytics_notification_id ON email_analytics(notification_id);

-- RLS Policies
ALTER TABLE email_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_timezones ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_analytics ENABLE ROW LEVEL SECURITY;

-- Users can only see their own email notifications
CREATE POLICY "Users can view own email notifications" ON email_notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own email preferences" ON email_preferences  
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own timezone settings" ON user_timezones
  FOR ALL USING (auth.uid() = user_id);

-- Email templates are viewable by all users (for unsubscribe pages, etc.)
CREATE POLICY "Email templates are publicly readable" ON email_templates
  FOR SELECT USING (true);

-- Only service can insert/update email notifications
CREATE POLICY "Service can manage email notifications" ON email_notifications
  FOR ALL USING (true);

-- Only service can insert email analytics  
CREATE POLICY "Service can insert email analytics" ON email_analytics
  FOR INSERT WITH CHECK (true);

-- Insert default email templates
INSERT INTO email_templates (template_name, subject_template, template_variables) VALUES
('diagnostic_results', 'Your Freedom Diagnostic Results - {{businessHealthScore}}/100', '["firstName", "businessHealthScore", "dashboardUrl", "topBottleneck", "recommendedAction"]'),
('missed_checkin_day2', 'Quick check-in? Your progress matters, {{firstName}}', '["firstName", "lastCheckinDate", "currentStreak", "dashboardUrl"]'),
('missed_checkin_day5', '{{firstName}}, your business transformation is waiting', '["firstName", "lastCheckinDate", "sprintProgress", "dashboardUrl"]'),
('missed_checkin_day10', 'We miss you! Your implementation journey awaits', '["firstName", "lastCheckinDate", "achievementCount", "dashboardUrl"]'),
('milestone_celebration', '🎉 Milestone Achieved: {{milestoneName}}', '["firstName", "milestoneName", "progressPercentage", "businessImpact", "dashboardUrl"]'),
('weekly_summary', 'Your Weekly Progress Summary - {{completedTasks}} tasks completed', '["firstName", "completedTasks", "weeklyStreak", "businessMetrics", "upcomingTasks", "dashboardUrl"]'),
('ai_insights', 'AI Coach Insight: {{insightTitle}}', '["firstName", "insightTitle", "insightDescription", "recommendedActions", "dashboardUrl"]')
ON CONFLICT (template_name) DO NOTHING;

-- Function to automatically create email preferences for new users
CREATE OR REPLACE FUNCTION create_default_email_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO email_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  INSERT INTO user_timezones (user_id)
  VALUES (NEW.id)  
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create default preferences for new users
DROP TRIGGER IF EXISTS create_email_preferences_on_signup ON auth.users;
CREATE TRIGGER create_email_preferences_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_default_email_preferences();

-- Function to check for missed check-ins and schedule reminder emails
CREATE OR REPLACE FUNCTION schedule_missed_checkin_emails()
RETURNS void AS $$
BEGIN
  -- Day 2 reminders
  INSERT INTO email_notifications (user_id, notification_type, scheduled_for, email_data)
  SELECT 
    u.id,
    'missed_checkin_day2',
    NOW(),
    json_build_object(
      'firstName', COALESCE(u.raw_user_meta_data->>'firstName', split_part(u.email, '@', 1)),
      'lastCheckinDate', COALESCE(MAX(dc.checkin_date), u.created_at::date),
      'dashboardUrl', 'https://yourdomain.com/dashboard'
    )::jsonb
  FROM auth.users u
  INNER JOIN email_preferences ep ON u.id = ep.user_id AND ep.missed_checkins = true
  LEFT JOIN daily_checkins dc ON u.id = dc.user_id 
    AND dc.checkin_date >= CURRENT_DATE - INTERVAL '7 days'
  LEFT JOIN email_notifications en ON u.id = en.user_id 
    AND en.notification_type = 'missed_checkin_day2'
    AND en.created_at >= CURRENT_DATE - INTERVAL '3 days'
  WHERE 
    u.created_at <= NOW() - INTERVAL '2 days'
    AND en.id IS NULL -- Haven't sent this reminder recently
    AND (
      dc.checkin_date IS NULL OR 
      MAX(dc.checkin_date) <= CURRENT_DATE - INTERVAL '2 days'
    )
  GROUP BY u.id, u.email, u.created_at, u.raw_user_meta_data;

  -- Day 5 reminders  
  INSERT INTO email_notifications (user_id, notification_type, scheduled_for, email_data)
  SELECT 
    u.id,
    'missed_checkin_day5', 
    NOW(),
    json_build_object(
      'firstName', COALESCE(u.raw_user_meta_data->>'firstName', split_part(u.email, '@', 1)),
      'lastCheckinDate', COALESCE(MAX(dc.checkin_date), u.created_at::date),
      'dashboardUrl', 'https://yourdomain.com/dashboard'
    )::jsonb
  FROM auth.users u
  INNER JOIN email_preferences ep ON u.id = ep.user_id AND ep.missed_checkins = true
  LEFT JOIN daily_checkins dc ON u.id = dc.user_id 
    AND dc.checkin_date >= CURRENT_DATE - INTERVAL '10 days'
  LEFT JOIN email_notifications en ON u.id = en.user_id 
    AND en.notification_type = 'missed_checkin_day5'
    AND en.created_at >= CURRENT_DATE - INTERVAL '6 days'
  WHERE 
    u.created_at <= NOW() - INTERVAL '5 days'
    AND en.id IS NULL
    AND (
      dc.checkin_date IS NULL OR 
      MAX(dc.checkin_date) <= CURRENT_DATE - INTERVAL '5 days'
    )
  GROUP BY u.id, u.email, u.created_at, u.raw_user_meta_data;

  -- Day 10 reminders
  INSERT INTO email_notifications (user_id, notification_type, scheduled_for, email_data)
  SELECT 
    u.id,
    'missed_checkin_day10',
    NOW(), 
    json_build_object(
      'firstName', COALESCE(u.raw_user_meta_data->>'firstName', split_part(u.email, '@', 1)),
      'lastCheckinDate', COALESCE(MAX(dc.checkin_date), u.created_at::date),
      'dashboardUrl', 'https://yourdomain.com/dashboard'
    )::jsonb
  FROM auth.users u
  INNER JOIN email_preferences ep ON u.id = ep.user_id AND ep.missed_checkins = true
  LEFT JOIN daily_checkins dc ON u.id = dc.user_id 
    AND dc.checkin_date >= CURRENT_DATE - INTERVAL '15 days'
  LEFT JOIN email_notifications en ON u.id = en.user_id 
    AND en.notification_type = 'missed_checkin_day10'
    AND en.created_at >= CURRENT_DATE - INTERVAL '11 days'
  WHERE 
    u.created_at <= NOW() - INTERVAL '10 days'
    AND en.id IS NULL
    AND (
      dc.checkin_date IS NULL OR 
      MAX(dc.checkin_date) <= CURRENT_DATE - INTERVAL '10 days'
    )
  GROUP BY u.id, u.email, u.created_at, u.raw_user_meta_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to schedule weekly summary emails (run on Sundays)
CREATE OR REPLACE FUNCTION schedule_weekly_summary_emails()
RETURNS void AS $$
BEGIN
  INSERT INTO email_notifications (user_id, notification_type, scheduled_for, email_data)
  SELECT 
    u.id,
    'weekly_summary',
    -- Schedule for 6 PM in user's timezone (default to 6 PM UTC if no timezone set)
    CURRENT_DATE + INTERVAL '18 hours',
    json_build_object(
      'firstName', COALESCE(u.raw_user_meta_data->>'firstName', split_part(u.email, '@', 1)),
      'completedTasks', COALESCE(COUNT(dc.id), 0),
      'dashboardUrl', 'https://yourdomain.com/dashboard'
    )::jsonb
  FROM auth.users u
  INNER JOIN email_preferences ep ON u.id = ep.user_id AND ep.weekly_summaries = true  
  LEFT JOIN daily_checkins dc ON u.id = dc.user_id 
    AND dc.checkin_date >= CURRENT_DATE - INTERVAL '7 days'
  LEFT JOIN email_notifications en ON u.id = en.user_id 
    AND en.notification_type = 'weekly_summary'
    AND en.created_at >= CURRENT_DATE - INTERVAL '6 days'
  WHERE 
    u.created_at <= NOW() - INTERVAL '1 day' -- At least signed up yesterday
    AND en.id IS NULL -- Haven't sent weekly summary recently
  GROUP BY u.id, u.email, u.raw_user_meta_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;