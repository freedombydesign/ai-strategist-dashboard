'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface ClientProject {
  id: string
  projectName: string
  status: 'active' | 'completed' | 'on_hold'
  progress: number
  startDate: string
  targetDate: string
  currentPhase: string
  nextMilestone: string
  milestoneDate: string
  teamLead: string
  description: string
  budget: number
  budgetUsed: number
}

interface ProjectDeliverable {
  id: string
  name: string
  type: 'document' | 'presentation' | 'analysis' | 'design' | 'strategy'
  status: 'pending' | 'in_progress' | 'review' | 'completed'
  dueDate: string
  version: string
  downloadUrl?: string
  previewAvailable: boolean
  clientFeedback?: string
  description: string
}

interface ProjectUpdate {
  id: string
  date: string
  title: string
  content: string
  type: 'milestone' | 'progress' | 'deliverable' | 'meeting'
  author: string
  attachments: string[]
  important: boolean
}

interface ClientFeedback {
  deliverableId: string
  rating: number
  comments: string
  approved: boolean
  requestedChanges: string[]
}

export default function ClientPortalPage() {
  const [projects, setProjects] = useState<ClientProject[]>([])
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const [deliverables, setDeliverables] = useState<ProjectDeliverable[]>([])
  const [updates, setUpdates] = useState<ProjectUpdate[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [feedbackModal, setFeedbackModal] = useState<string | null>(null)
  const [clientFeedback, setClientFeedback] = useState<ClientFeedback>({
    deliverableId: '',
    rating: 5,
    comments: '',
    approved: true,
    requestedChanges: []
  })

  useEffect(() => {
    fetchPortalData()
  }, [])

  const fetchPortalData = async () => {
    setLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const mockProjects = [
        {
          id: '1',
          projectName: 'Strategic Business Transformation',
          status: 'active' as const,
          progress: 78,
          startDate: '2024-01-15',
          targetDate: '2024-04-15',
          currentPhase: 'Implementation Planning',
          nextMilestone: 'Phase 3 Completion',
          milestoneDate: '2024-03-20',
          teamLead: 'Sarah Chen',
          description: 'Comprehensive strategic transformation initiative focusing on operational excellence and market expansion.',
          budget: 75000,
          budgetUsed: 58500
        },
        {
          id: '2',
          projectName: 'Digital Marketing Campaign',
          status: 'active' as const,
          progress: 45,
          startDate: '2024-02-01',
          targetDate: '2024-03-15',
          currentPhase: 'Creative Development',
          nextMilestone: 'Campaign Launch',
          milestoneDate: '2024-03-10',
          teamLead: 'Marcus Johnson',
          description: 'Multi-channel digital marketing campaign to drive brand awareness and lead generation.',
          budget: 25000,
          budgetUsed: 11250
        }
      ]

      const mockDeliverables = [
        {
          id: '1',
          name: 'Current State Analysis Report',
          type: 'document' as const,
          status: 'completed' as const,
          dueDate: '2024-02-15',
          version: '2.0',
          downloadUrl: '/files/current-state-analysis.pdf',
          previewAvailable: true,
          description: 'Comprehensive analysis of current business operations, processes, and market position.',
          clientFeedback: 'Excellent insights and actionable recommendations.'
        },
        {
          id: '2',
          name: 'Strategic Roadmap Presentation',
          type: 'presentation' as const,
          status: 'review' as const,
          dueDate: '2024-03-10',
          version: '1.5',
          downloadUrl: '/files/strategic-roadmap.pptx',
          previewAvailable: true,
          description: '3-year strategic roadmap with implementation timeline and resource requirements.'
        },
        {
          id: '3',
          name: 'Implementation Plan',
          type: 'document' as const,
          status: 'in_progress' as const,
          dueDate: '2024-03-25',
          version: '1.0',
          previewAvailable: false,
          description: 'Detailed implementation plan with timelines, responsibilities, and success metrics.'
        }
      ]

      const mockUpdates = [
        {
          id: '1',
          date: '2024-03-05',
          title: 'Phase 2 Milestone Completed Successfully',
          content: 'We have successfully completed Phase 2 of your strategic transformation project. All deliverables have been reviewed and approved, and we are now transitioning into Phase 3 - Implementation Planning.',
          type: 'milestone' as const,
          author: 'Sarah Chen',
          attachments: ['phase2-summary.pdf'],
          important: true
        },
        {
          id: '2',
          date: '2024-03-03',
          title: 'Weekly Progress Update',
          content: 'This week we focused on stakeholder interviews and competitive analysis. The team conducted 12 stakeholder sessions and compiled insights that will inform our strategic recommendations.',
          type: 'progress' as const,
          author: 'Marcus Johnson',
          attachments: [],
          important: false
        },
        {
          id: '3',
          date: '2024-03-01',
          title: 'Strategic Roadmap Ready for Review',
          content: 'The strategic roadmap presentation is now available for your review in the deliverables section. Please review and provide feedback by March 8th.',
          type: 'deliverable' as const,
          author: 'Sarah Chen',
          attachments: ['roadmap-preview.pdf'],
          important: true
        }
      ]

      setProjects(mockProjects)
      setDeliverables(mockDeliverables)
      setUpdates(mockUpdates)
      setSelectedProject(mockProjects[0].id)
      
    } catch (error) {
      console.error('Error fetching portal data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50'
      case 'active': 
      case 'in_progress': return 'text-blue-600 bg-blue-50'
      case 'review': return 'text-yellow-600 bg-yellow-50'
      case 'pending': return 'text-gray-600 bg-gray-50'
      case 'on_hold': return 'text-red-600 bg-red-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'document': return '📄'
      case 'presentation': return '📊'
      case 'analysis': return '📈'
      case 'design': return '🎨'
      case 'strategy': return '🎯'
      default: return '📋'
    }
  }

  const handleFeedbackSubmit = async () => {
    console.log('Feedback submitted:', clientFeedback)
    setFeedbackModal(null)
    setClientFeedback({
      deliverableId: '',
      rating: 5,
      comments: '',
      approved: true,
      requestedChanges: []
    })
  }

  const currentProject = projects.find(p => p.id === selectedProject)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your project portal...</p>
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
              <h1 className="text-2xl font-bold text-gray-900">Project Portal</h1>
              <span className="ml-3 px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                Client Access
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/deliver-ease"
                className="bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
              >
                Admin View
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Project Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Projects</h3>
              <div className="space-y-3">
                {projects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => setSelectedProject(project.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedProject === project.id 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium text-gray-900 text-sm">{project.projectName}</div>
                    <div className="flex items-center justify-between mt-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(project.status)}`}>
                        {project.status.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-gray-500">{project.progress}%</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {currentProject && (
              <>
                {/* Project Overview Card */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-100 rounded-lg shadow-sm border p-6 mb-8">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">{currentProject.projectName}</h2>
                      <p className="text-gray-600 mb-4">{currentProject.description}</p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Current Phase:</span>
                          <p className="text-indigo-600">{currentProject.currentPhase}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Next Milestone:</span>
                          <p className="text-indigo-600">{currentProject.nextMilestone}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Target Date:</span>
                          <p className="text-indigo-600">{new Date(currentProject.targetDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                    <div className="ml-6 text-right">
                      <div className="text-3xl font-bold text-indigo-600">{currentProject.progress}%</div>
                      <div className="text-sm text-gray-600">Complete</div>
                    </div>
                  </div>
                  <div className="mt-6">
                    <div className="w-full bg-white rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${currentProject.progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Navigation Tabs */}
                <div className="border-b border-gray-200 mb-8">
                  <nav className="-mb-px flex space-x-8">
                    {['overview', 'deliverables', 'updates', 'communication'].map((tab) => (
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

                {/* Tab Content */}
                {activeTab === 'overview' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-lg shadow-sm border p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Details</h3>
                      <dl className="space-y-3">
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Team Lead</dt>
                          <dd className="text-sm text-gray-900">{currentProject.teamLead}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Start Date</dt>
                          <dd className="text-sm text-gray-900">{new Date(currentProject.startDate).toLocaleDateString()}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Budget Utilization</dt>
                          <dd className="text-sm text-gray-900">
                            ${currentProject.budgetUsed.toLocaleString()} of ${currentProject.budget.toLocaleString()}
                            <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${(currentProject.budgetUsed / currentProject.budget) * 100}%` }}
                              ></div>
                            </div>
                          </dd>
                        </div>
                      </dl>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                      <div className="space-y-3">
                        <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                          Download Project Summary
                        </button>
                        <button className="w-full border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                          Schedule Review Meeting
                        </button>
                        <button className="w-full border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                          Request Project Update
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'deliverables' && (
                  <div className="bg-white rounded-lg shadow-sm border">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900">Project Deliverables</h3>
                    </div>
                    <div className="divide-y divide-gray-200">
                      {deliverables.map((deliverable) => (
                        <div key={deliverable.id} className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-4">
                              <span className="text-2xl">{getTypeIcon(deliverable.type)}</span>
                              <div className="flex-1">
                                <h4 className="text-lg font-medium text-gray-900">{deliverable.name}</h4>
                                <p className="text-sm text-gray-600 mt-1">{deliverable.description}</p>
                                <div className="flex items-center space-x-4 mt-3">
                                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(deliverable.status)}`}>
                                    {deliverable.status.replace('_', ' ')}
                                  </span>
                                  <span className="text-sm text-gray-500">v{deliverable.version}</span>
                                  <span className="text-sm text-gray-500">Due: {new Date(deliverable.dueDate).toLocaleDateString()}</span>
                                </div>
                                {deliverable.clientFeedback && (
                                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                                    <p className="text-sm text-green-800">{deliverable.clientFeedback}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              {deliverable.downloadUrl && (
                                <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors">
                                  Download
                                </button>
                              )}
                              {deliverable.status === 'review' && (
                                <button
                                  onClick={() => setFeedbackModal(deliverable.id)}
                                  className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                                >
                                  Review
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'updates' && (
                  <div className="space-y-6">
                    {updates.map((update) => (
                      <div key={update.id} className="bg-white rounded-lg shadow-sm border p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              {update.important && (
                                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                              )}
                              <h4 className="text-lg font-medium text-gray-900">{update.title}</h4>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                update.type === 'milestone' ? 'bg-purple-100 text-purple-800' :
                                update.type === 'deliverable' ? 'bg-blue-100 text-blue-800' :
                                update.type === 'meeting' ? 'bg-green-100 text-green-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {update.type}
                              </span>
                            </div>
                            <p className="text-gray-600 mb-3">{update.content}</p>
                            <div className="flex items-center text-sm text-gray-500">
                              <span>{update.author}</span>
                              <span className="mx-2">•</span>
                              <span>{new Date(update.date).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'communication' && (
                  <div className="bg-white rounded-lg shadow-sm border p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Communication Center</h3>
                    <div className="space-y-4">
                      <div className="border rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2">Send Message to Team</h4>
                        <textarea
                          className="w-full border border-gray-300 rounded-lg p-3 text-sm"
                          rows={4}
                          placeholder="Type your message or question here..."
                        ></textarea>
                        <button className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors">
                          Send Message
                        </button>
                      </div>
                      <div className="border rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2">Request Meeting</h4>
                        <p className="text-sm text-gray-600 mb-3">Schedule a project review or consultation call with your team.</p>
                        <button className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition-colors">
                          Schedule Meeting
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Feedback Modal */}
      {feedbackModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full m-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Provide Feedback</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setClientFeedback({...clientFeedback, rating: star})}
                      className={`text-2xl ${star <= clientFeedback.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Comments</label>
                <textarea
                  value={clientFeedback.comments}
                  onChange={(e) => setClientFeedback({...clientFeedback, comments: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm"
                  rows={4}
                  placeholder="Share your feedback..."
                ></textarea>
              </div>
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={clientFeedback.approved}
                    onChange={() => setClientFeedback({...clientFeedback, approved: true})}
                    className="mr-2"
                  />
                  Approve
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={!clientFeedback.approved}
                    onChange={() => setClientFeedback({...clientFeedback, approved: false})}
                    className="mr-2"
                  />
                  Request Changes
                </label>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setFeedbackModal(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleFeedbackSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
              >
                Submit Feedback
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}