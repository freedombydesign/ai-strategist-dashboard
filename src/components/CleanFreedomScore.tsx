'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '../context/AuthContext'
import { diagnosticService, FreedomDiagnosticQuestion } from '../services/diagnosticService'
import { scoreAndRecommend, DiagnosticAnswers, FreedomScoreResult } from '../utils/freedomScoring'

export default function CleanFreedomScore() {
  const { user } = useAuth()
  const [questions, setQuestions] = useState<FreedomDiagnosticQuestion[]>([])
  const [answers, setAnswers] = useState<Record<number, number | null>>({})
  const [scoreResult, setScoreResult] = useState<FreedomScoreResult | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [isCalculating, setIsCalculating] = useState<boolean>(false)

  const moduleMapping = {
    1: 'M1_Q1',
    2: 'M1_Q2',
    3: 'M3_Q1',
    4: 'M3_Q2',
    5: 'M2_Q1',
    6: 'M2_Q2',
    7: 'M4_Q1',
    8: 'M4_Q2',
    9: 'M6_Q1',
    10: 'M5_Q1',
    11: 'M5_Q2',
    12: 'M6_Q2'
  }

  useEffect(() => {
    loadDiagnosticQuestions()
  }, [])

  const loadDiagnosticQuestions = async () => {
    try {
      setLoading(true)
      const questionsData = await diagnosticService.getDiagnosticQuestions()
      if (questionsData.length !== 12) {
        throw new Error(`Expected 12 questions, got ${questionsData.length}`)
      }

      setQuestions(questionsData)

      const initialAnswers: Record<number, number | null> = {}
      questionsData.forEach(q => {
        initialAnswers[q.id] = null
      })
      setAnswers(initialAnswers)
      setLoading(false)
    } catch (err) {
      console.error('Error loading diagnostic questions:', err)
      setError('Failed to load diagnostic questions')
      setLoading(false)
    }
  }

  const handleAnswerChange = (questionId: number, value: number) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }))
  }

  const calculateScore = async () => {
    try {
      setIsCalculating(true)
      
      // Convert answers to the format expected by scoreAndRecommend
      const diagnosticAnswers: DiagnosticAnswers = {}
      Object.entries(answers).forEach(([questionId, answer]) => {
        if (answer !== null) {
          const moduleKey = moduleMapping[parseInt(questionId) as keyof typeof moduleMapping]
          diagnosticAnswers[moduleKey] = answer
        }
      })

      const result = scoreAndRecommend(diagnosticAnswers)
      setScoreResult(result)

      // Save to localStorage
      localStorage.setItem('lastFreedomScore', JSON.stringify(result))

      // Save to database if user is logged in
      if (user?.id) {
        await diagnosticService.saveUserResponses(user.id, diagnosticAnswers, result)
      }

      setIsCalculating(false)
    } catch (err) {
      console.error('Error calculating score:', err)
      setError('Failed to calculate score')
      setIsCalculating(false)
    }
  }

  const allQuestionsAnswered = questions.length > 0 && 
    questions.every(q => answers[q.id] !== null && answers[q.id] !== undefined)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading assessment...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Error: {error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (scoreResult) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Your Freedom Score</h1>
            
            <div className="text-center mb-8">
              <div className="text-6xl font-bold text-blue-600 mb-4">
                {scoreResult.percent}%
              </div>
              <div className="text-xl text-gray-600">
                Total Score: {scoreResult.totalScore}/60
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              {Object.entries(scoreResult.moduleAverages).map(([module, score]) => (
                <div key={module} className="bg-gray-50 rounded-lg p-4 text-center">
                  <div className="text-sm text-gray-600 mb-1">{getModuleName(module)}</div>
                  <div className="text-2xl font-bold text-gray-900">{score}</div>
                  <div className="text-xs text-gray-500">out of 10</div>
                </div>
              ))}
            </div>

            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Recommendations</h3>
              <div className="space-y-3">
                {scoreResult.recommendations.map((rec, index) => (
                  <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">{rec.title}</h4>
                    <p className="text-blue-800">{rec.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center space-x-4">
              <Link
                href="/dashboard"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg inline-block"
              >
                View Dashboard
              </Link>
              <button
                onClick={() => {
                  setScoreResult(null)
                  setAnswers({})
                  questions.forEach(q => {
                    setAnswers(prev => ({ ...prev, [q.id]: null }))
                  })
                }}
                className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-6 py-3 rounded-lg"
              >
                Retake Assessment
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Freedom Score Assessment</h1>
          <p className="text-lg text-gray-600 mb-8">
            Answer these 12 questions to discover your business freedom score and get personalized recommendations.
          </p>

          <div className="space-y-8">
            {questions.map((question, index) => (
              <div key={question.id} className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {index + 1}. {question.question_text}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                    <label key={value} className="flex items-center">
                      <input
                        type="radio"
                        name={`question-${question.id}`}
                        value={value}
                        checked={answers[question.id] === value}
                        onChange={() => handleAnswerChange(question.id, value)}
                        className="mr-3"
                      />
                      <span className="text-gray-700">
                        {value} - {getScaleLabel(value)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={calculateScore}
              disabled={!allQuestionsAnswered || isCalculating}
              className={`px-8 py-3 rounded-lg font-semibold ${
                allQuestionsAnswered && !isCalculating
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isCalculating ? 'Calculating...' : 'Calculate My Freedom Score'}
            </button>
            
            {!allQuestionsAnswered && (
              <p className="mt-2 text-sm text-gray-500">
                Please answer all questions to calculate your score
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function getModuleName(module: string) {
  const names: Record<string, string> = {
    'M1': 'Position for Profit',
    'M2': 'Buyer Journey',
    'M3': 'Systems',
    'M4': 'Sales System',
    'M5': 'Delivery',
    'M6': 'Improvement'
  }
  return names[module] || module
}

function getScaleLabel(value: number) {
  const labels: Record<number, string> = {
    1: 'Strongly Disagree',
    2: 'Disagree',
    3: 'Somewhat Disagree',
    4: 'Neutral',
    5: 'Somewhat Agree',
    6: 'Agree',
    7: 'Strongly Agree',
    8: 'Very Strongly Agree',
    9: 'Extremely Agree',
    10: 'Perfectly Agree'
  }
  return labels[value] || ''
}