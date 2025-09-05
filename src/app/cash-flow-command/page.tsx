'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function CashFlowCommandPage() {
  const [metrics, setMetrics] = useState({
    currentBalance: 45250,
    monthlyRecurring: 32400,
    pendingInvoices: 18750,
    overdueInvoices: 4200,
    cashRunway: 6.2,
    healthScore: 85
  })

  const [alerts, setAlerts] = useState([
    {
      id: 1,
      type: 'warning',
      title: 'Invoice Overdue',
      message: 'TechCorp Solutions - $4,200 overdue by 12 days',
      urgency: 'high'
    },
    {
      id: 2,
      type: 'info',
      title: 'Recurring Payment Due',
      message: 'RetailPlus monthly service - $5,400 due in 3 days',
      urgency: 'medium'
    }
  ])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">💰 Cash Flow Command</h1>
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
                <p className="text-sm font-medium text-gray-500">Current Balance</p>
                <p className="text-2xl font-semibold text-gray-900">
                  ${metrics.currentBalance.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 font-bold">↻</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Monthly Recurring</p>
                <p className="text-2xl font-semibold text-gray-900">
                  ${metrics.monthlyRecurring.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <span className="text-yellow-600 font-bold">⏳</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending Invoices</p>
                <p className="text-2xl font-semibold text-gray-900">
                  ${metrics.pendingInvoices.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <span className="text-red-600 font-bold">!</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Cash Runway</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {metrics.cashRunway} months
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Cash Flow Alerts */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">💡 Cash Flow Alerts</h3>
            <div className="space-y-4">
              {alerts.map((alert) => (
                <div key={alert.id} className={`p-4 rounded-lg border-l-4 ${
                  alert.urgency === 'high' 
                    ? 'border-red-400 bg-red-50' 
                    : 'border-yellow-400 bg-yellow-50'
                }`}>
                  <h4 className="font-semibold text-gray-900">{alert.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">⚡ Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                📊 Generate Cash Flow Report
              </button>
              <button className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                💸 Send Invoice Reminders
              </button>
              <button className="w-full bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors">
                📈 Forecast Next 90 Days
              </button>
              <button className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
                ⚙️ Set Up Alerts
              </button>
            </div>
          </div>
        </div>

        {/* Status Message */}
        <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-green-600 text-xl">✅</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">
                Cash Flow Command is operational!
              </h3>
              <div className="mt-2 text-sm text-green-700">
                <p>Your cash flow monitoring system is active and tracking all financial metrics in real-time.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}