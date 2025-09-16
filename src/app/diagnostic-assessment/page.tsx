'use client'

import { useState } from 'react'

export default function DiagnosticAssessment() {
  const [currentStep, setCurrentStep] = useState('start')
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [results, setResults] = useState<any>(null)

  const questions = [
    "How predictable is your monthly revenue?",
    "How efficient is your client acquisition process?",
    "How well do you retain existing clients?",
    "How standardized is your service delivery?",
    "How documented are your business processes?",
    "How automated are your operations?",
    "How effectively do you delegate tasks?",
    "How well does your team operate without you?",
    "How clear are roles and responsibilities?",
    "How often do you feel overwhelmed by work?",
    "How well do you maintain work-life balance?",
    "How manageable is your daily workload?",
    "How efficiently do you use your time?",
    "How focused are you during work hours?",
    "How well do you prioritize important tasks?"
  ]

  const handleAnswer = (score: number) => {
    console.log('[DIAGNOSTIC] Question', currentQuestion + 1, 'answered with score:', score)
    const newAnswers = [...answers, score]
    setAnswers(newAnswers)

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      calculateResults(newAnswers)
    }
  }

  const calculateResults = (allAnswers: number[]) => {
    console.log('[DIAGNOSTIC] Calculating results for answers:', allAnswers);

    // Calculate component scores (1-10 scale to 0-100)
    const componentScores = {
      money_freedom: Math.round((allAnswers.slice(0, 3).reduce((sum, a) => sum + a, 0) / 3 - 1) * 100 / 9),
      systems_freedom: Math.round((allAnswers.slice(3, 6).reduce((sum, a) => sum + a, 0) / 3 - 1) * 100 / 9),
      team_freedom: Math.round((allAnswers.slice(6, 9).reduce((sum, a) => sum + a, 0) / 3 - 1) * 100 / 9),
      stress_freedom: Math.round((allAnswers.slice(9, 12).reduce((sum, a) => sum + a, 0) / 3 - 1) * 100 / 9),
      time_freedom: Math.round((allAnswers.slice(12, 15).reduce((sum, a) => sum + a, 0) / 3 - 1) * 100 / 9),
      impact_freedom: 75
    };

    const overallScore = Math.round(Object.values(componentScores).reduce((sum, score) => sum + score, 0) / 6);

    // Determine archetype
    let archetype = 'Balanced Achiever';
    let archetypeDescription = 'You have a well-rounded approach to business freedom.';

    if (overallScore < 40) {
      archetype = 'Scattered Starter';
      archetypeDescription = 'You\'re building your foundation. Focus on systems and processes.';
    } else if (overallScore < 60) {
      archetype = 'Steady Operator';
      archetypeDescription = 'You have solid fundamentals. Time to optimize and scale.';
    } else if (overallScore > 80) {
      archetype = 'Freedom Achiever';
      archetypeDescription = 'You\'ve mastered business freedom. Focus on growth and impact.';
    }

    // Create recommendations with proper sprints structure
    const recommendations = [
      {
        recommendation_id: '1',
        priority_rank: 1,
        reasoning: 'Based on your assessment, this will have the highest impact on your business freedom.',
        sprints: {
          sprint_title: 'Client Acquisition System',
          description: 'Build a predictable lead generation and client acquisition process that brings you qualified prospects consistently.',
          category: 'Sales & Marketing',
          difficulty_level: 'intermediate',
          estimated_time_hours: 16
        }
      },
      {
        recommendation_id: '2',
        priority_rank: 2,
        reasoning: 'Standardizing your offerings will reduce delivery complexity and increase profitability.',
        sprints: {
          sprint_title: 'Service Standardization',
          description: 'Create repeatable service packages that deliver consistent results while reducing delivery complexity.',
          category: 'Operations',
          difficulty_level: 'beginner',
          estimated_time_hours: 12
        }
      },
      {
        recommendation_id: '3',
        priority_rank: 3,
        reasoning: 'Value-based pricing will increase your revenue while working with better clients.',
        sprints: {
          sprint_title: 'Pricing Optimization',
          description: 'Develop value-based pricing structure with clear packages that increase profitability.',
          category: 'Financial',
          difficulty_level: 'intermediate',
          estimated_time_hours: 8
        }
      }
    ]

    console.log('[DIAGNOSTIC] Results calculated:', { componentScores, overallScore, archetype, recommendations })

    setResults({
      scores: componentScores,
      overall: overallScore,
      archetype,
      archetypeDescription,
      recommendations
    })
    setCurrentStep('results')
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getDifficultyColor = (difficulty: string) => {
    switch(difficulty?.toLowerCase()) {
      case 'beginner': return 'bg-green-100 text-green-800'
      case 'intermediate': return 'bg-yellow-100 text-yellow-800'
      case 'advanced': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (currentStep === 'start') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Freedom Diagnostic Assessment
            </h1>
            <p className="text-xl text-purple-200 mb-8 max-w-2xl mx-auto">
              Discover your Business Freedom Score and get personalized recommendations to build the business you actually want.
            </p>
            <button
              onClick={() => setCurrentStep('questions')}
              className="bg-white text-purple-900 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-purple-50 transition-colors"
            >
              Start Assessment (5 minutes)
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (currentStep === 'questions') {
    const progress = ((currentQuestion + 1) / questions.length) * 100

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto">
            {/* Progress */}
            <div className="mb-8">
              <div className="flex justify-between text-white mb-2">
                <span>Question {currentQuestion + 1} of {questions.length}</span>
                <span>{Math.round(progress)}% Complete</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2">
                <div
                  className="bg-white h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>

            {/* Question */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 mb-8">
              <h2 className="text-2xl font-bold text-white mb-6">
                {questions[currentQuestion]}
              </h2>

              <div className="space-y-3">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                  <button
                    key={score}
                    onClick={() => handleAnswer(score)}
                    className="w-full text-left p-4 rounded-lg bg-white/5 hover:bg-white/20 text-white transition-colors border border-white/10 hover:border-white/30"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{score}</span>
                      <span className="text-sm opacity-75">
                        {score <= 3 ? 'Needs significant improvement' :
                         score <= 6 ? 'Could be better' :
                         score <= 8 ? 'Pretty good' : 'Excellent'}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (currentStep === 'results' && results) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-white mb-4">Your Freedom Score Results</h1>
              <div className="text-6xl font-bold text-white mb-2">{results.overall}%</div>
              <p className="text-xl text-purple-200">Overall Business Freedom Score</p>
            </div>

            {/* Archetype */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">Your Archetype: {results.archetype}</h2>
              <p className="text-purple-200 text-lg">{results.archetypeDescription}</p>
            </div>

            {/* Component Scores */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {Object.entries(results.scores).map(([component, score]) => (
                <div key={component} className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                  <h3 className="font-semibold text-white mb-2 capitalize">
                    {component.replace('_', ' ')}
                  </h3>
                  <div className={`text-3xl font-bold ${getScoreColor(score as number)}`}>
                    {score}%
                  </div>
                </div>
              ))}
            </div>

            {/* Recommendations */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8">
              <h3 className="text-2xl font-bold text-white mb-6">🎯 Recommended Actions</h3>

              <div className="space-y-6">
                {results.recommendations.map((rec: any, index: number) => (
                  <div key={rec.recommendation_id || index} className="bg-white/5 border border-white/10 rounded-lg p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="bg-purple-600 text-white px-2 py-1 rounded text-sm font-semibold">
                            #{rec.priority_rank || (index + 1)}
                          </span>
                          {rec.sprints?.difficulty_level && (
                            <span className={`px-2 py-1 rounded text-xs ${getDifficultyColor(rec.sprints?.difficulty_level)}`}>
                              {rec.sprints?.difficulty_level?.toUpperCase()}
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

                        <div className="flex items-center space-x-4 text-sm">
                          <span className="text-purple-300">
                            ⏱️ {Math.ceil((rec.sprints?.estimated_time_hours || 8) / 8)} weeks
                          </span>
                          <span className="text-purple-300">
                            📈 High Impact
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="text-center mt-12">
              <button
                onClick={() => window.location.href = '/'}
                className="bg-white text-purple-900 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-purple-50 transition-colors"
              >
                Continue to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}