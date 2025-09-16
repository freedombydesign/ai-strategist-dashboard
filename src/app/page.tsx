'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // COMPLETELY DISABLED - No automatic redirects
    // This prevents interference with /diagnostic-assessment and other routes
    console.log('[HOME-PAGE] Redirect disabled for launch - no automatic redirects')
  }, [router])
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
      <div className="text-center max-w-4xl mx-auto px-4">
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">Business Systemizer</h1>
        <p className="text-xl text-purple-200 mb-12 max-w-2xl mx-auto">
          Transform your service delivery workflows into streamlined, repeatable systems that scale your business.
        </p>
        <div className="space-y-6">
          <a
            href="/diagnostic-assessment"
            className="inline-block bg-white text-purple-900 px-12 py-4 rounded-lg text-xl font-bold hover:bg-purple-50 transition-colors shadow-lg"
          >
            Start Your Freedom Assessment
          </a>
          <p className="text-purple-300 text-sm">
            Discover your Business Freedom Score in 5 minutes
          </p>
        </div>
      </div>
    </div>
  )
}