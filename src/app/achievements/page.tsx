'use client'

import Link from 'next/link'
import ProtectedRoute from '@/components/ProtectedRoute'
import AchievementCenter from '@/components/AchievementCenter'
import MobileOptimizedLayout from '@/components/MobileOptimizedLayout'
import { ArrowLeft, Trophy } from 'lucide-react'

export default function AchievementsPage() {
  return (
    <ProtectedRoute>
      <MobileOptimizedLayout>
      <div className="min-h-screen bg-gray-50 py-4 md:py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-6 md:mb-8">
            <Link
              href="/dashboard"
              className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
            >
              <ArrowLeft size={20} className="mr-2" />
              Back to Dashboard
            </Link>
            
            <div className="flex items-center mb-4 md:mb-6">
              <div className="bg-gradient-to-r from-purple-600 to-yellow-500 p-3 rounded-lg mr-4">
                <Trophy className="text-white" size={32} />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Achievement Center</h1>
                <p className="text-gray-600 text-base md:text-lg">
                  Track your progress, unlock rewards, and build unstoppable momentum
                </p>
              </div>
            </div>
          </div>

          {/* Achievement Center */}
          <AchievementCenter />
        </div>
      </div>
      </MobileOptimizedLayout>
    </ProtectedRoute>
  )
}