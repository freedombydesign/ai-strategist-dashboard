'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { businessMetricsService, type BusinessSnapshot } from '../services/businessMetricsService'
import { TrendingUp, TrendingDown, DollarSign, Plus, BarChart3 } from 'lucide-react'
import Link from 'next/link'

interface BusinessMetricsWidgetProps {
  className?: string
}

export default function BusinessMetricsWidget({ className = '' }: BusinessMetricsWidgetProps) {
  const { user } = useAuth()
  const [latestSnapshot, setLatestSnapshot] = useState<BusinessSnapshot | null>(null)
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.id) {
      loadBusinessData()
    }
  }, [user?.id])

  const loadBusinessData = async () => {
    try {
      setLoading(true)
      
      const [snapshots, analyticsData] = await Promise.all([
        businessMetricsService.getRecentSnapshots(user!.id, 1),
        businessMetricsService.getBusinessAnalytics(user!.id)
      ])

      setLatestSnapshot(snapshots[0] || null)
      setAnalytics(analyticsData)
      
    } catch (error) {
      console.error('[BUSINESS-WIDGET] Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!latestSnapshot) {
    // No data yet - show setup prompt
    return (
      <div className={`bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg shadow-sm border border-green-200 p-6 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <DollarSign className="text-green-600 mr-3" size={24} />
            <div>
              <h3 className="text-lg font-semibold text-green-900">Track Business Metrics</h3>
              <p className="text-sm text-green-700">Monitor your revenue, expenses, and profit trends</p>
            </div>
          </div>
          <Link
            href="/business-metrics"
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium flex items-center transition-colors"
          >
            <Plus size={16} className="mr-2" />
            Add Data
          </Link>
        </div>
      </div>
    )
  }

  const profit = latestSnapshot.monthly_revenue - latestSnapshot.monthly_expenses
  const isPositive = profit > 0

  return (
    <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Business Health</h3>
        <Link
          href="/business-metrics"
          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          View Details →
        </Link>
      </div>

      {/* Current Month Summary */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            ${latestSnapshot.monthly_revenue.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500">Revenue</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">
            ${latestSnapshot.monthly_expenses.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500">Expenses</div>
        </div>
      </div>

      {/* Net Profit */}
      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Net Profit</span>
          <div className="text-right">
            <div className={`text-xl font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              ${profit.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">
              {latestSnapshot.profit_margin.toFixed(1)}% margin
            </div>
          </div>
        </div>
      </div>

      {/* Trend Indicator */}
      {analytics && analytics.recentTrend !== 'neutral' && (
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg mb-4">
          <div className="flex items-center">
            {analytics.recentTrend === 'up' ? (
              <TrendingUp className="text-green-600 mr-2" size={16} />
            ) : (
              <TrendingDown className="text-red-600 mr-2" size={16} />
            )}
            <span className="text-sm text-gray-700">
              {analytics.recentTrend === 'up' ? 'Up' : 'Down'} {analytics.recentTrendPercentage.toFixed(1)}%
            </span>
          </div>
          <span className="text-xs text-gray-500">vs last month</span>
        </div>
      )}

      {/* Mini Trend Visualization */}
      {analytics && analytics.profitTrend && analytics.profitTrend.length > 1 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">6-Month Profit Trend</span>
            <BarChart3 className="text-gray-400" size={16} />
          </div>
          <div className="flex items-end space-x-1 h-12">
            {analytics.profitTrend.map((profit: number, index: number) => {
              const maxProfit = Math.max(...analytics.profitTrend)
              const minProfit = Math.min(...analytics.profitTrend)
              const range = maxProfit - minProfit || 1
              const height = Math.max(((profit - minProfit) / range) * 100, 10)
              
              return (
                <div
                  key={index}
                  className={`flex-1 rounded-t ${
                    profit > 0 ? 'bg-green-300' : 'bg-red-300'
                  }`}
                  style={{ height: `${height}%` }}
                  title={`$${profit.toLocaleString()}`}
                />
              )
            })}
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>6mo ago</span>
            <span>Current</span>
          </div>
        </div>
      )}

      {/* Action Button */}
      <div className="pt-4 border-t border-gray-200">
        <Link
          href="/business-metrics"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white text-center py-2 px-4 rounded-lg font-medium inline-block transition-colors"
        >
          Update This Month's Numbers
        </Link>
      </div>
    </div>
  )
}