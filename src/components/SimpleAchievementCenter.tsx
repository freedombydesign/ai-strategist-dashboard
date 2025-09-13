'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Trophy, Star, Target, CheckCircle2, Award } from 'lucide-react'

export default function SimpleAchievementCenter() {
  const [completedAchievements] = useState([
    {
      id: 1,
      title: 'Freedom Score Completed',
      description: 'Completed your first Freedom Score assessment',
      icon: Target,
      completed: true,
      points: 100
    },
    {
      id: 2,
      title: 'Sprint Started',
      description: 'Started your first strategic sprint',
      icon: Star,
      completed: false,
      points: 150
    },
    {
      id: 3,
      title: 'Profile Updated',
      description: 'Updated your business profile',
      icon: CheckCircle2,
      completed: false,
      points: 50
    },
    {
      id: 4,
      title: 'AI Coach Consultation',
      description: 'Had your first conversation with the AI strategist',
      icon: Award,
      completed: false,
      points: 200
    }
  ])

  const totalPoints = completedAchievements
    .filter(a => a.completed)
    .reduce((sum, a) => sum + a.points, 0)

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Trophy className="w-8 h-8 text-yellow-500 mr-3" />
          <h1 className="text-3xl font-bold text-gray-900">Achievement Center</h1>
        </div>
        <p className="text-gray-600">
          Track your progress and celebrate your business growth milestones.
        </p>
      </div>

      {/* Points Summary */}
      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg p-6 mb-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold mb-2">Total Achievement Points</h2>
            <div className="text-3xl font-bold">{totalPoints} Points</div>
          </div>
          <div className="text-right">
            <div className="text-sm opacity-90">Completed</div>
            <div className="text-lg font-semibold">
              {completedAchievements.filter(a => a.completed).length} / {completedAchievements.length}
            </div>
          </div>
        </div>
      </div>

      {/* Achievements Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {completedAchievements.map((achievement) => {
          const IconComponent = achievement.icon
          return (
            <div
              key={achievement.id}
              className={`bg-white rounded-lg border p-6 transition-all ${
                achievement.completed
                  ? 'border-green-200 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start">
                <div className={`p-3 rounded-lg mr-4 ${
                  achievement.completed
                    ? 'bg-green-100 text-green-600'
                    : 'bg-gray-100 text-gray-400'
                }`}>
                  <IconComponent className="w-6 h-6" />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className={`font-semibold ${
                      achievement.completed ? 'text-green-900' : 'text-gray-900'
                    }`}>
                      {achievement.title}
                    </h3>
                    {achievement.completed && (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    )}
                  </div>
                  
                  <p className={`text-sm mb-3 ${
                    achievement.completed ? 'text-green-700' : 'text-gray-600'
                  }`}>
                    {achievement.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${
                      achievement.completed ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {achievement.points} points
                    </span>
                    
                    {achievement.completed && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                        Completed ✓
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Action Buttons */}
      <div className="mt-12 text-center">
        <div className="bg-blue-50 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Ready for more achievements?</h3>
          <p className="text-blue-700 mb-4">
            Complete your business profile and start working on sprints to unlock more achievements!
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/business-profile"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
            >
              Update Business Profile
            </Link>
            
            <Link
              href="/ai-strategist"
              className="border border-blue-600 text-blue-600 hover:bg-blue-50 px-6 py-3 rounded-lg font-medium"
            >
              Talk to AI Strategist
            </Link>
          </div>
        </div>
        
        <Link
          href="/dashboard"
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  )
}