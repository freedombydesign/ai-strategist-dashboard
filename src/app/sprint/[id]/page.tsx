'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import { sprintService, type EnhancedStep } from '@/services/sprintService'
import EnhancedProgressTracker from '@/components/EnhancedProgressTracker'
import SprintCheckinPrompt from '@/components/SprintCheckinPrompt'
import { CheckCircle2, Circle, Clock, ArrowLeft, Target, ExternalLink } from 'lucide-react'

interface Sprint {
  id: string
  name: string
  client_facing_title?: string
  description?: string
  goal?: string
  time_saved_hours?: number
}

// Sprint-specific daily tasks based on sprint type
const getSprintTasks = (sprintName: string) => {
  const taskLibrary = {
    'profitable_service': [
      {
        day: 1,
        tasks: [
          {
            id: 'profit-1-1',
            title: 'Analyze Service Profitability',
            description: 'Calculate the actual profit margin for each service you offer by factoring in all costs.',
            estimatedMinutes: 20,
            category: 'Financial Analysis'
          },
          {
            id: 'profit-1-2',
            title: 'Identify High-Value Clients',
            description: 'List your top 10 clients and identify which service they value most from you.',
            estimatedMinutes: 15,
            category: 'Client Analysis'
          }
        ]
      },
      {
        day: 2,
        tasks: [
          {
            id: 'profit-2-1',
            title: 'Document Your Golden Service',
            description: 'Write down every step of your most profitable service delivery process.',
            estimatedMinutes: 25,
            category: 'Documentation'
          }
        ]
      },
      {
        day: 3,
        tasks: [
          {
            id: 'profit-3-1',
            title: 'Create Service Focus Plan',
            description: 'Decide what percentage of your time will focus on this profitable service going forward.',
            estimatedMinutes: 15,
            category: 'Strategy'
          }
        ]
      }
    ],
    'smooth_path': [
      {
        day: 1,
        tasks: [
          {
            id: 'path-1-1',
            title: 'Map Your Current Buyer Journey',
            description: 'Document every touchpoint from when a prospect first hears about you to becoming a paying client.',
            estimatedMinutes: 20,
            category: 'Journey Mapping'
          },
          {
            id: 'path-1-2',
            title: 'Identify Friction Points',
            description: 'Mark where prospects typically get confused, delayed, or drop off in your current process.',
            estimatedMinutes: 15,
            category: 'Analysis'
          }
        ]
      },
      {
        day: 2,
        tasks: [
          {
            id: 'path-2-1',
            title: 'Design Smooth Handoffs',
            description: 'Create simple transition processes between each stage of your buyer journey.',
            estimatedMinutes: 25,
            category: 'Process Design'
          }
        ]
      },
      {
        day: 3,
        tasks: [
          {
            id: 'path-3-1',
            title: 'Test Your New Path',
            description: 'Walk through your improved buyer journey with a recent prospect or ask someone to role-play it.',
            estimatedMinutes: 20,
            category: 'Testing'
          }
        ]
      }
    ],
    'sell_bottleneck': [
      {
        day: 1,
        tasks: [
          {
            id: 'sell-1-1',
            title: 'Identify Your Sales Bottlenecks',
            description: 'List all the sales activities that currently require your personal involvement.',
            estimatedMinutes: 15,
            category: 'Assessment'
          },
          {
            id: 'sell-1-2',
            title: 'Create Sales Scripts',
            description: 'Write down the exact words you use for common sales conversations and objection handling.',
            estimatedMinutes: 25,
            category: 'Documentation'
          }
        ]
      },
      {
        day: 2,
        tasks: [
          {
            id: 'sell-2-1',
            title: 'Design Sales System',
            description: 'Create a step-by-step sales process that someone else could follow to close deals.',
            estimatedMinutes: 30,
            category: 'System Design'
          }
        ]
      },
      {
        day: 3,
        tasks: [
          {
            id: 'sell-3-1',
            title: 'Test Sales Delegation',
            description: 'Have someone else practice your sales process with you or a role-play scenario.',
            estimatedMinutes: 20,
            category: 'Delegation'
          }
        ]
      }
    ],
    'streamline_delivery': [
      {
        day: 1,
        tasks: [
          {
            id: 'delivery-1-1',
            title: 'Map Your Delivery Process',
            description: 'Document every step from client onboarding to project completion.',
            estimatedMinutes: 25,
            category: 'Process Mapping'
          }
        ]
      },
      {
        day: 2,
        tasks: [
          {
            id: 'delivery-2-1',
            title: 'Create Delivery Templates',
            description: 'Build reusable templates, checklists, and workflows for consistent service delivery.',
            estimatedMinutes: 30,
            category: 'Templates'
          }
        ]
      },
      {
        day: 3,
        tasks: [
          {
            id: 'delivery-3-1',
            title: 'Test Streamlined Delivery',
            description: 'Use your new templates and processes with a current client project.',
            estimatedMinutes: 15,
            category: 'Implementation'
          }
        ]
      }
    ],
    'continuous_improve': [
      {
        day: 1,
        tasks: [
          {
            id: 'improve-1-1',
            title: 'Set Up Feedback Systems',
            description: 'Create simple ways to regularly collect feedback from clients and team members.',
            estimatedMinutes: 20,
            category: 'Feedback Systems'
          }
        ]
      },
      {
        day: 2,
        tasks: [
          {
            id: 'improve-2-1',
            title: 'Create Improvement Process',
            description: 'Design a weekly routine to review what worked and what can be improved.',
            estimatedMinutes: 15,
            category: 'Process'
          }
        ]
      },
      {
        day: 3,
        tasks: [
          {
            id: 'improve-3-1',
            title: 'Schedule Regular Reviews',
            description: 'Block time in your calendar for weekly improvement sessions and stick to them.',
            estimatedMinutes: 10,
            category: 'Scheduling'
          }
        ]
      }
    ]
  }

  return taskLibrary[sprintName as keyof typeof taskLibrary] || taskLibrary.profitable_service
}

