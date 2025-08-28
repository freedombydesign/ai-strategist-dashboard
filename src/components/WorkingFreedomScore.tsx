'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '../context/AuthContext'
import { diagnosticService, FreedomDiagnosticQuestion } from '../services/diagnosticService'
import { scoreAndRecommend, DiagnosticAnswers, FreedomScoreResult } from '../utils/freedomScoring'
import AIChat from './AIChat'
import ProtectedRoute from './ProtectedRoute'

export default function FreedomScoreDiagnostic() {
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
        initialAnswers[q.order_index] = null
      })
      setAnswers(initialAnswers)

    } catch (err) {
      setError('Failed to load diagnostic questions. Make sure your database has 12 questions.')
      console.error('Database error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAnswerChange = (questionOrderIndex: number, value: string) => {
    const newAnswers = { ...answers, [questionOrderIndex]: parseInt(value) }
    setAnswers(newAnswers)

    const allAnswered = Object.values(newAnswers).every(answer => answer !== null)
    if (allAnswered) {
      calculateScoreAndSave(newAnswers)
    }
  }

  const calculateScoreAndSave = async (answersObj: Record<number, number | null>) => {
    try {
      setIsCalculating(true)
      console.log('Calculating score with answers:', answersObj)
      
      const moduleAnswers: DiagnosticAnswers = {
        M1_Q1: 0, M1_Q2: 0, M2_Q1: 0, M2_Q2: 0, M3_Q1: 0, M3_Q2: 0,
        M4_Q1: 0, M4_Q2: 0, M5_Q1: 0, M5_Q2: 0, M6_Q1: 0, M6_Q2: 0
      }

      Object.entries(answersObj).forEach(([questionIndex, answer]) => {
        const moduleKey = moduleMapping[parseInt(questionIndex) as keyof typeof moduleMapping]
        if (moduleKey && answer !== null) {
          moduleAnswers[moduleKey as keyof DiagnosticAnswers] = answer
        }
      })

      console.log('Module answers:', moduleAnswers)
      
      const result = scoreAndRecommend(moduleAnswers)
      console.log('Score result:', result)
      setScoreResult(result)
      
      // Save to localStorage for dashboard (client-side only)
      if (typeof window !== 'undefined') {
        localStorage.setItem('lastFreedomScore', JSON.stringify(result))
        localStorage.setItem('scoreCompletedAt', new Date().toISOString())
      }
      
      // Save to database with real user ID
      if (user?.id) {
        try {
          const savedResponse = await diagnosticService.saveResponsesAndCalculateScore(
            moduleAnswers,
            user.id
          )
          console.log('Response saved for user:', user.id, 'Response ID:', savedResponse.id)
        } catch (saveError) {
          console.error('Error saving response:', saveError)
        }
      } else {
        console.warn('No user ID available, response not saved to database')
      }

    } catch (err) {
      console.error('Error calculating score:', err)
      setError('Failed to calculate your Freedom Score. Please try again.')
    } finally {
      setIsCalculating(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Freedom Score™ Diagnostic</h2>
          <p className="text-gray-600">Loading your diagnostic questions...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-xl font-semibold text-red-800 mb-2">Error</h2>
          <p className="text-red-600">{error}</p>
          <button 
            onClick={loadDiagnosticQuestions}
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-4xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Freedom Score™ Diagnostic</h1>
                <p className="text-sm text-gray-600">Rate each statement from 1-10</p>
              </div>
              <div className="flex items-center gap-4">
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  ← Return to Dashboard
                </Link>
                {user?.email && (
                  <span className="text-sm text-gray-500">{user.email}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto p-6">
          <p className="text-gray-600 mb-8">
            Rate each statement from 1-10, where 1 = "not true at all" and 10 = "completely true/optimized"
          </p>

      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Progress</span>
          <span>{Object.values(answers).filter(a => a !== null).length} of 12 questions</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
            style={{
              width: `${(Object.values(answers).filter(a => a !== null).length / 12) * 100}%`
            }}
          ></div>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-6 mb-8">
        {questions.map((question) => {
          const moduleInfo = getModuleInfo(question.order_index)
          return (
            <div key={question.id} className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">
                {moduleInfo.module} • {moduleInfo.name}
              </div>
              <h3 className="font-medium mb-4 text-gray-800">
                {question.order_index}. {question.question_text}
              </h3>
              <div className="space-y-2">
                <div className="grid grid-cols-10 gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                    <label key={value} className="flex flex-col items-center cursor-pointer">
                      <input
                        type="radio"
                        name={`question_${question.order_index}`}
                        value={value}
                        onChange={(e) => handleAnswerChange(question.order_index, e.target.value)}
                        className="form-radio text-blue-600 mb-1"
                      />
                      <span className="text-sm font-medium">{value}</span>
                    </label>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>Not true at all</span>
                  <span>Completely true</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Results */}
      {isCalculating && (
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-blue-800">Calculating your Freedom Score...</p>
          </div>
        </div>
      )}

      {scoreResult && (
        <div className="bg-gradient-to-r from-blue-50 to-green-50 p-8 rounded-lg border">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Your Freedom Score™</h3>
            <div className="text-5xl font-bold text-blue-600 mb-2">{scoreResult.percent}%</div>
            <p className="text-gray-600">Total Score: {scoreResult.totalScore}/60</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            {Object.entries(scoreResult.moduleAverages).map(([module, score]) => (
              <div key={module} className="bg-white p-4 rounded-lg text-center">
                <div className="text-sm text-gray-600 mb-1">{getModuleName(module)}</div>
                <div className="text-2xl font-bold text-gray-800">{score}</div>
                <div className="text-xs text-gray-500">out of 10</div>
              </div>
            ))}
          </div>

          <div className="space-y-6">
            <h4 className="text-xl font-semibold text-gray-800 mb-4">
              🎯 Your Recommended Sprint Sequence
            </h4>

            {scoreResult.recommendedOrder.map((sprint, index) => (
              <div key={sprint.sprintKey} className="bg-white p-6 rounded-lg border-l-4 border-green-500">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <span className="bg-green-500 text-white text-sm font-bold rounded-full w-6 h-6 flex items-center justify-center mr-3">
                        {index + 1}
                      </span>
                      <h5 className="text-lg font-bold text-green-600">{sprint.title}</h5>
                    </div>
                    <p className="text-gray-600 ml-9">{sprint.why}</p>
                  </div>
                </div>
              </div>
            ))}

            <div className="bg-gray-50 p-6 rounded-lg border">
              <h5 className="font-semibold mb-2 text-gray-800">🚀 What happens next:</h5>
              <p className="text-gray-600 leading-relaxed">
                You'll get a 7-10 day Action Sprint with 10-minute tasks, templates, and your AI Strategist 
                to rewrite and check your work. Each Sprint builds on the previous one to systematically 
                remove you as the bottleneck.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Dashboard Navigation Section - Added between results and chat */}
      {scoreResult && (
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <h4 className="text-lg font-semibold text-gray-800 mb-2">Ready to take action?</h4>
          <p className="text-gray-600 mb-4">
            Your results have been saved. Visit your dashboard to track progress and access your action plans.
          </p>
          <Link
            href="/dashboard"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg inline-flex items-center font-medium transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Go to Dashboard
          </Link>
        </div>
      )}

      {scoreResult && user && (
        <AIChat 
          freedomScore={scoreResult}
          userId={user.id}
        />
      )}
        </div>
      </div>
    </ProtectedRoute>
  )
}

// Helpers
function getModuleInfo(questionIndex: number) {
  const moduleMap = {
    1: { module: 'M1', name: 'Position for Profit' },
    2: { module: 'M1', name: 'Position for Profit' },
    3: { module: 'M3', name: 'Set Up Systems That Support You' },
    4: { module: 'M3', name: 'Set Up Systems That Support You' },
    5: { module: 'M2', name: 'Engineer the Buyer Journey' },
    6: { module: 'M2', name: 'Engineer the Buyer Journey' },
    7: { module: 'M4', name: 'Build a Sales System' },
    8: { module: 'M4', name: 'Build a Sales System' },
    9: { module: 'M6', name: 'Refine, Release, Repeat' },
    10: { module: 'M5', name: 'Deliver Without Doing It All' },
    11: { module: 'M5', name: 'Deliver Without Doing It All' },
    12: { module: 'M6', name: 'Refine, Release, Repeat' }
  }
  return moduleMap[questionIndex as keyof typeof moduleMap] || { module: 'Unknown', name: 'Unknown' }
}

function getModuleName(moduleKey: string): string {
  const names = {
    'M1': 'Position for Profit',
    'M2': 'Engineer Buyer Journey', 
    'M3': 'Set Up Systems',
    'M4': 'Build Sales System',
    'M5': 'Deliver Without Doing All',
    'M6': 'Refine, Release, Repeat'
  }
  return names[moduleKey as keyof typeof names] || moduleKey
}