import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  return NextResponse.json({
    supabase_client: 'Using hardcoded centralized client',
    openai_key_exists: !!process.env.OPENAI_API_KEY,
    supabase_status: 'CONFIGURED (hardcoded)',
    message: 'Using centralized Supabase client - no env vars needed'
  })
}