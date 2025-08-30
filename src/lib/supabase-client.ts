import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Singleton pattern to ensure only ONE instance is ever created
let supabaseInstance: SupabaseClient | null = null

// Use environment variables, fallback to hardcoded values for development
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kmpdmofcqdfqwcsvrwvv.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttcGRtb2ZjcWRmcXdjc3Zyd3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MTkzMTksImV4cCI6MjA3MTI5NTMxOX0.tXuEepbVcmF3zMnayfYAHJ12o24auRosK02s-p6RnBs'

// Debug: Override Headers constructor to catch invalid header usage
if (typeof window !== 'undefined') {
  const OriginalHeaders = window.Headers
  window.Headers = function(init) {
    if (init && typeof init === 'object') {
      const fixedInit = {}
      for (const [key, value] of Object.entries(init)) {
        if (key.toLowerCase() === 'authorization' && typeof value === 'string' && value.startsWith('eyJ')) {
          console.error('[HEADERS-DEBUG] Invalid JWT header detected:', key, value.slice(0, 50) + '...')
          console.error('[HEADERS-DEBUG] Stack trace:', new Error().stack)
          fixedInit[key] = `Bearer ${value}`
        } else {
          fixedInit[key] = value
        }
      }
      return new OriginalHeaders(fixedInit)
    }
    return new OriginalHeaders(init)
  }
  
  // Also override fetch for double safety
  const originalFetch = window.fetch
  window.fetch = function(input, init) {
    if (init?.headers && typeof init.headers === 'object' && !init.headers.constructor.name.includes('Headers')) {
      const fixedHeaders = {}
      for (const [key, value] of Object.entries(init.headers)) {
        if (key.toLowerCase() === 'authorization' && typeof value === 'string' && value.startsWith('eyJ')) {
          console.error('[FETCH-DEBUG] Invalid JWT header detected:', key, value.slice(0, 50) + '...')
          fixedHeaders[key] = `Bearer ${value}`
        } else {
          fixedHeaders[key] = value
        }
      }
      init.headers = fixedHeaders
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