'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { achievementService, type Achievement, type MomentumScore } from '../services/achievementService'
import { Trophy, Star, Target, Flame, TrendingUp, Award, Lock, CheckCircle2 } from 'lucide-react'

interface AchievementCenterProps {
  className?: string
}

export default function AchievementCenter({ className = '' }: AchievementCenterProps) {
  const { user } = useAuth()
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [momentumScore, setMomentumScore] = useState<MomentumScore | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [newlyUnlocked, setNewlyUnlocked] = useState<Achievement[]>([])

  useEffect(() => {
    if (user?.id) {
      loadAchievements()
    }
  }, [user?.id])

  const loadAchievements = async () => {
    try {
      setLoading(true)
      
      const [userAchievements, momentum, newUnlocks] = await Promise.all([
        achievementService.getUserAchievements(user!.id),
        achievementService.calculateMomentumScore(user!.id),
        achievementService.checkAndUnlockAchievements(user!.id)
      ])

      setAchievements(userAchievements)
      setMomentumScore(momentum)
      
      if (newUnlocks.length > 0) {
        setNewlyUnlocked(newUnlocks)
        // Show celebration for new unlocks
        setTimeout(() => setNewlyUnlocked([]), 5000)
      }

    } catch (error) {
      console.error('[ACHIEVEMENT-CENTER] Error loading achievements:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredAchievements = selectedCategory === 'all' 
    ? achievements 
    : achievements.filter(a => a.category === selectedCategory)

  const categories = [
    { id: 'all', name: 'All', icon: Trophy },
    { id: 'streak', name: 'Streaks', icon: Flame },
    { id: 'completion', name: 'Tasks', icon: CheckCircle2 },
    { id: 'business', name: 'Business', icon: TrendingUp },
    { id: 'consistency', name: 'Energy', icon: Target },
    { id: 'milestone', name: 'Milestones', icon: Award }
  ]

  const unlockedCount = achievements.filter(a => a.unlocked).length
  const totalPoints = achievements.filter(a => a.unlocked).reduce((sum, a) => sum + a.points, 0)

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      {/* Header with Stats */}
      <div className="p-6 border-b bg-gradient-to-r from-purple-50 to-indigo-50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">Achievement Center</h3>
          <div className="text-right">
            <div className="text-2xl font-bold text-purple-600">{unlockedCount}/{achievements.length}</div>
            <div className="text-xs text-gray-600">Unlocked</div>
          </div>
        </div>

        {/* Momentum Score */}
        {momentumScore && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <Star className="text-yellow-500 mr-1" size={18} />
                <span className="text-lg font-bold text-gray-900">{momentumScore.current}</span>
              </div>
              <div className="text-xs text-gray-600">Momentum Score</div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <Trophy className="text-blue-500 mr-1" size={18} />
                <span className="text-lg font-bold text-gray-900">{totalPoints}</span>
              </div>
              <div className="text-xs text-gray-600">Total Points</div>
            </div>
            
            <div className="text-center">
              <div className={`flex items-center justify-center mb-1 ${
                momentumScore.trend === 'up' ? 'text-green-500' :
                momentumScore.trend === 'down' ? 'text-red-500' : 'text-gray-500'
              }`}>
                <TrendingUp size={18} />
              </div>
              <div className="text-xs text-gray-600">
                {momentumScore.trend === 'up' ? 'Rising' : 
                 momentumScore.trend === 'down' ? 'Falling' : 'Stable'}
              </div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <Target className="text-green-500 mr-1" size={18} />
                <span className="text-lg font-bold text-gray-900">{momentumScore.multiplier}x</span>
              </div>
              <div className="text-xs text-gray-600">Multiplier</div>
            </div>
          </div>
        )}
      </div>

      {/* Category Tabs */}
      <div className="px-4 md:px-6 py-4 border-b">
        <div className="flex space-x-1 overflow-x-auto">
          {categories.map((category) => {
            const Icon = category.icon
            const isActive = selectedCategory === category.id
            return (
              <button
                key={category.id}
                onClick={() => {
                  setSelectedCategory(category.id)
                  if ('vibrate' in navigator) {
                    navigator.vibrate(25)
                  }
                }}
                className={`flex items-center px-4 py-3 md:px-3 md:py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap touch-manipulation ${
                  isActive
                    ? 'bg-purple-100 text-purple-700 scale-105'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 hover:scale-102'
                }`}
              >
                <Icon size={16} className="mr-2" />
                {category.name}
              </button>
            )
          })}
        </div>
      </div>

      {/* Achievement Grid */}
      <div className="p-4 md:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAchievements.map((achievement) => {
            const isNewlyUnlocked = newlyUnlocked.some(nu => nu.id === achievement.id)
            const progressPercentage = Math.round((achievement.progress! / achievement.requirement) * 100)
            
            return (
              <div
                key={achievement.id}
                className={`relative p-4 border rounded-lg transition-all duration-300 cursor-pointer hover:shadow-md touch-manipulation ${
                  achievement.unlocked
                    ? `${achievementService.getRarityColor(achievement.rarity)} border-current hover:scale-105`
                    : 'bg-gray-50 border-gray-200 hover:border-purple-200 hover:bg-gray-100'
                } ${isNewlyUnlocked ? 'animate-pulse ring-2 ring-yellow-400' : ''}`}
                onClick={() => {
                  // Add haptic feedback on mobile
                  if ('vibrate' in navigator) {
                    navigator.vibrate(50)
                  }
                }}
              >
                {/* Achievement Icon and Status */}
                <div className="flex items-start justify-between mb-3">
                  <div className={`text-2xl ${achievement.unlocked ? '' : 'grayscale opacity-50'}`}>
                    {achievement.icon}
                  </div>
                  <div className="flex items-center">
                    {achievement.unlocked ? (
                      <CheckCircle2 className="text-green-500" size={20} />
                    ) : (
                      <Lock className="text-gray-400" size={20} />
                    )}
                  </div>
                </div>

                {/* Achievement Info */}
                <div className="mb-3">
                  <h4 className={`font-semibold mb-1 ${
                    achievement.unlocked ? 'text-gray-900' : 'text-gray-600'
                  }`}>
                    {achievement.name}
                  </h4>
                  <p className={`text-sm ${
                    achievement.unlocked ? 'text-gray-700' : 'text-gray-500'
                  }`}>
                    {achievement.description}
                  </p>
                </div>

                {/* Progress Bar */}
                {!achievement.unlocked && (
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>{achievement.progress}/{achievement.requirement}</span>
                      <span>{progressPercentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Points and Rarity */}
                <div className="flex items-center justify-between text-xs">
                  <span className={`px-2 py-1 rounded-full font-medium ${
                    achievementService.getRarityColor(achievement.rarity)
                  }`}>
                    {achievement.rarity.toUpperCase()}
                  </span>
                  <span className="font-medium text-gray-700">
                    {achievement.points} pts
                  </span>
                </div>

                {/* New Achievement Overlay */}
                {isNewlyUnlocked && (
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-lg flex items-center justify-center">
                    <div className="text-white text-center">
                      <Star className="mx-auto mb-2" size={32} />
                      <div className="font-bold">UNLOCKED!</div>
                      <div className="text-sm">+{achievement.points} points</div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {filteredAchievements.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Trophy className="mx-auto mb-3 text-gray-300" size={48} />
            <p>No achievements in this category yet</p>
          </div>
        )}
      </div>

      {/* Momentum Factors Breakdown */}
      {momentumScore && selectedCategory === 'all' && (
        <div className="px-6 pb-6 border-t bg-gray-50">
          <h4 className="text-sm font-semibold text-gray-900 mb-3 pt-4">Momentum Breakdown</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-lg font-bold text-orange-600">+{momentumScore.factors.streakBonus}</div>
              <div className="text-xs text-gray-600">Streak Bonus</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">+{momentumScore.factors.consistencyBonus}</div>
              <div className="text-xs text-gray-600">Energy Bonus</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">+{momentumScore.factors.businessImpactBonus}</div>
              <div className="text-xs text-gray-600">Business Bonus</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-purple-600">+{momentumScore.factors.achievementBonus}</div>
              <div className="text-xs text-gray-600">Achievement Bonus</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}