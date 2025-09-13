'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { achievementService, type Achievement, type MomentumScore } from '../services/achievementService'
import { Trophy, Star, TrendingUp, Award, ChevronRight } from 'lucide-react'
import Link from 'next/link'

interface AchievementWidgetProps {
  className?: string
}

export default function AchievementWidget({ className = '' }: AchievementWidgetProps) {
  const { user } = useAuth()
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [momentumScore, setMomentumScore] = useState<MomentumScore | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.id) {
      // Add a timeout to prevent infinite loading
      const loadTimeout = setTimeout(() => {
        if (loading) {
          console.warn('[ACHIEVEMENT-WIDGET] Loading timeout, setting fallback data')
          setAchievements([])
          setMomentumScore({
            current: 0,
            trend: 'stable',
            multiplier: 1,
            factors: {
              streakBonus: 0,
              consistencyBonus: 0,
              businessImpactBonus: 0,
              achievementBonus: 0
            }
          })
          setLoading(false)
        }
      }, 10000) // 10 second timeout

      loadAchievementData()
      
      return () => clearTimeout(loadTimeout)
    }
  }, [user?.id])

  const loadAchievementData = async () => {
    try {
      setLoading(true)
      
      const [userAchievements, momentum] = await Promise.all([
        achievementService.getUserAchievements(user!.id),
        achievementService.calculateMomentumScore(user!.id)
      ])

      setAchievements(userAchievements)
      setMomentumScore(momentum)
      
      console.log('[ACHIEVEMENT-WIDGET] Loaded data:', {
        achievementCount: userAchievements.length,
        unlockedAchievements: userAchievements.filter(a => a.unlocked),
        totalPoints: userAchievements.filter(a => a.unlocked).reduce((sum, a) => sum + a.points, 0),
        momentumScore: momentum,
        achievementSample: userAchievements.slice(0, 3)
      })
      
    } catch (error) {
      console.error('[ACHIEVEMENT-WIDGET] Error loading data:', error)
      // Set empty data so widget doesn't stay in loading state
      setAchievements([])
      setMomentumScore({
        current: 0,
        trend: 'stable',
        multiplier: 1,
        factors: {
          streakBonus: 0,
          consistencyBonus: 0,
          businessImpactBonus: 0,
          achievementBonus: 0
        }
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
          <div className="h-4 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  const unlockedCount = achievements.filter(a => a.unlocked).length
  const totalPoints = achievements.filter(a => a.unlocked).reduce((sum, a) => sum + a.points, 0)
  const recentUnlocked = achievements
    .filter(a => a.unlocked && a.unlockedAt)
    .sort((a, b) => new Date(b.unlockedAt!).getTime() - new Date(a.unlockedAt!).getTime())
    .slice(0, 3)

  const almostUnlocked = achievements
    .filter(a => !a.unlocked && a.progress! >= a.requirement * 0.8)
    .sort((a, b) => (b.progress! / b.requirement) - (a.progress! / a.requirement))
    .slice(0, 2)

  return (
    <div className={`bg-white rounded-lg shadow-sm border p-6 card-hover fade-in-scale ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Achievements</h3>
        <Link href="/achievements" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
          View All →
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {/* Momentum Score */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <Star className="text-yellow-500 mr-1" size={18} />
            <span className="text-xl font-bold text-gray-900">
              {momentumScore?.current || 0}
            </span>
          </div>
          <div className="text-xs text-gray-600">Momentum</div>
        </div>

        {/* Achievements */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <Trophy className="text-purple-500 mr-1" size={18} />
            <span className="text-xl font-bold text-gray-900">
              {unlockedCount}
            </span>
          </div>
          <div className="text-xs text-gray-600">Unlocked</div>
        </div>

        {/* Points */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <Award className="text-blue-500 mr-1" size={18} />
            <span className="text-xl font-bold text-gray-900">
              {totalPoints}
            </span>
          </div>
          <div className="text-xs text-gray-600">Points</div>
        </div>

        {/* Trend */}
        <div className="text-center">
          <div className={`flex items-center justify-center mb-1 ${
            momentumScore?.trend === 'up' ? 'text-green-500' :
            momentumScore?.trend === 'down' ? 'text-red-500' : 'text-gray-500'
          }`}>
            <TrendingUp size={18} />
          </div>
          <div className="text-xs text-gray-600">
            {momentumScore?.trend === 'up' ? 'Rising' : 
             momentumScore?.trend === 'down' ? 'Falling' : 'Stable'}
          </div>
        </div>
      </div>

      {/* Recent Achievements */}
      {recentUnlocked.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Recent Unlocks 🎉</h4>
          <div className="space-y-2">
            {recentUnlocked.map((achievement) => (
              <div key={achievement.id} className="flex items-center p-2 bg-green-50 rounded-lg spring-bounce">
                <div className="text-lg mr-3">{achievement.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-green-900 text-sm truncate">
                    {achievement.name}
                  </div>
                  <div className="text-xs text-green-700">
                    +{achievement.points} points
                  </div>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  achievementService.getRarityColor(achievement.rarity)
                }`}>
                  {achievement.rarity.toUpperCase()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Almost Unlocked */}
      {almostUnlocked.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Almost There! 🔥</h4>
          <div className="space-y-2">
            {almostUnlocked.map((achievement) => {
              const progressPercentage = Math.round((achievement.progress! / achievement.requirement) * 100)
              return (
                <div key={achievement.id} className="p-3 border border-orange-200 rounded-lg bg-orange-50">
                  <div className="flex items-center mb-2">
                    <div className="text-lg mr-3 grayscale">{achievement.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 text-sm">
                        {achievement.name}
                      </div>
                      <div className="text-xs text-gray-600">
                        {achievement.progress}/{achievement.requirement} ({progressPercentage}%)
                      </div>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className="bg-orange-500 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Call to Action */}
      <div className="pt-4 border-t border-gray-200">
        {unlockedCount === 0 ? (
          <div className="text-center">
            <Trophy className="mx-auto text-gray-300 mb-2" size={32} />
            <p className="text-sm text-gray-600 mb-3">
              Complete your first check-in to start earning achievements!
            </p>
            <Link
              href="/checkin"
              className="inline-flex items-center bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors btn-press mobile-tap-target"
            >
              Get Started
              <ChevronRight size={16} className="ml-1" />
            </Link>
          </div>
        ) : (
          <Link
            href="/achievements"
            className="block w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium text-center transition-colors btn-press mobile-tap-target"
          >
            View Achievement Center
          </Link>
        )}
      </div>
    </div>
  )
}