export default function SprintDetailPage() {
  const params = useParams()
  const { user } = useAuth()
  const [sprint, setSprint] = useState<Sprint | null>(null)
  const [enhancedSteps, setEnhancedSteps] = useState<EnhancedStep[]>([])
  const [loading, setLoading] = useState(true)
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (params.id && user?.id) {
      loadSprint()
      
      // Set this sprint as the active one for dashboard tracking
      const activeSprintKey = `active_sprint_${user.id}`
      localStorage.setItem(activeSprintKey, JSON.stringify(params.id))
      console.log('[SPRINT-DETAIL] Set active sprint for dashboard:', params.id)
    }
  }, [params.id, user?.id])
  
  // Load completed tasks after sprint is loaded
  useEffect(() => {
    if (sprint && user?.id && params.id) {
      loadCompletedTasks()
    }
  }, [sprint, user?.id, params.id, enhancedSteps.length]) // Add enhancedSteps.length as dependency

  const loadSprint = async () => {
    try {
      setLoading(true)
      console.log('[SPRINT-DETAIL] Loading enhanced sprint and steps:', params.id)
      
      // First try to load from enhanced sprint data
      try {
        const enhancedSprints = await sprintService.getEnhancedSprintData()
        const sprintData = enhancedSprints.find(s => s.id === params.id)
        
        if (sprintData) {
          console.log('[SPRINT-DETAIL] Found enhanced sprint data:', sprintData)
          setSprint(sprintData)
          
          // Load the actual Airtable steps for this sprint
          const steps = await sprintService.getEnhancedStepsForOldSprint(sprintData.name)
          console.log('[SPRINT-DETAIL] Loaded enhanced steps:', steps)
          setEnhancedSteps(steps)
        } else {
          console.log('[SPRINT-DETAIL] No enhanced sprint found, trying regular sprint')
          const fallbackSprint = await sprintService.getSprintById(params.id as string)
          if (fallbackSprint) {
            setSprint(fallbackSprint as any)
          }
        }
      } catch (dbError) {
        console.error('[SPRINT-DETAIL] Error loading enhanced data:', dbError)
        
        // Fallback to regular sprint loading
        try {
          const fallbackSprint = await sprintService.getSprintById(params.id as string)
          setSprint(fallbackSprint as any)
        } catch (fallbackError) {
          console.error('[SPRINT-DETAIL] All loading attempts failed')
        }
      }
    } catch (error) {
      console.error('[SPRINT-DETAIL] Error loading sprint:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadCompletedTasks = () => {
    if (typeof window !== 'undefined' && user?.id && params.id) {
      const key = `completed_tasks_${user.id}_${params.id}`
      const saved = localStorage.getItem(key)
      
      // Start with pre-completed steps from Airtable data
      const preCompletedTasks = new Set<string>()
      
      // Never load pre-completed steps from Airtable - only use localStorage
      console.log('[SPRINT-DETAIL] Using only localStorage completion data - ignoring Airtable completion_status')
      
      if (saved) {
        try {
          const taskIds = JSON.parse(saved)
          console.log('[SPRINT-DETAIL] Loaded completed tasks from localStorage:', taskIds)
          
          // If we have enhanced steps, validate against those IDs
          if (enhancedSteps.length > 0) {
            const validStepIds = new Set(enhancedSteps.map(step => `enhanced-step-${step.id}`))
            const filteredTaskIds = taskIds.filter((id: string) => validStepIds.has(id))
            console.log('[SPRINT-DETAIL] Filtered to valid enhanced steps:', filteredTaskIds, 'from', taskIds)
            
            // Combine localStorage data with pre-completed tasks
            const combinedCompleted = new Set([...preCompletedTasks, ...filteredTaskIds])
            setCompletedTasks(combinedCompleted)
          } else {
            // Fallback to old system
            const currentSprintTasks = getSprintTasks(sprint?.name || 'profitable_service')
            const validTaskIds = new Set<string>()
            currentSprintTasks.forEach(day => {
              day.tasks.forEach(task => {
                validTaskIds.add(task.id)
              })
            })
            
            const filteredTaskIds = taskIds.filter((id: string) => validTaskIds.has(id))
            console.log('[SPRINT-DETAIL] Filtered to valid tasks (fallback):', filteredTaskIds, 'from', taskIds)
            setCompletedTasks(new Set(filteredTaskIds))
          }
        } catch (error) {
          console.error('[SPRINT-DETAIL] Error parsing completed tasks:', error)
          setCompletedTasks(preCompletedTasks) // Use just pre-completed if parsing fails
        }
      } else {
        // No saved data, just use pre-completed tasks
        setCompletedTasks(preCompletedTasks)
      }
    }
  }

  const saveCompletedTasks = (taskIds: Set<string>) => {
    if (typeof window !== 'undefined' && user?.id && params.id) {
      const key = `completed_tasks_${user.id}_${params.id}`
      const array = Array.from(taskIds)
      localStorage.setItem(key, JSON.stringify(array))
      console.log('[SPRINT-DETAIL] Saved completed tasks:', array)
    }
  }

  const handleCompleteTask = async (taskId: string) => {
    setCompletedTasks(prev => {
      const newSet = new Set(prev)
      if (newSet.has(taskId)) {
        newSet.delete(taskId)
      } else {
        newSet.add(taskId)
      }
      saveCompletedTasks(newSet)
      
      // Check if sprint is now complete after adding this task
      if (!newSet.has(taskId)) return newSet // If we just removed a task, don't check completion
      
      // Calculate new completion stats
      let totalTasks = 0
      let completed = 0
      
      if (enhancedSteps.length > 0) {
        totalTasks = enhancedSteps.length
        const validEnhancedStepIds = new Set(enhancedSteps.map(step => `enhanced-step-${step.id}`))
        completed = Array.from(newSet).filter(tId => validEnhancedStepIds.has(tId)).length
      } else {
        const sprintTasks = getSprintTasks(sprint?.name || 'profitable_service')
        totalTasks = sprintTasks.reduce((sum, day) => sum + day.tasks.length, 0)
        completed = newSet.size
      }
      
      // Check if sprint is 100% complete
      if (completed === totalTasks && totalTasks > 0) {
        console.log('[SPRINT-COMPLETION] 🎉 Sprint completed! Triggering celebration email...')
        
        // Mark this sprint as completed in localStorage
        if (user?.id) {
          const completedSprintsKey = `completed_sprints_${user.id}`
          const completedSprintsData = localStorage.getItem(completedSprintsKey)
          let completedSprints = []
          
          if (completedSprintsData) {
            try {
              completedSprints = JSON.parse(completedSprintsData)
            } catch (error) {
              console.error('[SPRINT-COMPLETION] Error parsing completed sprints:', error)
            }
          }
          
          // Only send email if this is the first time completing this sprint
          if (!completedSprints.includes(params.id)) {
            completedSprints.push(params.id)
            localStorage.setItem(completedSprintsKey, JSON.stringify(completedSprints))
            
            // Send sprint completion email
            sendSprintCompletionEmail(completed, totalTasks)
          }
        }
      }
      
      return newSet
    })
  }

  const sendSprintCompletionEmail = async (completedTasks: number, totalTasks: number) => {
    if (!user?.email || !sprint) return
    
    try {
      console.log('[SPRINT-COMPLETION] 📧 Sending sprint completion email...')
      
      const response = await fetch('/api/send-sprint-completion-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userEmail: user.email,
          userName: user.user_metadata?.name || user.email?.split('@')[0]?.replace(/[._]/g, ' ')?.replace(/\b\w/g, l => l.toUpperCase()) || 'there',
          sprintData: {
            name: sprint.name,
            client_facing_title: sprint.client_facing_title || sprint.name,
            description: sprint.description || '',
            goal: sprint.goal || '',
            time_saved_hours: sprint.time_saved_hours || 0
          },
          userProgress: {
            totalStepsCompleted: completedTasks,
            sprintDuration: Math.ceil(totalTasks / 2) // Estimate based on task count
          }
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        console.log('[SPRINT-COMPLETION] ✅ Sprint completion email sent! ID:', result.emailId)
        // Show a nice success message to the user
        alert('🎉 Sprint Completed! Check your email for your celebration and next steps!')
      } else {
        console.error('[SPRINT-COMPLETION] ❌ Email failed:', result.error)
      }
      
    } catch (error) {
      console.error('[SPRINT-COMPLETION] 💥 Error sending email:', error)
    }
  }

  const handleResetSprint = () => {
    const confirmReset = window.confirm(
      'Are you sure you want to reset this sprint? This will clear all completed tasks and cannot be undone.'
    )
    
    if (confirmReset) {
      console.log('[SPRINT-DETAIL] Resetting sprint:', params.id)
      
      // Clear all completed tasks for this sprint
      const key = `completed_tasks_${user?.id}_${params.id}`
      localStorage.removeItem(key)
      
      // Also remove from completed sprints if it was marked complete
      if (user?.id) {
        const completedSprintsKey = `completed_sprints_${user.id}`
        const completedSprintsData = localStorage.getItem(completedSprintsKey)
        if (completedSprintsData) {
          try {
            const completedSprints = JSON.parse(completedSprintsData)
            const updatedCompleted = completedSprints.filter((id: string) => id !== params.id)
            localStorage.setItem(completedSprintsKey, JSON.stringify(updatedCompleted))
          } catch (error) {
            console.error('[SPRINT-DETAIL] Error updating completed sprints:', error)
          }
        }
      }
      
      // Remove from started sprints to reset button state
      const startedSprintsKey = `started_sprints_${user.id}`
      const startedSprintsData = localStorage.getItem(startedSprintsKey)
      if (startedSprintsData) {
        try {
          const startedSprints = JSON.parse(startedSprintsData)
          const updatedStarted = startedSprints.filter((id: string) => id !== params.id)
          localStorage.setItem(startedSprintsKey, JSON.stringify(updatedStarted))
        } catch (error) {
          console.error('[SPRINT-DETAIL] Error updating started sprints:', error)
        }
      }
      
      // Reset local state
      setCompletedTasks(new Set())
      
      console.log('[SPRINT-DETAIL] Sprint reset successfully')
    }
  }

  const getCompletionStats = () => {
    // Use enhanced steps if available, otherwise fallback to old system
    if (enhancedSteps.length > 0) {
      const totalTasks = enhancedSteps.length
      // Count only valid enhanced step completions
      const validEnhancedStepIds = new Set(enhancedSteps.map(step => `enhanced-step-${step.id}`))
      const completed = Array.from(completedTasks).filter(taskId => validEnhancedStepIds.has(taskId)).length
      const percentage = totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0
      
      console.log('[SPRINT-DETAIL] Completion stats calculation:', {
        totalTasks,
        completed,
        percentage,
        enhancedStepsCount: enhancedSteps.length,
        completedTasksSize: completedTasks.size,
        validEnhancedStepIds: Array.from(validEnhancedStepIds),
        allCompletedTasks: Array.from(completedTasks)
      })
      
      return { totalTasks, completed, percentage }
    } else {
      const sprintTasks = getSprintTasks(sprint?.name || 'profitable_service')
      const totalTasks = sprintTasks.reduce((sum, day) => sum + day.tasks.length, 0)
      const completed = completedTasks.size
      const percentage = totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0
      
      console.log('[SPRINT-DETAIL] Fallback stats calculation:', {
        totalTasks,
        completed,
        percentage,
        sprintName: sprint?.name,
        completedTasksSize: completedTasks.size
      })
      
      return { totalTasks, completed, percentage }
    }
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-8"></div>
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white rounded-lg p-6">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="h-16 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  if (!sprint) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 p-6">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Sprint Not Found</h1>
            <Link href="/dashboard" className="text-blue-600 hover:text-blue-800">
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  const stats = getCompletionStats()

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link 
              href="/dashboard" 
              className="text-blue-600 hover:text-blue-800 text-sm font-medium mb-4 inline-flex items-center"
            >
              <ArrowLeft size={16} className="mr-2" />
              Back to Dashboard
            </Link>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {sprint.client_facing_title || sprint.name}
            </h1>
            
            {sprint.description && (
              <p className="text-lg text-gray-600 mb-6">
                {sprint.description}
              </p>
            )}

            {/* Enhanced Progress Tracker */}
            <div className="mb-6">
              <EnhancedProgressTracker
                sprintId={params.id as string}
                sprintName={sprint.client_facing_title || sprint.name}
                totalTasks={stats.totalTasks}
                completedTasks={stats.completed}
              />
              
              {/* Reset Button */}
              <div className="mt-4 text-right">
                <button
                  onClick={handleResetSprint}
                  className="text-red-600 hover:text-red-800 text-sm font-medium px-4 py-2 rounded-lg border border-red-300 hover:bg-red-50 transition-colors"
                  title="Reset all progress for this sprint"
                >
                  🔄 Reset Sprint Progress
                </button>
              </div>
            </div>

            {/* Goal */}
            {sprint.goal && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <Target className="text-green-600 mt-1 mr-3 flex-shrink-0" size={20} />
                  <div>
                    <h3 className="font-semibold text-green-900 mb-2">Sprint Goal</h3>
                    <p className="text-green-800">{sprint.goal}</p>
                    {sprint.time_saved_hours && (
                      <div className="mt-2 text-sm text-green-700 flex items-center">
                        <Clock size={14} className="mr-1" />
                        Time savings: {sprint.time_saved_hours} hours per week
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sprint Check-in Prompt */}
          <SprintCheckinPrompt
            sprintId={params.id as string}
            sprintName={sprint.client_facing_title || sprint.name}
            completedTasks={stats.completed}
            totalTasks={stats.totalTasks}
            className="mb-6"
          />

          {/* Sprint Steps */}
          <div className="space-y-6">
            {enhancedSteps.length > 0 ? (
              // Display Ruth's actual Airtable steps
              enhancedSteps.map((step) => {
                const stepId = `enhanced-step-${step.id}`
                const isCompleted = completedTasks.has(stepId)
                
                return (
                  <div key={step.id} className="bg-white rounded-lg shadow-sm border">
                    <div className="bg-gray-50 px-6 py-4 border-b">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Step {step.step_number}: {step.step_name}
                      </h3>
                    </div>
                    
                    <div className="p-6">
                      <div 
                        className={`rounded-lg border p-4 transition-all cursor-pointer ${
                          isCompleted 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-gray-50 border-gray-200 hover:border-blue-300'
                        }`}
                        onClick={() => handleCompleteTask(stepId)}
                      >
                        <div className="flex items-start">
                          <div className="mr-3 mt-1">
                            {isCompleted ? (
                              <CheckCircle2 size={20} className="text-green-600" />
                            ) : (
                              <Circle size={20} className="text-gray-400" />
                            )}
                          </div>
                          
                          <div className="flex-1">
                            <h4 className={`font-medium mb-2 ${
                              isCompleted ? 'text-green-900 line-through' : 'text-gray-900'
                            }`}>
                              {step.step_name}
                            </h4>
                            
                            <p className={`text-sm mb-3 ${
                              isCompleted ? 'text-green-700' : 'text-gray-600'
                            }`}>
                              {step.task_description}
                            </p>

                            <div className={`text-sm mb-3 font-medium ${
                              isCompleted ? 'text-green-800' : 'text-blue-800'
                            }`}>
                              <strong>Deliverable:</strong> {step.deliverable}
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="flex items-center text-xs text-gray-500 space-x-3">
                                {step.connected_ai_prompt && (
                                  <div className="px-2 py-1 bg-purple-100 rounded text-xs text-purple-700">
                                    AI: {step.connected_ai_prompt}
                                  </div>
                                )}
                                <div className="px-2 py-1 bg-blue-100 rounded text-xs text-blue-700">
                                  {step.sprint_category}
                                </div>
                              </div>

                              {step.resource_link && (
                                <a
                                  href={step.resource_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center text-xs text-blue-600 hover:text-blue-800"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <ExternalLink size={12} className="mr-1" />
                                  Resource Link
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              // Fallback to old system if no enhanced steps
              getSprintTasks(sprint?.name || 'profitable_service').map((dayData) => (
                <div key={dayData.day} className="bg-white rounded-lg shadow-sm border">
                  <div className="bg-gray-50 px-6 py-4 border-b">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Day {dayData.day}
                    </h3>
                  </div>
                  
                  <div className="p-6 space-y-4">
                    {dayData.tasks.map((task) => {
                      const isCompleted = completedTasks.has(task.id)
                      
                      return (
                        <div 
                          key={task.id}
                          className={`rounded-lg border p-4 transition-all cursor-pointer ${
                            isCompleted 
                              ? 'bg-green-50 border-green-200' 
                              : 'bg-gray-50 border-gray-200 hover:border-blue-300'
                          }`}
                          onClick={() => handleCompleteTask(task.id)}
                        >
                          <div className="flex items-start">
                            <div className="mr-3 mt-1">
                              {isCompleted ? (
                                <CheckCircle2 size={20} className="text-green-600" />
                              ) : (
                                <Circle size={20} className="text-gray-400" />
                              )}
                            </div>
                            
                            <div className="flex-1">
                              <h4 className={`font-medium mb-2 ${
                                isCompleted ? 'text-green-900 line-through' : 'text-gray-900'
                              }`}>
                                {task.title}
                              </h4>
                              
                              <p className={`text-sm mb-3 ${
                                isCompleted ? 'text-green-700' : 'text-gray-600'
                              }`}>
                                {task.description}
                              </p>
                              
                              <div className="flex items-center text-xs text-gray-500 space-x-3">
                                <div className="flex items-center">
                                  <Clock size={12} className="mr-1" />
                                  {task.estimatedMinutes} minutes
                                </div>
                                <div className="px-2 py-1 bg-gray-100 rounded text-xs">
                                  {task.category}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
            <h4 className="text-lg font-semibold text-blue-900 mb-2">
              🚀 Keep Going!
            </h4>
            <p className="text-blue-800">
              Each completed task removes you as a bottleneck. Complete all tasks to unlock the next sprint!
            </p>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}