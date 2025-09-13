'use client'

import ProtectedRoute from '@/components/ProtectedRoute'
import SimpleAchievementCenter from '@/components/SimpleAchievementCenter'

export default function AchievementsPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-6">
          <SimpleAchievementCenter />
        </div>
      </div>
    </ProtectedRoute>
  )
}