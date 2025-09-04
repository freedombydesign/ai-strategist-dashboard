'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { implementationService } from '../services/implementationService'
import { CheckCircle2, Calendar, Target, Zap } from 'lucide-react'
import Link from 'next/link'

interface SprintCheckinPromptProps {
  sprintId: string
  sprintName: string
  completedTasks: number
  totalTasks: number
  className?: string
}

export default function SprintCheckinPrompt({ 
  sprintId, 
  sprintName, 
  completedTasks, 
  totalTasks,
  className = '' 
}: SprintCheckinPromptProps) {
  const { user } = useAuth()
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.id) {
      checkTodaysStatus()
    }
  }, [user?.id])

  const checkTodaysStatus = async () => {
    try {
      setLoading(true)
      const todaysCheckin = await implementationService.getTodaysCheckin(user!.id)
      setHasCheckedInToday(!!todaysCheckin)
    } catch (error) {
      console.error('[SPRINT-CHECKIN] Error checking status:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-3 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  if (hasCheckedInToday) {
    // Already checked in today
    return (
      <div className={`bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg shadow-sm border border-green-200 p-4 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <CheckCircle2 className="text-green-600 mr-3" size={20} />
            <div>
              <h4 className="font-semibold text-green-900">Daily Check-in Complete! ✅</h4>
              <p className="text-sm text-green-700">
                Keep up the momentum on <strong>{sprintName}</strong>
              </p>
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-800">{completionPercentage}%</div>
            <div className="text-xs text-green-600">Sprint Progress</div>
          </div>
        </div>
      </div>
    )
  }

  // Need to check in today
  return (
    <div className={`bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-sm border border-blue-200 p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Target className="text-blue-600 mr-3" size={20} />
          <div>
            <h4 className="font-semibold text-blue-900">Daily Sprint Check-in</h4>
            <p className="text-sm text-blue-700">
              Log today's progress on <strong>{sprintName}</strong>
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <div className="text-center">
            <div className="text-lg font-bold text-blue-800">{completionPercentage}%</div>
            <div className="text-xs text-blue-600">Progress</div>
          </div>
          <Link
            href={`/checkin?sprint=${encodeURIComponent(sprintId)}&name=${encodeURIComponent(sprintName)}`}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg font-medium flex items-center transition-colors text-sm"
          >
            <Zap size={14} className="mr-1" />
            Check In
          </Link>
        </div>
      </div>
    </div>
  )
}