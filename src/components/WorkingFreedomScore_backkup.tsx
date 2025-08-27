'use client'

import { useState, useEffect } from 'react'
import { findRecommendedSprint } from '@/lib/recommendation'

export default function WorkingFreedomScore() {
  const [questions] = useState([
    { id: 1, text: "I have a clear process for generating consistent leads", category: 'lead_generation' },
    { id: 2, text: "I can take time off without my business collapsing", category: 'delegation' },
    { id: 3, text: "I have systems that help me efficiently qualify potential clients", category: 'clarity' },
    { id: 4, text: "My team can handle most client requests without my involvement", category: 'delegation' },
    { id: 5, text: "I have a clear pricing strategy that feels good to me and clients", category: 'pricing' },
    { id: 6, text: "I consistently hit my revenue targets with ease", category: 'revenue' },
    { id: 7, text: "I have a documented process for onboarding new clients", category: 'client_onboarding' },
    { id: 8, text: "I feel energized by my work most days", category: 'clarity' },
    { id: 9, text: "My business can operate without my daily involvement", category: 'delegation' },
    { id: 10, text: "I have a clear vision for where my business is headed in the next year", category: 'clarity' },
    { id: 11, text: "I have effective systems for delivering my services consistently", category: 'service_delivery' },
    { id: 12, text: "I feel confident saying no to clients who aren't a good fit", category: 'pricing' }
  ])

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [showResults, setShowResults] = useState(false)
  const [recommendedSprint, setRecommendedSprint] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleAnswer = (value: number) => {
    const newAnswers = [...answers, value]
    setAnswers(newAnswers)

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    } else {
      setShowResults(true)
    }
  }

  const calculateScore = () => {
    const total = answers.reduce((sum, answer) => sum + answer, 0)
    return Math.round((total / (answers.length * 5)) * 100)
  }

  const calculateWeakestCategory = () => {
    // Group answers by category and calculate averages
    const categoryScores: Record<string, { total: number; count: number }> = {};
    
    questions.forEach((question, index) => {
      if (answers[index] !== undefined) {
        const category = question.category;
        if (!categoryScores[category]) {
          categoryScores[category] = { total: 0, count: 0 };
        }
        categoryScores[category].total += answers[index];
        categoryScores[category].count += 1;
      }
    });

    // Find the category with the lowest average score
    let weakestCategory = '';
    let lowestAverage = 5; // Start with highest possible score

    for (const category in categoryScores) {
      const average = categoryScores[category].total / categoryScores[category].count;
      if (average < lowestAverage) {
        lowestAverage = average;
        weakestCategory = category;
      }
    }

    return weakestCategory;
  };

  // This effect runs when showResults becomes true
  useEffect(() => {
    if (showResults) {
      const fetchRecommendation = async () => {
        setIsLoading(true);
        try {
          const weakestCategory = calculateWeakestCategory();
          const sprint = await findRecommendedSprint(weakestCategory);
          setRecommendedSprint(sprint);
        } catch (error) {
          console.error('Error fetching recommendation:', error);
          // Fallback to a default recommendation
          setRecommendedSprint({ name: 'Find Clarity' });
        }
        setIsLoading(false);
      };

      fetchRecommendation();
    }
  }, [showResults, answers]);

  if (showResults) {
    const score = calculateScore()
    
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4 text-center">Your Freedom Score: {score}%</h2>
        <div className="bg-blue-50 p-4 rounded-md mb-6">
          <h3 className="text-xl font-semibold text-blue-800">Recommended Sprint:</h3>
          {isLoading ? (
            <p className="mt-2 text-blue-700">Loading recommendation...</p>
          ) : (
            <p className="mt-2 text-blue-700">
              Based on your answers, we recommend starting with the "{recommendedSprint?.name}" sprint.
            </p>
          )}
        </div>
        <button
          onClick={() => {
            setCurrentQuestionIndex(0)
            setAnswers([])
            setShowResults(false)
            setRecommendedSprint(null)
          }}
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
        >
          Retake Assessment
        </button>
      </div>
    )
  }

  const currentQuestion = questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="mb-2 text-sm text-gray-500">
        Question {currentQuestionIndex + 1} of {questions.length}
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
        <div 
          className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      <h2 className="text-xl font-semibold mb-6">{currentQuestion.text}</h2>
      <div className="grid grid-cols-5 gap-2 mt-6">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            onClick={() => handleAnswer(value)}
            className="py-2 px-4 bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {value}
          </button>
        ))}
      </div>
      <div className="flex justify-between text-sm text-gray-500 mt-2">
        <span>Strongly Disagree</span>
        <span>Strongly Agree</span>
      </div>
    </div>
  )
}