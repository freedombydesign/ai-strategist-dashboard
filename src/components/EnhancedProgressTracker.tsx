'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { implementationService, type ImplementationProgress } from '../services/implementationService'
import { TrendingUp, Zap, Target, Calendar, Flame, Award } from 'lucide-react'

interface EnhancedProgressTrackerProps {
  sprintId: string
  sprintName: string
  totalTasks: number
  completedTasks: number
  className?: string
}

export default function EnhancedProgressTracker({ 
  sprintId, 
  sprintName, 
  totalTasks, 
  completedTasks,
  className = '' 
}: EnhancedProgressTrackerProps) {
  const { user } = useAuth()
  const [progress, setProgress] = useState<ImplementationProgress | null>(null)
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.id && sprintId) {
      loadProgressData()
    }
  }, [user?.id, sprintId, completedTasks, totalTasks])

  const loadProgressData = async () => {
    try {
      setLoading(true)
      
      // Update progress with current data
      await implementationService.updateSprintProgress(
        user!.id, 
        sprintId, 
        completedTasks, 
        totalTasks
      )

      // Load updated progress
      const progressData = await implementationService.getProgressForSprint(user!.id, sprintId)
      const analyticsData = await implementationService.getImplementationAnalytics(user!.id)
      
      setProgress(progressData)
      setAnalytics(analyticsData)
      
      console.log('[ENHANCED-PROGRESS] Loaded data:', { progressData, analyticsData })
    } catch (error) {
      console.error('[ENHANCED-PROGRESS] Error loading progress:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
        </div>
      </div>
    )
  }

  const completionPercentage = progress?.completion_percentage || 0
  const momentumScore = progress?.momentum_score || 0
  const streakDays = progress?.streak_days || 0

  return (
    <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Implementation Progress</h3>
          <p className="text-sm text-gray-600">{sprintName}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-600">{completionPercentage}%</div>
          <div className="text-xs text-gray-500">Complete</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Progress</span>
          <span>{completedTasks} of {totalTasks} tasks</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className={`h-3 rounded-full transition-all duration-500 ${
              completionPercentage >= 100 ? 'bg-green-600' :
              completionPercentage >= 75 ? 'bg-blue-600' :
              completionPercentage >= 50 ? 'bg-yellow-500' :
              'bg-red-500'
            }`}
            style={{ width: `${Math.min(completionPercentage, 100)}%` }}
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Momentum Score */}
        <div className="bg-purple-50 p-4 rounded-lg text-center">
          <TrendingUp className="text-purple-600 mx-auto mb-2" size={24} />
          <div className="font-bold text-purple-900">{momentumScore}</div>
          <div className="text-xs text-purple-700">Momentum</div>
        </div>

        {/* Current Streak */}
        <div className="bg-orange-50 p-4 rounded-lg text-center">
          <Flame className="text-orange-600 mx-auto mb-2" size={24} />
          <div className="font-bold text-orange-900">{streakDays}</div>
          <div className="text-xs text-orange-700">Day Streak</div>
        </div>

        {/* Energy Level */}
        <div className="bg-green-50 p-4 rounded-lg text-center">
          <Zap className="text-green-600 mx-auto mb-2" size={24} />
          <div className="font-bold text-green-900">
            {analytics?.averageEnergyLevel || '—'}/10
          </div>
          <div className="text-xs text-green-700">Avg Energy</div>
        </div>

        {/* Check-ins */}
        <div className="bg-blue-50 p-4 rounded-lg text-center">
          <Calendar className="text-blue-600 mx-auto mb-2" size={24} />
          <div className="font-bold text-blue-900">{analytics?.totalCheckins || 0}</div>
          <div className="text-xs text-blue-700">Check-ins</div>
        </div>
      </div>

      {/* Achievements */}
      {(streakDays >= 7 || completionPercentage >= 50 || momentumScore >= 100) && (
        <div className="mt-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
          <div className="flex items-center mb-2">
            <Award className="text-yellow-600 mr-2" size={20} />
            <span className="font-semibold text-yellow-900">Achievements Unlocked! 🎉</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {streakDays >= 7 && (
              <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">
                🔥 Week Warrior ({streakDays} days)
              </span>
            )}
            {completionPercentage >= 50 && (
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                🎯 Halfway Hero
              </span>
            )}
            {momentumScore >= 100 && (
              <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                ⚡ Momentum Master
              </span>
            )}
            {completionPercentage >= 100 && (
              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                ✅ Sprint Champion
              </span>
            )}
          </div>
        </div>
      )}

      {/* Completion Trend */}
      {analytics?.completionTrend && analytics.completionTrend.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Daily Task Completion (Last 7 Days)</h4>
          <div className="flex items-end space-x-1 h-16">
            {analytics.completionTrend.map((count: number, index: number) => (
              <div
                key={index}
                className="flex-1 bg-blue-200 rounded-t relative group"
                style={{ 
                  height: `${Math.max((count / Math.max(...analytics.completionTrend)) * 100, 10)}%` 
                }}
              >
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                  {count} tasks
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>7 days ago</span>
            <span>Today</span>
          </div>
        </div>
      )}

      {/* Action Items */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        {completionPercentage < 100 && (
          <div className="text-sm text-gray-600">
            {streakDays === 0 && (
              <p>💡 <strong>Get started:</strong> Complete your first daily check-in to start building momentum!</p>
            )}
            {streakDays > 0 && streakDays < 3 && (
              <p>🔥 <strong>Build momentum:</strong> Keep your streak alive - check in daily!</p>
            )}
            {streakDays >= 3 && completionPercentage < 50 && (
              <p>⚡ <strong>Great consistency!</strong> Focus on completing more tasks to boost progress.</p>
            )}
            {completionPercentage >= 50 && completionPercentage < 100 && (
              <p>🎯 <strong>Almost there!</strong> You're over halfway - maintain the momentum!</p>
            )}
          </div>
        )}
        {completionPercentage >= 100 && (
          <div className="text-sm text-green-700 bg-green-50 p-3 rounded-lg">
            🎉 <strong>Sprint Complete!</strong> Amazing work! Ready for your next challenge?
          </div>
        )}
      </div>
    </div>
  )
}