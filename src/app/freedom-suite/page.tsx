'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

export default function FreedomSuitePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [systemStats, setSystemStats] = useState({
    cashFlow: { health: 85, alerts: 2 },
    profitPulse: { health: 92, profit: 34.2 },
    journeyBuilder: { health: 78, active: 12 },
    systemStack: { health: 88, processes: 45 },
    convertFlow: { health: 73, pipeline: 1250000 },
    deliverEase: { health: 94, projects: 8 },
    launchLoop: { health: 81, experiments: 3 }
  })

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Freedom Suite...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Freedom by Design Suite</h1>
              <span className="ml-3 px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">Premium</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user.user_metadata?.firstName || user.email?.split('@')[0]}</span>
              <button
                onClick={() => router.push('https://ai.scalewithruth.com')}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
              >
                🧠 Executive AI
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-white mb-8">
          <h2 className="text-3xl font-bold mb-4">Your Business Operating System</h2>
          <p className="text-xl opacity-90 mb-6">7 integrated systems working together to scale your service business from $1M to $3M+ revenue</p>
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold">94%</div>
              <div className="text-sm opacity-80">System Health</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">$485K</div>
              <div className="text-sm opacity-80">Monthly Revenue</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">8.4/10</div>
              <div className="text-sm opacity-80">Business Score</div>
            </div>
          </div>
        </div>

        {/* System Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
          {/* Cash Flow Command */}
          <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/cash-flow-command')}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-xl">💰</span>
                </div>
                <div className="ml-3">
                  <h3 className="font-semibold text-gray-900">Cash Flow Command</h3>
                  <p className="text-sm text-gray-500">Financial Forecasting</p>
                </div>
              </div>
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${systemStats.cashFlow.health >= 80 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                {systemStats.cashFlow.health}%
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Active Alerts</span>
                <span className="font-medium">{systemStats.cashFlow.alerts}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: `${systemStats.cashFlow.health}%` }}></div>
              </div>
            </div>
          </div>

          {/* ProfitPulse */}
          <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/profit-pulse')}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-xl">📈</span>
                </div>
                <div className="ml-3">
                  <h3 className="font-semibold text-gray-900">ProfitPulse</h3>
                  <p className="text-sm text-gray-500">Profitability Analysis</p>
                </div>
              </div>
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${systemStats.profitPulse.health >= 80 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                {systemStats.profitPulse.health}%
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Profit Margin</span>
                <span className="font-medium text-green-600">{systemStats.profitPulse.profit}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${systemStats.profitPulse.health}%` }}></div>
              </div>
            </div>
          </div>

          {/* JourneyBuilder */}
          <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/journey-builder')}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-xl">🎯</span>
                </div>
                <div className="ml-3">
                  <h3 className="font-semibold text-gray-900">JourneyBuilder</h3>
                  <p className="text-sm text-gray-500">Customer Journeys</p>
                </div>
              </div>
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${systemStats.journeyBuilder.health >= 80 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                {systemStats.journeyBuilder.health}%
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Active Journeys</span>
                <span className="font-medium">{systemStats.journeyBuilder.active}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${systemStats.journeyBuilder.health}%` }}></div>
              </div>
            </div>
          </div>

          {/* SystemStack */}
          <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/system-stack')}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <span className="text-xl">📚</span>
                </div>
                <div className="ml-3">
                  <h3 className="font-semibold text-gray-900">SystemStack</h3>
                  <p className="text-sm text-gray-500">Process Documentation</p>
                </div>
              </div>
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${systemStats.systemStack.health >= 80 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                {systemStats.systemStack.health}%
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Active Processes</span>
                <span className="font-medium">{systemStats.systemStack.processes}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-orange-600 h-2 rounded-full" style={{ width: `${systemStats.systemStack.health}%` }}></div>
              </div>
            </div>
          </div>

          {/* ConvertFlow */}
          <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/convert-flow')}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <span className="text-xl">🔄</span>
                </div>
                <div className="ml-3">
                  <h3 className="font-semibold text-gray-900">ConvertFlow</h3>
                  <p className="text-sm text-gray-500">Sales Optimization</p>
                </div>
              </div>
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${systemStats.convertFlow.health >= 80 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                {systemStats.convertFlow.health}%
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Pipeline Value</span>
                <span className="font-medium">${(systemStats.convertFlow.pipeline / 1000000).toFixed(2)}M</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-red-600 h-2 rounded-full" style={{ width: `${systemStats.convertFlow.health}%` }}></div>
              </div>
            </div>
          </div>

          {/* DeliverEase */}
          <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/deliver-ease')}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                  <span className="text-xl">🚀</span>
                </div>
                <div className="ml-3">
                  <h3 className="font-semibold text-gray-900">DeliverEase</h3>
                  <p className="text-sm text-gray-500">Client Delivery</p>
                </div>
              </div>
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${systemStats.deliverEase.health >= 80 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                {systemStats.deliverEase.health}%
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Active Projects</span>
                <span className="font-medium">{systemStats.deliverEase.projects}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-teal-600 h-2 rounded-full" style={{ width: `${systemStats.deliverEase.health}%` }}></div>
              </div>
            </div>
          </div>

          {/* LaunchLoop */}
          <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/launch-loop')}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <span className="text-xl">🔬</span>
                </div>
                <div className="ml-3">
                  <h3 className="font-semibold text-gray-900">LaunchLoop</h3>
                  <p className="text-sm text-gray-500">Continuous Optimization</p>
                </div>
              </div>
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${systemStats.launchLoop.health >= 80 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                {systemStats.launchLoop.health}%
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Running Experiments</span>
                <span className="font-medium">{systemStats.launchLoop.experiments}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${systemStats.launchLoop.health}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
              <span className="text-2xl mb-2">📊</span>
              <span className="text-sm font-medium text-gray-900">Generate Report</span>
            </button>
            <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
              <span className="text-2xl mb-2">🔧</span>
              <span className="text-sm font-medium text-gray-900">System Health</span>
            </button>
            <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
              <span className="text-2xl mb-2">📈</span>
              <span className="text-sm font-medium text-gray-900">View Analytics</span>
            </button>
            <button 
              onClick={() => router.push('https://ai.scalewithruth.com')}
              className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors"
            >
              <span className="text-2xl mb-2">🧠</span>
              <span className="text-sm font-medium text-gray-900">Executive AI</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}