'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function DashboardPage() {
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
  
  // For main domain, show dashboard selection
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Choose Your Dashboard
          </h1>
          <p className="text-xl text-blue-200 mb-12 max-w-2xl mx-auto">
            Access your advanced business management systems
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Freedom Suite Dashboard */}
            <Link
              href="https://suite.scalewithruth.com"
              className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-8 hover:bg-white/20 transition-all duration-300"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mb-6 mx-auto">
                <span className="text-3xl">🚀</span>
              </div>
              <h3 className="text-2xl font-semibold text-white mb-4">Freedom Suite Dashboard</h3>
              <p className="text-blue-200 mb-6">
                Complete business management platform with DeliverEase, ProfitPulse, Cash Flow Command, and Convert Flow systems.
              </p>
              <div className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium">
                Access Freedom Suite →
              </div>
            </Link>

            {/* AI Intelligence Dashboard */}
            <Link
              href="https://ai.scalewithruth.com"
              className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-8 hover:bg-white/20 transition-all duration-300"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center mb-6 mx-auto">
                <span className="text-3xl">🧠</span>
              </div>
              <h3 className="text-2xl font-semibold text-white mb-4">AI Intelligence Dashboard</h3>
              <p className="text-blue-200 mb-6">
                Strategic AI-powered business command center with AI Strategist, Implementation Coach, and Executive Analytics.
              </p>
              <div className="bg-purple-600 text-white px-6 py-3 rounded-lg font-medium">
                Access AI Intelligence →
              </div>
            </Link>
          </div>

          <div className="mt-12">
            <Link
              href="/"
              className="text-blue-300 hover:text-blue-200 transition-colors"
            >
              ← Back to Homepage
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}