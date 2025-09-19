'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

interface FreedomScores {
  time_freedom: number
  money_freedom: number
  impact_freedom: number
  systems_freedom: number
  team_freedom: number
  stress_freedom: number
}

interface FreedomScoreData {
  overall: number
  scoreDate: string
  components: FreedomScores
  trend: 'improving' | 'declining' | 'stable'
  pointsChanged: number
  percentageChange: number
}

interface Insight {
  type: 'positive' | 'warning' | 'action' | 'info'
  message: string
  priority: 'high' | 'medium' | 'low'
}

interface Recommendation {
  sprintKey: string
  title: string
  description: string
  priority: number
  estimatedImpact: string
}

interface DashboardData {
  currentScore: FreedomScoreData | null
  insights: Insight[]
  recommendations: Recommendation[]
}

export default function FreedomDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAssessment, setShowAssessment] = useState(false)
  const [assessmentScores, setAssessmentScores] = useState<FreedomScores>({
    time_freedom: 70,
    money_freedom: 65,
    impact_freedom: 75,
    systems_freedom: 60,
    team_freedom: 80,
    stress_freedom: 85
  })

  useEffect(() => {
    fetchFreedomScore()
  }, [])

  const fetchFreedomScore = async () => {
    try {
      setLoading(true)
      console.log('[FREEDOM-DASHBOARD] Using fallback mode - no API calls')

      // Set default dashboard data to avoid API calls
      setDashboardData({
        currentScore: {
          overall: 65,
          scoreDate: new Date().toISOString(),
          components: {
            time_freedom: 60,
            money_freedom: 70,
            impact_freedom: 65,
            systems_freedom: 55,
            team_freedom: 50,
            stress_freedom: 75
          },
          trend: 'stable',
          pointsChanged: 0,
          percentageChange: 0
        },
        insights: [
          {
            type: 'info',
            message: 'Complete the diagnostic assessment to see personalized insights',
            priority: 'high'
          }
        ],
        recommendations: []
      })
      return

      // Fallback to original API
      const response = await fetch('/api/dashboard/freedom-score?period=30d&includeHistory=true&includeTrends=true')
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setDashboardData(result.data)
        } else {
          setError('Failed to load dashboard data')
        }
      } else {
        setError('Take the diagnostic assessment to see your freedom score')
      }
    } catch (err) {
      console.warn('Dashboard fetch failed:', err)
      setError('Take the diagnostic assessment to get started')
    } finally {
      setLoading(false)
    }
  }

  const submitAssessment = async () => {
    try {
      const response = await fetch('/api/dashboard/freedom-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assessmentDate: new Date().toISOString().split('T')[0],
          scores: assessmentScores,
          assessmentMethod: 'dashboard_update',
          notes: 'Assessment from Freedom Dashboard'
        })
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setShowAssessment(false)
          fetchFreedomScore()
        } else {
          setError('Failed to save assessment')
        }
      } else {
        setError('Could not save assessment - database may not be set up')
      }
    } catch (err) {
      setError('Assessment submission failed')
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400'
    if (score >= 60) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'positive': return '✅'
      case 'warning': return '⚠️'
      case 'action': return '🎯'
      default: return 'ℹ️'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
      <div className="bg-white/10 backdrop-blur-sm border-b border-white/20">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/workflow-analytics"
                className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors"
              >
                ← Back to Analytics
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-white">🚀 Freedom Dashboard</h1>
                <p className="text-purple-200">Track your journey to business freedom</p>
              </div>
            </div>

            <div className="flex space-x-4">
              <Link
                href="/assessment"
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                🎯 Take Diagnostic
              </Link>
              <button
                onClick={() => setShowAssessment(!showAssessment)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                {showAssessment ? 'Cancel' : '📊 Quick Score'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {error && (
          <div className="bg-yellow-500/20 border border-yellow-400/30 text-yellow-200 p-6 rounded-xl mb-8">
            <h3 className="font-bold text-lg mb-2">⚠️ Setup Required</h3>
            <p className="mb-4">{error}</p>
            <div className="text-sm">
              <p className="mb-2">To use the full diagnostic system:</p>
              <ol className="list-decimal list-inside space-y-1 text-xs">
                <li>Run the comprehensive database schema in your Supabase dashboard</li>
                <li>Run the diagnostic questions seed data</li>
                <li>Then use the sophisticated diagnostic assessment</li>
              </ol>
            </div>
          </div>
        )}

        {showAssessment && (
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">📊 Quick Freedom Assessment</h2>
            <p className="text-purple-200 mb-8">Rate each area from 0-100 based on your current level of freedom:</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(assessmentScores).map(([key, value]) => (
                <div key={key} className="space-y-2">
                  <label className="block text-white font-medium">
                    {key.replace('_', ' ').toUpperCase()}: {value}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={value}
                    onChange={(e) => setAssessmentScores({
                      ...assessmentScores,
                      [key]: parseInt(e.target.value)
                    })}
                    className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="text-sm text-purple-200">
                    {key === 'time_freedom' && 'Control over your schedule and time'}
                    {key === 'money_freedom' && 'Financial independence and cash flow'}
                    {key === 'impact_freedom' && 'Meaningful work and influence'}
                    {key === 'systems_freedom' && 'Automated processes and efficiency'}
                    {key === 'team_freedom' && 'Delegation and team capability'}
                    {key === 'stress_freedom' && 'Low stress and high well-being'}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center mt-8">
              <div className="text-2xl font-bold text-white">
                Overall Score: {Math.round(Object.values(assessmentScores).reduce((sum, score) => sum + score, 0) / 6)}%
              </div>
              <button
                onClick={submitAssessment}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors"
              >
                Save Assessment
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="text-white text-xl">Loading your freedom score...</div>
          </div>
        ) : dashboardData?.currentScore ? (
          <>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8 mb-8">
              <h2 className="text-2xl font-bold text-white mb-6">Your Freedom Score</h2>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 text-center">
                  <div className="text-6xl font-bold text-purple-400 mb-2">
                    {Math.round(dashboardData.currentScore.overall)}
                  </div>
                  <div className="text-purple-200 text-lg">Overall Score</div>
                  <div className="text-sm text-gray-300 mt-2">
                    {new Date(dashboardData.currentScore.scoreDate).toLocaleDateString()}
                  </div>
                </div>

                <div className="lg:col-span-2">
                  <h3 className="text-lg font-semibold text-white mb-4">Component Scores</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(dashboardData.currentScore.components).map(([key, value]) => (
                      <div key={key} className="bg-white/5 border border-white/10 rounded-lg p-4">
                        <div className="flex justify-between items-center">
                          <div className="text-sm text-gray-300 capitalize">
                            {key.replace('_', ' ')}
                          </div>
                          <div className={`text-lg font-bold ${getScoreColor(value)}`}>
                            {Math.round(value)}
                          </div>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                          <div
                            className={`h-2 rounded-full ${value >= 80 ? 'bg-green-500' : value >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                            style={{ width: `${value}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {dashboardData.insights && dashboardData.insights.length > 0 && (
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8 mb-8">
                <h2 className="text-2xl font-bold text-white mb-6">📋 Insights</h2>
                <div className="space-y-4">
                  {dashboardData.insights.map((insight, index) => (
                    <div key={index} className="bg-white/5 border border-white/10 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <span className="text-lg">{getInsightIcon(insight.type)}</span>
                        <div>
                          <p className="text-white font-medium">{insight.message}</p>
                          <div className="text-xs text-gray-400 mt-1">
                            {insight.priority} priority
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8">
              <h2 className="text-2xl font-bold text-white mb-6">🎯 Next Steps</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Link
                  href="/workflow-analytics"
                  className="group bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-6 transition-all"
                >
                  <div className="text-2xl mb-3">📊</div>
                  <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-purple-200">
                    View Analytics
                  </h3>
                  <p className="text-gray-300 text-sm">
                    See detailed workflow analytics and optimization opportunities
                  </p>
                </Link>

                <Link
                  href="/service-delivery-systemizer"
                  className="group bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-6 transition-all"
                >
                  <div className="text-2xl mb-3">✨</div>
                  <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-blue-200">
                    Analyze Workflow
                  </h3>
                  <p className="text-gray-300 text-sm">
                    Start optimizing your workflows based on your freedom score
                  </p>
                </Link>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">🚀 Welcome to Your Freedom Dashboard</h2>
            <p className="text-purple-200 mb-6">
              Take the comprehensive diagnostic assessment to get your business freedom score and personalized recommendations.
            </p>
            <Link
              href="/assessment"
              className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 rounded-lg font-semibold transition-colors"
            >
              🎯 Take Freedom Diagnostic
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}