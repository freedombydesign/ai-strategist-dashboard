import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Singleton pattern to ensure only ONE instance is ever created
let supabaseInstance: SupabaseClient | null = null

// Use environment variables, fallback to hardcoded values for development
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kmpdmofcqdfqwcsvrwvv.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttcGRtb2ZjcWRmcXdjc3Zyd3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MTkzMTksImV4cCI6MjA3MTI5NTMxOX0.tXuEepbVcmF3zMnayfYAHJ12o24auRosK02s-p6RnBs'

// Debug: Override fetch to catch invalid header usage
if (typeof window !== 'undefined') {
  const originalFetch = window.fetch
  window.fetch = function(input, init) {
    if (init?.headers) {
      const headers = new Headers(init.headers)
      for (const [key, value] of headers.entries()) {
        if (key.toLowerCase() === 'authorization' && value.startsWith('eyJ')) {
          console.error('[FETCH-DEBUG] Invalid JWT header detected:', key, value.slice(0, 50) + '...')
          console.error('[FETCH-DEBUG] Stack trace:', new Error().stack)
          // Fix the header
          headers.set(key, `Bearer ${value}`)
          init.headers = headers
        }
      }
    }
    return originalFetch.call(this, input, init)
  }
}

function getSupabaseInstance(): SupabaseClient {
  if (!supabaseInstance) {
    console.log('[SUPABASE-CLIENT] Creating SINGLE Supabase instance v4.0 with URL:', supabaseUrl?.slice(0, 30) + '...')
    
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