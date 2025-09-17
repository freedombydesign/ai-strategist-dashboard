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

interface ActionStep {
  title: string
  description: string
  timeEstimate?: string
}

const getActionSteps = (sprintKey: string): ActionStep[] => {
  const actionStepsMap: Record<string, ActionStep[]> = {
    'process-documentation': [
      {
        title: 'Document Your Core Workflows',
        description: 'Map out your 3-5 most critical business processes step by step',
        timeEstimate: '2-3 hours'
      },
      {
        title: 'Create Process Templates',
        description: 'Build reusable templates for your most common workflows',
        timeEstimate: '3-4 hours'
      },
      {
        title: 'Standardize Documentation Format',
        description: 'Create a consistent format for all process documentation',
        timeEstimate: '1-2 hours'
      },
      {
        title: 'Train Team on New Processes',
        description: 'Walk your team through the documented processes and gather feedback',
        timeEstimate: '2-3 hours'
      },
      {
        title: 'Implement Process Review Cycle',
        description: 'Set up monthly reviews to refine and improve your processes',
        timeEstimate: '30 minutes'
      }
    ],
    'workflow-optimization': [
      {
        title: 'Analyze Current Bottlenecks',
        description: 'Identify the 3 biggest slowdowns in your service delivery',
        timeEstimate: '2 hours'
      },
      {
        title: 'Map Ideal Workflow',
        description: 'Design the optimal flow from client contact to project completion',
        timeEstimate: '3 hours'
      },
      {
        title: 'Eliminate Redundant Steps',
        description: 'Remove or combine steps that add no value to your process',
        timeEstimate: '2 hours'
      },
      {
        title: 'Create Automation Triggers',
        description: 'Set up automated handoffs between workflow stages',
        timeEstimate: '3-4 hours'
      },
      {
        title: 'Test and Refine',
        description: 'Run your optimized workflow with 2-3 projects and adjust',
        timeEstimate: '1 week'
      }
    ],
    'team-training': [
      {
        title: 'Assess Current Skills',
        description: 'Evaluate your team\'s current capabilities and knowledge gaps',
        timeEstimate: '1-2 hours'
      },
      {
        title: 'Create Training Materials',
        description: 'Develop step-by-step training guides for key processes',
        timeEstimate: '4-6 hours'
      },
      {
        title: 'Conduct Training Sessions',
        description: 'Run interactive training sessions with your team',
        timeEstimate: '2-3 hours'
      },
      {
        title: 'Implement Practice Period',
        description: 'Allow team members to practice with supervision and feedback',
        timeEstimate: '1 week'
      },
      {
        title: 'Establish Ongoing Development',
        description: 'Set up regular skill development and knowledge sharing',
        timeEstimate: '30 minutes weekly'
      }
    ],
    'default': [
      {
        title: 'Assess Current State',
        description: 'Evaluate your current systems and identify improvement opportunities',
        timeEstimate: '2 hours'
      },
      {
        title: 'Design Improvement Plan',
        description: 'Create a detailed plan for implementing this sprint',
        timeEstimate: '3 hours'
      },
      {
        title: 'Implement Changes',
        description: 'Execute your improvement plan step by step',
        timeEstimate: '1-2 weeks'
      },
      {
        title: 'Test and Refine',
        description: 'Test your new system and make necessary adjustments',
        timeEstimate: '3-5 days'
      },
      {
        title: 'Document and Train',
        description: 'Document your new process and train your team',
        timeEstimate: '2-4 hours'
      }
    ]
  }

  return actionStepsMap[sprintKey] || actionStepsMap['default']
}

