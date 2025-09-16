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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">Business Systemizer</h1>
        <p className="text-xl text-gray-600 mb-8">Transform your service delivery workflows into streamlined, repeatable systems.</p>
        <div className="space-y-4">
          <a
            href="/ai-intelligence"
            className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Go to AI Intelligence
          </a>
          <br />
          <a
            href="/diagnostic-assessment"
            className="inline-block bg-purple-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-purple-700 transition-colors"
          >
            Take Diagnostic Assessment
          </a>
        </div>
      </div>
    </div>
  )
}