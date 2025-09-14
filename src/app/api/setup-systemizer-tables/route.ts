import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('[SETUP-SYSTEMIZER-TABLES] Starting table creation...')

    // Since we can't easily execute raw SQL, let's create tables using the Supabase client
    // This is a simplified approach that just ensures our API will work
    console.log('[SETUP-SYSTEMIZER-TABLES] Note: This endpoint expects tables to be created via Supabase dashboard or migrations')
    console.log('[SETUP-SYSTEMIZER-TABLES] Testing table access instead of creating them...')

    // Test if we can access the tables (they should be created manually or via migrations)
    const testResults = {}

    try {
      const { data: templates, error: templatesError } = await supabase
        .from('workflow_templates')
        .select('id')
        .limit(1)

      testResults['workflow_templates'] = {
        accessible: !templatesError,
        error: templatesError?.message
      }
    } catch (err) {
      testResults['workflow_templates'] = {
        accessible: false,
        error: 'Table may not exist'
      }
    }

    try {
      const { data: steps, error: stepsError } = await supabase
        .from('workflow_steps')
        .select('id')
        .limit(1)

      testResults['workflow_steps'] = {
        accessible: !stepsError,
        error: stepsError?.message
      }
    } catch (err) {
      testResults['workflow_steps'] = {
        accessible: false,
        error: 'Table may not exist'
      }
    }

    try {
      const { data: assets, error: assetsError } = await supabase
        .from('template_assets')
        .select('id')
        .limit(1)

      testResults['template_assets'] = {
        accessible: !assetsError,
        error: assetsError?.message
      }
    } catch (err) {
      testResults['template_assets'] = {
        accessible: false,
        error: 'Table may not exist'
      }
    }

    try {
      const { data: exports, error: exportsError } = await supabase
        .from('export_configurations')
        .select('id')
        .limit(1)

      testResults['export_configurations'] = {
        accessible: !exportsError,
        error: exportsError?.message
      }
    } catch (err) {
      testResults['export_configurations'] = {
        accessible: false,
        error: 'Table may not exist'
      }
    }

    try {
      const { data: analytics, error: analyticsError } = await supabase
        .from('systemizer_analytics')
        .select('id')
        .limit(1)

      testResults['systemizer_analytics'] = {
        accessible: !analyticsError,
        error: analyticsError?.message
      }
    } catch (err) {
      testResults['systemizer_analytics'] = {
        accessible: false,
        error: 'Table may not exist'
      }
    }

    const allTablesAccessible = Object.values(testResults).every((result: any) => result.accessible)

    if (!allTablesAccessible) {
      return NextResponse.json({
        success: false,
        message: 'Some or all Service Delivery Systemizer tables are not accessible',
        details: 'Please run the SQL migration file (database/003_service_delivery_systemizer_tables.sql) in your Supabase dashboard',
        testResults,
        instructions: [
          '1. Go to your Supabase dashboard',
          '2. Navigate to SQL Editor',
          '3. Run the contents of database/003_service_delivery_systemizer_tables.sql',
          '4. Then test this endpoint again'
        ]
      }, { status: 400 })
    }

    console.log('[SETUP-SYSTEMIZER-TABLES] All tables are accessible!')

    return NextResponse.json({
      success: true,
      message: 'All Service Delivery Systemizer tables are accessible and ready!',
      testResults,
      tablesReady: [
        'workflow_templates',
        'workflow_steps',
        'template_assets',
        'export_configurations',
        'systemizer_analytics'
      ]
    })

  } catch (error) {
    console.error('[SETUP-SYSTEMIZER-TABLES] Unexpected error:', error)
    return NextResponse.json({
      error: 'Failed to setup/test Systemizer tables',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET endpoint to check table status
export async function GET(request: NextRequest) {
  try {
    console.log('[SETUP-SYSTEMIZER-TABLES] Checking table status...')

    const tables = [
      'workflow_templates',
      'workflow_steps',
      'template_assets',
      'export_configurations',
      'systemizer_analytics'
    ]

    const tableStatus = {}

    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('id')
          .limit(1)

        tableStatus[table] = {
          exists: !error,
          accessible: !error,
          error: error?.message || null,
          sampleDataCount: data?.length || 0
        }
      } catch (err) {
        tableStatus[table] = {
          exists: false,
          accessible: false,
          error: err instanceof Error ? err.message : 'Unknown error'
        }
      }
    }

    const allTablesReady = Object.values(tableStatus).every((status: any) => status.accessible)

    return NextResponse.json({
      success: true,
      allTablesReady,
      tableStatus,
      message: allTablesReady
        ? 'All Service Delivery Systemizer tables are ready!'
        : 'Some tables are not accessible. Please run the migration SQL.'
    })

  } catch (error) {
    console.error('[SETUP-SYSTEMIZER-TABLES] Status check error:', error)
    return NextResponse.json({
      error: 'Failed to check table status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}