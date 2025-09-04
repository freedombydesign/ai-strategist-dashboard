'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { sprintService, Sprint, Step, UserStepProgress } from '../services/sprintService'
import { CheckCircle2, Circle, Clock, ChevronRight, FileText } from 'lucide-react'

interface SprintDetailProps {
  sprint: Sprint
  onBack?: () => void
}

export default function SprintDetail({ sprint, onBack }: SprintDetailProps) {
  const { user } = useAuth()
  const [steps, setSteps] = useState<Step[]>([])
  const [userStepProgress, setUserStepProgress] = useState<UserStepProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [completingStep, setCompletingStep] = useState<string | null>(null)
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set())
  const [usingEnhancedSteps, setUsingEnhancedSteps] = useState(false)

  useEffect(() => {
    if (user?.id) {
      loadSprintDetails()
      
      // Set this sprint as the active one for dashboard tracking
      const activeSprintKey = `active_sprint_${user.id}`
      localStorage.setItem(activeSprintKey, JSON.stringify(sprint.id))
      console.log('[SPRINT-DETAIL-COMPONENT] Set active sprint for dashboard:', sprint.id)
    }
  }, [user?.id, sprint.id])

  const loadSprintDetails = async () => {
    try {
      setLoading(true)
      console.log('[SPRINT-DETAIL-COMPONENT] Loading enhanced steps for sprint:', sprint.name)
      
      // Try to load enhanced steps first (from Airtable data)
      const enhancedSteps = await sprintService.getEnhancedStepsForOldSprint(sprint.name)
      
      if (enhancedSteps.length > 0) {
        console.log('[SPRINT-DETAIL-COMPONENT] Using enhanced steps:', enhancedSteps.length)
        // Convert enhanced steps to the old Step format for compatibility
        const convertedSteps = enhancedSteps.map(step => ({
          id: step.id.toString(),
          title: step.step_name,
          description: step.task_description || '',
          sprint_id: sprint.id,
          order_number: step.step_number,
          estimated_minutes: 30, // Default
          resource_links: step.resource_link ? [step.resource_link] : [],
          deliverable: step.deliverable
        }))
        setSteps(convertedSteps)
        setUsingEnhancedSteps(true)
        
        // Load actual progress from localStorage instead of database
        loadCompletedTasksFromLocalStorage()
      } else {
        console.log('[SPRINT-DETAIL-COMPONENT] Falling back to old system')
        // Fallback to old system
        const [sprintSteps, stepProgress] = await Promise.all([
          sprintService.getSprintSteps(sprint.id),
          sprintService.getUserStepProgress(user!.id, sprint.id)
        ])

        setSteps(sprintSteps)
        setUserStepProgress(stepProgress)
      }
    } catch (error) {
      console.error('[SPRINT-DETAIL-COMPONENT] Error loading sprint details:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadCompletedTasksFromLocalStorage = () => {
    if (typeof window !== 'undefined' && user?.id) {
      const key = `completed_tasks_${user.id}_${sprint.id}`
      const saved = localStorage.getItem(key)
      
      // Start with pre-completed steps from Airtable data
      const preCompletedTasks = new Set<string>()
      
      // For true fresh starts, don't load any pre-completed steps from Airtable
      // Only use what's actually saved in localStorage
      console.log('[SPRINT-DETAIL-COMPONENT] Loading only localStorage data - no pre-completed steps')
      
      if (saved) {
        try {
          const taskIds = JSON.parse(saved)
          console.log('[SPRINT-DETAIL-COMPONENT] Loaded completed tasks from localStorage:', taskIds)
          
          // Combine localStorage data with pre-completed tasks
          const combinedCompleted = new Set([...preCompletedTasks, ...taskIds])
          setCompletedTasks(combinedCompleted)
        } catch (error) {
          console.error('[SPRINT-DETAIL-COMPONENT] Error parsing completed tasks:', error)
          setCompletedTasks(preCompletedTasks) // Use just pre-completed if parsing fails
        }
      } else {
        // No saved data, just use pre-completed tasks
        setCompletedTasks(preCompletedTasks)
      }
    }
  }

  const saveCompletedTasks = (taskIds: Set<string>) => {
    if (typeof window !== 'undefined' && user?.id) {
      const key = `completed_tasks_${user.id}_${sprint.id}`
      const array = Array.from(taskIds)
      localStorage.setItem(key, JSON.stringify(array))
      console.log('[SPRINT-DETAIL-COMPONENT] Saved completed tasks:', array)
    }
  }

  const getStepStatus = (stepId: string): 'completed' | 'current' | 'upcoming' => {
    if (usingEnhancedSteps) {
      // For enhanced steps, use localStorage completion status
      const taskId = `enhanced-step-${stepId}`
      if (completedTasks.has(taskId)) return 'completed'
      
      // Find the first uncompleted step to mark as current
      const currentStepIndex = steps.findIndex(step => {
        const taskId = `enhanced-step-${step.id}`
        return !completedTasks.has(taskId)
      })
      
      const stepIndex = steps.findIndex(step => step.id === stepId)
      return stepIndex === currentStepIndex ? 'current' : 'upcoming'
    } else {
      // Original logic for old system
      const progress = userStepProgress.find(p => p.step_id === stepId)
      if (progress?.status === 'completed') return 'completed'
      
      // Find the first uncompleted step to mark as current
      const currentStepIndex = steps.findIndex(step => {
        const stepProgress = userStepProgress.find(p => p.step_id === step.id)
        return !stepProgress || stepProgress.status !== 'completed'
      })
      
      const stepIndex = steps.findIndex(step => step.id === stepId)
      return stepIndex === currentStepIndex ? 'current' : 'upcoming'
    }
  }

  const handleCompleteStep = async (step: Step) => {
    if (!user?.id) return

    try {
      setCompletingStep(step.id)
      
      if (usingEnhancedSteps) {
        // For enhanced steps, toggle localStorage completion
        const taskId = `enhanced-step-${step.id}`
        const newCompletedTasks = new Set(completedTasks)
        
        if (newCompletedTasks.has(taskId)) {
          newCompletedTasks.delete(taskId)
        } else {
          newCompletedTasks.add(taskId)
        }
        
        setCompletedTasks(newCompletedTasks)
        saveCompletedTasks(newCompletedTasks)
      } else {
        // Original logic for old system
        const success = await sprintService.completeStep(user.id, step.id, sprint.id)
        
        if (success) {
          await loadSprintDetails() // Reload to update progress
        }
      }
    } catch (error) {
      console.error('Error completing step:', error)
    } finally {
      setCompletingStep(null)
    }
  }

  const handleResetSprint = () => {
    if (!user?.id) return
    
    const confirmReset = window.confirm(
      'Are you sure you want to reset this sprint? This will clear all completed tasks and cannot be undone.'
    )
    
    if (confirmReset) {
      console.log('[SPRINT-DETAIL-COMPONENT] Resetting sprint:', sprint.id)
      
      // Clear all completed tasks for this sprint
      const key = `completed_tasks_${user.id}_${sprint.id}`
      localStorage.removeItem(key)
      
      // Also remove from completed sprints if it was marked complete
      const completedSprintsKey = `completed_sprints_${user.id}`
      const completedSprintsData = localStorage.getItem(completedSprintsKey)
      if (completedSprintsData) {
        try {
          const completedSprints = JSON.parse(completedSprintsData)
          const updatedCompleted = completedSprints.filter((id: string) => id !== sprint.id)
          localStorage.setItem(completedSprintsKey, JSON.stringify(updatedCompleted))
        } catch (error) {
          console.error('[SPRINT-DETAIL-COMPONENT] Error updating completed sprints:', error)
        }
      }
      
      // Remove from started sprints to reset button state
      const startedSprintsKey = `started_sprints_${user.id}`
      const startedSprintsData = localStorage.getItem(startedSprintsKey)
      if (startedSprintsData) {
        try {
          const startedSprints = JSON.parse(startedSprintsData)
          const updatedStarted = startedSprints.filter((id: string) => id !== sprint.id)
          localStorage.setItem(startedSprintsKey, JSON.stringify(updatedStarted))
        } catch (error) {
          console.error('[SPRINT-DETAIL-COMPONENT] Error updating started sprints:', error)
        }
      }
      
      // Reset local state
      setCompletedTasks(new Set())
      
      console.log('[SPRINT-DETAIL-COMPONENT] Sprint reset successfully')
    }
  }

  const groupStepsByDay = (steps: Step[]) => {
    const grouped = steps.reduce((acc, step) => {
      const day = step.day_number
      if (!acc[day]) acc[day] = []
      acc[day].push(step)
      return acc
    }, {} as Record<number, Step[]>)

    return Object.entries(grouped)
      .map(([day, daySteps]) => ({ day: parseInt(day), steps: daySteps }))
      .sort((a, b) => a.day - b.day)
  }

  const getCompletionStats = () => {
    const totalSteps = steps.length
    
    if (usingEnhancedSteps) {
      // Count completed tasks from localStorage for enhanced steps
      const validEnhancedStepIds = new Set(steps.map(step => `enhanced-step-${step.id}`))
      const completedSteps = Array.from(completedTasks).filter(taskId => validEnhancedStepIds.has(taskId)).length
      const percentage = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0
      
      console.log('[SPRINT-DETAIL-COMPONENT] Enhanced completion stats:', {
        totalSteps,
        completedSteps,
        percentage,
        validEnhancedStepIds: Array.from(validEnhancedStepIds),
        completedTasks: Array.from(completedTasks)
      })
      
      return { totalSteps, completedSteps, percentage }
    } else {
      // Original logic for old system
      const completedSteps = userStepProgress.filter(p => p.status === 'completed').length
      const percentage = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0
      return { totalSteps, completedSteps, percentage }
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-2/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-full mb-8"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="border rounded-lg p-4">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const dayGroups = groupStepsByDay(steps)
  const stats = getCompletionStats()

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          {onBack && (
            <button
              onClick={onBack}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
            >
              ← Back to Sprint Overview
            </button>
          )}
          
          <button
            onClick={handleResetSprint}
            className="text-red-600 hover:text-red-800 text-sm font-medium flex items-center"
            title="Reset all progress for this sprint"
          >
            🔄 Reset Sprint
          </button>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {sprint.client_facing_title}
        </h2>
        
        <p className="text-gray-600 mb-4">
          {sprint.description}
        </p>

        {/* Progress Bar */}
        <div className="bg-gray-200 rounded-full h-2 mb-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${stats.percentage}%` }}
          />
        </div>
        
        <div className="flex justify-between text-sm text-gray-600">
          <span>{stats.completedSteps} of {stats.totalSteps} steps completed</span>
          <span>{stats.percentage}% complete</span>
        </div>
      </div>

      {/* Goal */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-green-900 mb-2">🎯 Sprint Goal</h3>
        <p className="text-green-800">{sprint.goal}</p>
        <div className="mt-2 text-sm text-green-700">
          <Clock size={14} className="inline mr-1" />
          Time savings: {sprint.time_saved_hours} hours per week
        </div>
      </div>

      {/* Daily Steps */}
      <div className="space-y-6">
        {dayGroups.map(({ day, steps: daySteps }) => (
          <div key={day} className="border-l-4 border-blue-200 pl-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Day {day}
            </h3>
            
            <div className="space-y-3">
              {daySteps.map((step) => {
                const status = getStepStatus(step.id)
                const isCompleting = completingStep === step.id
                
                return (
                  <div 
                    key={step.id}
                    className={`rounded-lg border p-4 transition-colors ${
                      status === 'completed' 
                        ? 'bg-green-50 border-green-200' 
                        : status === 'current'
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start flex-1">
                        <div className="mr-3 mt-0.5">
                          {status === 'completed' ? (
                            <CheckCircle2 size={20} className="text-green-600" />
                          ) : (
                            <Circle size={20} className={
                              status === 'current' ? 'text-blue-600' : 'text-gray-400'
                            } />
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <h4 className={`font-medium mb-2 ${
                            status === 'completed' ? 'text-green-900' : 'text-gray-900'
                          }`}>
                            {step.title}
                          </h4>
                          
                          <p className={`text-sm mb-3 ${
                            status === 'completed' ? 'text-green-700' : 'text-gray-600'
                          }`}>
                            {step.description}
                          </p>
                          
                          <div className="flex items-center text-xs text-gray-500 space-x-3">
                            <div className="flex items-center">
                              <Clock size={12} className="mr-1" />
                              {step.estimated_minutes} minutes
                            </div>
                            {step.category && (
                              <div className="flex items-center">
                                <FileText size={12} className="mr-1" />
                                {step.category}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {status === 'current' && (
                        <button
                          onClick={() => handleCompleteStep(step)}
                          disabled={isCompleting}
                          className="ml-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-3 py-1.5 rounded text-sm font-medium flex items-center transition-colors"
                        >
                          {isCompleting ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-b border-white mr-2"></div>
                              Completing...
                            </>
                          ) : (
                            <>
                              <CheckCircle2 size={14} className="mr-1" />
                              Complete
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Actions */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Keep up the great work! Each step removes you as a bottleneck.
          </div>
          
          {stats.percentage === 100 && (
            <div className="flex items-center text-green-600 font-medium">
              <CheckCircle2 size={16} className="mr-2" />
              Sprint Completed! 🎉
            </div>
          )}
        </div>
      </div>
    </div>
  )
}