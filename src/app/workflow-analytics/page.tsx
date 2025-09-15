'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowLeftIcon,
  ChartBarIcon,
  ClockIcon,
  CogIcon,
  TrendingUpIcon,
  SparklesIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  LightBulbIcon,
  RocketLaunchIcon
} from '@heroicons/react/24/outline'

interface AnalyticsData {
  summary: {
    totalWorkflows: number
    totalTimeSaved: string
    averageAutomationPercentage: number
    mostUsedWorkflow: {
      id: string | null
      name: string
      usageCount: number
    }
  }
  trends: {
    timeSavedTrend: string
    automationTrend: string
    usageTrend: string
  }
  recommendations: Array<{
    type: string
    title: string
    description: string
    estimatedImpact: string
    workflowId?: string
  }>
  period: string
  generatedAt: string
  hasExecutionData: boolean
}

export default function WorkflowAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  const fetchAnalytics = async () => {
    try {
      setRefreshing(true)
      const response = await fetch('/api/systemizer/analytics')

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result?.success && result?.data) {
        setData(result.data)
        setError('')
      } else {
        setError(result?.error || 'Failed to fetch analytics data')
      }
    } catch (err) {
      console.error('Analytics fetch error:', err)
      setError('Unable to load analytics. Please try refreshing the page.')
      // Set fallback data to prevent crashes
      setData({
        summary: {
          totalWorkflows: 0,
          totalTimeSaved: '0 hours',
          averageAutomationPercentage: 0,
          mostUsedWorkflow: { id: null, name: 'No workflows yet', usageCount: 0 }
        },
        trends: {
          timeSavedTrend: 'stable',
          automationTrend: 'stable',
          usageTrend: 'stable'
        },
        recommendations: [],
        period: '30d',
        generatedAt: new Date().toISOString(),
        hasExecutionData: false
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const getTrendIcon = (trend: string) => {
    return trend === 'increasing'
      ? <TrendingUpIcon className="w-5 h-5 text-green-400" />
      : <CogIcon className="w-5 h-5 text-gray-400" />
  }

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'template_generation':
        return <SparklesIcon className="w-5 h-5 text-purple-400" />
      case 'optimization':
        return <CogIcon className="w-5 h-5 text-blue-400" />
      case 'new_workflow':
        return <CheckCircleIcon className="w-5 h-5 text-green-400" />
      case 'freedom_score':
        return <RocketLaunchIcon className="w-5 h-5 text-indigo-400" />
      default:
        return <LightBulbIcon className="w-5 h-5 text-yellow-400" />
    }
  }

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-slate-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p>Loading Analytics...</p>
        </div>
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-slate-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-center">
          <ExclamationTriangleIcon className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-lg">{error}</p>
          <button
            onClick={fetchAnalytics}
            className="mt-4 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-slate-900 to-indigo-900">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-sm border-b border-white/20">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <ArrowLeftIcon className="w-4 h-4" />
                <span>Back to Dashboard</span>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-white">📊 Workflow Analytics</h1>
                <p className="text-purple-200">Real-time insights from your workflow optimization</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={fetchAnalytics}
                disabled={refreshing}
                className="flex items-center space-x-2 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <ChartBarIcon className="w-4 h-4" />
                <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
              </button>

              <Link
                href="/service-delivery-systemizer"
                className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <SparklesIcon className="w-4 h-4" />
                <span>Analyze New Workflow</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <ChartBarIcon className="w-8 h-8 text-blue-400" />
              {getTrendIcon(data.trends.usageTrend)}
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Total Workflows</h3>
            <p className="text-3xl font-bold text-blue-400">{data.summary.totalWorkflows}</p>
            <p className="text-sm text-blue-200 mt-2">Active in system</p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <ClockIcon className="w-8 h-8 text-green-400" />
              {getTrendIcon(data.trends.timeSavedTrend)}
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Time Saved</h3>
            <p className="text-3xl font-bold text-green-400">{data.summary.totalTimeSaved}</p>
            <p className="text-sm text-green-200 mt-2">Through automation</p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <CogIcon className="w-8 h-8 text-purple-400" />
              {getTrendIcon(data.trends.automationTrend)}
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Automation Level</h3>
            <p className="text-3xl font-bold text-purple-400">{data.summary.averageAutomationPercentage}%</p>
            <p className="text-sm text-purple-200 mt-2">Average across workflows</p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <RocketLaunchIcon className="w-8 h-8 text-yellow-400" />
              <span className="text-xs text-yellow-200 bg-yellow-900/30 px-2 py-1 rounded">TOP</span>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Most Used</h3>
            <p className="text-sm font-medium text-yellow-400 mb-1">{data.summary.mostUsedWorkflow.name}</p>
            <p className="text-2xl font-bold text-yellow-400">{data.summary.mostUsedWorkflow.usageCount}</p>
            <p className="text-sm text-yellow-200 mt-2">executions</p>
          </div>
        </div>

        {/* AI Recommendations */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            <LightBulbIcon className="w-6 h-6 text-yellow-400 mr-3" />
            AI Recommendations
          </h2>

          {data.recommendations.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {data.recommendations.map((rec, index) => (
                <div key={index} className="bg-white/5 border border-white/10 rounded-lg p-6">
                  <div className="flex items-start space-x-3">
                    {getRecommendationIcon(rec.type)}
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-2">{rec.title}</h3>
                      <p className="text-gray-300 mb-3">{rec.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-green-400 font-medium">💰 {rec.estimatedImpact}</span>
                        {rec.workflowId && (
                          <Link
                            href="/template-manager"
                            className="text-xs bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded transition-colors"
                          >
                            Take Action →
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <SparklesIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-300">No recommendations available yet. Analyze more workflows to get AI insights!</p>
            </div>
          )}
        </div>

        {/* Workflow Navigation */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8">
          <h2 className="text-2xl font-bold text-white mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link
              href="/service-delivery-systemizer"
              className="group bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-6 transition-all"
            >
              <SparklesIcon className="w-8 h-8 text-purple-400 mb-3" />
              <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-purple-200">Analyze Workflow</h3>
              <p className="text-gray-300 text-sm">Start with workflow analysis to generate insights</p>
            </Link>

            <Link
              href="/template-manager"
              className="group bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-6 transition-all"
            >
              <CogIcon className="w-8 h-8 text-blue-400 mb-3" />
              <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-blue-200">Generate Templates</h3>
              <p className="text-gray-300 text-sm">Create AI-powered templates for automation</p>
            </Link>

            <Link
              href="/export-manager"
              className="group bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-6 transition-all"
            >
              <RocketLaunchIcon className="w-8 h-8 text-green-400 mb-3" />
              <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-green-200">Export to Platforms</h3>
              <p className="text-gray-300 text-sm">Deploy workflows to your favorite tools</p>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="text-center py-8 text-gray-400 text-sm">
        <p>Analytics last updated: {new Date(data.generatedAt).toLocaleString()}</p>
        <p className="mt-2">Period: {data.period} • {data.hasExecutionData ? 'Real execution data' : 'Estimated metrics'}</p>
      </div>
    </div>
  )
}