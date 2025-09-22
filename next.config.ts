  import type { NextConfig } from "next"

  const nextConfig: NextConfig = {
    eslint: {
      ignoreDuringBuilds: true,
    },
    typescript: {
      ignoreBuildErrors: true,
    },
    // Minimal config for memory optimization
    poweredByHeader: false,
    // Simplified webpack config
    webpack: (config: any) => {
      config.resolve.symlinks = false
      return config
    }
  }

  export default nextConfig