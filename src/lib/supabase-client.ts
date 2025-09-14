import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Business Systemizer Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dylzuudcvkcydmdyigcf.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5bHp1dWRjdmtjeWRtZGlpZ2NmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYyNzM5MzksImV4cCI6MjA1MTg0OTkzOX0.ZIqgTbZT98mmGXSoNzF9DMMU8U5wJMFobYV1eY-zJKo'

// Create a more robust Supabase client with error handling
function createSupabaseClient(): SupabaseClient {
  try {
    console.log('[SUPABASE-CLIENT] Creating Business Systemizer Supabase instance with URL:', supabaseUrl?.slice(0, 30) + '...')

    const client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: typeof window !== 'undefined', // Only persist on client side
        autoRefreshToken: true,
        storageKey: 'business-systemizer-auth-v1',
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        detectSessionInUrl: typeof window !== 'undefined'
      },
      global: {
        headers: {
          'x-application-name': 'business-systemizer'
        }
      }
    })

    console.log('[SUPABASE-CLIENT] Client created successfully')
    return client
  } catch (error) {
    console.error('[SUPABASE-CLIENT] Error creating client:', error)
    // Fallback: create a minimal client
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    })
  }
}

// Create the client instance
export const supabase = createSupabaseClient()