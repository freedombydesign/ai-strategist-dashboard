'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import MobileOptimizedLayout from '@/components/MobileOptimizedLayout'
import ImplementationCoach from '@/components/ImplementationCoach'
import { implementationService } from '@/services/implementationService'
import { ArrowLeft, Bot, TrendingUp, Flame, Calendar, Target, BarChart3 } from 'lucide-react'

export default function ImplementationCoachPage() {
  const { user } = useAuth()
  const [analytics, setAnalytics] = useState<any>(null)
  const [streakDays, setStreakDays] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.id) {
      loadAnalytics()
    }
  }, [user?.id])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      
      const [analyticsData, streak] = await Promise.all([
        implementationService.getImplementationAnalytics(user!.id),
        implementationService.calculateStreakDays(user!.id)
      ])

      setAnalytics(analyticsData)
      setStreakDays(streak)
    } catch (error) {
      console.error('[COACH-PAGE] Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ProtectedRoute>
      <MobileOptimizedLayout>
      <div className="min-h-screen bg-gray-50 py-4 md:py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/dashboard"
              className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
            >
              <ArrowLeft size={20} className="mr-2" />
              Back to Dashboard
            </Link>
            
            <div className="flex items-center mb-6">
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-3 rounded-lg mr-4">
                <Bot className="text-white" size={32} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Implementation Coach</h1>
                <p className="text-gray-600 text-lg">
                  Your AI accountability partner for accelerated progress and obstacle resolution
                </p>
              </div>
            </div>

            {/* Analytics Overview */}
            {!loading && analytics && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                {/* Current Streak */}
                <div className="bg-white p-4 rounded-lg shadow-sm border text-center">
                  <Flame className="text-orange-600 mx-auto mb-2" size={24} />
                  <div className="text-2xl font-bold text-gray-900">{streakDays}</div>
                  <div className="text-sm text-gray-600">Day Streak</div>
                </div>

                {/* Total Check-ins */}
                <div className="bg-white p-4 rounded-lg shadow-sm border text-center">
                  <Calendar className="text-blue-600 mx-auto mb-2" size={24} />
                  <div className="text-2xl font-bold text-gray-900">{analytics.totalCheckins}</div>
                  <div className="text-sm text-gray-600">Check-ins</div>
                </div>

                {/* Average Energy */}
                <div className="bg-white p-4 rounded-lg shadow-sm border text-center">
                  <Target className="text-green-600 mx-auto mb-2" size={24} />
                  <div className="text-2xl font-bold text-gray-900">{analytics.averageEnergyLevel}/10</div>
                  <div className="text-sm text-gray-600">Avg Energy</div>
                </div>

                {/* Current Streak Badge */}
                <div className="bg-white p-4 rounded-lg shadow-sm border text-center">
                  <TrendingUp className="text-purple-600 mx-auto mb-2" size={24} />
                  <div className="text-2xl font-bold text-gray-900">{analytics.currentStreak}</div>
                  <div className="text-sm text-gray-600">Current Streak</div>
                </div>

                {/* Completion Trend */}
                <div className="bg-white p-4 rounded-lg shadow-sm border text-center">
                  <BarChart3 className="text-indigo-600 mx-auto mb-2" size={24} />
                  <div className="text-2xl font-bold text-gray-900">
                    {analytics.completionTrend?.length > 0 
                      ? Math.round(analytics.completionTrend.reduce((a: number, b: number) => a + b, 0) / analytics.completionTrend.length)
                      : 0
                    }
                  </div>
                  <div className="text-sm text-gray-600">Avg Tasks/Day</div>
                </div>
              </div>
            )}

            {loading && (
              <div className="grid grid-cols-5 gap-4 mb-6">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="bg-white p-4 rounded-lg shadow-sm border">
                    <div className="animate-pulse">
                      <div className="h-6 bg-gray-200 rounded mb-2"></div>
                      <div className="h-8 bg-gray-200 rounded mb-1"></div>
                      <div className="h-4 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Chat Interface */}
            <div className="lg:col-span-2">
              <ImplementationCoach />
            </div>

            {/* Coaching Insights Sidebar */}
            <div className="space-y-6">
              {/* What I Do */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">What I Help With</h3>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <div className="bg-purple-100 rounded-full p-1 mr-3 mt-1">
                      <TrendingUp size={12} className="text-purple-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 text-sm">Pattern Recognition</div>
                      <div className="text-xs text-gray-600">Identify trends in your energy, productivity, and obstacles</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="bg-blue-100 rounded-full p-1 mr-3 mt-1">
                      <Target size={12} className="text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 text-sm">Obstacle Resolution</div>
                      <div className="text-xs text-gray-600">Analyze recurring challenges and suggest specific solutions</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="bg-green-100 rounded-full p-1 mr-3 mt-1">
                      <Flame size={12} className="text-green-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 text-sm">Accountability Systems</div>
                      <div className="text-xs text-gray-600">Build habits and momentum for consistent progress</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="bg-orange-100 rounded-full p-1 mr-3 mt-1">
                      <BarChart3 size={12} className="text-orange-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 text-sm">Performance Optimization</div>
                      <div className="text-xs text-gray-600">Connect daily actions to business results</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Patterns */}
              {analytics && analytics.completionTrend && analytics.completionTrend.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Insights</h3>
                  
                  <div className="space-y-3">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="font-medium text-blue-900 text-sm mb-1">Task Completion Trend</div>
                      <div className="flex items-end space-x-1 h-8">
                        {analytics.completionTrend.slice(0, 7).map((count: number, index: number) => (
                          <div
                            key={index}
                            className="flex-1 bg-blue-300 rounded-t"
                            style={{ 
                              height: `${Math.max((count / Math.max(...analytics.completionTrend)) * 100, 15)}%` 
                            }}
                          />
                        ))}
                      </div>
                      <div className="text-xs text-blue-700 mt-2">Last 7 days</div>
                    </div>

                    <div className="p-3 bg-orange-50 rounded-lg">
                      <div className="font-medium text-orange-900 text-sm">Current Status</div>
                      <div className="text-xs text-orange-700 mt-1">
                        {streakDays === 0 && "Ready to start your streak! Let's build momentum together."}
                        {streakDays >= 1 && streakDays < 7 && "Building momentum! Stay consistent to strengthen your habits."}
                        {streakDays >= 7 && "Excellent consistency! Let's optimize for even better results."}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <Link
                    href="/checkin"
                    className="block w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium text-center transition-colors"
                  >
                    Complete Daily Check-in
                  </Link>
                  
                  <Link
                    href="/business-metrics"
                    className="block w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium text-center transition-colors"
                  >
                    Update Business Metrics
                  </Link>
                  
                  <Link
                    href="/ai-strategist"
                    className="block w-full border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium text-center transition-colors"
                  >
                    Switch to Strategic Coach
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </MobileOptimizedLayout>
    </ProtectedRoute>
  )
}