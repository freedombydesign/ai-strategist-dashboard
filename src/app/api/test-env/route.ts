import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  return NextResponse.json({
    supabase_url_exists: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabase_key_exists: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    openai_key_exists: !!process.env.OPENAI_API_KEY,
    supabase_url_value: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING',
    message: 'Environment variables test'
  })
}