import { createClient } from '@supabase/supabase-js'

// Hardcoded values for now to get the site working
// TODO: Replace with environment variables once Vercel issue is resolved
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kmpdmofcqdfqwcsvrwvv.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttcGRtb2ZjcWRmcXdjc3Zyd3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MTkzMTksImV4cCI6MjA3MTI5NTMxOX0.tXuEepbVcmF3zMnayfYAHJ12o24auRosK02s-p6RnBs'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)