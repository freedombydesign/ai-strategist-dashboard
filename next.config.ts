  import type { NextConfig } from "next"

  const nextConfig: NextConfig = {
    eslint: {
      ignoreDuringBuilds: true,
    },
    typescript: {
      ignoreBuildErrors: true,
    },
    // Remove env override that was blocking Supabase variables
    webpack: (config: any, { isServer }: { isServer: boolean }) => {
      // Fix for Windows case sensitivity issues
      config.resolve.symlinks = false
      return config
    },
    experimental: {
      // Help with Windows development issues
      esmExternals: 'loose',
    },
  }

  export default nextConfig