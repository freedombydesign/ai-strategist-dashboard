'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import MobileOptimizedLayout from '@/components/MobileOptimizedLayout'
import UltimateImplementationCoach from '@/components/UltimateImplementationCoach'
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

          {/* Ultimate Implementation Coach - Bypasses all JavaScript interference */}
          <UltimateImplementationCoach />
        </div>
      </div>
      </MobileOptimizedLayout>
    </ProtectedRoute>
  )
}