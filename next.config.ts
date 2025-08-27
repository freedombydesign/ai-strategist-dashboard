  import type { NextConfig } from "next"

  const nextConfig: NextConfig = {
    eslint: {
      ignoreDuringBuilds: true,
    },
    typescript: {
      ignoreBuildErrors: true,
    },
    env: {
      // Override any Supabase env vars to prevent multiple client creation
      NEXT_PUBLIC_SUPABASE_URL: '',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: '',
    },
  }

  export default nextConfig