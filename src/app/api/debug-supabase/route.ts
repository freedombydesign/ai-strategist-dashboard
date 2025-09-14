import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('[DEBUG-SUPABASE] Starting diagnostic...')

    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    console.log('[DEBUG-SUPABASE] Environment check:')
    console.log('- URL exists:', !!supabaseUrl)
    console.log('- URL value:', supabaseUrl?.slice(0, 30) + '...')
    console.log('- ANON_KEY exists:', !!supabaseAnonKey)
    console.log('- ANON_KEY value:', supabaseAnonKey?.slice(0, 20) + '...')

    // Test basic Supabase connection
    const { data, error: connectionError } = await supabase
      .from('service_workflow_templates')
      .select('id')
      .limit(1)

    console.log('[DEBUG-SUPABASE] Connection test result:')
    console.log('- Error:', connectionError?.message || 'none')
    console.log('- Data count:', data?.length || 0)

    // Test with a different table that might exist
    const { data: existingTableData, error: existingTableError } = await supabase
      .from('users')
      .select('id')
      .limit(1)

    console.log('[DEBUG-SUPABASE] Existing table test:')
    console.log('- Users table error:', existingTableError?.message || 'none')
    console.log('- Users table data:', existingTableData?.length || 0)

    return NextResponse.json({
      success: true,
      environment: {
        urlExists: !!supabaseUrl,
        urlPreview: supabaseUrl?.slice(0, 30) + '...',
        anonKeyExists: !!supabaseAnonKey,
        anonKeyPreview: supabaseAnonKey?.slice(0, 20) + '...'
      },
      connectionTest: {
        serviceWorkflowTemplatesError: connectionError?.message || null,
        serviceWorkflowTemplatesWorking: !connectionError,
        dataCount: data?.length || 0
      },
      existingTableTest: {
        usersTableError: existingTableError?.message || null,
        usersTableWorking: !existingTableError,
        usersDataCount: existingTableData?.length || 0
      }
    })

  } catch (error) {
    console.error('[DEBUG-SUPABASE] Unexpected error:', error)
    return NextResponse.json({
      error: 'Debug failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}