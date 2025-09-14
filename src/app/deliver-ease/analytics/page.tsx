'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface PerformanceMetrics {
  totalProjects: number
  activeProjects: number
  completedProjects: number
  onTimeDeliveryRate: number
  avgProjectDuration: number
  clientSatisfactionScore: number
  teamUtilizationRate: number
  revenuePerProject: number
  profitMargin: number
  founderHoursPerWeek: number
  automationEfficiency: number
  qualityScore: number
}

interface ProjectAnalytics {
  projectId: string
  projectName: string
  clientName: string
  completionRate: number
  daysRemaining: number
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  budgetUtilization: number
  teamPerformance: number
  clientEngagement: number
  profitability: number
}

interface TeamMetrics {
  memberId: string
  memberName: string
  utilizationRate: number
  completedTasks: number
  avgTaskDuration: number
  qualityRating: number
  clientFeedback: number
  activeProjects: number
  skillEfficiency: number
}

interface BusinessInsight {
  category: 'efficiency' | 'growth' | 'risk' | 'opportunity'
  title: string
  metric: string
  value: number
  trend: 'up' | 'down' | 'stable'
  impact: 'high' | 'medium' | 'low'
  recommendation: string
}

export default function AnalyticsPage() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const [projectAnalytics, setProjectAnalytics] = useState<ProjectAnalytics[]>([])
  const [teamMetrics, setTeamMetrics] = useState<TeamMetrics[]>([])
  const [insights, setInsights] = useState<BusinessInsight[]>([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30d')
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    fetchAnalyticsData()
  }, [timeRange])

  const fetchAnalyticsData = async () => {
    setLoading(true)
    try {
      // Simulate fetching sophisticated analytics data
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setMetrics({
        totalProjects: 147,
        activeProjects: 23,
        completedProjects: 124,
        onTimeDeliveryRate: 94.2,
        avgProjectDuration: 45.3,
        clientSatisfactionScore: 4.8,
        teamUtilizationRate: 87.5,
        revenuePerProject: 47500,
        profitMargin: 34.2,
        founderHoursPerWeek: 8.5,
        automationEfficiency: 92.1,
        qualityScore: 96.3
      })

      setProjectAnalytics([
        {
          projectId: '1',
          projectName: 'Strategic Transformation',
          clientName: 'TechCorp Solutions',
          completionRate: 78,
          daysRemaining: 12,
          riskLevel: 'low',
          budgetUtilization: 72,
          teamPerformance: 94,
          clientEngagement: 89,
          profitability: 42.1
        },
        {
          projectId: '2',
          projectName: 'Digital Marketing Overhaul',
          clientName: 'GrowthVentures LLC',
          completionRate: 45,
          daysRemaining: 28,
          riskLevel: 'medium',
          budgetUtilization: 58,
          teamPerformance: 87,
          clientEngagement: 76,
          profitability: 29.7
        },
        {
          projectId: '3',
          projectName: 'Leadership Development Program',
          clientName: 'Enterprise Dynamics',
          completionRate: 92,
          daysRemaining: 5,
          riskLevel: 'low',
          budgetUtilization: 89,
          teamPerformance: 96,
          clientEngagement: 94,
          profitability: 48.3
        }
      ])

      setTeamMetrics([
        {
          memberId: '1',
          memberName: 'Sarah Chen',
          utilizationRate: 92,
          completedTasks: 34,
          avgTaskDuration: 3.2,
          qualityRating: 4.9,
          clientFeedback: 4.8,
          activeProjects: 4,
          skillEfficiency: 94
        },
        {
          memberId: '2',
          memberName: 'Marcus Johnson',
          utilizationRate: 87,
          completedTasks: 28,
          avgTaskDuration: 4.1,
          qualityRating: 4.7,
          clientFeedback: 4.6,
          activeProjects: 3,
          skillEfficiency: 89
        }
      ])

      setInsights([
        {
          category: 'efficiency',
          title: 'Automation ROI Exceeds Target',
          metric: 'Founder Time Reduction',
          value: 73.2,
          trend: 'up',
          impact: 'high',
          recommendation: 'Expand automation to additional workflow areas'
        },
        {
          category: 'growth',
          title: 'Project Margin Optimization',
          metric: 'Average Profit Margin',
          value: 34.2,
          trend: 'up',
          impact: 'high',
          recommendation: 'Implement value-based pricing for premium services'
        },
        {
          category: 'risk',
          title: 'Team Utilization Monitoring',
          metric: 'Average Team Utilization',
          value: 87.5,
          trend: 'stable',
          impact: 'medium',
          recommendation: 'Consider strategic capacity expansion'
        }
      ])

    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600 bg-green-50'
      case 'medium': return 'text-yellow-600 bg-yellow-50'
      case 'high': return 'text-orange-600 bg-orange-50'
      case 'critical': return 'text-red-600 bg-red-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return '↗'
      case 'down': return '↘'
      case 'stable': return '→'
      default: return '→'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics dashboard...</p>
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
              <h1 className="text-2xl font-bold text-gray-900">Performance Analytics</h1>
              <div className="ml-4 flex items-center space-x-2">
                <select 
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-1 text-sm"
                >
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                  <option value="90d">Last 90 Days</option>
                  <option value="1y">Last Year</option>
                </select>
              </div>
            </div>
            <div className="flex items-center space-x-4">
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
            {['overview', 'projects', 'team', 'insights'].map((tab) => (
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
            {/* Executive KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-indigo-600">Founder Hours/Week</p>
                    <p className="text-3xl font-bold text-indigo-900">{metrics?.founderHoursPerWeek}</p>
                    <p className="text-xs text-indigo-600 mt-1">Target: &lt;10 hours</p>
                  </div>
                  <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <span className="text-indigo-600 text-xl">⏱</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-emerald-600">On-Time Delivery</p>
                    <p className="text-3xl font-bold text-emerald-900">{metrics?.onTimeDeliveryRate}%</p>
                    <p className="text-xs text-emerald-600 mt-1">Industry: 78%</p>
                  </div>
                  <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <span className="text-emerald-600 text-xl">✓</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-violet-100 rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-violet-600">Profit Margin</p>
                    <p className="text-3xl font-bold text-violet-900">{metrics?.profitMargin}%</p>
                    <p className="text-xs text-violet-600 mt-1">+2.3% vs last period</p>
                  </div>
                  <div className="w-12 h-12 bg-violet-100 rounded-lg flex items-center justify-center">
                    <span className="text-violet-600 text-xl">📈</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-amber-50 to-yellow-100 rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-yellow-600">Automation Score</p>
                    <p className="text-3xl font-bold text-yellow-900">{metrics?.automationEfficiency}%</p>
                    <p className="text-xs text-yellow-600 mt-1">Excellent efficiency</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <span className="text-yellow-600 text-xl">⚡</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Secondary Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <p className="text-sm font-medium text-gray-500">Active Projects</p>
                <p className="text-2xl font-semibold text-gray-900">{metrics?.activeProjects}</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <p className="text-sm font-medium text-gray-500">Client Satisfaction</p>
                <p className="text-2xl font-semibold text-gray-900">{metrics?.clientSatisfactionScore}/5.0</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <p className="text-sm font-medium text-gray-500">Team Utilization</p>
                <p className="text-2xl font-semibold text-gray-900">{metrics?.teamUtilizationRate}%</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <p className="text-sm font-medium text-gray-500">Quality Score</p>
                <p className="text-2xl font-semibold text-gray-900">{metrics?.qualityScore}%</p>
              </div>
            </div>
          </>
        )}

        {activeTab === 'projects' && (
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Project Performance Analysis</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Risk Level</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Budget</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Performance</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Profitability</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {projectAnalytics.map((project) => (
                    <tr key={project.projectId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{project.projectName}</div>
                          <div className="text-sm text-gray-500">{project.clientName}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${project.completionRate}%` }}
                            ></div>
                          </div>
                          <span className="ml-2 text-sm text-gray-600">{project.completionRate}%</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">{project.daysRemaining} days remaining</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRiskLevelColor(project.riskLevel)}`}>
                          {project.riskLevel}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{project.budgetUtilization}%</div>
                        <div className="text-xs text-gray-500">utilized</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{project.teamPerformance}%</div>
                        <div className="text-xs text-gray-500">team score</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-green-600">{project.profitability}%</div>
                        <div className="text-xs text-gray-500">margin</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'team' && (
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Team Performance Metrics</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
              {teamMetrics.map((member) => (
                <div key={member.memberId} className="border rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-gray-900">{member.memberName}</h4>
                    <span className="text-sm text-gray-500">{member.activeProjects} active projects</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Utilization</p>
                      <p className="text-xl font-semibold text-gray-900">{member.utilizationRate}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Quality Rating</p>
                      <p className="text-xl font-semibold text-gray-900">{member.qualityRating}/5.0</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Tasks Completed</p>
                      <p className="text-xl font-semibold text-gray-900">{member.completedTasks}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Efficiency</p>
                      <p className="text-xl font-semibold text-gray-900">{member.skillEfficiency}%</p>
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
              <div key={index} className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full mr-3 ${
                        insight.category === 'efficiency' ? 'bg-blue-100 text-blue-800' :
                        insight.category === 'growth' ? 'bg-green-100 text-green-800' :
                        insight.category === 'risk' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {insight.category}
                      </span>
                      <span className="text-lg">{getTrendIcon(insight.trend)}</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{insight.title}</h3>
                    <p className="text-sm text-gray-600 mb-3">{insight.metric}: {insight.value}%</p>
                    <p className="text-sm text-gray-700">{insight.recommendation}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    insight.impact === 'high' ? 'bg-red-100 text-red-800' :
                    insight.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {insight.impact} impact
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}