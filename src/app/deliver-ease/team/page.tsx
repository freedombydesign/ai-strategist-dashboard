'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface TeamMember {
  id: string
  name: string
  role: string
  email: string
  avatar: string
  status: 'available' | 'busy' | 'unavailable'
  currentWorkload: number
  maxCapacity: number
  skillsets: string[]
  activeProjects: number
  completedTasks: number
  avgPerformance: number
  clientRating: number
  hoursThisWeek: number
  utilizationRate: number
  nextAvailable: string
}

interface WorkloadData {
  memberId: string
  memberName: string
  totalHours: number
  billableHours: number
  projects: {
    id: string
    name: string
    client: string
    hoursAllocated: number
    priority: 'low' | 'medium' | 'high' | 'critical'
    dueDate: string
  }[]
}

interface TaskAssignment {
  id: string
  taskName: string
  projectName: string
  clientName: string
  assignedTo: string
  estimatedHours: number
  deadline: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  status: 'pending' | 'in_progress' | 'review' | 'completed'
  skillsRequired: string[]
}

interface TeamInsight {
  type: 'capacity' | 'performance' | 'skill' | 'risk'
  title: string
  message: string
  impact: 'low' | 'medium' | 'high' | 'critical'
  recommendation: string
  affectedMembers: string[]
}

