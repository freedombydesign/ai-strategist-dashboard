'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { sprintService } from '../services/sprintService'
import { implementationService } from '../services/implementationService'
import EnhancedProgressTracker from './EnhancedProgressTracker'

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

interface SimpleDashboardProgressProps {
  freedomScore?: FreedomScoreResult
  className?: string
}

export default function SimpleDashboardProgress({ freedomScore, className = '' }: SimpleDashboardProgressProps) {
  const { user } = useAuth()
  const [progressData, setProgressData] = useState<{ sprintName: string; completed: number; total: number; percent: number } | null>(null)
  const [startedSprints, setStartedSprints] = useState<string[]>([])

  useEffect(() => {
    if (user?.id) {
      loadProgressFromLocalStorage()
    }
  }, [user?.id])

  // Listen for active sprint changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key && e.key.includes('active_sprint_') && user?.id) {
        console.log('[DASHBOARD-PROGRESS] Active sprint changed, refreshing progress')
        loadProgressFromLocalStorage()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [user?.id])

  // Remove infinite loop - only check on mount and storage changes

  const loadProgressFromLocalStorage = async () => {
    try {
      console.log('[DASHBOARD-PROGRESS] Loading progress from localStorage...')
      
      // Get started sprints from localStorage
      const startedSprintsKey = `started_sprints_${user!.id}`
      const startedSprintsData = localStorage.getItem(startedSprintsKey)
      
      if (!startedSprintsData) {
        console.log('[DASHBOARD-PROGRESS] No started sprints found')
        setProgressData(null)
        return
      }

      const parsedStartedSprints = JSON.parse(startedSprintsData)
      console.log('[DASHBOARD-PROGRESS] Started sprints:', parsedStartedSprints)
      setStartedSprints(parsedStartedSprints)
      
      if (parsedStartedSprints.length === 0) {
        setProgressData(null)
        return
      }

      // Get the most recent incomplete sprint (prioritize incomplete over completed)
      // If all are completed, take the most recent one
      const completedSprintsKey = `completed_sprints_${user!.id}`
      const completedSprintsData = localStorage.getItem(completedSprintsKey)
      let completedSprints: string[] = []
      
      if (completedSprintsData) {
        try {
          completedSprints = JSON.parse(completedSprintsData)
        } catch (error) {
          console.error('[DASHBOARD-PROGRESS] Error parsing completed sprints:', error)
        }
      }
      
      // Check if there's an active sprint set (currently being viewed)
      const activeSprintKey = `active_sprint_${user!.id}`
      const activeSprintData = localStorage.getItem(activeSprintKey)
      let activeSprintId = null
      
      if (activeSprintData) {
        try {
          activeSprintId = JSON.parse(activeSprintData)
          // Only use active sprint if it's actually started
          if (!parsedStartedSprints.includes(activeSprintId)) {
            activeSprintId = null
            localStorage.removeItem(activeSprintKey)
          }
        } catch (error) {
          console.error('[DASHBOARD-PROGRESS] Error parsing active sprint:', error)
          localStorage.removeItem(activeSprintKey)
        }
      }
      
      // Determine current sprint priority:
      // 1. Active sprint (currently being viewed)
      // 2. Most recent incomplete sprint
      // 3. Most recent overall sprint
      const incompleteSprints = parsedStartedSprints.filter(id => !completedSprints.includes(id))
      
      const currentSprintId = activeSprintId || (
        incompleteSprints.length > 0 
          ? incompleteSprints[incompleteSprints.length - 1]  // Most recent incomplete
          : parsedStartedSprints[parsedStartedSprints.length - 1]        // Most recent overall if all completed
      )
      
      console.log('[DASHBOARD-PROGRESS] Sprint selection logic:', {
        activeSprintId,
        incompleteSprints,
        selectedSprint: currentSprintId
      })
      
      // Get enhanced sprint data to find sprint name
      const enhancedSprints = await sprintService.getEnhancedSprintData()
      const currentSprint = enhancedSprints.find(s => s.id === currentSprintId)
      
      if (!currentSprint) {
        console.log('[DASHBOARD-PROGRESS] Sprint not found:', currentSprintId)
        setProgressData(null)
        return
      }

      console.log('[DASHBOARD-PROGRESS] Current sprint:', currentSprint.name)

      // Get enhanced steps for this sprint
      const enhancedSteps = await sprintService.getEnhancedStepsForOldSprint(currentSprint.name)
      const totalSteps = enhancedSteps.length
      
      // Get completed tasks from localStorage
      const completedTasksKey = `completed_tasks_${user!.id}_${currentSprintId}`
      const completedTasksData = localStorage.getItem(completedTasksKey)
      
      let completed = 0
      if (completedTasksData) {
        try {
          const completedTasks = JSON.parse(completedTasksData)
          // Count only valid enhanced step completions
          const validStepIds = new Set(enhancedSteps.map(step => `enhanced-step-${step.id}`))
          completed = completedTasks.filter((taskId: string) => validStepIds.has(taskId)).length
        } catch (error) {
          console.error('[DASHBOARD-PROGRESS] Error parsing completed tasks:', error)
        }
      }
      
      const percent = totalSteps > 0 ? Math.round((completed / totalSteps) * 100) : 0
      
      // Track sprint completion in localStorage
      if (percent === 100) {
        const completedSprintsKey = `completed_sprints_${user!.id}`
        const completedSprintsData = localStorage.getItem(completedSprintsKey)
        let completedSprints: string[] = []
        
        if (completedSprintsData) {
          try {
            completedSprints = JSON.parse(completedSprintsData)
          } catch (error) {
            console.error('[DASHBOARD-PROGRESS] Error parsing completed sprints:', error)
          }
        }
        
        // Add this sprint to completed list if not already there
        if (!completedSprints.includes(currentSprintId)) {
          completedSprints.push(currentSprintId)
          localStorage.setItem(completedSprintsKey, JSON.stringify(completedSprints))
          console.log('[DASHBOARD-PROGRESS] Sprint marked as completed:', currentSprint.client_facing_title)
        }
      }
      
      console.log('[DASHBOARD-PROGRESS] Progress calculated:', {
        sprintName: currentSprint.client_facing_title,
        completed,
        totalSteps,
        percent
      })

      setProgressData({
        sprintName: currentSprint.client_facing_title || currentSprint.name,
        completed,
        total: totalSteps,
        percent
      })

    } catch (error) {
      console.error('[DASHBOARD-PROGRESS] Error loading progress:', error)
      setProgressData(null)
    }
  }

  // Don't render anything if no progress data
  if (!progressData) {
    return null
  }

  // Use enhanced progress tracker if we have sprint data
  const currentSprintId = progressData && startedSprints.length > 0 ? 
    startedSprints[startedSprints.length - 1] : null

  if (currentSprintId && progressData) {
    return (
      <EnhancedProgressTracker
        sprintId={currentSprintId}
        sprintName={progressData.sprintName}
        totalTasks={progressData.total}
        completedTasks={progressData.completed}
        className={className}
      />
    )
  }

  // Fallback to simple progress display
  return (
    <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Sprint Progress</h3>
      
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Current Sprint: {progressData.sprintName}</span>
          <span className="text-sm text-gray-500">{progressData.percent}%</span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressData.percent}%` }}
          />
        </div>
        
        <div className="flex justify-between text-sm text-gray-600 mt-2">
          <span>{progressData.completed} of {progressData.total} steps completed</span>
          <span>{progressData.percent}% complete</span>
        </div>
      </div>
    </div>
  )
}