'use client'

import { useState } from 'react'
import CleanFreedomScore from '../../components/CleanFreedomScore'

export default function AssessmentPage() {
  const [showTest, setShowTest] = useState(false)

  if (showTest) {
    return <CleanFreedomScore />
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Freedom Score Assessment</h1>
          <p className="text-lg text-gray-600 mb-8">
            Ready to take your Freedom Score diagnostic? This will load the full 12-question assessment.
          </p>
          
          <div className="text-center">
            <button
              onClick={() => setShowTest(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold"
            >
              Start Freedom Score Assessment
            </button>
          </div>
          
          <div className="mt-8 text-center">
            <a 
              href="/" 
              className="text-blue-600 hover:text-blue-800"
            >
              ← Back to Homepage
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}