'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function ProfitPulsePage() {
  const [metrics, setMetrics] = useState({
    monthlyRevenue: 485000,
    profitMargin: 34.2,
    grossProfit: 165870,
    netProfit: 145200,
    expenseRatio: 65.8,
    revenueGrowth: 12.5,
    healthScore: 92
  })

  const [insights, setInsights] = useState([
    {
      id: 1,
      type: 'positive',
      title: 'Strong Profit Margins',
      message: 'Your 34.2% profit margin is well above industry average of 22%',
      impact: 'high'
    },
    {
      id: 2,
      type: 'growth',
      title: 'Revenue Growth Trending Up',
      message: '12.5% month-over-month growth indicates strong business momentum',
      impact: 'high'
    },
    {
      id: 3,
      type: 'opportunity',
      title: 'Expense Optimization Opportunity', 
      message: 'Reducing expenses by 5% could increase profit margin to 39%',
      impact: 'medium'
    }
  ])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">📈 ProfitPulse</h1>
              <span className="ml-3 px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                {metrics.healthScore}% Health
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
              >
                ← Dashboard
              </Link>
              <Link
                href="https://suite.scalewithruth.com"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                🏢 Full Suite
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-green-600 font-bold">$</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Monthly Revenue</p>
                <p className="text-2xl font-semibold text-gray-900">
                  ${metrics.monthlyRevenue.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 font-bold">%</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Profit Margin</p>
                <p className="text-2xl font-semibold text-green-600">
                  {metrics.profitMargin}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-purple-600 font-bold">↗</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Net Profit</p>
                <p className="text-2xl font-semibold text-gray-900">
                  ${metrics.netProfit.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <span className="text-yellow-600 font-bold">📊</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Revenue Growth</p>
                <p className="text-2xl font-semibold text-green-600">
                  +{metrics.revenueGrowth}%
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Profitability Insights */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">💡 Profitability Insights</h3>
            <div className="space-y-4">
              {insights.map((insight) => (
                <div key={insight.id} className={`p-4 rounded-lg border-l-4 ${
                  insight.type === 'positive' 
                    ? 'border-green-400 bg-green-50' 
                    : insight.type === 'growth'
                    ? 'border-blue-400 bg-blue-50'
                    : 'border-yellow-400 bg-yellow-50'
                }`}>
                  <h4 className="font-semibold text-gray-900">{insight.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{insight.message}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">⚡ Profit Optimization</h3>
            <div className="space-y-3">
              <button className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                📊 Generate Profit Report
              </button>
              <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                📈 Analyze Expense Trends
              </button>
              <button className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
                💰 Revenue Optimization
              </button>
              <button className="w-full bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors">
                ⚙️ Set Profit Targets
              </button>
            </div>
          </div>
        </div>

        {/* Performance Summary */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <span className="text-blue-600 text-2xl">📈</span>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Excellent Profitability Performance!
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-700">
                <div>
                  <strong>Profit Margin:</strong> 34.2% (Above average)
                </div>
                <div>
                  <strong>Revenue Growth:</strong> +12.5% (Strong momentum)
                </div>
                <div>
                  <strong>Health Score:</strong> 92% (Excellent)
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}