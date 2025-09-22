'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useAuth } from '@/context/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import { diagnosticService } from '@/services/diagnosticService'
import BusinessContextOnboarding from '@/components/BusinessContextOnboarding'
import DailyCheckinPrompt from '@/components/DailyCheckinPrompt'
import { 
  ChartBarIcon,
  TrophyIcon,
  RocketLaunchIcon,
  SparklesIcon,
  ArrowTrendingUpIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline'
import { MobileNavigation, FloatingActionButton } from '@/components/MobileNavigation'
import { useRouter } from 'next/navigation'

// Import all the missing components
import SimpleSprintPlanner from '@/components/SimpleSprintPlanner'
import SimpleDashboardProgress from '@/components/SimpleDashboardProgress'
import BusinessMetricsWidget from '@/components/BusinessMetricsWidget'
import ImplementationMetricsOverview from '@/components/ImplementationMetricsOverview'
import AchievementWidget from '@/components/AchievementWidget'
import EnhancedSprintTracker from '@/components/EnhancedSprintTracker'
import SprintDebugWidget from '@/components/SprintDebugWidget'
import { LogOut } from 'lucide-react'

export default function Dashboard() {
  const { user, signOut, isSigningOut } = useAuth()
  const [freedomScore, setFreedomScore] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showBusinessOnboarding, setShowBusinessOnboarding] = useState(false)
  const [isAISubdomain, setIsAISubdomain] = useState(false)
  const router = useRouter()
  
  useEffect(() => {
    // Check if we're on the ai.scalewithruth.com subdomain
    const hostname = window.location.hostname
    if (hostname === 'ai.scalewithruth.com') {
      setIsAISubdomain(true)
      router.replace('/ai-intelligence')
      return
    }
    
    if (user?.id) {
      loadUserDiagnosticData()
    }
  }, [user?.id, router])

  const loadUserDiagnosticData = async () => {
    try {
      setLoading(true)
      
      // Try localStorage first
      const scoreData = localStorage.getItem('lastFreedomScore')
      if (scoreData) {
        const parsed = JSON.parse(scoreData)
        setFreedomScore(parsed)
        setLoading(false)
        return
      }

      // Then try database
      const userResponses = await diagnosticService.getUserResponses(user!.id)
      if (userResponses.length > 0) {
        const mostRecent = userResponses[0]
        setFreedomScore({
          ...mostRecent.scoreResult,
          completedAt: mostRecent.created_at
        })
      }
      setLoading(false)
    } catch (err) {
      console.error('Error loading dashboard data:', err)
      setError('Error loading diagnostic data')
      setLoading(false)
    }
  }

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
            onClick={() => window.location.reload()} 
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
                <h1 className="text-2xl font-bold text-gray-900">Executive Dashboard</h1>
                <p className="text-gray-600">Welcome back, {user?.email?.split('@')[0] || 'User'}!</p>
              </div>
              <div className="flex items-center gap-4">
                <Link
                  href="/business-metrics"
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
                >
                  Analytics
                </Link>
                <Link
                  href="/achievements"
                  className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg"
                >
                  Achievements
                </Link>
                <Link
                  href="/checkin"
                  className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg"
                >
                  Check-in
                </Link>
                <Link
                  href="/export-manager"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                >
                  Export Manager
                </Link>
                <Link
                  href="/admin"
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg"
                >
                  Admin
                </Link>
                <button
                  onClick={signOut}
                  disabled={isSigningOut}
                  className={`flex items-center gap-2 font-medium ${
                    isSigningOut 
                      ? 'text-gray-400 cursor-not-allowed' 
                      : 'text-red-600 hover:text-red-800'
                  }`}
                >
                  <LogOut size={16} style={{width: '16px', height: '16px'}} />
                  {isSigningOut ? 'Signing Out...' : 'Sign Out'}
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
                    {Object.entries(freedomScore.moduleAverages || {}).map(([module, score]: [string, any]) => (
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

                {/* Debug Widget (temporary) */}
                <SprintDebugWidget />
                
                {/* Daily Check-in Prompt */}
                <DailyCheckinPrompt />
                
                {/* Enhanced Sprint Tracking */}
                <EnhancedSprintTracker freedomScore={freedomScore} />
                
                {/* Simple Sprint Progress */}
                <SimpleDashboardProgress freedomScore={freedomScore} />
                
                {/* Implementation Metrics Overview */}
                <ImplementationMetricsOverview />
                
                {/* Sprint Planning */}
                <SimpleSprintPlanner freedomScore={freedomScore} />
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Achievement Widget */}
                <AchievementWidget />
                
                {/* Business Metrics Widget */}
                <BusinessMetricsWidget />

                {/* AI Strategist */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Coaches</h3>
                  <div className="space-y-3">
                    <Link
                      href="/ai-strategist"
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-lg flex items-center justify-center"
                    >
                      <SparklesIcon className="w-4 h-4 mr-2" style={{width: '16px', height: '16px'}} />
                      AI Strategist
                    </Link>
                    <Link
                      href="/implementation-coach"
                      className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center"
                    >
                      <RocketLaunchIcon className="w-4 h-4 mr-2" style={{width: '16px', height: '16px'}} />
                      Implementation Coach
                    </Link>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <Link
                      href="/assessment"
                      className="flex items-center text-gray-600 hover:text-gray-900"
                    >
                      <ChartBarIcon className="w-4 h-4 mr-3" style={{width: '16px', height: '16px'}} />
                      Retake Freedom Score
                    </Link>
                    <Link
                      href="/business-metrics"
                      className="flex items-center text-gray-600 hover:text-gray-900"
                    >
                      <ArrowTrendingUpIcon className="w-4 h-4 mr-3" style={{width: '16px', height: '16px'}} />
                      Business Analytics
                    </Link>
                    <button
                      onClick={() => setShowBusinessOnboarding(true)}
                      className="flex items-center text-gray-600 hover:text-gray-900 w-full text-left"
                    >
                      <UserGroupIcon className="w-4 h-4 mr-3" style={{width: '16px', height: '16px'}} />
                      Update Business Profile
                    </button>
                    <Link
                      href="/achievements"
                      className="flex items-center text-gray-600 hover:text-gray-900"
                    >
                      <TrophyIcon className="w-4 h-4 mr-3" style={{width: '16px', height: '16px'}} />
                      View Achievements
                    </Link>
                    <Link
                      href="/export-manager"
                      className="flex items-center text-gray-600 hover:text-gray-900"
                    >
                      <ArrowTrendingUpIcon className="w-4 h-4 mr-3" style={{width: '16px', height: '16px'}} />
                      Export Manager
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* No Score Yet */
            <div className="bg-white rounded-lg shadow-sm border p-8">
              <div className="text-center">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" style={{width: '64px', height: '64px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

        {/* Business Context Onboarding Modal */}
        {showBusinessOnboarding && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              {/* Background overlay */}
              <div 
                className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                onClick={() => setShowBusinessOnboarding(false)}
              ></div>

              {/* Modal container */}
              <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full sm:p-6">
                {/* Close button */}
                <div className="absolute top-0 right-0 pt-4 pr-4">
                  <button
                    type="button"
                    className="bg-white rounded-md text-gray-400 hover:text-gray-600 focus:outline-none"
                    onClick={() => setShowBusinessOnboarding(false)}
                  >
                    <span className="sr-only">Close</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Business onboarding content */}
                <BusinessContextOnboarding 
                  onComplete={() => setShowBusinessOnboarding(false)}
                  onClose={() => setShowBusinessOnboarding(false)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Mobile Navigation */}
        <MobileNavigation />
        <FloatingActionButton />
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