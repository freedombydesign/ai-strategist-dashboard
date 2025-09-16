'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // Only redirect from the root path, never redirect deep links
    const currentPath = window.location.pathname
    console.log('[HOME-PAGE] Current path:', currentPath)

    // NEVER redirect if we're not on root - this protects /diagnostic-assessment
    if (currentPath !== '/') {
      console.log('[HOME-PAGE] Not root path, no redirect')
      return
    }

    console.log('[HOME-PAGE] Root path detected, redirecting to AI Intelligence')
    router.replace('/ai-intelligence')
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