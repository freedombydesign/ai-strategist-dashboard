'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

interface DiagnosticQuestion {
  question_id: string
  question_order: number
  category: string
  component: string
  question_text: string
  subtitle?: string
  scale_description: any
  weight: number
  sprint_trigger: string
}

interface DiagnosticResponse {
  question_id: string
  score: number
  response_time_seconds?: number
}

interface ComponentScores {
  money_freedom: number
  systems_freedom: number
  team_freedom: number
  stress_freedom: number
  time_freedom: number
  impact_freedom: number
}

interface Recommendation {
  recommendation_id: string
  sprint_id: string
  priority_rank: number
  confidence_score: number
  reasoning: string
  estimated_impact_points: number
  estimated_time_to_complete: number
  sprints: {
    sprint_key: string
    sprint_title: string
    description: string
    category: string
    difficulty_level: string
    assets_generated: any
  }
}

interface AssessmentResult {
  assessment: any
  componentScores: ComponentScores
  archetype: {
    name: string
    confidence: number
    description: string
  }
  recommendations: Recommendation[]
  summary: {
    overallScore: number
    questionsAnswered: number
    strongestComponent: string
    weakestComponent: string
  }
}

type AssessmentStep = 'intro' | 'questions' | 'results'

export default function DiagnosticAssessment() {
  const [step, setStep] = useState<AssessmentStep>('intro')
  const [questions, setQuestions] = useState<DiagnosticQuestion[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [responses, setResponses] = useState<DiagnosticResponse[]>([])
  const [assessmentId, setAssessmentId] = useState<string | null>(null)
  const [results, setResults] = useState<AssessmentResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now())

  // Load questions on component mount
  useEffect(() => {
    loadQuestions()
  }, [])

  const loadQuestions = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/diagnostic/questions')
      const data = await response.json()

      if (data.success) {
        setQuestions(data.data.questions)
      } else {
        console.warn('Database not set up, using fallback questions:', data.error)
        loadFallbackQuestions()
      }
    } catch (err) {
      console.warn('Could not connect to diagnostic system, using fallback questions:', err)
      loadFallbackQuestions()
    } finally {
      setLoading(false)
    }
  }

  const loadFallbackQuestions = () => {
    // Fallback questions when database isn't set up yet
    const fallbackQuestions = [
      {
        question_id: 1,
        question_order: 1,
        category: 'sales_money',
        component: 'money_freedom',
        question_text: 'How predictable is your monthly flow of new clients?',
        scale_type: 'linear',
        weight: 1.2,
        sprint_trigger: 'Acquisition Engine'
      },
      {
        question_id: 2,
        question_order: 2,
        category: 'sales_money',
        component: 'money_freedom',
        question_text: 'How well do you understand which marketing activities actually bring in customers?',
        scale_type: 'linear',
        weight: 1.1,
        sprint_trigger: 'Marketing Analytics'
      },
      {
        question_id: 3,
        question_order: 3,
        category: 'sales_money',
        component: 'money_freedom',
        question_text: 'How effectively do you convert prospects into paying customers?',
        scale_type: 'linear',
        weight: 1.3,
        sprint_trigger: 'Sales Optimization'
      },
      {
        question_id: 4,
        question_order: 4,
        category: 'operations_systems',
        component: 'systems_freedom',
        question_text: 'How systematized are your core business processes?',
        scale_type: 'linear',
        weight: 1.4,
        sprint_trigger: 'Process Documentation'
      },
      {
        question_id: 5,
        question_order: 5,
        category: 'operations_systems',
        component: 'systems_freedom',
        question_text: 'How much of your daily work runs on autopilot without your direct involvement?',
        scale_type: 'linear',
        weight: 1.5,
        sprint_trigger: 'Automation Setup'
      },
      {
        question_id: 6,
        question_order: 6,
        category: 'team_leadership',
        component: 'team_freedom',
        question_text: 'How capable is your team of handling critical tasks without constant oversight?',
        scale_type: 'linear',
        weight: 1.3,
        sprint_trigger: 'Team Development'
      },
      {
        question_id: 7,
        question_order: 7,
        category: 'team_leadership',
        component: 'team_freedom',
        question_text: 'How clear are the roles and responsibilities within your organization?',
        scale_type: 'linear',
        weight: 1.2,
        sprint_trigger: 'Role Clarity'
      },
      {
        question_id: 8,
        question_order: 8,
        category: 'stress_control',
        component: 'stress_freedom',
        question_text: 'How often do you feel overwhelmed by your business responsibilities?',
        scale_type: 'inverse',
        weight: 1.4,
        sprint_trigger: 'Stress Management'
      },
      {
        question_id: 9,
        question_order: 9,
        category: 'stress_control',
        component: 'stress_freedom',
        question_text: 'How well can you disconnect from work and truly relax?',
        scale_type: 'linear',
        weight: 1.3,
        sprint_trigger: 'Work-Life Balance'
      },
      {
        question_id: 10,
        question_order: 10,
        category: 'time_scheduling',
        component: 'time_freedom',
        question_text: 'How much control do you have over your daily schedule?',
        scale_type: 'linear',
        weight: 1.5,
        sprint_trigger: 'Schedule Optimization'
      },
      {
        question_id: 11,
        question_order: 11,
        category: 'time_scheduling',
        component: 'time_freedom',
        question_text: 'How often do urgent matters derail your planned priorities?',
        scale_type: 'inverse',
        weight: 1.2,
        sprint_trigger: 'Priority Management'
      },
      {
        question_id: 12,
        question_order: 12,
        category: 'impact_vision',
        component: 'impact_freedom',
        question_text: 'How clearly defined is your long-term vision for the business?',
        scale_type: 'linear',
        weight: 1.1,
        sprint_trigger: 'Vision Setting'
      },
      {
        question_id: 13,
        question_order: 13,
        category: 'impact_vision',
        component: 'impact_freedom',
        question_text: 'How aligned are your daily activities with your bigger purpose?',
        scale_type: 'linear',
        weight: 1.3,
        sprint_trigger: 'Strategic Alignment'
      },
      {
        question_id: 14,
        question_order: 14,
        category: 'impact_vision',
        component: 'impact_freedom',
        question_text: 'How confident are you that your business is making the impact you want?',
        scale_type: 'linear',
        weight: 1.2,
        sprint_trigger: 'Impact Measurement'
      },
      {
        question_id: 15,
        question_order: 15,
        category: 'leadership_growth',
        component: 'team_freedom',
        question_text: 'How effectively are you developing leadership capabilities in others?',
        scale_type: 'linear',
        weight: 1.1,
        sprint_trigger: 'Leadership Development'
      }
    ]

    setQuestions(fallbackQuestions)
    console.log('Loaded 15 fallback diagnostic questions')
  }

  const startAssessment = async () => {
    try {
      setLoading(true)
      console.log('[DIAGNOSTIC] Starting assessment in fallback mode (bypassing database)')

      // Skip database for now and go straight to fallback mode
      setAssessmentId('fallback-' + Date.now())
      setStep('questions')
      setQuestionStartTime(Date.now())

      console.log('[DIAGNOSTIC] Assessment started successfully in fallback mode')
    } catch (err) {
      console.error('[DIAGNOSTIC] Error starting assessment:', err)
      setError('Could not start assessment')
    } finally {
      setLoading(false)
    }
  }

  const handleQuestionResponse = (score: number) => {
    const currentQuestion = questions[currentQuestionIndex]
    const responseTime = Math.round((Date.now() - questionStartTime) / 1000)

    const newResponse: DiagnosticResponse = {
      question_id: currentQuestion.question_id,
      score,
      response_time_seconds: responseTime
    }

    const updatedResponses = [...responses, newResponse]
    setResponses(updatedResponses)

    console.log(`[DIAGNOSTIC] Question ${currentQuestionIndex + 1} of ${questions.length} answered`)
    console.log(`[DIAGNOSTIC] Total responses so far:`, updatedResponses.length)

    if (currentQuestionIndex < questions.length - 1) {
      console.log(`[DIAGNOSTIC] Moving to next question: ${currentQuestionIndex + 2}`)
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      setQuestionStartTime(Date.now())
    } else {
      console.log('[DIAGNOSTIC] Assessment complete! Starting submission...')
      // Assessment complete - submit responses
      submitAssessment(updatedResponses)
    }
  }

  const submitAssessment = async (finalResponses: DiagnosticResponse[]) => {
    try {
      setLoading(true)
      console.log('[DIAGNOSTIC] Starting submission with responses:', finalResponses)

      // Try to submit to database first
      if (!assessmentId.startsWith('fallback-')) {
        try {
          const response = await fetch('/api/diagnostic/assessment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              assessmentId,
              responses: finalResponses
            })
          })

          const data = await response.json()

          if (data.success) {
            setResults(data.data)
            setStep('results')
            return
          }
        } catch (err) {
          console.warn('Database submission failed, calculating results locally:', err)
        }
      }

      // Fallback mode - calculate results locally
      console.log('[DIAGNOSTIC] Using fallback mode, calculating results locally')
      const localResults = calculateLocalResults(finalResponses)
      console.log('[DIAGNOSTIC] Local results calculated:', localResults)
      setResults(localResults)
      setStep('results')
    } catch (err) {
      console.error('[DIAGNOSTIC] Submission error:', err)
      setError('Could not submit assessment: ' + (err instanceof Error ? err.message : 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  const calculateLocalResults = (responses: DiagnosticResponse[]) => {
    // Calculate component scores locally
    const componentScores: any = {
      money_freedom: 0,
      systems_freedom: 0,
      team_freedom: 0,
      stress_freedom: 0,
      time_freedom: 0,
      impact_freedom: 0
    }

    const componentCounts: any = {}
    Object.keys(componentScores).forEach(key => componentCounts[key] = 0)

    responses.forEach(response => {
      const question = questions.find(q => q.question_id == response.question_id) // Use == to handle string/number comparison
      if (question) {
        let normalizedScore = response.score * 10 // Convert 1-10 to 10-100 scale

        // Handle inverse scale questions (like stress/overwhelm)
        if (question.scale_type === 'inverse') {
          normalizedScore = 110 - normalizedScore
        }

        componentScores[question.component] += normalizedScore
        componentCounts[question.component]++
      }
    })

    // Average the scores
    Object.keys(componentScores).forEach(component => {
      if (componentCounts[component] > 0) {
        componentScores[component] = Math.round(componentScores[component] / componentCounts[component])
      }
    })

    const overallScore = Math.round(
      Object.values(componentScores).reduce((sum: number, score: any) => sum + score, 0) / 6
    )

    // Simple archetype determination
    let archetype = 'balanced_builder'
    if (overallScore >= 80) archetype = 'freedom_focused'
    else if (overallScore >= 60) archetype = 'systematic_scaler'
    else if (overallScore <= 40) archetype = 'overwhelmed_operator'

    return {
      summary: {
        overallScore,
        assessmentDate: new Date().toISOString(),
        totalQuestions: responses.length
      },
      componentScores,
      archetype: {
        name: archetype,
        description: getArchetypeDescription(archetype),
        confidence: 0.85
      },
      recommendations: [
        {
          title: 'Start with highest impact areas',
          description: 'Focus on your lowest scoring components first for maximum impact',
          priority: 1
        }
      ]
    }
  }

  const getArchetypeDescription = (archetype: string) => {
    const descriptions: any = {
      'freedom_focused': 'You have achieved significant business freedom and are optimizing for maximum impact.',
      'systematic_scaler': 'You are building strong systems and are on track to scale effectively.',
      'balanced_builder': 'You have a good foundation and are developing capabilities across all areas.',
      'overwhelmed_operator': 'You are working hard but need better systems to create more freedom.'
    }
    return descriptions[archetype] || 'You are building a unique path to business freedom.'
  }

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
      setResponses(responses.slice(0, -1)) // Remove last response
      setQuestionStartTime(Date.now())
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400'
    if (score >= 60) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent'
    if (score >= 60) return 'Good'
    if (score >= 40) return 'Needs Work'
    return 'Critical'
  }

  const formatComponentName = (component: string) => {
    return component.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-500/20 text-green-300'
      case 'intermediate': return 'bg-yellow-500/20 text-yellow-300'
      case 'advanced': return 'bg-red-500/20 text-red-300'
      default: return 'bg-gray-500/20 text-gray-300'
    }
  }

  const currentQuestion = questions[currentQuestionIndex]
  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0

  if (loading && step === 'intro') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading diagnostic system...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-sm border-b border-white/20">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/freedom-dashboard"
                className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors"
              >
                ← Back to Dashboard
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-white">🎯 Freedom Diagnostic</h1>
                <p className="text-purple-200">Discover your business freedom archetype</p>
              </div>
            </div>

            {step === 'questions' && (
              <div className="text-white text-sm">
                Question {currentQuestionIndex + 1} of {questions.length}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Error Message */}
        {error && (
          <div className="bg-red-500/20 border border-red-400/30 text-red-200 p-6 rounded-xl mb-8">
            <h3 className="font-bold text-lg mb-2">⚠️ Error</h3>
            <p>{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition-colors"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Introduction Step */}
        {step === 'intro' && (
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-6">
              🚀 Business Freedom Diagnostic
            </h2>
            <p className="text-purple-200 text-lg mb-8 max-w-2xl mx-auto">
              Take our sophisticated 15-question assessment to discover your business freedom archetype
              and get personalized sprint recommendations to level up your freedom.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <h3 className="text-white font-semibold mb-2">📊 What You'll Get</h3>
                <ul className="text-purple-200 text-sm space-y-1">
                  <li>• Your freedom score across 6 components</li>
                  <li>• Your business archetype profile</li>
                  <li>• Personalized sprint recommendations</li>
                  <li>• Priority-ranked action plan</li>
                </ul>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <h3 className="text-white font-semibold mb-2">⏱️ Assessment Details</h3>
                <ul className="text-purple-200 text-sm space-y-1">
                  <li>• 15 behavior-driven questions</li>
                  <li>• ~5-10 minutes to complete</li>
                  <li>• 1-10 scale responses</li>
                  <li>• Instant results & recommendations</li>
                </ul>
              </div>
            </div>

            {questions.length > 0 ? (
              <button
                onClick={startAssessment}
                disabled={loading}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors"
              >
                {loading ? 'Starting Assessment...' : '🎯 Start Diagnostic Assessment'}
              </button>
            ) : (
              <div className="text-red-200">
                <p className="mb-4">⚠️ Diagnostic questions not available</p>
                <p className="text-sm">Please ensure the database schema and questions are set up correctly.</p>
              </div>
            )}
          </div>
        )}

        {/* Questions Step */}
        {step === 'questions' && currentQuestion && (
          <div className="space-y-8">
            {/* Progress Bar */}
            <div className="bg-white/10 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Question Card */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8">
              <div className="mb-6">
                <div className="flex items-center space-x-2 mb-4">
                  <span className="bg-purple-600 text-white px-3 py-1 rounded text-sm">
                    {currentQuestion.category.replace('_', ' ').toUpperCase()}
                  </span>
                  <span className="text-purple-300 text-sm">
                    {formatComponentName(currentQuestion.component)}
                  </span>
                </div>

                <h2 className="text-2xl font-bold text-white mb-3">
                  {currentQuestion.question_text}
                </h2>

                {currentQuestion.subtitle && (
                  <p className="text-purple-200 text-lg">
                    {currentQuestion.subtitle}
                  </p>
                )}
              </div>

              {/* Scale Description */}
              {currentQuestion.scale_description && (
                <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-8">
                  <div className="flex justify-between text-sm">
                    <div className="text-red-300">
                      <span className="font-semibold">1:</span> {currentQuestion.scale_description['1']}
                    </div>
                    <div className="text-green-300 text-right">
                      <span className="font-semibold">10:</span> {currentQuestion.scale_description['10']}
                    </div>
                  </div>
                </div>
              )}

              {/* Rating Scale */}
              <div className="grid grid-cols-10 gap-2 mb-8">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                  <button
                    key={score}
                    onClick={() => handleQuestionResponse(score)}
                    className="h-16 bg-white/10 hover:bg-purple-600 border border-white/20 rounded-lg font-semibold text-white transition-all hover:scale-105"
                  >
                    {score}
                  </button>
                ))}
              </div>

              <div className="flex justify-between items-center">
                <button
                  onClick={goToPreviousQuestion}
                  disabled={currentQuestionIndex === 0}
                  className="text-purple-300 hover:text-purple-200 disabled:text-gray-500 disabled:cursor-not-allowed"
                >
                  ← Previous Question
                </button>

                <div className="text-purple-300 text-sm">
                  Click a number from 1 (lowest) to 10 (highest)
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results Step */}
        {step === 'results' && results && (
          <div className="space-y-8">
            {/* Overall Score */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8 text-center">
              <h2 className="text-3xl font-bold text-white mb-4">🎉 Assessment Complete!</h2>

              <div className="mb-6">
                <div className="text-6xl font-bold text-purple-400 mb-2">
                  {results.summary.overallScore}
                </div>
                <div className="text-purple-200 text-xl">Overall Freedom Score</div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-lg p-6 mb-6">
                <h3 className="text-xl font-bold text-white mb-2">
                  Your Archetype: {results.archetype.name.replace('_', ' ').toUpperCase()}
                </h3>
                <p className="text-purple-200">{results.archetype.description}</p>
                <div className="mt-2 text-sm text-purple-300">
                  Confidence: {Math.round(results.archetype.confidence * 100)}%
                </div>
              </div>
            </div>

            {/* Component Breakdown */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8">
              <h3 className="text-2xl font-bold text-white mb-6">Freedom Component Scores</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(results.componentScores).map(([component, score]) => (
                  <div key={component} className="bg-white/5 border border-white/10 rounded-lg p-6">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-white font-semibold">
                        {formatComponentName(component)}
                      </h4>
                      <span className={`text-2xl font-bold ${getScoreColor(score)}`}>
                        {score}
                      </span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          score >= 80 ? 'bg-green-500' :
                          score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${score}%` }}
                      />
                    </div>
                    <div className="text-right text-sm text-purple-300 mt-1">
                      {getScoreLabel(score)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sprint Recommendations */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8">
              <h3 className="text-2xl font-bold text-white mb-6">🎯 Recommended Actions</h3>

              <div className="space-y-6">
                {results.recommendations.slice(0, 5).map((rec, index) => (
                  <div key={rec.recommendation_id || rec.title || index} className="bg-white/5 border border-white/10 rounded-lg p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="bg-purple-600 text-white px-2 py-1 rounded text-sm font-semibold">
                            #{rec.priority_rank || rec.priority || (index + 1)}
                          </span>
                          {rec.sprints?.difficulty_level && (
                            <span className={`px-2 py-1 rounded text-xs ${getDifficultyColor(rec.sprints.difficulty_level)}`}>
                              {rec.sprints.difficulty_level.toUpperCase()}
                            </span>
                          )}
                          <span className="text-purple-300 text-sm">
                            {rec.sprints?.category || 'Priority Action'}
                          </span>
                        </div>

                        <h4 className="text-lg font-semibold text-white mb-2">
                          {rec.sprints?.sprint_title || rec.title || `Action ${index + 1}`}
                        </h4>
                        <p className="text-purple-200 mb-3">
                          {rec.sprints?.description || rec.description || rec.reasoning}
                        </p>
                        {rec.reasoning && (
                          <p className="text-sm text-gray-300">
                            {rec.reasoning}
                          </p>
                        )}
                      </div>

                      {(rec.estimated_impact_points || rec.estimated_time_to_complete) && (
                        <div className="text-right ml-4">
                          {rec.estimated_impact_points && (
                            <div className="text-green-400 font-semibold">
                              +{rec.estimated_impact_points} points
                            </div>
                          )}
                          {rec.estimated_time_to_complete && (
                            <div className="text-purple-300 text-sm">
                              ~{rec.estimated_time_to_complete} days
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {rec.sprints?.assets_generated && (
                      <div className="border-t border-white/10 pt-4">
                        <h5 className="text-white font-medium mb-2">Assets Generated:</h5>
                        <div className="text-sm text-purple-200">
                          {rec.sprints.assets_generated.templates?.length > 0 && (
                            <span className="mr-4">📄 {rec.sprints.assets_generated.templates.length} Templates</span>
                          )}
                          {rec.sprints.assets_generated.sops?.length > 0 && (
                            <span className="mr-4">📋 {rec.sprints.assets_generated.sops.length} SOPs</span>
                          )}
                          {rec.sprints.assets_generated.automations?.length > 0 && (
                            <span>⚙️ {rec.sprints.assets_generated.automations.length} Automations</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-8 text-center">
                <div className="space-y-4">
                  <Link
                    href="/freedom-dashboard"
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-12 py-4 rounded-lg font-semibold transition-all inline-block text-lg"
                  >
                    🚀 View Your Freedom Dashboard
                  </Link>

                  <div className="text-purple-200 text-sm">
                    or continue your optimization journey:
                  </div>

                  <div className="space-x-4">
                    <Link
                      href="/workflow-analytics"
                      className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-6 py-3 rounded-lg font-medium transition-all inline-block"
                    >
                      📊 Analytics
                    </Link>
                    <Link
                      href="/service-delivery-systemizer"
                      className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-6 py-3 rounded-lg font-medium transition-all inline-block"
                    >
                      ⚙️ Analyze Workflow
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading Overlay */}
        {loading && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-8 text-center">
              <div className="text-white text-xl mb-4">
                {step === 'questions' ? 'Processing your responses...' : 'Loading...'}
              </div>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}