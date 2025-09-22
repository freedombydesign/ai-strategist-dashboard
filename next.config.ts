  import type { NextConfig } from "next"

  const nextConfig: NextConfig = {
    eslint: {
      ignoreDuringBuilds: true,
    },
    typescript: {
      ignoreBuildErrors: true,
    },
    // Performance optimizations
    compress: true,
    poweredByHeader: false,
    generateEtags: true,
    // Remove env override that was blocking Supabase variables
    webpack: (config: any, { isServer }: { isServer: boolean }) => {
      // Fix for Windows case sensitivity issues
      config.resolve.symlinks = false

      // Optimize bundle
      if (!isServer && config.optimization.splitChunks) {
        config.optimization.splitChunks.chunks = 'all'
        config.optimization.splitChunks.cacheGroups = {
          ...config.optimization.splitChunks.cacheGroups,
          lucide: {
            test: /[\\/]node_modules[\\/]lucide-react[\\/]/,
            name: 'lucide',
            chunks: 'all',
          },
        }
      }

      return config
    },
    experimental: {
      // Help with Windows development issues
      esmExternals: 'loose',
    },
  }

  export default nextConfig