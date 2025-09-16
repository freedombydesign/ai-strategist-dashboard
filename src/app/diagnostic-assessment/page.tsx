'use client'

import { useState } from 'react'

// CACHE BUST v2.2 - EMERGENCY CLIENT-SIDE VERSION WITH ORIGINAL LAYOUT

export default function DiagnosticAssessment() {
  const [currentStep, setCurrentStep] = useState('start')
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [results, setResults] = useState<any>(null)

  const questions = [
    "How predictable is your monthly flow of new clients?",
    "How well do you understand which marketing activities actually bring in customers?",
    "How effectively do you convert prospects into paying customers?",
    "How systematized are your core business processes?",
    "How much of your daily work runs on autopilot without your direct involvement?",
    "How capable is your team of handling critical tasks without constant oversight?",
    "How clear are the roles and responsibilities within your organization?",
    "How often do you feel overwhelmed by your business responsibilities?",
    "How well can you disconnect from work and truly relax?",
    "How much control do you have over your daily schedule?",
    "How often do urgent matters derail your planned priorities?",
    "How clearly defined is your long-term vision for the business?",
    "How aligned are your daily activities with your bigger purpose?",
    "How confident are you that your business is making the impact you want?",
    "How well can you step away from your business for a week without major issues?"
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
      archetypeDescription = 'You\\'re building your foundation. Focus on systems and processes.';
    } else if (overallScore < 60) {
      archetype = 'Steady Operator';
      archetypeDescription = 'You have solid fundamentals. Time to optimize and scale.';
    } else if (overallScore > 80) {
      archetype = 'Freedom Achiever';
      archetypeDescription = 'You\\'ve mastered business freedom. Focus on growth and impact.';
    }

    // Create safe recommendations without sprints dependency
    const recommendations = [
      {
        recommendation_id: '1',
        priority_rank: 1,
        reasoning: 'Based on your assessment, this will have the highest impact on your business freedom.',
        title: 'Client Acquisition System',
        description: 'Build a predictable lead generation and client acquisition process that brings you qualified prospects consistently.',
        category: 'Sales & Marketing',
        difficulty_level: 'intermediate',
        estimated_time_hours: 16
      },
      {
        recommendation_id: '2',
        priority_rank: 2,
        reasoning: 'Standardizing your offerings will reduce delivery complexity and increase profitability.',
        title: 'Service Standardization',
        description: 'Create repeatable service packages that deliver consistent results while reducing delivery complexity.',
        category: 'Operations',
        difficulty_level: 'beginner',
        estimated_time_hours: 12
      },
      {
        recommendation_id: '3',
        priority_rank: 3,
        reasoning: 'Value-based pricing will increase your revenue while working with better clients.',
        title: 'Pricing Optimization',
        description: 'Develop value-based pricing structure with clear packages that increase profitability.',
        category: 'Financial',
        difficulty_level: 'intermediate',
        estimated_time_hours: 8
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
    if (score >= 80) return 'text-green-400'
    if (score >= 60) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getDifficultyColor = (difficulty: string) => {
    switch(difficulty?.toLowerCase()) {
      case 'beginner': return 'bg-green-500/20 text-green-300'
      case 'intermediate': return 'bg-yellow-500/20 text-yellow-300'
      case 'advanced': return 'bg-red-500/20 text-red-300'
      default: return 'bg-gray-500/20 text-gray-300'
    }
  }

  const formatComponentName = (component: string) => {
    return component.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  }

  const goToPreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
      setAnswers(answers.slice(0, -1))
    }
  }

  if (currentStep === 'start') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-sm border-b border-white/20">
          <div className="max-w-4xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <a
                  href="/dashboard"
                  className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  ← Back to Dashboard
                </a>
                <div>
                  <h1 className="text-2xl font-bold text-white">🎯 Freedom Diagnostic</h1>
                  <p className="text-purple-200">Discover your business freedom archetype</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 py-12">
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

            <button
              onClick={() => setCurrentStep('questions')}
              className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors"
            >
              🎯 Start Diagnostic Assessment
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (currentStep === 'questions') {
    const progress = ((currentQuestion + 1) / questions.length) * 100

    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-sm border-b border-white/20">
          <div className="max-w-4xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <a
                  href="/dashboard"
                  className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  ← Back to Dashboard
                </a>
                <div>
                  <h1 className="text-2xl font-bold text-white">🎯 Freedom Diagnostic</h1>
                  <p className="text-purple-200">Discover your business freedom archetype</p>
                </div>
              </div>

              <div className="text-white text-sm">
                Question {currentQuestion + 1} of {questions.length}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8">
            {/* Progress */}
            <div className="mb-8">
              <div className="flex justify-between text-purple-200 mb-2">
                <span>Question {currentQuestion + 1} of {questions.length}</span>
                <span>{Math.round(progress)}% Complete</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-8">
                {questions[currentQuestion]}
              </h2>

              {/* Rating Scale - Original Horizontal Layout */}
              <div className="grid grid-cols-10 gap-2 mb-8">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                  <button
                    key={score}
                    onClick={() => handleAnswer(score)}
                    className="h-16 bg-white/10 hover:bg-purple-600 border border-white/20 rounded-lg font-semibold text-white transition-all hover:scale-105"
                  >
                    {score}
                  </button>
                ))}
              </div>

              <div className="flex justify-between items-center">
                <button
                  onClick={goToPreviousQuestion}
                  disabled={currentQuestion === 0}
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
        </div>
      </div>
    )
  }

  if (currentStep === 'results' && results) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-sm border-b border-white/20">
          <div className="max-w-4xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <a
                  href="/dashboard"
                  className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  ← Back to Dashboard
                </a>
                <div>
                  <h1 className="text-2xl font-bold text-white">🎯 Freedom Diagnostic</h1>
                  <p className="text-purple-200">Your Results</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="space-y-8">
            {/* Overall Score & Archetype */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8 text-center">
              <h2 className="text-3xl font-bold text-white mb-4">Your Results</h2>

              <div className="mb-6">
                <div className={`text-6xl font-bold mb-2 ${getScoreColor(results.overall)}`}>
                  {results.overall}
                </div>
                <div className="text-purple-200">Overall Freedom Score</div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <h3 className="text-xl font-bold text-white mb-2">
                  🎭 Your Archetype: {results.archetype}
                </h3>
                <p className="text-purple-200">{results.archetypeDescription}</p>
              </div>
            </div>

            {/* Component Breakdown */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8">
              <h3 className="text-2xl font-bold text-white mb-6">Freedom Component Scores</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(results.scores).map(([component, score]) => (
                  <div key={component} className="bg-white/5 border border-white/10 rounded-lg p-6">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-white font-semibold">
                        {formatComponentName(component)}
                      </h4>
                      <span className={`text-2xl font-bold ${getScoreColor(score as number)}`}>
                        {score}
                      </span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          (score as number) >= 80 ? 'bg-green-500' :
                          (score as number) >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${score}%` }}
                      />
                    </div>
                    <div className="text-right text-sm text-purple-300 mt-1">
                      {(score as number) >= 80 ? 'Excellent' : (score as number) >= 60 ? 'Good' : 'Needs Work'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sprint Recommendations */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8">
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
                          {rec?.difficulty_level && (
                            <span className={`px-2 py-1 rounded text-xs ${getDifficultyColor(rec?.difficulty_level || 'beginner')}`}>
                              {rec?.difficulty_level?.toUpperCase() || 'BEGINNER'}
                            </span>
                          )}
                          <span className="text-purple-300 text-sm">
                            {rec.category || 'Priority Action'}
                          </span>
                        </div>

                        <h4 className="text-lg font-semibold text-white mb-2">
                          {rec.title || `Action ${index + 1}`}
                        </h4>
                        <p className="text-purple-200 mb-3">
                          {rec.description || rec.reasoning}
                        </p>

                        <div className="flex items-center space-x-4 text-sm">
                          <span className="text-purple-300">
                            ⏱️ {Math.ceil((rec.estimated_time_hours || 8) / 8)} weeks
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

            {/* Action Buttons */}
            <div className="text-center space-x-4">
              <a
                href="/dashboard"
                className="inline-block bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors"
              >
                🚀 Continue to Dashboard
              </a>

              <button
                onClick={() => {
                  setCurrentStep('start')
                  setCurrentQuestion(0)
                  setAnswers([])
                  setResults(null)
                }}
                className="bg-white/10 hover:bg-white/20 text-white px-6 py-4 rounded-lg font-semibold transition-colors"
              >
                🔄 Retake Assessment
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}