export default function DiagnosticAssessment() {
  const [step, setStep] = useState<AssessmentStep>('intro')
  const [questions, setQuestions] = useState<DiagnosticQuestion[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [responses, setResponses] = useState<DiagnosticResponse[]>([])
  const [assessmentId, setAssessmentId] = useState<string | null>(null)
  const [results, setResults] = useState<AssessmentResult | null>(null)
  const [loading, setLoading] = useState(true) // Start with loading to check localStorage first
  const [error, setError] = useState<string | null>(null)
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now())
  const [selectedSprint, setSelectedSprint] = useState<Recommendation | null>(null)

  // Load questions and saved results on component mount
  useEffect(() => {
    // Check for saved results FIRST, before loading questions
    let hasResults = false
    try {
      const savedResults = localStorage.getItem('businessSystemizerResults')
      if (savedResults) {
        const parsedResults = JSON.parse(savedResults)
        setResults(parsedResults)
        setStep('results')
        setLoading(false)
        hasResults = true
        console.log('Found saved results, showing immediately')
      }
    } catch (err) {
      console.warn('Could not load saved results:', err)
    }

    // Only load questions if no saved results found
    if (!hasResults) {
      loadQuestions()
    }
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

      // Try to create new assessment in database
      try {
        const response = await fetch('/api/diagnostic/assessment')
        const data = await response.json()

        if (data.success) {
          setAssessmentId(data.data.assessment_id)
          setStep('questions')
          setQuestionStartTime(Date.now())
          return
        }
      } catch (err) {
        console.warn('Database assessment creation failed, using fallback mode:', err)
      }

      // Fallback mode - proceed without database
      setAssessmentId('fallback-' + Date.now())
      setStep('questions')
      setQuestionStartTime(Date.now())
    } catch (err) {
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

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      setQuestionStartTime(Date.now())
    } else {
      // Assessment complete - submit responses
      submitAssessment(updatedResponses)
    }
  }

  const submitAssessment = async (finalResponses: DiagnosticResponse[]) => {
    try {
      setLoading(true)

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
            // Save results to localStorage
            try {
              localStorage.setItem('businessSystemizerResults', JSON.stringify(data.data))
            } catch (err) {
              console.warn('Could not save results to localStorage:', err)
            }
            setStep('results')
            return
          }
        } catch (err) {
          console.warn('Database submission failed, calculating results locally:', err)
        }
      }

      // Fallback mode - calculate results locally
      const localResults = calculateLocalResults(finalResponses)
      setResults(localResults)
      // Save results to localStorage
      try {
        localStorage.setItem('businessSystemizerResults', JSON.stringify(localResults))
      } catch (err) {
        console.warn('Could not save results to localStorage:', err)
      }
      setStep('results')
    } catch (err) {
      setError('Could not submit assessment')
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
      const question = questions.find(q => q.question_id === response.question_id)
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
          recommendation_id: 'fallback-1',
          sprint_id: 'process-documentation',
          priority_rank: 1,
          confidence_score: 0.9,
          reasoning: 'Based on your assessment, systematizing your processes will provide the highest impact.',
          estimated_impact_points: 25,
          estimated_time_to_complete: 7,
          sprints: {
            sprint_key: 'process-documentation',
            sprint_title: 'Process Documentation Sprint',
            description: 'Document and systematize your core business processes',
            category: 'Systems Building',
            difficulty_level: 'beginner',
            assets_generated: {
              templates: ['Process Template', 'SOP Template'],
              sops: ['Documentation SOP'],
              automations: []
            }
          }
        },
        {
          recommendation_id: 'fallback-2',
          sprint_id: 'workflow-optimization',
          priority_rank: 2,
          confidence_score: 0.85,
          reasoning: 'Optimizing your workflows will reduce bottlenecks and improve efficiency.',
          estimated_impact_points: 20,
          estimated_time_to_complete: 5,
          sprints: {
            sprint_key: 'workflow-optimization',
            sprint_title: 'Workflow Optimization Sprint',
            description: 'Analyze and optimize your service delivery workflows',
            category: 'Operations',
            difficulty_level: 'intermediate',
            assets_generated: {
              templates: ['Workflow Template'],
              sops: ['Optimization SOP'],
              automations: ['Process Automation']
            }
          }
        },
        {
          recommendation_id: 'fallback-3',
          sprint_id: 'team-training',
          priority_rank: 3,
          confidence_score: 0.8,
          reasoning: 'Training your team on systematized processes will increase consistency.',
          estimated_impact_points: 15,
          estimated_time_to_complete: 3,
          sprints: {
            sprint_key: 'team-training',
            sprint_title: 'Team Training Sprint',
            description: 'Train your team on standardized processes and procedures',
            category: 'Team Development',
            difficulty_level: 'beginner',
            assets_generated: {
              templates: ['Training Template'],
              sops: ['Training SOP', 'Onboarding SOP'],
              automations: []
            }
          }
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

  const retakeAssessment = () => {
    // Clear localStorage and reset state
    try {
      localStorage.removeItem('businessSystemizerResults')
    } catch (err) {
      console.warn('Could not clear saved results:', err)
    }

    setStep('intro')
    setCurrentQuestionIndex(0)
    setResponses([])
    setResults(null)
    setAssessmentId(null)
    setError(null)
  }

  const currentQuestion = questions[currentQuestionIndex]
  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0

  if (loading && step === 'intro' && !results) {
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
              <h3 className="text-2xl font-bold text-white mb-6">🎯 Recommended Sprints</h3>

              <div className="space-y-6">
                {results.recommendations.slice(0, 5).map((rec, index) => (
                  <div key={rec.recommendation_id} className="bg-white/5 border border-white/10 rounded-lg p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="bg-purple-600 text-white px-2 py-1 rounded text-sm font-semibold">
                            #{rec.priority_rank}
                          </span>
                          {rec.sprints?.difficulty_level && (
                            <span className={`px-2 py-1 rounded text-xs ${getDifficultyColor(rec.sprints?.difficulty_level)}`}>
                              {rec.sprints?.difficulty_level?.toUpperCase()}
                            </span>
                          )}
                          <span className="text-purple-300 text-sm">
                            {rec.sprints?.category || 'System Building'}
                          </span>
                        </div>

                        <h4 className="text-lg font-semibold text-white mb-2">
                          {rec.sprints?.sprint_title || `Sprint ${rec.priority_rank}`}
                        </h4>
                        <p className="text-purple-200 mb-3">
                          {rec.sprints?.description || rec.reasoning}
                        </p>
                        <p className="text-sm text-gray-300">
                          {rec.reasoning}
                        </p>
                      </div>

                      <div className="text-right ml-4">
                        <div className="text-green-400 font-semibold">
                          +{rec.estimated_impact_points} points
                        </div>
                        <div className="text-purple-300 text-sm">
                          ~{rec.estimated_time_to_complete} days
                        </div>
                      </div>
                    </div>

                    {rec.sprints?.assets_generated && (
                      <div className="border-t border-white/10 pt-4 mb-4">
                        <h5 className="text-white font-medium mb-2">Assets Generated:</h5>
                        <div className="space-y-2">
                          {rec.sprints?.assets_generated?.templates?.length > 0 && (
                            <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg p-3">
                              <div className="flex items-center space-x-2">
                                <span className="text-blue-400">📄</span>
                                <span className="text-purple-200 text-sm">
                                  {rec.sprints?.assets_generated?.templates?.length} Templates
                                </span>
                              </div>
                              <button
                                onClick={() => window.open('/template-manager', '_blank')}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-semibold transition-colors"
                              >
                                View Templates
                              </button>
                            </div>
                          )}
                          {rec.sprints?.assets_generated?.sops?.length > 0 && (
                            <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg p-3">
                              <div className="flex items-center space-x-2">
                                <span className="text-green-400">📋</span>
                                <span className="text-purple-200 text-sm">
                                  {rec.sprints?.assets_generated?.sops?.length} SOPs
                                </span>
                              </div>
                              <button
                                onClick={() => window.open('/template-manager?type=sops', '_blank')}
                                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-semibold transition-colors"
                              >
                                View SOPs
                              </button>
                            </div>
                          )}
                          {rec.sprints?.assets_generated?.automations?.length > 0 && (
                            <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg p-3">
                              <div className="flex items-center space-x-2">
                                <span className="text-purple-400">⚙️</span>
                                <span className="text-purple-200 text-sm">
                                  {rec.sprints?.assets_generated?.automations?.length} Automations
                                </span>
                              </div>
                              <button
                                onClick={() => window.open('/service-delivery-systemizer?focus=automations', '_blank')}
                                className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-xs font-semibold transition-colors"
                              >
                                View Automations
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Action Steps Section */}
                    <div className="border-t border-white/10 pt-4">
                      <div className="flex justify-between items-center mb-3">
                        <h5 className="text-white font-medium">📋 Action Steps</h5>
                        <button
                          onClick={() => setSelectedSprint(selectedSprint?.recommendation_id === rec.recommendation_id ? null : rec)}
                          className="text-purple-300 hover:text-purple-200 text-sm"
                        >
                          {selectedSprint?.recommendation_id === rec.recommendation_id ? '▼ Hide Steps' : '▶ Show Steps'}
                        </button>
                      </div>

                      {selectedSprint?.recommendation_id === rec.recommendation_id && (
                        <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3">
                          {getActionSteps(rec.sprints?.sprint_key || 'default').map((step, stepIndex) => (
                            <div key={stepIndex} className="flex items-start space-x-3">
                              <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded font-semibold min-w-[24px] text-center">
                                {stepIndex + 1}
                              </span>
                              <div className="flex-1">
                                <p className="text-purple-200 text-sm">{step.title}</p>
                                <p className="text-gray-300 text-xs mt-1">{step.description}</p>
                                {step.timeEstimate && (
                                  <span className="text-purple-300 text-xs">⏱️ {step.timeEstimate}</span>
                                )}
                              </div>
                            </div>
                          ))}

                          <div className="border-t border-white/10 pt-3 mt-4">
                            <button
                              onClick={() => window.open('/service-delivery-systemizer', '_blank')}
                              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2 rounded-lg text-sm font-semibold transition-all"
                            >
                              🚀 Start This Sprint
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 text-center">
                <div className="space-y-6">
                  <div className="text-purple-200 text-lg font-medium">
                    🎯 Ready to systematize your business?
                  </div>

                  <Link
                    href="/service-delivery-systemizer"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-12 py-4 rounded-lg font-semibold transition-all inline-block text-lg"
                  >
                    ⚙️ Start Workflow Systemizer
                  </Link>

                  <div className="text-purple-200 text-sm">
                    Analyze your workflows and generate templates, SOPs, and automations
                  </div>

                  <div className="border-t border-white/20 pt-6">
                    <div className="text-purple-200 text-sm mb-4">
                      or explore other tools:
                    </div>

                    <div className="space-x-4">
                      <Link
                        href="/freedom-dashboard"
                        className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-6 py-3 rounded-lg font-medium transition-all inline-block"
                      >
                        🚀 Freedom Dashboard
                      </Link>
                      <Link
                        href="/workflow-analytics"
                        className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-6 py-3 rounded-lg font-medium transition-all inline-block"
                      >
                        📊 Analytics
                      </Link>
                      <button
                        onClick={retakeAssessment}
                        className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-6 py-3 rounded-lg font-medium transition-all"
                      >
                        🔄 Retake Assessment
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Comprehensive Asset Manager */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8">
              <h3 className="text-2xl font-bold text-white mb-6">📚 Your Asset Library</h3>
              <p className="text-purple-200 mb-6">
                Access all your generated templates, SOPs, and automations in one place
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white/5 border border-white/10 rounded-lg p-6 text-center">
                  <div className="text-4xl mb-4">📄</div>
                  <h4 className="text-white font-semibold mb-2">Templates</h4>
                  <p className="text-purple-200 text-sm mb-4">
                    Ready-to-use templates for all your business processes
                  </p>
                  <Link
                    href="/template-manager"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-all inline-block"
                  >
                    View Templates
                  </Link>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-lg p-6 text-center">
                  <div className="text-4xl mb-4">📋</div>
                  <h4 className="text-white font-semibold mb-2">SOPs</h4>
                  <p className="text-purple-200 text-sm mb-4">
                    Standard Operating Procedures for consistent execution
                  </p>
                  <Link
                    href="/template-manager?type=sops"
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold transition-all inline-block"
                  >
                    View SOPs
                  </Link>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-lg p-6 text-center">
                  <div className="text-4xl mb-4">⚙️</div>
                  <h4 className="text-white font-semibold mb-2">Automations</h4>
                  <p className="text-purple-200 text-sm mb-4">
                    Automated workflows to streamline your operations
                  </p>
                  <Link
                    href="/service-delivery-systemizer?focus=automations"
                    className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-semibold transition-all inline-block"
                  >
                    View Automations
                  </Link>
                </div>
              </div>

              <div className="mt-6 text-center">
                <Link
                  href="/export-manager"
                  className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-all inline-block"
                >
                  📤 Export All Assets
                </Link>
                <p className="text-purple-300 text-sm mt-2">
                  Export your complete asset library to popular platforms
                </p>
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