'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function DiagnosticStart() {
  const [isReady, setIsReady] = useState(false)

  if (isReady) {
    // This would redirect to your actual WorkingFreedomScore component
    window.location.href = '/assessment'
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Freedom Score™ Diagnostic
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Let's identify your biggest bottleneck and the right Sprint to remove it
          </p>
          
          <div className="bg-blue-50 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-blue-900 mb-4">What to expect:</h2>
            <ul className="text-left text-blue-800 space-y-2">
              <li>• 12 questions about your business systems</li>
              <li>• Takes 3-5 minutes to complete</li>
              <li>• Instant personalized Sprint recommendations</li>
              <li>• Your AI strategist will be ready to help</li>
            </ul>
          </div>
          
          <button 
            onClick={() => setIsReady(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold px-8 py-4 rounded-lg transition-colors mb-4"
          >
            Start Assessment
          </button>
          
          <div>
            <Link href="/" className="text-gray-600 hover:text-gray-800">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}