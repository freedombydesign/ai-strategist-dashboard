import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Singleton pattern to ensure only ONE instance is ever created
let supabaseInstance: SupabaseClient | null = null

const supabaseUrl = 'https://kmpdmofcqdfqwcsvrwvv.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttcGRtb2ZjcWRmcXdjc3Zyd3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MTkzMTksImV4cCI6MjA3MTI5NTMxOX0.tXuEepbVcmF3zMnayfYAHJ12o24auRosK02s-p6RnBs'

function getSupabaseInstance(): SupabaseClient {
  if (!supabaseInstance) {
    console.log('[SUPABASE-CLIENT] Creating SINGLE Supabase instance v2.0')
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