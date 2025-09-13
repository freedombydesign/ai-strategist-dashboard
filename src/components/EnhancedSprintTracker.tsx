'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

interface SprintStep {
  id: number
  title: string
  description: string
  day_number: number
  order_index: number
  estimated_minutes: number
}

interface SprintProgress {
  id: number
  user_id: string
  sprint_id: number
  step_number: number | null
  step_title: string | null
  status: 'started' | 'in_progress' | 'completed'
  notes: string | null
  sprints: {
    id: number
    sprint_key: string
    name: string
    full_title: string
    description: string
  }
}

interface FreedomScoreResult {
  percent: number
  totalScore: number
  recommendedOrder: Array<{
    title: string
    why: string
    sprintKey: string
  }>
  moduleAverages: Record<string, number>
}

interface EnhancedSprintTrackerProps {
  freedomScore?: FreedomScoreResult
  className?: string
}

export default function EnhancedSprintTracker({ freedomScore, className = '' }: EnhancedSprintTrackerProps) {
  const { user } = useAuth()
  const [currentProgress, setCurrentProgress] = useState<SprintProgress | null>(null)
  const [sprintSteps, setSprintSteps] = useState<SprintStep[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  useEffect(() => {
    console.log('[SPRINT-TRACKER] Component mounted with:', {
      hasUser: !!user?.id,
      hasFreedomScore: !!freedomScore,
      hasRecommendedOrder: !!freedomScore?.recommendedOrder,
      recommendedOrderLength: freedomScore?.recommendedOrder?.length || 0
    })
    
    if (user?.id && freedomScore?.recommendedOrder) {
      loadCurrentProgress()
    }
  }, [user?.id, freedomScore])

  // Listen for localStorage changes to refresh progress
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key && e.key.includes('completed_tasks_') && user?.id) {
        console.log('[SPRINT-TRACKER] Detected localStorage task completion change, refreshing...')
        setRefreshTrigger(prev => prev + 1)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [user?.id])

  // Periodic refresh to catch same-tab localStorage changes  
  useEffect(() => {
    if (!user?.id || !currentProgress?.sprint_id) return

    const interval = setInterval(() => {
      // Just trigger a re-render to recalculate progress from localStorage
      setRefreshTrigger(prev => prev + 1)
    }, 5000) // Refresh every 5 seconds

    return () => clearInterval(interval)
  }, [user?.id, currentProgress?.sprint_id])

  // Re-render when refreshTrigger changes (for localStorage-based progress calculation)
  useEffect(() => {
    // This just triggers a re-render, the actual progress calculation happens in the render
  }, [refreshTrigger])

  const loadCurrentProgress = async () => {
    try {
      setLoading(true)
      
      // Get current sprint progress
      const progressResponse = await fetch(`/api/update-sprint-progress?userId=${user?.id}`)
      const progressData = await progressResponse.json()
      
      if (progressData.success && progressData.data.length > 0) {
        const currentProgress = progressData.data[0]
        setCurrentProgress(currentProgress)
        
        // Load enhanced steps for current sprint
        if (currentProgress.sprint_id) {
          console.log('[SPRINT-TRACKER] Loading enhanced steps for sprint:', currentProgress.sprints.name)
          
          try {
            // Import sprintService dynamically to get enhanced steps
            const { sprintService } = await import('../services/sprintService')
            const enhancedSteps = await sprintService.getEnhancedStepsForOldSprint(currentProgress.sprints.name)
            
            if (enhancedSteps.length > 0) {
              console.log('[SPRINT-TRACKER] Found enhanced steps:', enhancedSteps.length)
              // Convert enhanced steps to SprintStep format
              const convertedSteps = enhancedSteps.map((step, index) => ({
                id: parseInt(step.id.toString()),
                title: step.step_name,
                description: step.task_description || '',
                day_number: Math.ceil((index + 1) / 3), // Group steps by day
                order_index: index,
                estimated_minutes: 30 // Default
              }))
              setSprintSteps(convertedSteps)
            } else {
              console.log('[SPRINT-TRACKER] No enhanced steps, falling back to API')
              // Fallback to old API
              const stepsResponse = await fetch(`/api/sprint-steps?sprintId=${currentProgress.sprint_id}`)
              const stepsData = await stepsResponse.json()
              if (stepsData.success) {
                setSprintSteps(stepsData.data)
              }
            }
          } catch (error) {
            console.error('[SPRINT-TRACKER] Error loading enhanced steps:', error)
            // Fallback to old API
            const stepsResponse = await fetch(`/api/sprint-steps?sprintId=${currentProgress.sprint_id}`)
            const stepsData = await stepsResponse.json()
            if (stepsData.success) {
              setSprintSteps(stepsData.data)
            }
          }
        }
      } else if (freedomScore?.recommendedOrder && freedomScore.recommendedOrder.length > 0) {
        // No current progress, start with first recommended sprint
        const firstSprint = freedomScore.recommendedOrder[0]
        await startNewSprint(firstSprint.sprintKey, firstSprint.title)
      }
    } catch (error) {
      console.error('[SPRINT-TRACKER] Error loading progress:', error)
    } finally {
      setLoading(false)
    }
  }

  const startNewSprint = async (sprintKey: string, sprintTitle: string) => {
    try {
      setUpdating(true)
      const response = await fetch('/api/update-sprint-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          sprintKey,
          stepNumber: 1,
          stepTitle: `Starting ${sprintTitle}`,
          status: 'started'
        })
      })

      if (response.ok) {
        await loadCurrentProgress()
      }
    } catch (error) {
      console.error('[SPRINT-TRACKER] Error starting sprint:', error)
    } finally {
      setUpdating(false)
    }
  }

  const updateStepProgress = async (stepNumber: number, stepTitle: string, status: 'in_progress' | 'completed') => {
    if (!currentProgress) return

    try {
      setUpdating(true)
      const response = await fetch('/api/update-sprint-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          sprintKey: currentProgress.sprints.sprint_key,
          stepNumber,
          stepTitle,
          status
        })
      })

      if (response.ok) {
        // Update local state
        setCurrentProgress(prev => prev ? {
          ...prev,
          step_number: stepNumber,
          step_title: stepTitle,
          status
        } : null)
      }
    } catch (error) {
      console.error('[SPRINT-TRACKER] Error updating step:', error)
    } finally {
      setUpdating(false)
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

  if (!currentProgress && (!freedomScore?.recommendedOrder || freedomScore.recommendedOrder.length === 0)) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Sprint Progress</h3>
        <p className="text-gray-500">Complete your Freedom Score assessment to get personalized sprint recommendations.</p>
      </div>
    )
  }

  const currentStep = sprintSteps.find(step => 
    step.order_index === (currentProgress?.step_number || 1) - 1
  ) || sprintSteps[0]

  const currentSprintIndex = freedomScore?.recommendedOrder?.findIndex(
    sprint => sprint.sprintKey === currentProgress?.sprints?.sprint_key
  ) || 0

  const totalSteps = sprintSteps.length
  const rawStepNumber = currentProgress?.step_number || 1
  
  // Handle corrupted data: if step number is higher than total steps AND status is just "started" 
  // (not "completed"), reset to step 1
  let currentStepNumber
  if (rawStepNumber > totalSteps && currentProgress?.status === 'started') {
    console.warn('[SPRINT-TRACKER] Corrupted step data detected, resetting to step 1:', {
      rawStepNumber,
      totalSteps,
      status: currentProgress?.status
    })
    currentStepNumber = 1
  } else {
    currentStepNumber = Math.min(rawStepNumber, totalSteps)
  }
  
  // Debug step counting and progress data
  console.log('[SPRINT-TRACKER] Step counter debug:', {
    rawStepNumber,
    totalSteps,
    currentStepNumber,
    currentProgressExists: !!currentProgress,
    stepNumberFromDB: currentProgress?.step_number,
    sprintId: currentProgress?.sprint_id,
    status: currentProgress?.status
  })
  
  // Debug step counting mismatch
  if (rawStepNumber > totalSteps) {
    console.warn('[SPRINT-TRACKER] Step number mismatch:', {
      rawStepNumber,
      totalSteps,
      currentStepNumber,
      sprintId: currentProgress?.sprint_id,
      sprintKey: currentProgress?.sprints?.sprint_key
    })
  }
  
  // Calculate progress using localStorage completion data (like the sprint detail pages)
  let progressPercent = 0
  if (totalSteps > 0 && currentProgress?.sprint_id && user?.id) {
    const key = `completed_tasks_${user.id}_${currentProgress.sprint_id}`
    const savedTasks = typeof window !== 'undefined' ? localStorage.getItem(key) : null
    
    if (savedTasks) {
      try {
        const completedTasks = JSON.parse(savedTasks)
        const completed = completedTasks.length
        progressPercent = Math.round((completed / totalSteps) * 100)
        console.log('[SPRINT-TRACKER] Progress calculated from localStorage:', {
          totalSteps,
          completed,
          progressPercent,
          sprintId: currentProgress.sprint_id,
          completedTasks
        })
      } catch (error) {
        console.error('[SPRINT-TRACKER] Error parsing localStorage tasks:', error)
        progressPercent = totalSteps > 0 ? Math.round((currentStepNumber / totalSteps) * 100) : 0
      }
    } else {
      // No completed tasks found, progress should be 0%
      progressPercent = 0
    }
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Sprint Progress</h3>
          {freedomScore?.recommendedOrder && (
            <p className="text-sm text-gray-500">
              Recommended Sprint #{currentSprintIndex + 1} of {freedomScore.recommendedOrder.length}
            </p>
          )}
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-600">{progressPercent}%</div>
          <div className="text-xs text-gray-500">Complete</div>
        </div>
      </div>

      {/* Current Sprint Info */}
      {currentProgress && (
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3 mt-1">
              {currentSprintIndex + 1}
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-blue-900">{currentProgress.sprints.full_title}</h4>
              <p className="text-sm text-blue-700 mt-1">{currentProgress.sprints.description}</p>
              {freedomScore?.recommendedOrder && freedomScore.recommendedOrder[currentSprintIndex] && (
                <p className="text-sm text-blue-600 mt-2 font-medium">
                  Why this sprint: {freedomScore.recommendedOrder[currentSprintIndex].why}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Current Step */}
      {currentStep && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h5 className="font-medium text-gray-900">
              Current Step: {currentStepNumber} of {totalSteps}
            </h5>
            <span className="text-sm text-gray-500">
              ~{currentStep.estimated_minutes} min • Day {currentStep.day_number}
            </span>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <h6 className="font-medium text-gray-900 mb-2">{currentStep.title}</h6>
            <p className="text-sm text-gray-700 mb-4">{currentStep.description}</p>
            
            <div className="flex gap-3">
              {currentProgress?.status !== 'completed' && (
                <>
                  {currentProgress?.status !== 'in_progress' && (
                    <button
                      onClick={() => updateStepProgress(currentStepNumber, currentStep.title, 'in_progress')}
                      disabled={updating}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      {updating ? 'Starting...' : 'Start This Step'}
                    </button>
                  )}
                  
                  {currentProgress?.status === 'in_progress' && (
                    <button
                      onClick={() => updateStepProgress(currentStepNumber, currentStep.title, 'completed')}
                      disabled={updating}
                      className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      {updating ? 'Completing...' : 'Mark Complete'}
                    </button>
                  )}
                </>
              )}
              
              {currentProgress?.status === 'completed' && currentStepNumber < totalSteps && (
                <button
                  onClick={() => updateStepProgress(currentStepNumber + 1, sprintSteps[currentStepNumber]?.title || 'Next Step', 'started')}
                  disabled={updating}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  {updating ? 'Moving...' : 'Next Step →'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Progress</span>
          <span>{currentStepNumber} of {totalSteps} steps</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
      </div>

      {/* Next Steps Preview */}
      {sprintSteps.length > currentStepNumber && (
        <div className="border-t pt-4">
          <h6 className="text-sm font-medium text-gray-700 mb-3">Coming Up Next</h6>
          <div className="space-y-2">
            {sprintSteps
              .slice(currentStepNumber, Math.min(currentStepNumber + 2, totalSteps))
              .map((step, index) => (
                <div key={step.id} className="flex items-center text-sm text-gray-600">
                  <div className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-xs mr-3">
                    {currentStepNumber + index + 1}
                  </div>
                  <span className="flex-1">{step.title}</span>
                  <span className="text-xs text-gray-400">{step.estimated_minutes}min</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}