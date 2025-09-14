'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { achievementService, type Achievement } from '../services/achievementService'
import Link from 'next/link'
import { Trophy, Star, Target, CheckCircle2, Award } from 'lucide-react'

export default function SimpleAchievementCenter() {
  const { user } = useAuth()
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.id) {
      loadAchievements()
    }
  }, [user?.id])

  const loadAchievements = async () => {
    try {
      setLoading(true)
      console.log('[ACHIEVEMENT-CENTER] Loading achievements for user:', user?.id)
      
      // Add timeout protection
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 5000)
      )
      
      const achievementsPromise = achievementService.getUserAchievements(user!.id)
      const userAchievements = await Promise.race([achievementsPromise, timeoutPromise]) as any
      
      console.log('[ACHIEVEMENT-CENTER] Achievements loaded:', userAchievements?.length)
      setAchievements(userAchievements)
    } catch (error) {
      console.error('[ACHIEVEMENT-CENTER] Error loading achievements:', error)
      
      // Try direct database query as fallback
      try {
        console.log('[ACHIEVEMENT-CENTER] Attempting fallback database query...')
        const { supabase } = await import('../lib/supabase')
        
        // Get check-ins to calculate basic achievements
        const { data: checkins, error: checkinError } = await supabase
          .from('daily_checkins')
          .select('*')
          .eq('user_id', user!.id)
          .order('checkin_date', { ascending: false })
        
        if (!checkinError && checkins) {
          console.log('[ACHIEVEMENT-CENTER] Fallback SUCCESS! Loaded checkins:', checkins.length)
          console.log('[ACHIEVEMENT-CENTER] Checkin data:', checkins)
          
          // Create basic achievements based on check-ins
          const basicAchievements = [
            {
              id: 'first_steps',
              name: 'First Steps',
              description: 'Complete your first daily check-in',
              icon: '🚀',
              category: 'streak' as const,
              requirement: 1,
              points: 10,
              rarity: 'common' as const,
              unlocked: checkins.length >= 1,
              progress: Math.min(checkins.length, 1)
            },
            {
              id: 'getting_started',
              name: 'Getting Started',
              description: 'Maintain a 3-day check-in streak',
              icon: '🔥',
              category: 'streak' as const,
              requirement: 3,
              points: 25,
              rarity: 'common' as const,
              unlocked: checkins.length >= 3,
              progress: Math.min(checkins.length, 3)
            },
            {
              id: 'week_warrior',
              name: 'Week Warrior',
              description: 'Maintain a 7-day check-in streak',
              icon: '⚔️',
              category: 'streak' as const,
              requirement: 7,
              points: 50,
              rarity: 'rare' as const,
              unlocked: checkins.length >= 7,
              progress: Math.min(checkins.length, 7)
            }
          ]
          
          console.log('[ACHIEVEMENT-CENTER] Fallback achievements created:', basicAchievements.length)
          console.log('[ACHIEVEMENT-CENTER] Achievement details:', basicAchievements)
          setAchievements(basicAchievements)
          return
        } else {
          console.error('[ACHIEVEMENT-CENTER] Database fallback failed:', checkinError)
        }
      } catch (fallbackError) {
        console.error('[ACHIEVEMENT-CENTER] Fallback also failed:', fallbackError)
      }
      
      // Final fallback - empty achievements array
      setAchievements([])
    } finally {
      setLoading(false)
    }
  }

  const totalPoints = achievements
    .filter(a => a.unlocked)
    .reduce((sum, a) => sum + a.points, 0)

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Trophy className="w-8 h-8 text-yellow-500 mr-3" />
          <h1 className="text-3xl font-bold text-gray-900">Achievement Center</h1>
        </div>
        <p className="text-gray-600">
          Track your progress and celebrate your business growth milestones.
        </p>
      </div>

      {/* Points Summary */}
      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg p-6 mb-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold mb-2">Total Achievement Points</h2>
            <div className="text-3xl font-bold">{totalPoints} Points</div>
          </div>
          <div className="text-right">
            <div className="text-sm opacity-90">Completed</div>
            <div className="text-lg font-semibold">
              {achievements.filter(a => a.unlocked).length} / {achievements.length}
            </div>
          </div>
        </div>
      </div>

      {/* Achievements Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {loading ? (
          // Loading skeleton
          [1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-lg border p-6">
              <div className="animate-pulse">
                <div className="h-12 w-12 bg-gray-200 rounded-lg mb-4"></div>
                <div className="h-6 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded mb-3"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))
        ) : (
          achievements.map((achievement) => (
            <div
              key={achievement.id}
              className={`bg-white rounded-lg border p-6 transition-all ${
                achievement.unlocked
                  ? 'border-green-200 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start">
                <div className={`p-3 rounded-lg mr-4 text-2xl ${
                  achievement.unlocked
                    ? 'bg-green-100'
                    : 'bg-gray-100'
                }`}>
                  {achievement.icon}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className={`font-semibold ${
                      achievement.unlocked ? 'text-green-900' : 'text-gray-900'
                    }`}>
                      {achievement.name}
                    </h3>
                    {achievement.unlocked && (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    )}
                  </div>
                  
                  <p className={`text-sm mb-3 ${
                    achievement.unlocked ? 'text-green-700' : 'text-gray-600'
                  }`}>
                    {achievement.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className={`text-sm font-medium ${
                        achievement.unlocked ? 'text-green-600' : 'text-gray-500'
                      }`}>
                        {achievement.points} points
                      </span>
                      {!achievement.unlocked && (
                        <span className="text-xs text-gray-500">
                          {achievement.progress}/{achievement.requirement}
                        </span>
                      )}
                    </div>
                    
                    {achievement.unlocked && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                        Completed ✓
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Action Buttons */}
      <div className="mt-12 text-center">
        <div className="bg-blue-50 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Ready for more achievements?</h3>
          <p className="text-blue-700 mb-4">
            Complete your business profile and start working on sprints to unlock more achievements!
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/business-metrics"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
            >
              Update Business Metrics
            </Link>
            
            <Link
              href="/ai-strategist"
              className="border border-blue-600 text-blue-600 hover:bg-blue-50 px-6 py-3 rounded-lg font-medium"
            >
              Talk to AI Strategist
            </Link>
          </div>
        </div>
        
        <Link
          href="/dashboard"
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  )
}