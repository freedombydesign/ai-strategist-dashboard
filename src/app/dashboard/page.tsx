'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import SimpleSprintPlanner from '@/components/SimpleSprintPlanner'
import { diagnosticService } from '@/services/diagnosticService'
import { LogOut } from 'lucide-react'

export default function Dashboard() {
  const { user, signOut } = useAuth()
  const [freedomScore, setFreedomScore] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)

  // Hydration effect
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (!isHydrated || !user?.id) return
    
    loadUserDiagnosticData()
  }, [isHydrated, user])

  const loadUserDiagnosticData = async () => {
    try {
      setLoading(true)
      console.log('[DASHBOARD] Starting to load user diagnostic data')
      
      // First try localStorage for immediate loading
      const scoreData = localStorage.getItem('lastFreedomScore')
      const completedAt = localStorage.getItem('scoreCompletedAt')
      
      if (scoreData) {
        console.log('[DASHBOARD] Found localStorage data, loading immediately')
        const parsed = JSON.parse(scoreData)
        setFreedomScore({
          ...parsed,
          completedAt: completedAt
        })
        setLoading(false)
        
        // Then try database in background for updates
        console.log('[DASHBOARD] Checking database for updates...')
        try {
          const userResponses = await diagnosticService.getUserResponses(user!.id)
          
          if (userResponses.length > 0) {
            const mostRecent = userResponses[0]
            console.log('[DASHBOARD] Found database data, updating')
            setFreedomScore({
              ...mostRecent.scoreResult,
              completedAt: mostRecent.created_at
            })
          }
        } catch (dbError) {
          console.error('[DASHBOARD] Database lookup failed, using localStorage:', dbError)
        }
      } else {
        // No localStorage, must try database
        console.log('[DASHBOARD] No localStorage, trying database...')
        const userResponses = await diagnosticService.getUserResponses(user!.id)
        
        if (userResponses.length > 0) {
          const mostRecent = userResponses[0]
          setFreedomScore({
            ...mostRecent.scoreResult,
            completedAt: mostRecent.created_at
          })
        }
        setLoading(false)
      }
    } catch (err) {
      console.error('[DASHBOARD] Error loading dashboard data:', err)
      setError('Error loading diagnostic data')
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Error: {error}</p>
          <button 
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.location.reload()
              }
            }} 
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Freedom Dashboard</h1>
              <p className="text-gray-600">Welcome back, {user?.email?.split('@')[0] || 'User'}!</p>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/ai-strategist"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
              >
                AI Strategist
              </Link>
              <button
                onClick={signOut}
                className="flex items-center gap-2 text-red-600 hover:text-red-800 font-medium"
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
            <h2 className="text-xl font-semibold mb-2">
              Welcome to your Freedom Operating System!
            </h2>
            <p className="text-blue-100">Ready to continue optimizing your business?</p>
          </div>
        </div>

        {freedomScore ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Freedom Score */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Freedom Score</h3>
                
                <div className="flex items-center mb-4">
                  <div className="text-4xl font-bold text-blue-600 mr-4">
                    {freedomScore.percent}%
                  </div>
                  <div>
                    <div className="text-gray-600">Total: {freedomScore.totalScore}/60</div>
                    <div className="text-sm text-gray-500">
                      {freedomScore.completedAt && `Completed ${new Date(freedomScore.completedAt).toLocaleDateString()}`}
                    </div>
                  </div>
                </div>

                {/* Module Breakdown */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                  {Object.entries(freedomScore.moduleAverages).map(([module, score]: [string, any]) => (
                    <div key={module} className="bg-gray-50 rounded-lg p-3 text-center">
                      <div className="text-sm text-gray-600 mb-1">
                        {getModuleName(module)}
                      </div>
                      <div className="text-xl font-bold text-gray-900">{score}</div>
                      <div className="text-xs text-gray-500">out of 10</div>
                    </div>
                  ))}
                </div>

                <div className="flex space-x-3">
                  <Link
                    href="/assessment"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
                  >
                    Retake Assessment
                  </Link>
                  <Link
                    href="/ai-strategist"
                    className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm"
                  >
                    Discuss with AI
                  </Link>
                </div>
              </div>

              {/* Sprint Planning */}
              <SimpleSprintPlanner freedomScore={freedomScore} />
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* AI Strategist */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Strategist</h3>
                <p className="text-gray-600 mb-4">
                  Get personalized coaching based on your Freedom Score results.
                </p>
                <Link
                  href="/ai-strategist"
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-lg flex items-center justify-center"
                >
                  Start Coaching
                </Link>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <Link
                    href="/assessment"
                    className="flex items-center text-gray-600 hover:text-gray-900"
                  >
                    <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Retake Assessment
                  </Link>
                  <Link
                    href="/ai-strategist"
                    className="flex items-center text-gray-600 hover:text-gray-900"
                  >
                    <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Ask Questions
                  </Link>
                </div>
              </div>

              {/* Sprint Sequence */}
              {freedomScore.recommendedOrder && (
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Sprint Sequence</h3>
                  <div className="space-y-3">
                    {freedomScore.recommendedOrder.slice(0, 3).map((sprint: any, index: number) => (
                      <div key={sprint.sprintKey} className="flex items-start">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mr-3 ${
                          index === 0 ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
                        }`}>
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className={`text-sm ${index === 0 ? 'font-medium text-gray-900' : 'text-gray-600'}`}>
                            {sprint.title}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* No Score Yet */
          <div className="bg-white rounded-lg shadow-sm border p-8">
            <div className="text-center">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Take Your Freedom Score Assessment
              </h3>
              <p className="text-gray-500 mb-6">
                Discover your business bottlenecks and get personalized recommendations
              </p>
              <Link
                href="/assessment"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg inline-flex items-center"
              >
                Start Assessment
              </Link>
            </div>
          </div>
        )}
      </div>
      </div>
    </ProtectedRoute>
  )
}

function getModuleName(module: string) {
  const names: Record<string, string> = {
    'M1': 'Position for Profit',
    'M2': 'Buyer Journey',
    'M3': 'Systems',
    'M4': 'Sales System',
    'M5': 'Delivery',
    'M6': 'Improvement'
  }
  return names[module] || module
}