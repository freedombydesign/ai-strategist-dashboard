'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // Only redirect if we're on the exact root path
    // This prevents breaking deep links like /diagnostic-assessment
    if (window.location.pathname === '/') {
      router.replace('/ai-intelligence')
    }
  }, [router])
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to AI Intelligence...</p>
      </div>
    </div>
  )
}