import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Lazy initialization to avoid import-time errors
let supabase: any = null
const getSupabase = () => {
  if (!supabase) {
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }
  return supabase
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const userId = url.searchParams.get('user_id')

    console.log('[DEBUG-WEBSITE] Checking website intelligence for user:', userId)

    // Check if the table exists and what's in it
    const { data: allData, error: allError } = await getSupabase()
      .from('website_intelligence')
      .select('id, user_id, website_url, created_at, status')
      .limit(10)

    console.log('[DEBUG-WEBSITE] All website intelligence records:', allData)
    console.log('[DEBUG-WEBSITE] Query error:', allError)

    if (userId) {
      // Check specific user
      const { data: userData, error: userError } = await getSupabase()
        .from('website_intelligence')
        .select('*')
        .eq('user_id', userId)

      console.log('[DEBUG-WEBSITE] User specific data:', userData)
      console.log('[DEBUG-WEBSITE] User query error:', userError)

      return NextResponse.json({
        success: true,
        user_id: userId,
        user_data: userData,
        user_error: userError,
        all_records: allData,
        all_error: allError
      })
    }

    return NextResponse.json({
      success: true,
      all_records: allData,
      all_error: allError,
      message: 'Add ?user_id=YOUR_ID to check specific user'
    })

  } catch (error) {
    console.error('[DEBUG-WEBSITE] Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}