import { createClient } from '@supabase/supabase-js'

// Function to get Supabase URL with fallback
const getSupabaseUrl = (): string => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url && typeof window !== 'undefined') {
    console.warn('NEXT_PUBLIC_SUPABASE_URL is missing');
    return 'https://placeholder.supabase.co';
  }
  return url || 'https://placeholder.supabase.co';
};

// Function to get Supabase anon key with fallback
const getSupabaseAnonKey = (): string => {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key && typeof window !== 'undefined') {
    console.warn('NEXT_PUBLIC_SUPABASE_ANON_KEY is missing');
    return 'placeholder-key-for-build';
  }
  return key || 'placeholder-key-for-build';
};

// Create client with proper environment variable handling
export const supabase = createClient(
  getSupabaseUrl(),
  getSupabaseAnonKey()
)