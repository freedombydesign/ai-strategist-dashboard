import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Singleton pattern to ensure only ONE instance is ever created
let supabaseInstance: SupabaseClient | null = null

// Use environment variables, fallback to hardcoded values for development
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kmpdmofcqdfqwcsvrwvv.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttcGRtb2ZjcWRmcXdjc3Zyd3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MTkzMTksImV4cCI6MjA3MTI5NTMxOX0.tXuEepbVcmF3zMnayfYAHJ12o24auRosK02s-p6RnBs'

function getSupabaseInstance(): SupabaseClient {
  if (!supabaseInstance) {
    console.log('[SUPABASE-CLIENT] Creating SINGLE Supabase instance v3.0 with URL:', supabaseUrl)
    console.log('[SUPABASE-CLIENT] Using environment variables:')
    console.log('[SUPABASE-CLIENT] NEXT_PUBLIC_SUPABASE_URL exists:', !!process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log('[SUPABASE-CLIENT] NEXT_PUBLIC_SUPABASE_ANON_KEY exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    console.log('[SUPABASE-CLIENT] Runtime check - supabaseUrl:', supabaseUrl?.slice(0, 20) + '...')
    console.log('[SUPABASE-CLIENT] Runtime check - supabaseAnonKey:', supabaseAnonKey?.slice(0, 20) + '...')
    
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        storageKey: 'ai-strategist-auth-v2'
      }
    })
  }
  return supabaseInstance
}

export const supabase = getSupabaseInstance()