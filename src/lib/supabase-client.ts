import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Singleton pattern to ensure only ONE instance is ever created
let supabaseInstance: SupabaseClient | null = null

// Use environment variables, fallback to hardcoded values for development
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dylzuudcvkcydmdyigcf.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5bHp1dWRjdmtjeWRtZHlpZ2NmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3ODA5MDgsImV4cCI6MjA3MzM1NjkwOH0.wWrr2HfjTnwaYdSHAtLe_hhQVyBTXMGsBUO1LnuCzXM'


function getSupabaseInstance(): SupabaseClient {
  if (!supabaseInstance) {
    console.log('[SUPABASE-CLIENT] Creating Business Systemizer Supabase instance')
    console.log('[SUPABASE-CLIENT] URL:', supabaseUrl)
    console.log('[SUPABASE-CLIENT] Using environment variables:', !!process.env.NEXT_PUBLIC_SUPABASE_URL)

    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        storageKey: 'business-systemizer-auth-v1'
      }
    })
  }
  return supabaseInstance
}

export const supabase = getSupabaseInstance()