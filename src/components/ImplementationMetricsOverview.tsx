'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { implementationService } from '../services/implementationService'
import { businessMetricsService } from '../services/businessMetricsService'
import { TrendingUp, Target, Flame, Calendar, DollarSign } from 'lucide-react'
import Link from 'next/link'

interface ImplementationMetricsOverviewProps {
  className?: string
}

export default function ImplementationMetricsOverview({ className = '' }: ImplementationMetricsOverviewProps) {
  const { user } = useAuth()
  const [analytics, setAnalytics] = useState<any>(null)
  const [businessData, setBusinessData] = useState<any>(null)
  const [streakDays, setStreakDays] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.id) {
      loadMetricsData()
    }
  }, [user?.id])

  const loadMetricsData = async () => {
    try {
      setLoading(true)
      
      const [analyticsData, businessAnalytics, streak] = await Promise.all([
        implementationService.getImplementationAnalytics(user!.id),
        businessMetricsService.getBusinessAnalytics(user!.id),
        implementationService.calculateStreakDays(user!.id)
      ])

      setAnalytics(analyticsData)
      setBusinessData(businessAnalytics)
      setStreakDays(streak)
      
    } catch (error) {
      console.error('[IMPLEMENTATION-OVERVIEW] Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900">Implementation Overview</h3>
        <div className="text-sm text-gray-500">Last 30 days</div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {/* Current Streak */}
        <div className="bg-orange-50 p-4 rounded-lg text-center">
          <Flame className="text-orange-600 mx-auto mb-2" size={24} />
          <div className="text-2xl font-bold text-orange-900">{streakDays}</div>
          <div className="text-xs text-orange-700">Day Streak</div>
        </div>

        {/* Total Check-ins */}
        <div className="bg-blue-50 p-4 rounded-lg text-center">
          <Calendar className="text-blue-600 mx-auto mb-2" size={24} />
          <div className="text-2xl font-bold text-blue-900">{analytics?.totalCheckins || 0}</div>
          <div className="text-xs text-blue-700">Check-ins</div>
        </div>

        {/* Average Energy */}
        <div className="bg-green-50 p-4 rounded-lg text-center">
          <Target className="text-green-600 mx-auto mb-2" size={24} />
          <div className="text-2xl font-bold text-green-900">
            {analytics?.averageEnergyLevel || 0}/10
          </div>
          <div className="text-xs text-green-700">Avg Energy</div>
        </div>

        {/* Business Growth */}
        <div className="bg-purple-50 p-4 rounded-lg text-center">
          <TrendingUp className="text-purple-600 mx-auto mb-2" size={24} />
          <div className="text-2xl font-bold text-purple-900">
            {businessData?.recentTrend === 'up' ? '+' : businessData?.recentTrend === 'down' ? '-' : ''}
            {businessData?.recentTrendPercentage || 0}%
          </div>
          <div className="text-xs text-purple-700">Profit Trend</div>
        </div>
      </div>

      {/* Business Health Summary */}
      {businessData && businessData.totalSnapshots > 0 && (
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-gray-900 flex items-center">
              <DollarSign className="text-gray-600 mr-2" size={18} />
              Business Health
            </h4>
            <Link href="/business-metrics" className="text-blue-600 hover:text-blue-700 text-sm">
              Details →
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-gray-900">
                ${businessData.averageRevenue.toLocaleString()}
              </div>
              <div className="text-xs text-gray-600">Avg Revenue</div>
            </div>
            <div>
              <div className="text-lg font-bold text-gray-900">
                ${businessData.averageProfit.toLocaleString()}
              </div>
              <div className="text-xs text-gray-600">Avg Profit</div>
            </div>
            <div>
              <div className="text-lg font-bold text-gray-900">
                {businessData.averageMargin.toFixed(1)}%
              </div>
              <div className="text-xs text-gray-600">Margin</div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="space-y-3">
        <div className="text-sm font-medium text-gray-700 mb-3">Quick Actions</div>
        
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/checkin"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium text-center transition-colors"
          >
            Daily Check-in
          </Link>
          
          <Link
            href="/business-metrics"
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium text-center transition-colors"
          >
            Update Metrics
          </Link>
        </div>
      </div>

      {/* Achievements Preview */}
      {(streakDays >= 7 || (analytics?.totalCheckins || 0) >= 10) && (
        <div className="mt-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
          <h4 className="font-semibold text-yellow-900 mb-2">🏆 Recent Achievements</h4>
          <div className="space-y-1">
            {streakDays >= 7 && (
              <div className="text-sm text-yellow-800">
                🔥 Week Warrior - {streakDays} day streak!
              </div>
            )}
            {(analytics?.totalCheckins || 0) >= 10 && (
              <div className="text-sm text-yellow-800">
                📈 Consistency Champion - {analytics.totalCheckins} check-ins
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}