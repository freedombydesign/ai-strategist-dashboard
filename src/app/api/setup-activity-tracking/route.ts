import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

export async function POST(request: NextRequest) {
  try {
    // Create daily_activity_tracking table
    const { error: tableError } = await supabase.rpc('exec_sql', {
      sql_query: `
        CREATE TABLE IF NOT EXISTS daily_activity_tracking (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          tracking_date DATE NOT NULL,
          hours_worked DECIMAL(4,2) DEFAULT 0,
          hours_in_fulfillment DECIMAL(4,2) DEFAULT 0,
          hours_in_coordination DECIMAL(4,2) DEFAULT 0,
          hours_in_business_development DECIMAL(4,2) DEFAULT 0,
          weekend_hours DECIMAL(4,2) DEFAULT 0,
          revenue_generated DECIMAL(10,2) DEFAULT 0,
          expenses_incurred DECIMAL(10,2) DEFAULT 0,
          tasks_delegated INTEGER DEFAULT 0,
          client_interactions_handled_by_team INTEGER DEFAULT 0,
          stress_level INTEGER DEFAULT 5 CHECK (stress_level >= 1 AND stress_level <= 10),
          job_satisfaction INTEGER DEFAULT 5 CHECK (job_satisfaction >= 1 AND job_satisfaction <= 10),
          energy_level INTEGER DEFAULT 5 CHECK (energy_level >= 1 AND energy_level <= 10),
          manual_tasks_completed INTEGER DEFAULT 0,
          automated_processes_triggered INTEGER DEFAULT 0,
          new_clients_onboarded INTEGER DEFAULT 0,
          client_issues_resolved INTEGER DEFAULT 0,
          notes TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

          -- Ensure one entry per user per date
          UNIQUE(user_id, tracking_date)
        );

        -- Create indexes for better performance
        CREATE INDEX IF NOT EXISTS idx_activity_tracking_user_date
        ON daily_activity_tracking(user_id, tracking_date);

        CREATE INDEX IF NOT EXISTS idx_activity_tracking_date
        ON daily_activity_tracking(tracking_date);

        -- Enable RLS
        ALTER TABLE daily_activity_tracking ENABLE ROW LEVEL SECURITY;

        -- Create RLS policy
        DROP POLICY IF EXISTS "Users can manage their own activity tracking" ON daily_activity_tracking;
        CREATE POLICY "Users can manage their own activity tracking" ON daily_activity_tracking
        FOR ALL USING (auth.uid() = user_id);

        -- Create updated_at trigger
        DROP TRIGGER IF EXISTS update_activity_tracking_updated_at ON daily_activity_tracking;
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        CREATE TRIGGER update_activity_tracking_updated_at
        BEFORE UPDATE ON daily_activity_tracking
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      `
    })

    if (tableError) {
      console.error('Error creating activity tracking table:', tableError)
      return NextResponse.json({
        success: false,
        error: 'Failed to create activity tracking table',
        details: tableError.message
      }, { status: 500 })
    }

    // Insert sample data for testing
    const sampleData = [
      {
        user_id: '00000000-0000-0000-0000-000000000000', // Replace with actual user ID
        tracking_date: '2024-01-15',
        hours_worked: 8.5,
        hours_in_fulfillment: 6.0,
        hours_in_coordination: 1.5,
        hours_in_business_development: 1.0,
        weekend_hours: 0,
        revenue_generated: 2500.00,
        expenses_incurred: 350.00,
        tasks_delegated: 5,
        client_interactions_handled_by_team: 3,
        stress_level: 4,
        job_satisfaction: 8,
        energy_level: 7,
        manual_tasks_completed: 12,
        automated_processes_triggered: 8,
        new_clients_onboarded: 1,
        client_issues_resolved: 2,
        notes: "Great day - new automation handled client onboarding"
      },
      {
        user_id: '00000000-0000-0000-0000-000000000000',
        tracking_date: '2024-01-14',
        hours_worked: 7.0,
        hours_in_fulfillment: 5.5,
        hours_in_coordination: 1.0,
        hours_in_business_development: 0.5,
        weekend_hours: 0,
        revenue_generated: 1800.00,
        expenses_incurred: 200.00,
        tasks_delegated: 3,
        client_interactions_handled_by_team: 2,
        stress_level: 3,
        job_satisfaction: 9,
        energy_level: 8,
        manual_tasks_completed: 8,
        automated_processes_triggered: 6,
        new_clients_onboarded: 0,
        client_issues_resolved: 1,
        notes: "Smooth workflow, good delegation"
      }
    ]

    // Note: Sample data insertion commented out - uncomment when you have actual user IDs
    /*
    const { error: sampleError } = await supabase
      .from('daily_activity_tracking')
      .insert(sampleData)

    if (sampleError) {
      console.error('Error inserting sample data:', sampleError)
      // Don't fail the whole operation for sample data
    }
    */

    return NextResponse.json({
      success: true,
      message: 'Activity tracking system set up successfully',
      data: {
        tableCreated: true,
        indexesCreated: true,
        rlsEnabled: true,
        sampleDataNote: 'Sample data commented out - add actual user IDs to enable'
      }
    })

  } catch (error) {
    console.error('Error setting up activity tracking:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to set up activity tracking system',
      details: error.message
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check if table exists and return schema info
    const { data: tableInfo, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'daily_activity_tracking')

    if (error) {
      return NextResponse.json({
        success: false,
        error: 'Failed to check table status',
        details: error.message
      }, { status: 500 })
    }

    const tableExists = tableInfo && tableInfo.length > 0

    if (tableExists) {
      // Get column information
      const { data: columns, error: colError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable')
        .eq('table_schema', 'public')
        .eq('table_name', 'daily_activity_tracking')
        .order('ordinal_position')

      return NextResponse.json({
        success: true,
        data: {
          tableExists: true,
          columns: columns || []
        }
      })
    } else {
      return NextResponse.json({
        success: true,
        data: {
          tableExists: false,
          message: 'Table does not exist. Run POST to create it.'
        }
      })
    }

  } catch (error) {
    console.error('Error checking activity tracking setup:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to check activity tracking setup',
      details: error.message
    }, { status: 500 })
  }
}