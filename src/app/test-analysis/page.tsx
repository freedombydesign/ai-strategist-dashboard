'use client'

import { useState } from 'react'

export default function TestAnalysisPage() {
  const [workflowName, setWorkflowName] = useState('')
  const [workflowSteps, setWorkflowSteps] = useState('')
  const [analysis, setAnalysis] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleAnalyze = async () => {
    if (!workflowName.trim() || !workflowSteps.trim()) {
      setError('Please provide both workflow name and steps')
      return
    }

    setIsLoading(true)
    setError('')
    setAnalysis(null)

    try {
      const response = await fetch('/api/systemizer/analyze-workflow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workflowName: workflowName.trim(),
          workflowSteps: workflowSteps.trim(),
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setAnalysis(data.data)
      } else {
        setError(data.error || 'Analysis failed')
      }
    } catch (err) {
      setError('Network error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const clearForm = () => {
    setWorkflowName('')
    setWorkflowSteps('')
    setAnalysis(null)
    setError('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            🧠 AI Workflow Analysis Testing
          </h1>
          <p className="text-purple-200">
            Test the AI analysis engine with your workflow data
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Workflow Input</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">
                  Workflow Name
                </label>
                <input
                  type="text"
                  value={workflowName}
                  onChange={(e) => setWorkflowName(e.target.value)}
                  placeholder="e.g., Client Onboarding Process"
                  className="w-full px-4 py-3 bg-black/30 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">
                  Workflow Steps (one per line)
                </label>
                <textarea
                  value={workflowSteps}
                  onChange={(e) => setWorkflowSteps(e.target.value)}
                  rows={8}
                  placeholder="1. Send welcome email&#10;2. Schedule kickoff call&#10;3. Collect requirements&#10;4. Create project plan&#10;..."
                  className="w-full px-4 py-3 bg-black/30 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-vertical"
                  disabled={isLoading}
                />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleAnalyze}
                  disabled={isLoading}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:from-gray-600 disabled:to-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 disabled:cursor-not-allowed"
                >
                  {isLoading ? '🤔 Analyzing...' : '🧠 Analyze Workflow'}
                </button>
                <button
                  onClick={clearForm}
                  className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-lg border border-white/20 transition-all duration-200"
                >
                  Clear
                </button>
              </div>

              {error && (
                <div className="bg-red-500/20 border border-red-400/30 text-red-200 p-4 rounded-lg">
                  {error}
                </div>
              )}
            </div>
          </div>

          {/* Results Section */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-6">AI Analysis Results</h2>

            {!analysis && !isLoading && (
              <div className="text-center text-purple-300 py-12">
                <div className="text-6xl mb-4">🤖</div>
                <p>Enter a workflow and click "Analyze" to see AI insights</p>
              </div>
            )}

            {isLoading && (
              <div className="text-center text-purple-300 py-12">
                <div className="animate-spin text-6xl mb-4">🧠</div>
                <p>AI is analyzing your workflow...</p>
              </div>
            )}

            {analysis && (
              <div className="space-y-6">
                {/* Basic Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                    <div className="text-sm text-purple-200">Complexity Score</div>
                    <div className="text-2xl font-bold text-white">
                      {analysis.analysis.complexity_score}/10
                    </div>
                  </div>
                  <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                    <div className="text-sm text-purple-200">Estimated Hours</div>
                    <div className="text-2xl font-bold text-white">
                      {analysis.analysis.estimated_hours}
                    </div>
                  </div>
                </div>

                {/* Risk Factors */}
                {analysis.analysis.risk_factors && (
                  <div className="bg-red-500/10 p-4 rounded-lg border border-red-400/20">
                    <h3 className="text-lg font-semibold text-red-200 mb-2">⚠️ Risk Factors</h3>
                    <ul className="text-red-200 text-sm space-y-1">
                      {analysis.analysis.risk_factors.map((risk, index) => (
                        <li key={index}>• {risk}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Optimization Suggestions */}
                {analysis.analysis.optimization_suggestions && (
                  <div className="bg-green-500/10 p-4 rounded-lg border border-green-400/20">
                    <h3 className="text-lg font-semibold text-green-200 mb-2">💡 Optimization Suggestions</h3>
                    <ul className="text-green-200 text-sm space-y-1">
                      {analysis.analysis.optimization_suggestions.map((suggestion, index) => (
                        <li key={index}>• {suggestion}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Missing Steps */}
                {analysis.analysis.missing_steps && (
                  <div className="bg-yellow-500/10 p-4 rounded-lg border border-yellow-400/20">
                    <h3 className="text-lg font-semibold text-yellow-200 mb-2">❓ Missing Steps</h3>
                    <ul className="text-yellow-200 text-sm space-y-1">
                      {analysis.analysis.missing_steps.map((step, index) => (
                        <li key={index}>• {step}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Automation Opportunities */}
                {analysis.analysis.automation_opportunities && (
                  <div className="bg-blue-500/10 p-4 rounded-lg border border-blue-400/20">
                    <h3 className="text-lg font-semibold text-blue-200 mb-2">🤖 Automation Opportunities</h3>
                    <ul className="text-blue-200 text-sm space-y-1">
                      {analysis.analysis.automation_opportunities.map((opportunity, index) => (
                        <li key={index}>• {opportunity}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Metadata */}
                <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                  <h3 className="text-sm font-semibold text-purple-200 mb-2">Analysis Details</h3>
                  <div className="text-xs text-purple-300 space-y-1">
                    <div>Model: {analysis.metadata.ai_model}</div>
                    <div>Tokens Used: {analysis.metadata.tokens_used}</div>
                    <div>Steps Analyzed: {analysis.metadata.steps_analyzed}</div>
                    <div>Analyzed: {new Date(analysis.metadata.analyzed_at).toLocaleString()}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}