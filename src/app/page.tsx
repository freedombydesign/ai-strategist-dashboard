'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function HomePage() {
  const router = useRouter()
  const [isAISubdomain, setIsAISubdomain] = useState(false)
  
  useEffect(() => {
    // Check if we're on the ai.scalewithruth.com subdomain
    const hostname = window.location.hostname
    if (hostname === 'ai.scalewithruth.com') {
      setIsAISubdomain(true)
      router.replace('/ai-intelligence')
    }
  }, [router])
  
  // If we're on the AI subdomain, show loading
  if (isAISubdomain) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to AI Intelligence...</p>
        </div>
      </div>
    )
  }
  
  // For main domain, show proper homepage
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Scale with Ruth
          </h1>
          <p className="text-xl text-blue-200 mb-12 max-w-3xl mx-auto">
            Advanced business systems and AI-powered tools for 7-figure founders who want their business to run without them.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
            {/* Freedom Suite */}
            <Link
              href="https://suite.scalewithruth.com"
              className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 hover:bg-white/20 transition-all duration-300"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <span className="text-2xl">🚀</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Freedom Suite</h3>
              <p className="text-blue-200 text-sm">Complete business management platform for 7-figure operations</p>
            </Link>

            {/* AI Intelligence */}
            <Link
              href="https://ai.scalewithruth.com"
              className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 hover:bg-white/20 transition-all duration-300"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <span className="text-2xl">🧠</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">AI Intelligence</h3>
              <p className="text-blue-200 text-sm">Strategic AI-powered business command center</p>
            </Link>

            {/* Coming Soon */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 opacity-60">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <span className="text-2xl">💎</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">More Systems</h3>
              <p className="text-blue-200 text-sm">Additional business optimization tools coming soon</p>
            </div>
          </div>

          <div className="mt-16 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8">
            <h2 className="text-2xl font-bold text-white mb-4">For 7-Figure Founders Only</h2>
            <p className="text-blue-200 max-w-2xl mx-auto">
              Sophisticated systems designed for business owners scaling from $1M to $10M+ ARR. 
              Built for minimal founder involvement and maximum operational efficiency.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}