'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { implementationService } from '../services/implementationService'
import { CheckCircle2, Calendar, ArrowRight, Zap } from 'lucide-react'
import Link from 'next/link'

interface DailyCheckinPromptProps {
  className?: string
}

export default function DailyCheckinPrompt({ className = '' }: DailyCheckinPromptProps) {
  const { user } = useAuth()
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false)
  const [streakDays, setStreakDays] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.id) {
      checkTodaysStatus()
    }
  }, [user?.id])

  const checkTodaysStatus = async () => {
    try {
      setLoading(true)
      
      // Check if user has checked in today
      const todaysCheckin = await implementationService.getTodaysCheckin(user!.id)
      setHasCheckedInToday(!!todaysCheckin)

      // Get current streak
      const streak = await implementationService.calculateStreakDays(user!.id)
      setStreakDays(streak)

    } catch (error) {
      console.error('[CHECKIN-PROMPT] Error checking status:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (hasCheckedInToday) {
    // Already checked in today - show celebration
    return (
      <div className={`bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg shadow-sm border border-green-200 p-6 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <CheckCircle2 className="text-green-600 mr-3" size={24} />
            <div>
              <h3 className="text-lg font-semibold text-green-900">Daily Check-in Complete! 🎉</h3>
              <p className="text-sm text-green-700">
                {streakDays > 0 ? (
                  <>Great job maintaining your {streakDays}-day streak! 🔥</>
                ) : (
                  <>You're building momentum - keep it up!</>
                )}
              </p>
            </div>
          </div>
          {streakDays > 0 && (
            <div className="bg-green-100 px-3 py-2 rounded-full">
              <div className="text-center">
                <div className="text-lg font-bold text-green-800">{streakDays}</div>
                <div className="text-xs text-green-600">Day Streak</div>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Hasn't checked in today - show prompt
  const isFirstCheckIn = streakDays === 0
  const promptText = isFirstCheckIn 
    ? "Start building your implementation streak with your first daily check-in!"
    : `Don't break your ${streakDays}-day streak! Complete today's check-in.`

  return (
    <div className={`bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-sm border border-blue-200 p-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Calendar className="text-blue-600 mr-3" size={24} />
          <div>
            <h3 className="text-lg font-semibold text-blue-900">Daily Check-in</h3>
            <p className="text-sm text-blue-700">{promptText}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {streakDays > 0 && (
            <div className="bg-orange-100 px-3 py-2 rounded-full">
              <div className="text-center">
                <div className="text-lg font-bold text-orange-800">{streakDays}</div>
                <div className="text-xs text-orange-600">Day Streak</div>
              </div>
            </div>
          )}
          <Link
            href="/checkin"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center transition-colors"
          >
            {isFirstCheckIn ? (
              <>
                <Zap size={16} className="mr-2" />
                Start Check-in
              </>
            ) : (
              <>
                <ArrowRight size={16} className="mr-2" />
                Complete Check-in
              </>
            )}
          </Link>
        </div>
      </div>
    </div>
  )
}