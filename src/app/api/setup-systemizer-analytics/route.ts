import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('[Setup Analytics] Setting up systemizer analytics tables...')

    // Create systemizer_workflows table
    console.log('[Setup Analytics] Creating systemizer_workflows table...')

    const createWorkflowsTable = `
      CREATE TABLE IF NOT EXISTS systemizer_workflows (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(100) DEFAULT 'general',
        estimated_time_saved INTEGER DEFAULT 0,
        automation_percentage INTEGER DEFAULT 0,
        usage_count INTEGER DEFAULT 0,
        last_executed_at TIMESTAMP WITH TIME ZONE,
        workflow_data JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_systemizer_workflows_category ON systemizer_workflows(category);
      CREATE INDEX IF NOT EXISTS idx_systemizer_workflows_usage ON systemizer_workflows(usage_count DESC);
      CREATE INDEX IF NOT EXISTS idx_systemizer_workflows_created ON systemizer_workflows(created_at DESC);

      -- Enable RLS
      ALTER TABLE systemizer_workflows ENABLE ROW LEVEL SECURITY;

      -- Create policy for authenticated users
      DROP POLICY IF EXISTS "Allow authenticated users to manage workflows" ON systemizer_workflows;
      CREATE POLICY "Allow authenticated users to manage workflows"
      ON systemizer_workflows
      FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
    `

    const { error: workflowTableError } = await supabase.rpc('exec_sql', { sql: createWorkflowsTable })

    if (workflowTableError) {
      console.error('[Setup Analytics] Error creating workflows table:', workflowTableError)
      // Try alternative approach if RPC doesn't exist
      return NextResponse.json({
        success: false,
        error: 'Could not create workflows table',
        sql: createWorkflowsTable,
        message: 'Please run this SQL manually in your Supabase SQL editor'
      }, { status: 500 })
    }

    // Create systemizer_workflow_executions table
    console.log('[Setup Analytics] Creating workflow executions table...')

    const createExecutionsTable = `
      CREATE TABLE IF NOT EXISTS systemizer_workflow_executions (
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

      -- Create indexes for better query performance
      CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow_id ON systemizer_workflow_executions(workflow_id);
      CREATE INDEX IF NOT EXISTS idx_workflow_executions_executed_at ON systemizer_workflow_executions(executed_at DESC);

      -- Enable RLS
      ALTER TABLE systemizer_workflow_executions ENABLE ROW LEVEL SECURITY;

      -- Create policy for authenticated users
      DROP POLICY IF EXISTS "Allow authenticated users to manage workflow executions" ON systemizer_workflow_executions;
      CREATE POLICY "Allow authenticated users to manage workflow executions"
      ON systemizer_workflow_executions
      FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
    `

    const { error: executionTableError } = await supabase.rpc('exec_sql', { sql: createExecutionsTable })

    if (executionTableError) {
      console.error('[Setup Analytics] Error creating executions table:', executionTableError)
      return NextResponse.json({
        success: false,
        error: 'Could not create executions table',
        sql: createExecutionsTable,
        message: 'Please run this SQL manually in your Supabase SQL editor'
      }, { status: 500 })
    }

    // Insert sample workflows for testing
    console.log('[Setup Analytics] Inserting sample workflows...')

    const sampleWorkflows = [
      {
        name: 'Client Onboarding Process',
        description: 'Automated client onboarding with document collection and welcome sequence',
        category: 'client_management',
        estimated_time_saved: 120,
        automation_percentage: 85,
        usage_count: 15
      },
      {
        name: 'Invoice Generation & Tracking',
        description: 'Automated invoice creation, sending, and payment tracking',
        category: 'financial',
        estimated_time_saved: 45,
        automation_percentage: 95,
        usage_count: 28
      },
      {
        name: 'Project Status Reporting',
        description: 'Weekly automated project status reports to stakeholders',
        category: 'project_management',
        estimated_time_saved: 60,
        automation_percentage: 70,
        usage_count: 12
      },
      {
        name: 'Lead Qualification & Nurturing',
        description: 'Automated lead scoring and nurture email sequences',
        category: 'marketing',
        estimated_time_saved: 90,
        automation_percentage: 80,
        usage_count: 22
      },
      {
        name: 'Employee Onboarding Checklist',
        description: 'Automated new hire onboarding process and task assignments',
        category: 'hr',
        estimated_time_saved: 180,
        automation_percentage: 75,
        usage_count: 6
      }
    ]

    const { data: insertedWorkflows, error: insertError } = await supabase
      .from('systemizer_workflows')
      .insert(sampleWorkflows)
      .select()

    if (insertError) {
      console.error('[Setup Analytics] Error inserting sample workflows:', insertError)
      return NextResponse.json({
        success: false,
        error: 'Could not insert sample workflows',
        details: insertError.message
      }, { status: 500 })
    }

    // Insert sample executions for the workflows
    if (insertedWorkflows && insertedWorkflows.length > 0) {
      console.log('[Setup Analytics] Creating sample execution data...')

      const sampleExecutions = []
      insertedWorkflows.forEach(workflow => {
        // Create 5-15 executions for each workflow over the past 30 days
        const executionCount = Math.floor(Math.random() * 10) + 5

        for (let i = 0; i < executionCount; i++) {
          const daysAgo = Math.floor(Math.random() * 30)
          const executedAt = new Date()
          executedAt.setDate(executedAt.getDate() - daysAgo)

          sampleExecutions.push({
            workflow_id: workflow.id,
            executed_at: executedAt.toISOString(),
            time_saved_minutes: Math.floor(Math.random() * 60) + workflow.estimated_time_saved,
            automation_percentage: workflow.automation_percentage + Math.floor(Math.random() * 20) - 10,
            status: Math.random() > 0.95 ? 'failed' : 'completed'
          })
        }
      })

      const { error: executionInsertError } = await supabase
        .from('systemizer_workflow_executions')
        .insert(sampleExecutions)

      if (executionInsertError) {
        console.log('[Setup Analytics] Warning: Could not insert sample executions:', executionInsertError.message)
      } else {
        console.log('[Setup Analytics] Inserted', sampleExecutions.length, 'sample executions')
      }
    }

    // Test the analytics endpoint
    console.log('[Setup Analytics] Testing analytics endpoint...')

    const analyticsResponse = await fetch(`${request.nextUrl.origin}/api/systemizer/analytics`)
    const analyticsData = await analyticsResponse.json()

    return NextResponse.json({
      success: true,
      message: 'Systemizer analytics setup completed successfully',
      data: {
        tablesCreated: ['systemizer_workflows', 'systemizer_workflow_executions'],
        workflowsCreated: insertedWorkflows?.length || 0,
        executionsCreated: sampleExecutions?.length || 0,
        analyticsTest: analyticsData,
        endpoints: {
          analytics: '/api/systemizer/analytics',
          trackExecution: '/api/systemizer/track-execution',
          setupWorkflowExecutions: '/api/setup-workflow-executions'
        }
      }
    })

  } catch (error) {
    console.error('[Setup Analytics] Unexpected error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to setup systemizer analytics',
      details: error instanceof Error ? error.message : 'Unknown error',
      manualSetup: {
        message: 'If automatic setup fails, please run these SQL commands manually in Supabase:',
        sql: {
          workflows: `CREATE TABLE systemizer_workflows (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            category VARCHAR(100) DEFAULT 'general',
            estimated_time_saved INTEGER DEFAULT 0,
            automation_percentage INTEGER DEFAULT 0,
            usage_count INTEGER DEFAULT 0,
            last_executed_at TIMESTAMP WITH TIME ZONE,
            workflow_data JSONB DEFAULT '{}',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );`,
          executions: `CREATE TABLE systemizer_workflow_executions (
            id SERIAL PRIMARY KEY,
            workflow_id INTEGER REFERENCES systemizer_workflows(id) ON DELETE CASCADE,
            executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            time_saved_minutes INTEGER DEFAULT 0,
            automation_percentage INTEGER DEFAULT 0,
            status VARCHAR(50) DEFAULT 'completed',
            execution_context JSONB DEFAULT '{}',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );`
        }
      }
    }, { status: 500 })
  }
}