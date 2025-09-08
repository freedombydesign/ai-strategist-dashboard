'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'

// Lazy load heavy components to prevent crashes
const DeliverEaseDashboard = dynamic(() => import('@/components/DeliverEaseDashboard'), {
  loading: () => <div className="animate-pulse bg-gray-100 h-96 rounded-lg"></div>
})

export default function BusinessSuitePage() {
  const [activeSystem, setActiveSystem] = useState<string | null>(null)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Freedom Suite</h1>
              <p className="text-gray-600">Advanced Business Management Platform</p>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="https://scalewithruth.com/dashboard"
                className="bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
              >
                Original Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* System Selector - Ultra Lightweight */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <button 
            onClick={() => setActiveSystem('deliver-ease')}
            className={`text-left p-6 rounded-lg border-2 transition-all ${
              activeSystem === 'deliver-ease' 
                ? 'border-indigo-500 bg-indigo-50' 
                : 'border-gray-200 bg-white hover:border-indigo-300'
            }`}
          >
            <div className="flex items-center mb-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <span className="text-indigo-600 font-bold">🚀</span>
              </div>
              <h3 className="ml-3 text-lg font-semibold text-gray-900">DeliverEase</h3>
            </div>
            <p className="text-sm text-gray-600">Automated client delivery management</p>
            <div className="mt-3 text-xs text-green-600 font-medium">✓ Active</div>
          </button>

          <button 
            onClick={() => setActiveSystem('profit-pulse')}
            className={`text-left p-6 rounded-lg border-2 transition-all ${
              activeSystem === 'profit-pulse' 
                ? 'border-emerald-500 bg-emerald-50' 
                : 'border-gray-200 bg-white hover:border-emerald-300'
            }`}
          >
            <div className="flex items-center mb-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <span className="text-emerald-600 font-bold">💰</span>
              </div>
              <h3 className="ml-3 text-lg font-semibold text-gray-900">ProfitPulse</h3>
            </div>
            <p className="text-sm text-gray-600">Financial intelligence & profit optimization</p>
            <div className="mt-3 text-xs text-green-600 font-medium">✓ Active</div>
          </button>

          <button 
            onClick={() => setActiveSystem('cash-flow')}
            className={`text-left p-6 rounded-lg border-2 transition-all ${
              activeSystem === 'cash-flow' 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 bg-white hover:border-blue-300'
            }`}
          >
            <div className="flex items-center mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 font-bold">💳</span>
              </div>
              <h3 className="ml-3 text-lg font-semibold text-gray-900">Cash Flow Command</h3>
            </div>
            <p className="text-sm text-gray-600">Cash flow management & forecasting</p>
            <div className="mt-3 text-xs text-green-600 font-medium">✓ Active</div>
          </button>

          <button 
            onClick={() => setActiveSystem('convert-flow')}
            className={`text-left p-6 rounded-lg border-2 transition-all ${
              activeSystem === 'convert-flow' 
                ? 'border-purple-500 bg-purple-50' 
                : 'border-gray-200 bg-white hover:border-purple-300'
            }`}
          >
            <div className="flex items-center mb-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-purple-600 font-bold">📈</span>
              </div>
              <h3 className="ml-3 text-lg font-semibold text-gray-900">Convert Flow</h3>
            </div>
            <p className="text-sm text-gray-600">Conversion optimization & analytics</p>
            <div className="mt-3 text-xs text-green-600 font-medium">✓ Active</div>
          </button>
        </div>

        {/* Quick Access Links - No Heavy Components */}
        {activeSystem === 'deliver-ease' && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">DeliverEase - Quick Access</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/deliver-ease" className="block p-4 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors">
                <div className="font-medium text-indigo-900">Main Dashboard</div>
                <div className="text-sm text-indigo-600">Executive command center</div>
              </Link>
              <Link href="/deliver-ease/analytics" className="block p-4 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors">
                <div className="font-medium text-indigo-900">Analytics</div>
                <div className="text-sm text-indigo-600">Performance metrics</div>
              </Link>
              <Link href="/deliver-ease/client-portal" className="block p-4 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors">
                <div className="font-medium text-indigo-900">Client Portal</div>
                <div className="text-sm text-indigo-600">Client project tracking</div>
              </Link>
            </div>
          </div>
        )}

        {activeSystem === 'profit-pulse' && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">ProfitPulse - Quick Access</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/profit-pulse" className="block p-4 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors">
                <div className="font-medium text-emerald-900">Main Dashboard</div>
                <div className="text-sm text-emerald-600">Financial intelligence center</div>
              </Link>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="font-medium text-gray-700">Advanced Analytics</div>
                <div className="text-sm text-gray-500">Coming soon</div>
              </div>
            </div>
          </div>
        )}

        {activeSystem === 'cash-flow' && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Cash Flow Command - Quick Access</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/cash-flow-command" className="block p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                <div className="font-medium text-blue-900">Main Dashboard</div>
                <div className="text-sm text-blue-600">Cash flow management</div>
              </Link>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="font-medium text-gray-700">Forecasting Tools</div>
                <div className="text-sm text-gray-500">Coming soon</div>
              </div>
            </div>
          </div>
        )}

        {activeSystem === 'convert-flow' && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Convert Flow - Quick Access</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/convert-flow" className="block p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
                <div className="font-medium text-purple-900">Main Dashboard</div>
                <div className="text-sm text-purple-600">Conversion optimization</div>
              </Link>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="font-medium text-gray-700">A/B Testing Suite</div>
                <div className="text-sm text-gray-500">Coming soon</div>
              </div>
            </div>
          </div>
        )}

        {!activeSystem && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-8 text-center">
            <h3 className="text-xl font-semibold text-blue-900 mb-2">Welcome to Freedom Suite</h3>
            <p className="text-blue-700 mb-4">Select a system above to get started with your advanced business management tools.</p>
            <div className="text-sm text-blue-600">
              All systems are optimized for <strong>minimal founder involvement</strong> and maximum operational efficiency.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}