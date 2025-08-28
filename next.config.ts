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
      BUILD_ID: Date.now().toString(),
    },
    generateBuildId: async () => {
      // Force new build ID to invalidate all cached bundles
      return `production-clean-${Date.now()}`
    },
  }

  export default nextConfig