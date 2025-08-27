'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import { sprintService } from '@/services/sprintService'
import { CheckCircle2, Circle, Clock, ArrowLeft, Target } from 'lucide-react'

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
  const [loading, setLoading] = useState(true)
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (params.id && user?.id) {
      loadSprint()
    }
  }, [params.id, user?.id])
  
  // Load completed tasks after sprint is loaded
  useEffect(() => {
    if (sprint && user?.id && params.id) {
      loadCompletedTasks()
    }
  }, [sprint, user?.id, params.id])

  const loadSprint = async () => {
    try {
      setLoading(true)
      console.log('[SPRINT-DETAIL] Loading sprint:', params.id)
      
      // Quick timeout for database calls
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database timeout')), 5000)
      )
      
      try {
        const sprintData = await Promise.race([
          sprintService.getSprintById(params.id as string),
          timeoutPromise
        ])
        console.log('[SPRINT-DETAIL] Sprint data:', sprintData)
        setSprint(sprintData as any)
      } catch (dbError) {
        console.error('[SPRINT-DETAIL] Database timeout, using fallback sprint')
        // Fallback sprint data
        setSprint({
          id: params.id as string,
          name: 'profitable_service',
          client_facing_title: 'Lock In Your Most Profitable Service Zone',
          description: 'Focus your business on the service that generates the most profit and satisfaction.',
          goal: 'Identify and systematize your most profitable service delivery process.',
          time_saved_hours: 5
        })
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
      if (saved) {
        try {
          const taskIds = JSON.parse(saved)
          console.log('[SPRINT-DETAIL] Loaded completed tasks:', taskIds)
          
          // Get current valid task IDs for this sprint
          const currentSprintTasks = getSprintTasks(sprint!.name || 'profitable_service')
          const validTaskIds = new Set<string>()
          currentSprintTasks.forEach(day => {
            day.tasks.forEach(task => {
              validTaskIds.add(task.id)
            })
          })
          
          // Filter saved tasks to only include valid ones
          const filteredTaskIds = taskIds.filter((id: string) => validTaskIds.has(id))
          console.log('[SPRINT-DETAIL] Filtered to valid tasks:', filteredTaskIds, 'from', taskIds)
          
          setCompletedTasks(new Set(filteredTaskIds))
          
          // Update localStorage if we filtered out invalid tasks
          if (filteredTaskIds.length !== taskIds.length) {
            localStorage.setItem(key, JSON.stringify(filteredTaskIds))
            console.log('[SPRINT-DETAIL] Cleaned up localStorage with valid tasks only')
          }
        } catch (error) {
          console.error('[SPRINT-DETAIL] Error parsing completed tasks:', error)
        }
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

  const handleCompleteTask = (taskId: string) => {
    setCompletedTasks(prev => {
      const newSet = new Set(prev)
      if (newSet.has(taskId)) {
        newSet.delete(taskId)
      } else {
        newSet.add(taskId)
      }
      saveCompletedTasks(newSet)
      return newSet
    })
  }

  const getCompletionStats = () => {
    const sprintTasks = getSprintTasks(sprint?.name || 'profitable_service')
    const totalTasks = sprintTasks.reduce((sum, day) => sum + day.tasks.length, 0)
    const completed = completedTasks.size
    const percentage = totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0
    
    return { totalTasks, completed, percentage }
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

            {/* Progress Bar */}
            <div className="bg-white rounded-lg p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Sprint Progress</h2>
                <span className="text-sm text-gray-600">{stats.completed} of {stats.totalTasks} tasks completed</span>
              </div>
              
              <div className="bg-gray-200 rounded-full h-3 mb-2">
                <div 
                  className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${stats.percentage}%` }}
                />
              </div>
              
              <div className="text-center text-2xl font-bold text-blue-600 mt-2">
                {stats.percentage}% Complete
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

          {/* Daily Tasks */}
          <div className="space-y-6">
            {getSprintTasks(sprint?.name || 'profitable_service').map((dayData) => (
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
            ))}
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