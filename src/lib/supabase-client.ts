import { createClient } from '@supabase/supabase-js'

// Hardcoded values to ensure they work - bypassing environment variable issues
const supabaseUrl = 'https://kmpdmofcqdfqwcsvrwvv.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttcGRtb2ZjcWRmcXdjc3Zyd3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MTkzMTksImV4cCI6MjA3MTI5NTMxOX0.tXuEepbVcmF3zMnayfYAHJ12o24auRosK02s-p6RnBs'

console.log('[SUPABASE-CLIENT] Creating client with URL:', supabaseUrl)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)