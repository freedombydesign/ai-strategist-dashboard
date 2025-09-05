'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface CashFlowMetrics {
  currentBalance: number
  monthlyRecurring: number
  pendingInvoices: number
  overdueInvoices: number
  cashRunway: number
  healthScore: number
  revenueGrowth: number
  avgTransactionValue: number
  customersCount: number
}

interface CashFlowAlert {
  id: string
  type: 'warning' | 'info' | 'success' | 'critical'
  title: string
  message: string
  urgency: 'low' | 'medium' | 'high' | 'critical'
  amount?: number
  dueDate?: string
}

interface Transaction {
  id: string
  amount: number
  status: string
  created: number
  description: string | null
  customer: string | null
  currency: string
  type: 'payment' | 'refund' | 'payout' | 'invoice'
}

export default function CashFlowCommandPage() {
  const [metrics, setMetrics] = useState<CashFlowMetrics | null>(null)
  const [alerts, setAlerts] = useState<CashFlowAlert[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastSync, setLastSync] = useState<Date | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [syncing, setSyncing] = useState(false)

  // Load real data from Stripe API
  useEffect(() => {
    loadCashFlowData()
  }, [])

  const loadCashFlowData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load metrics, alerts, and transactions in parallel
      const [metricsRes, alertsRes, transactionsRes] = await Promise.all([
        fetch('/api/cash-flow/metrics'),
        fetch('/api/cash-flow/alerts'),
        fetch('/api/cash-flow/transactions?limit=20')
      ])

      const metricsData = await metricsRes.json()
      const alertsData = await alertsRes.json()
      const transactionsData = await transactionsRes.json()

      if (metricsData.success) {
        setMetrics(metricsData.data)
      }

      if (alertsData.success) {
        setAlerts(alertsData.data)
      }

      if (transactionsData.success) {
        setTransactions(transactionsData.data)
      }

      setLastSync(new Date())
    } catch (err) {
      console.error('Error loading cash flow data:', err)
      setError('Failed to load cash flow data. Please check your Stripe configuration.')
    } finally {
      setLoading(false)
    }
  }

  const handleSync = async () => {
    try {
      setSyncing(true)
      const response = await fetch('/api/cash-flow/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync' })
      })
      
      const data = await response.json()
      if (data.success) {
        await loadCashFlowData()
        alert('✅ Cash flow data synced successfully!')
      } else {
        alert('❌ Sync failed: ' + data.error)
      }
    } catch (err) {
      console.error('Sync error:', err)
      alert('❌ Sync failed. Please try again.')
    } finally {
      setSyncing(false)
    }
  }

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'critical': return 'border-red-400 bg-red-50'
      case 'warning': return 'border-yellow-400 bg-yellow-50'
      case 'info': return 'border-blue-400 bg-blue-50'
      case 'success': return 'border-green-400 bg-green-50'
      default: return 'border-gray-400 bg-gray-50'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading real-time cash flow data...</p>
          <p className="text-sm text-gray-500">Connecting to Stripe API</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">💰 Cash Flow Command</h1>
              {metrics && (
                <span className={`ml-3 px-3 py-1 text-sm font-medium rounded-full ${
                  metrics.healthScore >= 80 
                    ? 'bg-green-100 text-green-800'
                    : metrics.healthScore >= 60
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {metrics.healthScore}% Health
                </span>
              )}
              {lastSync && (
                <span className="ml-3 text-xs text-gray-500">
                  Last synced: {lastSync.toLocaleTimeString()}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleSync}
                disabled={syncing}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                {syncing ? '⏳ Syncing...' : '🔄 Sync Stripe'}
              </button>
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