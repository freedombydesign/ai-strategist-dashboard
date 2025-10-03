'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface ProfitMetrics {
  monthlyRevenue: number
  monthlyExpenses: number
  grossProfit: number
  netProfit: number
  profitMargin: number
  expenseRatio: number
  revenueGrowth: number
  expenseGrowth: number
  profitGrowth: number
  avgTransactionValue: number
  customersCount: number
  revenuePerCustomer: number
  healthScore: number
  marketingSpend: number
  averageCAC: number
}

interface ClientProfitability {
  customerId: string
  customerName: string
  revenue: number
  estimatedExpenses: number
  profit: number
  profitMargin: number
  transactionCount: number
  avgOrderValue: number
  lastTransaction: number
}

interface ProfitInsight {
  type: 'opportunity' | 'warning' | 'success' | 'optimization'
  title: string
  message: string
  impact: 'low' | 'medium' | 'high' | 'critical'
  potentialSavings?: number
  recommendedAction: string
}

export default function ProfitPulsePage() {
  const [metrics, setMetrics] = useState<ProfitMetrics>({
    monthlyRevenue: 0,
    monthlyExpenses: 0,
    grossProfit: 0,
    netProfit: 0,
    profitMargin: 0,
    expenseRatio: 0,
    revenueGrowth: 0,
    expenseGrowth: 0,
    profitGrowth: 0,
    avgTransactionValue: 0,
    customersCount: 0,
    revenuePerCustomer: 0,
    healthScore: 0,
    marketingSpend: 0,
    averageCAC: 0
  })
  const [clients, setClients] = useState<ClientProfitability[]>([])
  const [insights, setInsights] = useState<ProfitInsight[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [lastSync, setLastSync] = useState<Date | null>(null)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      // Get user email from session or auth
      const userEmail = 'user@example.com' // TODO: Get from auth

      // Fetch dashboard data
      const dashboardResponse = await fetch(`/api/profit-pulse/dashboard?userId=${userEmail}`)
      const dashboardData = await dashboardResponse.json()

      // Fetch marketing spend
      const marketingResponse = await fetch(`/api/marketing-spend?userId=${userEmail}`)
      const marketingData = await marketingResponse.json()

      if (dashboardData.success) {
        const overview = dashboardData.data.overview.keyMetrics
        const acquisition = dashboardData.data.acquisition

        setMetrics({
          monthlyRevenue: overview.totalRevenue || 0,
          monthlyExpenses: (overview.totalRevenue - overview.totalProfit) || 0,
          grossProfit: overview.totalProfit || 0,
          netProfit: overview.totalProfit || 0,
          profitMargin: overview.profitMargin || 0,
          expenseRatio: overview.totalRevenue > 0
            ? ((overview.totalRevenue - overview.totalProfit) / overview.totalRevenue) * 100
            : 0,
          revenueGrowth: 0,
          expenseGrowth: 0,
          profitGrowth: 0,
          avgTransactionValue: overview.totalRevenue / Math.max(1, overview.clientsTracked),
          customersCount: overview.clientsTracked || 0,
          revenuePerCustomer: overview.totalRevenue / Math.max(1, overview.clientsTracked),
          healthScore: overview.profitMargin || 0,
          marketingSpend: marketingData.success ? marketingData.data.totalSpend : 0,
          averageCAC: acquisition?.averageCAC || 0
        })

        // Convert insights from alerts
        const convertedInsights: ProfitInsight[] = dashboardData.data.alerts.map((alert: any) => ({
          type: alert.severity === 'critical' ? 'warning' : 'optimization',
          title: alert.message,
          message: alert.impact,
          impact: alert.severity,
          recommendedAction: 'Review dashboard for details'
        }))

        setInsights(convertedInsights)
      }

      setLoading(false)
      setLastSync(new Date())

    } catch (err) {
      console.error('Error fetching dashboard data:', err)
      setError('Failed to load dashboard data')
      setLoading(false)

      // Fallback to mock data on error
      setMetrics({
        monthlyRevenue: 0,
        monthlyExpenses: 0,
        grossProfit: 0,
        netProfit: 0,
        profitMargin: 0,
        expenseRatio: 0,
        revenueGrowth: 0,
        expenseGrowth: 0,
        profitGrowth: 0,
        avgTransactionValue: 0,
        customersCount: 0,
        revenuePerCustomer: 0,
        healthScore: 0,
        marketingSpend: 0,
        averageCAC: 0
      })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Executive Header */}
      <div className="bg-white/80 backdrop-blur-xl shadow-xl border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-6">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
                ProfitPulse
              </h1>
              <div className="flex items-center space-x-3">
                <span className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-bold rounded-full shadow-lg">
                  {metrics.healthScore.toFixed(0)}% EXECUTIVE HEALTH
                </span>
                <span className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-bold rounded-full shadow-lg">
                  INTELLIGENCE
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/freedom-suite"
                className="bg-gradient-to-r from-slate-600 to-slate-700 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:from-slate-700 hover:to-slate-800 transition-all duration-300 shadow-lg"
              >
                ← BACK TO SYSTEMS
              </Link>
              <Link
                href="https://suite.scalewithruth.com"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg"
              >
                EXECUTIVE SUITE
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Executive Metrics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-200/50 p-8 hover:shadow-3xl transition-all duration-500 transform hover:-translate-y-2">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-xl">
                  <span className="text-white font-bold text-2xl">$</span>
                </div>
              </div>
              <div className="ml-6">
                <p className="text-sm font-bold text-slate-600 uppercase tracking-widest">MONTHLY REVENUE</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  ${metrics.monthlyRevenue.toLocaleString()}
                </p>
                <p className="text-sm text-emerald-600 font-semibold mt-1">+{metrics.revenueGrowth.toFixed(1)}% Growth</p>
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-200/50 p-8 hover:shadow-3xl transition-all duration-500 transform hover:-translate-y-2">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl">
                  <span className="text-white font-bold text-2xl">%</span>
                </div>
              </div>
              <div className="ml-6">
                <p className="text-sm font-bold text-slate-600 uppercase tracking-widest">PROFIT MARGIN</p>
                <p className="text-3xl font-bold text-emerald-600">
                  {metrics.profitMargin.toFixed(1)}%
                </p>
                <p className="text-sm text-slate-600 font-semibold mt-1">Industry Leading</p>
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-200/50 p-8 hover:shadow-3xl transition-all duration-500 transform hover:-translate-y-2">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-xl">
                  <span className="text-white font-bold text-2xl">↗</span>
                </div>
              </div>
              <div className="ml-6">
                <p className="text-sm font-bold text-slate-600 uppercase tracking-widest">NET PROFIT</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  ${metrics.netProfit.toLocaleString()}
                </p>
                <p className="text-sm text-purple-600 font-semibold mt-1">+{metrics.profitGrowth}% Growth</p>
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-200/50 p-8 hover:shadow-3xl transition-all duration-500 transform hover:-translate-y-2">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-xl">
                  <span className="text-white font-bold text-2xl">$</span>
                </div>
              </div>
              <div className="ml-6">
                <p className="text-sm font-bold text-slate-600 uppercase tracking-widest">CUSTOMER ACQ. COST</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  ${metrics.averageCAC.toFixed(0)}
                </p>
                <p className="text-sm text-slate-600 font-semibold mt-1">
                  Marketing: ${metrics.marketingSpend.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Executive Intelligence */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-200/50 p-10">
            <div className="flex items-center mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg mr-4">
                <span className="text-white font-bold text-xl">AI</span>
              </div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">EXECUTIVE INTELLIGENCE</h3>
            </div>
            <div className="space-y-6">
              {insights.map((insight, index) => (
                <div key={index} className={`p-6 rounded-xl border-l-4 ${
                  insight.type === 'success' 
                    ? 'border-emerald-400 bg-gradient-to-r from-emerald-50 to-teal-50' 
                    : insight.type === 'opportunity'
                    ? 'border-blue-400 bg-gradient-to-r from-blue-50 to-indigo-50'
                    : 'border-amber-400 bg-gradient-to-r from-amber-50 to-orange-50'
                } shadow-lg`}>
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-slate-900">{insight.title}</h4>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                      insight.impact === 'critical' ? 'bg-red-100 text-red-800' :
                      insight.impact === 'high' ? 'bg-orange-100 text-orange-800' :
                      insight.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {insight.impact}
                    </span>
                  </div>
                  <p className="text-slate-700 mb-3">{insight.message}</p>
                  {insight.potentialSavings && (
                    <p className="text-emerald-600 font-semibold mb-2">
                      Potential Savings: ${insight.potentialSavings.toLocaleString()}
                    </p>
                  )}
                  <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
                    ACTION: {insight.recommendedAction}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Executive Commands */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-200/50 p-10">
            <div className="flex items-center mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl flex items-center justify-center shadow-lg mr-4">
                <span className="text-white font-bold text-xl">⚡</span>
              </div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">EXECUTIVE COMMANDS</h3>
            </div>
            <div className="space-y-6">
              <button className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-8 py-4 rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 font-bold text-lg">
                GENERATE PROFIT INTELLIGENCE
              </button>
              <button className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-8 py-4 rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 font-bold text-lg">
                ANALYZE EXPENSE PATTERNS
              </button>
              <button className="w-full bg-gradient-to-r from-purple-500 to-violet-600 text-white px-8 py-4 rounded-xl hover:from-purple-600 hover:to-violet-700 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 font-bold text-lg">
                REVENUE OPTIMIZATION
              </button>
              <button className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white px-8 py-4 rounded-xl hover:from-amber-600 hover:to-orange-700 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 font-bold text-lg">
                SET PROFIT TARGETS
              </button>
            </div>
            
            {/* Additional Executive Metrics */}
            <div className="mt-10 pt-8 border-t border-slate-200">
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-slate-900">${metrics.avgTransactionValue.toLocaleString()}</p>
                  <p className="text-sm text-slate-600 font-semibold uppercase tracking-wide">Avg Transaction</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-slate-900">{metrics.customersCount}</p>
                  <p className="text-sm text-slate-600 font-semibold uppercase tracking-wide">Active Clients</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Executive Performance Summary */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 rounded-3xl p-12 shadow-2xl">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-3xl flex items-center justify-center shadow-xl">
                <span className="text-white font-bold text-3xl">↗</span>
              </div>
            </div>
            <div className="ml-8 flex-1">
              <h3 className="text-3xl font-bold text-white mb-6">
                EXCEPTIONAL EXECUTIVE PERFORMANCE
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white/10 rounded-2xl p-6 backdrop-blur-sm hover:bg-white/20 transition-all duration-300">
                  <div className="text-white font-bold text-lg mb-2">PROFIT MARGIN</div>
                  <div className="text-emerald-400 text-3xl font-bold mb-1">{metrics.profitMargin}%</div>
                  <div className="text-slate-300">Executive Tier</div>
                </div>
                <div className="bg-white/10 rounded-2xl p-6 backdrop-blur-sm hover:bg-white/20 transition-all duration-300">
                  <div className="text-white font-bold text-lg mb-2">REVENUE GROWTH</div>
                  <div className="text-emerald-400 text-3xl font-bold mb-1">+{metrics.revenueGrowth}%</div>
                  <div className="text-slate-300">Strong Trajectory</div>
                </div>
                <div className="bg-white/10 rounded-2xl p-6 backdrop-blur-sm hover:bg-white/20 transition-all duration-300">
                  <div className="text-white font-bold text-lg mb-2">HEALTH SCORE</div>
                  <div className="text-emerald-400 text-3xl font-bold mb-1">{metrics.healthScore}%</div>
                  <div className="text-slate-300">Exceptional</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}