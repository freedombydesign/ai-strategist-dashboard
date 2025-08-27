'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '../context/AuthContext'
import { sprintService } from '../services/sprintService'
import { FreedomScoreResult } from '../utils/freedomScoring'
import { Clock, PlayCircle, CheckCircle, ArrowRight } from 'lucide-react'

interface SimpleSprintPlannerProps {
  freedomScore?: FreedomScoreResult | null
}

interface SimpleSprint {
  id: string
  name: string
  client_facing_title?: string
  description?: string
  goal?: string
  time_saved_hours?: number
}

export default function SimpleSprintPlanner({ freedomScore }: SimpleSprintPlannerProps) {
  const { user } = useAuth()
  const [sprints, setSprints] = useState<SimpleSprint[]>([])
  const [loading, setLoading] = useState(true)
  const [startingSprintId, setStartingSprintId] = useState<string | null>(null)
  const [startedSprints, setStartedSprints] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (user?.id) {
      loadSprints()
      loadStartedSprints()
    }
  }, [user?.id])

  const loadSprints = async () => {
    try {
      setLoading(true)
      console.log('[SIMPLE-SPRINT] Loading sprints...')
      
      const sprintData = await sprintService.getAllSprints()
      console.log('[SIMPLE-SPRINT] Loaded sprints:', sprintData)
      
      setSprints(sprintData)
    } catch (error) {
      console.error('[SIMPLE-SPRINT] Error loading sprints:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStartedSprints = () => {
    if (typeof window !== 'undefined' && user?.id) {
      const key = `started_sprints_${user.id}`
      const saved = localStorage.getItem(key)
      if (saved) {
        try {
          const sprintIds = JSON.parse(saved)
          console.log('[SIMPLE-SPRINT] Loaded started sprints from localStorage:', sprintIds)
          setStartedSprints(new Set(sprintIds))
        } catch (error) {
          console.error('[SIMPLE-SPRINT] Error parsing started sprints:', error)
        }
      }
    }
  }

  const saveStartedSprints = (sprintIds: Set<string>) => {
    if (typeof window !== 'undefined' && user?.id) {
      const key = `started_sprints_${user.id}`
      const array = Array.from(sprintIds)
      localStorage.setItem(key, JSON.stringify(array))
      console.log('[SIMPLE-SPRINT] Saved started sprints to localStorage:', array)
    }
  }

  const getRecommendedSprints = (): SimpleSprint[] => {
    if (!freedomScore?.recommendedOrder || sprints.length === 0) {
      // Return first 3 sprints as fallback
      return sprints.slice(0, 3)
    }

    // Map diagnostic recommendations to actual sprints
    const sprintMapping: Record<string, string> = {
      'S1': 'profitable_service',
      'S2': 'smooth_path',
      'S3': 'sell_bottleneck',
      'S4': 'streamline_delivery',
      'S5': 'continuous_improve'
    }

    const recommendedSprints: SimpleSprint[] = []
    
    for (const recommendation of freedomScore.recommendedOrder.slice(0, 3)) {
      const sprintName = sprintMapping[recommendation.sprintKey]
      const sprint = sprints.find(s => s.name === sprintName)
      
      if (sprint) {
        recommendedSprints.push(sprint)
      }
    }

    // If we couldn't map enough sprints, fill with available ones
    if (recommendedSprints.length < 3) {
      const usedIds = new Set(recommendedSprints.map(s => s.id))
      const remaining = sprints.filter(s => !usedIds.has(s.id)).slice(0, 3 - recommendedSprints.length)
      recommendedSprints.push(...remaining)
    }

    return recommendedSprints
  }

  const handleStartSprint = async (sprint: SimpleSprint) => {
    if (!user?.id) return

    try {
      setStartingSprintId(sprint.id)
      console.log('[SIMPLE-SPRINT] Starting sprint:', sprint.id)
      
      const result = await sprintService.startUserSprint(user.id, sprint.id)
      
      if (result) {
        console.log('[SIMPLE-SPRINT] Sprint started successfully')
        const newStartedSprints = new Set([...startedSprints, sprint.id])
        setStartedSprints(newStartedSprints)
        saveStartedSprints(newStartedSprints)
      } else {
        console.error('[SIMPLE-SPRINT] Failed to start sprint')
      }
    } catch (error) {
      console.error('[SIMPLE-SPRINT] Error starting sprint:', error)
    } finally {
      setStartingSprintId(null)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-16 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (sprints.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          🎯 Your Sprint Plan
        </h3>
        <div className="text-center py-8">
          <div className="text-gray-500 mb-4">
            <PlayCircle size={48} className="mx-auto mb-2" />
            <p>No sprints available yet</p>
            <p className="text-sm">Check your database sprints table</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        🎯 Your Sprint Plan
      </h3>

      {freedomScore && (
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            Based on your Freedom Score of <span className="font-semibold">{freedomScore.percent}%</span>, 
            start with these recommended sprints to systematically remove bottlenecks.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {getRecommendedSprints().map((sprint, index) => {
          const isStarting = startingSprintId === sprint.id
          const isStarted = startedSprints.has(sprint.id)

          return (
            <div 
              key={sprint.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <span className={`
                      inline-flex items-center justify-center w-6 h-6 rounded-full text-sm font-bold mr-3
                      ${index === 0 ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}
                    `}>
                      {index + 1}
                    </span>
                    <h4 className="text-lg font-medium text-gray-900">
                      {sprint.client_facing_title || sprint.name}
                    </h4>
                  </div>
                  
                  {sprint.description && (
                    <p className="text-gray-600 text-sm mb-3 ml-9">
                      {sprint.description}
                    </p>
                  )}

                  <div className="flex items-center ml-9 text-sm text-gray-500">
                    {sprint.time_saved_hours && (
                      <div className="flex items-center">
                        <Clock size={14} className="mr-1" />
                        Save {sprint.time_saved_hours}h/week
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end">
                  {!isStarted ? (
                    <button
                      onClick={() => handleStartSprint(sprint)}
                      disabled={isStarting}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors"
                    >
                      {isStarting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Starting...
                        </>
                      ) : (
                        <>
                          <PlayCircle size={16} className="mr-2" />
                          Start Sprint
                        </>
                      )}
                    </button>
                  ) : (
                    <Link
                      href={`/sprint/${sprint.id}`}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors"
                    >
                      <ArrowRight size={16} className="mr-2" />
                      Continue Sprint
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h5 className="font-medium text-gray-900 mb-2">🚀 What happens next?</h5>
        <p className="text-sm text-gray-600">
          Once you start a sprint, you'll get daily 10-minute tasks designed to systematically 
          remove bottlenecks from your business. Each sprint builds on the previous one.
        </p>
      </div>
    </div>
  )
}