export default function TeamDashboardPage() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [workloadData, setWorkloadData] = useState<WorkloadData[]>([])
  const [pendingTasks, setPendingTasks] = useState<TaskAssignment[]>([])
  const [insights, setInsights] = useState<TeamInsight[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedMember, setSelectedMember] = useState<string | null>(null)
  const [rebalancing, setRebalancing] = useState(false)

  useEffect(() => {
    fetchTeamData()
  }, [])

  const fetchTeamData = async () => {
    setLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const mockTeamMembers = [
        {
          id: '1',
          name: 'Sarah Chen',
          role: 'Senior Strategy Consultant',
          email: 'sarah.chen@company.com',
          avatar: '/avatars/sarah.jpg',
          status: 'busy' as const,
          currentWorkload: 36,
          maxCapacity: 40,
          skillsets: ['Strategic Planning', 'Business Analysis', 'Market Research', 'Project Management'],
          activeProjects: 4,
          completedTasks: 34,
          avgPerformance: 94,
          clientRating: 4.9,
          hoursThisWeek: 36,
          utilizationRate: 90,
          nextAvailable: '2024-03-15'
        },
        {
          id: '2',
          name: 'Marcus Johnson',
          role: 'Digital Marketing Specialist',
          email: 'marcus.johnson@company.com',
          avatar: '/avatars/marcus.jpg',
          status: 'available' as const,
          currentWorkload: 28,
          maxCapacity: 40,
          skillsets: ['Digital Marketing', 'Campaign Management', 'Analytics', 'Content Strategy'],
          activeProjects: 3,
          completedTasks: 28,
          avgPerformance: 87,
          clientRating: 4.6,
          hoursThisWeek: 28,
          utilizationRate: 70,
          nextAvailable: 'Now'
        },
        {
          id: '3',
          name: 'Elena Rodriguez',
          role: 'Operations Manager',
          email: 'elena.rodriguez@company.com',
          avatar: '/avatars/elena.jpg',
          status: 'busy' as const,
          currentWorkload: 35,
          maxCapacity: 40,
          skillsets: ['Operations Management', 'Process Optimization', 'Quality Control', 'Team Leadership'],
          activeProjects: 5,
          completedTasks: 42,
          avgPerformance: 96,
          clientRating: 4.8,
          hoursThisWeek: 35,
          utilizationRate: 87.5,
          nextAvailable: '2024-03-12'
        },
        {
          id: '4',
          name: 'David Kim',
          role: 'Business Analyst',
          email: 'david.kim@company.com',
          avatar: '/avatars/david.jpg',
          status: 'available' as const,
          currentWorkload: 22,
          maxCapacity: 40,
          skillsets: ['Data Analysis', 'Financial Modeling', 'Research', 'Documentation'],
          activeProjects: 2,
          completedTasks: 19,
          avgPerformance: 91,
          clientRating: 4.7,
          hoursThisWeek: 22,
          utilizationRate: 55,
          nextAvailable: 'Now'
        }
      ]

      const mockWorkloadData = [
        {
          memberId: '1',
          memberName: 'Sarah Chen',
          totalHours: 36,
          billableHours: 34,
          projects: [
            {
              id: '1',
              name: 'Strategic Transformation',
              client: 'TechCorp Solutions',
              hoursAllocated: 16,
              priority: 'high' as const,
              dueDate: '2024-03-20'
            },
            {
              id: '2',
              name: 'Market Analysis',
              client: 'GrowthVentures',
              hoursAllocated: 12,
              priority: 'medium' as const,
              dueDate: '2024-03-25'
            },
            {
              id: '3',
              name: 'Process Optimization',
              client: 'Enterprise Dynamics',
              hoursAllocated: 8,
              priority: 'low' as const,
              dueDate: '2024-04-01'
            }
          ]
        },
        {
          memberId: '2',
          memberName: 'Marcus Johnson',
          totalHours: 28,
          billableHours: 26,
          projects: [
            {
              id: '4',
              name: 'Digital Campaign Launch',
              client: 'RetailPlus Inc',
              hoursAllocated: 18,
              priority: 'high' as const,
              dueDate: '2024-03-18'
            },
            {
              id: '5',
              name: 'Brand Strategy',
              client: 'StartupXYZ',
              hoursAllocated: 10,
              priority: 'medium' as const,
              dueDate: '2024-03-30'
            }
          ]
        }
      ]

      const mockPendingTasks = [
        {
          id: '1',
          taskName: 'Competitive Analysis Report',
          projectName: 'Strategic Transformation',
          clientName: 'TechCorp Solutions',
          assignedTo: '',
          estimatedHours: 8,
          deadline: '2024-03-20',
          priority: 'high' as const,
          status: 'pending' as const,
          skillsRequired: ['Market Research', 'Business Analysis']
        },
        {
          id: '2',
          taskName: 'Campaign Performance Review',
          projectName: 'Digital Campaign Launch',
          clientName: 'RetailPlus Inc',
          assignedTo: '',
          estimatedHours: 4,
          deadline: '2024-03-18',
          priority: 'critical' as const,
          status: 'pending' as const,
          skillsRequired: ['Digital Marketing', 'Analytics']
        },
        {
          id: '3',
          taskName: 'Process Documentation',
          projectName: 'Process Optimization',
          clientName: 'Enterprise Dynamics',
          assignedTo: '',
          estimatedHours: 6,
          deadline: '2024-03-22',
          priority: 'medium' as const,
          status: 'pending' as const,
          skillsRequired: ['Documentation', 'Process Optimization']
        }
      ]

      const mockInsights = [
        {
          type: 'capacity' as const,
          title: 'Capacity Imbalance Detected',
          message: 'David Kim is underutilized at 55% while Sarah Chen is at 90% capacity',
          impact: 'medium' as const,
          recommendation: 'Redistribute 6-8 hours of analytical work from Sarah to David',
          affectedMembers: ['Sarah Chen', 'David Kim']
        },
        {
          type: 'performance' as const,
          title: 'Exceptional Team Performance',
          message: 'Team average performance is 92%, exceeding industry benchmark of 78%',
          impact: 'high' as const,
          recommendation: 'Consider taking on additional high-value projects',
          affectedMembers: ['Sarah Chen', 'Elena Rodriguez', 'Marcus Johnson', 'David Kim']
        },
        {
          type: 'risk' as const,
          title: 'Critical Task Deadline Risk',
          message: 'Campaign Performance Review due in 2 days with no assigned team member',
          impact: 'critical' as const,
          recommendation: 'Immediately assign to Marcus Johnson or escalate timeline',
          affectedMembers: ['Marcus Johnson']
        }
      ]

      setTeamMembers(mockTeamMembers)
      setWorkloadData(mockWorkloadData)
      setPendingTasks(mockPendingTasks)
      setInsights(mockInsights)
      
    } catch (error) {
      console.error('Error fetching team data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'text-green-600 bg-green-50'
      case 'busy': return 'text-yellow-600 bg-yellow-50'
      case 'unavailable': return 'text-red-600 bg-red-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-50'
      case 'high': return 'text-orange-600 bg-orange-50'
      case 'medium': return 'text-yellow-600 bg-yellow-50'
      case 'low': return 'text-green-600 bg-green-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'critical': return 'border-red-400 bg-red-50'
      case 'high': return 'border-orange-400 bg-orange-50'
      case 'medium': return 'border-yellow-400 bg-yellow-50'
      case 'low': return 'border-green-400 bg-green-50'
      default: return 'border-gray-400 bg-gray-50'
    }
  }

  const handleAutoAssign = async () => {
    setRebalancing(true)
    await new Promise(resolve => setTimeout(resolve, 2000))
    console.log('Auto-assignment completed')
    setRebalancing(false)
  }

  const handleRebalanceWorkload = async () => {
    setRebalancing(true)
    await new Promise(resolve => setTimeout(resolve, 2000))
    console.log('Workload rebalancing completed')
    setRebalancing(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading team dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
              <span className="ml-3 px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                {teamMembers.length} Members
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleAutoAssign}
                disabled={rebalancing}
                className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {rebalancing ? 'Processing...' : 'Auto-Assign Tasks'}
              </button>
              <button
                onClick={handleRebalanceWorkload}
                disabled={rebalancing}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {rebalancing ? 'Rebalancing...' : 'Rebalance Workload'}
              </button>
              <Link
                href="/deliver-ease"
                className="bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
              >
                ← Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {['overview', 'workload', 'assignments', 'insights'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {activeTab === 'overview' && (
          <>
            {/* Team Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-indigo-600">Team Utilization</p>
                    <p className="text-3xl font-bold text-indigo-900">
                      {Math.round(teamMembers.reduce((acc, m) => acc + m.utilizationRate, 0) / teamMembers.length)}%
                    </p>
                    <p className="text-xs text-indigo-600 mt-1">Optimal: 80-90%</p>
                  </div>
                  <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <span className="text-indigo-600 text-xl">⚡</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-emerald-600">Avg Performance</p>
                    <p className="text-3xl font-bold text-emerald-900">
                      {Math.round(teamMembers.reduce((acc, m) => acc + m.avgPerformance, 0) / teamMembers.length)}%
                    </p>
                    <p className="text-xs text-emerald-600 mt-1">Industry: 78%</p>
                  </div>
                  <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <span className="text-emerald-600 text-xl">📈</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-violet-100 rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-violet-600">Client Rating</p>
                    <p className="text-3xl font-bold text-violet-900">
                      {(teamMembers.reduce((acc, m) => acc + m.clientRating, 0) / teamMembers.length).toFixed(1)}
                    </p>
                    <p className="text-xs text-violet-600 mt-1">Out of 5.0</p>
                  </div>
                  <div className="w-12 h-12 bg-violet-100 rounded-lg flex items-center justify-center">
                    <span className="text-violet-600 text-xl">⭐</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-amber-50 to-yellow-100 rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-yellow-600">Pending Tasks</p>
                    <p className="text-3xl font-bold text-yellow-900">{pendingTasks.length}</p>
                    <p className="text-xs text-yellow-600 mt-1">Need assignment</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <span className="text-yellow-600 text-xl">📋</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Team Members Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {teamMembers.map((member) => (
                <div key={member.id} className="bg-white rounded-lg shadow-sm border p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                        <span className="text-blue-600 font-bold text-lg">{member.name.split(' ').map(n => n[0]).join('')}</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{member.name}</h3>
                        <p className="text-sm text-gray-600">{member.role}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(member.status)}`}>
                      {member.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-500">Utilization</p>
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${member.utilizationRate}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{member.utilizationRate}%</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Performance</p>
                      <p className="text-lg font-semibold text-gray-900">{member.avgPerformance}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Active Projects</p>
                      <p className="text-lg font-semibold text-gray-900">{member.activeProjects}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">This Week</p>
                      <p className="text-lg font-semibold text-gray-900">{member.hoursThisWeek}h</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm text-gray-500 mb-2">Skills</p>
                    <div className="flex flex-wrap gap-1">
                      {member.skillsets.slice(0, 3).map((skill) => (
                        <span key={skill} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {skill}
                        </span>
                      ))}
                      {member.skillsets.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          +{member.skillsets.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>Next Available: {member.nextAvailable}</span>
                    <span>Rating: {member.clientRating}/5.0</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === 'workload' && (
          <div className="space-y-6">
            {workloadData.map((workload) => (
              <div key={workload.memberId} className="bg-white rounded-lg shadow-sm border">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">{workload.memberName}</h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>Total: {workload.totalHours}h</span>
                      <span>Billable: {workload.billableHours}h</span>
                      <span>Utilization: {Math.round((workload.billableHours / 40) * 100)}%</span>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {workload.projects.map((project) => (
                      <div key={project.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{project.name}</h4>
                          <p className="text-sm text-gray-600">{project.client}</p>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(project.priority)}`}>
                            {project.priority}
                          </span>
                          <span className="text-sm text-gray-600">{project.hoursAllocated}h</span>
                          <span className="text-sm text-gray-500">Due: {new Date(project.dueDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'assignments' && (
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Pending Task Assignments</h3>
              <button
                onClick={handleAutoAssign}
                disabled={rebalancing}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {rebalancing ? 'Auto-Assigning...' : 'Auto-Assign All'}
              </button>
            </div>
            <div className="divide-y divide-gray-200">
              {pendingTasks.map((task) => (
                <div key={task.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-lg font-medium text-gray-900">{task.taskName}</h4>
                      <p className="text-sm text-gray-600 mt-1">{task.projectName} • {task.clientName}</p>
                      <div className="flex items-center space-x-4 mt-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                        <span className="text-sm text-gray-500">{task.estimatedHours}h estimated</span>
                        <span className="text-sm text-gray-500">Due: {new Date(task.deadline).toLocaleDateString()}</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-3">
                        {task.skillsRequired.map((skill) => (
                          <span key={skill} className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <select className="border border-gray-300 rounded px-3 py-1 text-sm">
                        <option value="">Assign to...</option>
                        {teamMembers.map((member) => (
                          <option key={member.id} value={member.id}>
                            {member.name} ({member.utilizationRate}%)
                          </option>
                        ))}
                      </select>
                      <button className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors">
                        Assign
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'insights' && (
          <div className="space-y-6">
            {insights.map((insight, index) => (
              <div key={index} className={`rounded-lg border-l-4 p-6 ${getImpactColor(insight.impact)}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full mr-3 ${
                        insight.type === 'capacity' ? 'bg-blue-100 text-blue-800' :
                        insight.type === 'performance' ? 'bg-green-100 text-green-800' :
                        insight.type === 'skill' ? 'bg-purple-100 text-purple-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {insight.type}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        insight.impact === 'critical' ? 'bg-red-100 text-red-800' :
                        insight.impact === 'high' ? 'bg-orange-100 text-orange-800' :
                        insight.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {insight.impact} impact
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{insight.title}</h3>
                    <p className="text-gray-600 mb-3">{insight.message}</p>
                    <p className="text-sm text-gray-700 font-medium">Recommendation: {insight.recommendation}</p>
                    <div className="flex flex-wrap gap-1 mt-3">
                      {insight.affectedMembers.map((member) => (
                        <span key={member} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                          {member}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors">
                    Take Action
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}