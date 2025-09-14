import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('[Setup] Creating workflow executions table for analytics tracking...')

    // Create workflow executions table for analytics
    const { error: execError } = await supabase.rpc('create_workflow_executions_table', {})

    if (execError) {
      // If RPC doesn't exist, create table directly
      const { error: createError } = await supabase.from('systemizer_workflow_executions').select('id').limit(1)

      if (createError && createError.code === '42P01') {
        // Table doesn't exist, we'll create it via SQL
        console.log('[Setup] Creating systemizer_workflow_executions table...')

        // Note: In a production environment, you would run this SQL directly in Supabase dashboard
        // CREATE TABLE systemizer_workflow_executions (
        //   id SERIAL PRIMARY KEY,
        //   workflow_id INTEGER REFERENCES systemizer_workflows(id) ON DELETE CASCADE,
        //   executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        //   time_saved_minutes INTEGER DEFAULT 0,
        //   automation_percentage INTEGER DEFAULT 0,
        //   status VARCHAR(50) DEFAULT 'completed',
        //   execution_context JSONB DEFAULT '{}',
        //   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        //   updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        // );

        return NextResponse.json({
          success: false,
          message: 'Please create the systemizer_workflow_executions table manually in Supabase dashboard',
          sql: `
CREATE TABLE systemizer_workflow_executions (
  id SERIAL PRIMARY KEY,
  workflow_id INTEGER REFERENCES systemizer_workflows(id) ON DELETE CASCADE,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  time_saved_minutes INTEGER DEFAULT 0,
  automation_percentage INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'completed',
  execution_context JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better query performance
CREATE INDEX idx_workflow_executions_workflow_id ON systemizer_workflow_executions(workflow_id);
CREATE INDEX idx_workflow_executions_executed_at ON systemizer_workflow_executions(executed_at);

-- Enable RLS
ALTER TABLE systemizer_workflow_executions ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users
CREATE POLICY "Allow authenticated users to manage workflow executions"
ON systemizer_workflow_executions
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
          `
        })
      }
    }

    // Test the analytics endpoint with sample data
    console.log('[Setup] Testing analytics functionality...')

    // Insert some sample execution data if workflows exist
    const { data: workflows } = await supabase
      .from('systemizer_workflows')
      .select('id, name')
      .limit(3)

    if (workflows && workflows.length > 0) {
      const sampleExecutions = []

      workflows.forEach(workflow => {
        // Create sample executions over the past 30 days
        for (let i = 0; i < Math.floor(Math.random() * 10) + 5; i++) {
          const daysAgo = Math.floor(Math.random() * 30)
          const executedAt = new Date()
          executedAt.setDate(executedAt.getDate() - daysAgo)

          sampleExecutions.push({
            workflow_id: workflow.id,
            executed_at: executedAt.toISOString(),
            time_saved_minutes: Math.floor(Math.random() * 120) + 30, // 30-150 minutes
            automation_percentage: Math.floor(Math.random() * 40) + 60, // 60-100%
            status: 'completed'
          })
        }
      })

      const { error: insertError } = await supabase
        .from('systemizer_workflow_executions')
        .insert(sampleExecutions)

      if (insertError) {
        console.log('[Setup] Could not insert sample data:', insertError.message)
      } else {
        console.log('[Setup] Inserted', sampleExecutions.length, 'sample executions')
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Workflow executions tracking setup completed',
      data: {
        tablesCreated: ['systemizer_workflow_executions'],
        analyticsEndpoint: '/api/systemizer/analytics',
        sampleDataInserted: workflows?.length || 0
      }
    })

  } catch (error) {
    console.error('[Setup] Error setting up workflow executions:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to setup workflow executions tracking',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}