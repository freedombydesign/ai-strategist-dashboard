'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function MinimalDashboard() {
  const [user, setUser] = useState({ email: 'user@example.com' })
  const [freedomScore, setFreedomScore] = useState({ percent: 67, totalScore: 40 })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Freedom Dashboard</h1>
              <p className="text-gray-600">Welcome back, {user?.email?.split('@')[0] || 'User'}!</p>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/suite"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
              >
                Advanced Suite
              </Link>
              <Link
                href="/ai-intelligence"
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg"
              >
                AI Intelligence
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
            <h2 className="text-xl font-semibold mb-2">
              Welcome to your Freedom Operating System!
            </h2>
            <p className="text-blue-100">Ready to continue optimizing your business?</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Freedom Score */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Freedom Score</h3>
              
              <div className="flex items-center mb-4">
                <div className="text-4xl font-bold text-blue-600 mr-4">
                  {freedomScore.percent}%
                </div>
                <div>
                  <div className="text-gray-600">Total: {freedomScore.totalScore}/60</div>
                  <div className="text-sm text-gray-500">
                    Last updated today
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <Link
                  href="/assessment"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
                >
                  Retake Assessment
                </Link>
                <Link
                  href="/ai-strategist"
                  className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm"
                >
                  Discuss with AI
                </Link>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-4">
                <Link
                  href="/deliver-ease"
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-center"
                >
                  <div className="text-2xl mb-2">🚀</div>
                  <div className="font-medium">DeliverEase</div>
                  <div className="text-sm text-gray-600">Client delivery</div>
                </Link>
                <Link
                  href="/suite"
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-center"
                >
                  <div className="text-2xl mb-2">⚡</div>
                  <div className="font-medium">Business Suite</div>
                  <div className="text-sm text-gray-600">Advanced tools</div>
                </Link>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* AI Coaches */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Coaches</h3>
              <div className="space-y-3">
                <Link
                  href="/ai-intelligence"
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-lg flex items-center justify-center"
                >
                  ✨ Executive Intelligence
                </Link>
                <Link
                  href="/implementation-coach"
                  className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center"
                >
                  🚀 Implementation Coach
                </Link>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Active Projects</span>
                  <span className="font-semibold">12</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Completion Rate</span>
                  <span className="font-semibold">94%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Freedom Score</span>
                  <span className="font-semibold">{freedomScore.percent}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}