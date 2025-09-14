'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { sprintService, Sprint, UserSprintProgress } from '../services/sprintService'
import { FreedomScoreResult } from '../utils/freedomScoring'
import { Clock, CheckCircle, PlayCircle, ArrowRight } from 'lucide-react'

interface SprintPlannerProps {
  freedomScore?: FreedomScoreResult | null
}

export default function SprintPlanner({ freedomScore }: SprintPlannerProps) {
  const { user } = useAuth()
  const [availableSprints, setAvailableSprints] = useState<Sprint[]>([])
  const [userProgress, setUserProgress] = useState<UserSprintProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [startingSprintId, setStartingSprintId] = useState<string | null>(null)

  useEffect(() => {
    if (user?.id) {
      loadSprintData()
    }
  }, [user?.id])

  const loadSprintData = async () => {
    try {
      setLoading(true)
      
      console.log('[SPRINT-PLANNER] Loading sprint data for user:', user!.id)
      
      const [sprints, progress] = await Promise.all([
        sprintService.getAllSprints(),
        sprintService.getUserSprintProgress(user!.id)
      ])

      console.log('[SPRINT-PLANNER] Loaded sprints:', sprints.length, 'Progress entries:', progress.length)
      
      setAvailableSprints(sprints)
      setUserProgress(progress)
    } catch (error) {
      console.error('[SPRINT-PLANNER] Error loading sprint data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRecommendedSprints = (): Sprint[] => {
    if (!freedomScore?.recommendedOrder || availableSprints.length === 0) {
      return availableSprints.slice(0, 3) // Return first 3 as fallback
    }

    // Map diagnostic recommendations to actual sprints
    const recommendedSprints: Sprint[] = []
    
    for (const recommendation of freedomScore.recommendedOrder.slice(0, 3)) {
      const sprint = availableSprints.find(s => 
        s.name === getSprintNameFromKey(recommendation.sprintKey)
      )
      
      if (sprint) {
        recommendedSprints.push(sprint)
      }
    }

    return recommendedSprints
  }

  const getSprintNameFromKey = (sprintKey: string): string => {
    const mapping: Record<string, string> = {
      'S1': 'profitable_service',
      'S2': 'smooth_path',
      'S3': 'sell_bottleneck', 
      'S4': 'streamline_delivery',
      'S5': 'continuous_improve'
    }
    return mapping[sprintKey] || sprintKey
  }

  const getSprintStatus = (sprint: Sprint): 'not_started' | 'in_progress' | 'completed' => {
    const progress = userProgress.find(p => p.sprint_id === sprint.id)
    return progress?.status || 'not_started'
  }

  const getSprintProgressPercent = (sprint: Sprint): number => {
    const progress = userProgress.find(p => p.sprint_id === sprint.id)
    if (!progress || progress.status === 'not_started') return 0
    if (progress.status === 'completed') return 100
    
    // For in_progress, we'd need to calculate based on completed steps
    // For now, return a placeholder
    return 25
  }

  const handleStartSprint = async (sprint: Sprint) => {
    if (!user?.id) {
      console.error('[SPRINT-PLANNER] No user ID available')
      return
    }

    try {
      setStartingSprintId(sprint.id)
      console.log('[SPRINT-PLANNER] Starting sprint:', sprint.id, 'for user:', user.id)
      
      const progress = await sprintService.startUserSprint(user.id, sprint.id)
      
      if (progress) {
        console.log('[SPRINT-PLANNER] Sprint started successfully:', progress)
        // Reload progress data
        await loadSprintData()
      } else {
        console.error('[SPRINT-PLANNER] Failed to start sprint - no progress returned')
      }
    } catch (error) {
      console.error('[SPRINT-PLANNER] Error starting sprint:', error)
    } finally {
      setStartingSprintId(null)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  const recommendedSprints = getRecommendedSprints()

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        🎯 Your Sprint Plan
      </h3>

      {freedomScore && (
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            Based on your Freedom Score of <span className="font-semibold">{freedomScore.percent}%</span>, 
            here's your personalized sprint sequence to remove bottlenecks systematically.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {recommendedSprints.map((sprint, index) => {
          const status = getSprintStatus(sprint)
          const progress = getSprintProgressPercent(sprint)
          const isStarting = startingSprintId === sprint.id

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
                      {sprint.client_facing_title}
                    </h4>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-3 ml-9">
                    {sprint.description}
                  </p>

                  <div className="flex items-center ml-9 text-sm text-gray-500 space-x-4">
                    <div className="flex items-center">
                      <Clock size={14} className="mr-1" />
                      Save {sprint.time_saved_hours}h/week
                    </div>
                    
                    {status !== 'not_started' && (
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className={`h-2 rounded-full ${
                              status === 'completed' ? 'bg-green-500' : 'bg-blue-500'
                            }`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="text-xs">{progress}%</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end">
                  {status === 'not_started' && (
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
                  )}

                  {status === 'in_progress' && (
                    <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center">
                      <ArrowRight size={16} className="mr-2" />
                      Continue
                    </button>
                  )}

                  {status === 'completed' && (
                    <div className="flex items-center text-green-600 text-sm font-medium">
                      <CheckCircle size={16} className="mr-2" />
                      Completed
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {freedomScore && freedomScore.recommendedOrder && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h5 className="font-medium text-gray-900 mb-2">🚀 Why this sequence?</h5>
          <p className="text-sm text-gray-600">
            Sprint 1 addresses your lowest-scoring area: <strong>{freedomScore.recommendedOrder[0]?.title}</strong>. 
            {freedomScore.recommendedOrder[0]?.why}
          </p>
        </div>
      )}
    </div>
  )
}