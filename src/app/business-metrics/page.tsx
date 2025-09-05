'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import { businessMetricsService } from '../../services/businessMetricsService'
import ProtectedRoute from '@/components/ProtectedRoute'
import { PremiumHeader } from '@/components/PremiumHeader'
import { PremiumBusinessMetrics } from '@/components/PremiumBusinessMetrics'
import { MobileNavigation, FloatingActionButton } from '@/components/MobileNavigation'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ArrowLeftIcon, CurrencyDollarIcon, CalendarIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface BusinessSnapshot {
  id: string
  user_id: string
  snapshot_date: string
  monthly_revenue: number
  monthly_expenses: number
  profit_margin: number
  notes: string
}

export default function BusinessMetricsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [recentSnapshots, setRecentSnapshots] = useState<BusinessSnapshot[]>([])
  const [formData, setFormData] = useState({
    monthly_revenue: '',
    monthly_expenses: '',
    active_clients: '',
    avg_project_value: '',
    avg_delivery_days: '',
    notes: ''
  })

  useEffect(() => {
    if (user?.id) {
      loadRecentSnapshots()
    }
  }, [user?.id])

  const loadRecentSnapshots = async () => {
    try {
      const snapshots = await businessMetricsService.getRecentSnapshots(user!.id, 6)
      setRecentSnapshots(snapshots)
    } catch (error) {
      console.error('[BUSINESS-METRICS] Error loading snapshots:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id) return

    const revenue = parseFloat(formData.monthly_revenue) || 0
    const expenses = parseFloat(formData.monthly_expenses) || 0

    if (revenue < 0 || expenses < 0) {
      alert('Revenue and expenses must be positive numbers')
      return
    }

    setLoading(true)

    try {
      const success = await businessMetricsService.saveSnapshot({
        user_id: user.id,
        snapshot_date: new Date().toISOString().split('T')[0],
        monthly_revenue: revenue,
        monthly_expenses: expenses,
        profit_margin: revenue > 0 ? ((revenue - expenses) / revenue) * 100 : 0,
        notes: formData.notes
      })

      if (success) {
        // Reset form
        setFormData({
          monthly_revenue: '',
          monthly_expenses: '',
          active_clients: '',
          avg_project_value: '',
          avg_delivery_days: '',
          notes: ''
        })
        
        // Reload snapshots
        await loadRecentSnapshots()
        
        // Show success and redirect
        alert('Business metrics saved successfully!')
        router.push('/?metrics=updated')
      } else {
        alert('Failed to save business metrics. Please try again.')
      }
    } catch (error) {
      console.error('[BUSINESS-METRICS] Error saving:', error)
      alert('Error saving business metrics. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const calculateTrend = () => {
    if (recentSnapshots.length < 2) return { direction: 'neutral', percentage: 0 }
    
    const latest = recentSnapshots[0]
    const previous = recentSnapshots[1]
    const latestProfit = latest.monthly_revenue - latest.monthly_expenses
    const previousProfit = previous.monthly_revenue - previous.monthly_expenses
    
    if (previousProfit === 0) return { direction: 'neutral', percentage: 0 }
    
    const change = ((latestProfit - previousProfit) / Math.abs(previousProfit)) * 100
    return {
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
      percentage: Math.abs(change)
    }
  }

  const trend = calculateTrend()
  const latestSnapshot = recentSnapshots[0]
  const latestProfit = latestSnapshot ? latestSnapshot.monthly_revenue - latestSnapshot.monthly_expenses : 0

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background transition-colors duration-300">
        {/* Premium Header */}
        <PremiumHeader />
        
        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-6 py-8">
          {/* Page Header */}
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-4 mb-6">
              <Button variant="ghost" size="sm" className="text-medium-gray hover:text-foreground">
                <Link href="/dashboard" className="flex items-center gap-2">
                  <ArrowLeftIcon className="w-4 h-4" />
                  Back to Dashboard
                </Link>
              </Button>
            </div>
            <h1 className="text-display text-3xl font-bold text-foreground mb-3">
              Business Analytics & Metrics
            </h1>
            <p className="text-body text-lg text-medium-gray">
              Comprehensive insights into your business performance with elegant visualizations
            </p>
          </motion.div>

          {/* Premium Business Metrics Dashboard */}
          <PremiumBusinessMetrics />

          {/* Data Input Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="mt-12"
          >
            <Card variant="elevated" className="max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-rich-gold to-rose-gold flex items-center justify-center">
                    <CurrencyDollarIcon className="w-5 h-5 text-white" />
                  </div>
                  Update This Month's Data
                </CardTitle>
                <CardDescription>
                  Track your monthly revenue and expenses to maintain accurate business insights
                </CardDescription>
              </CardHeader>
              <CardContent>
            
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-body font-medium text-foreground mb-3">
                      Monthly Revenue ($)
                    </label>
                    <div className="relative">
                      <CurrencyDollarIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-medium-gray w-5 h-5" />
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.monthly_revenue}
                        onChange={(e) => setFormData(prev => ({ ...prev, monthly_revenue: e.target.value }))}
                        className="w-full pl-12 pr-4 py-4 bg-surface border border-black/10 rounded-xl focus:ring-2 focus:ring-rich-gold focus:border-rich-gold transition-all font-medium text-foreground placeholder-medium-gray"
                        placeholder="25,000.00"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-body font-medium text-foreground mb-3">
                      Monthly Expenses ($)
                    </label>
                    <div className="relative">
                      <CurrencyDollarIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-medium-gray w-5 h-5" />
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.monthly_expenses}
                        onChange={(e) => setFormData(prev => ({ ...prev, monthly_expenses: e.target.value }))}
                        className="w-full pl-12 pr-4 py-4 bg-surface border border-black/10 rounded-xl focus:ring-2 focus:ring-rich-gold focus:border-rich-gold transition-all font-medium text-foreground placeholder-medium-gray"
                        placeholder="15,000.00"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-body font-medium text-foreground mb-3">
                      Notes (Optional)
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      rows={4}
                      className="w-full px-4 py-4 bg-surface border border-black/10 rounded-xl focus:ring-2 focus:ring-rich-gold focus:border-rich-gold transition-all resize-none font-medium text-foreground placeholder-medium-gray"
                      placeholder="Any important context about this month's numbers..."
                    />
                  </div>

                  {/* Premium Profit Preview */}
                  {formData.monthly_revenue && formData.monthly_expenses && (
                    <motion.div 
                      className="bg-gradient-to-r from-rich-gold/5 to-rose-gold/5 border border-rich-gold/20 p-6 rounded-xl"
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-body font-semibold text-foreground">Profit Preview:</span>
                        <span className={`text-display text-xl font-bold ${
                          parseFloat(formData.monthly_revenue) - parseFloat(formData.monthly_expenses) > 0 
                            ? 'text-success' 
                            : 'text-error'
                        }`}>
                          ${(parseFloat(formData.monthly_revenue) - parseFloat(formData.monthly_expenses)).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-sm text-medium-gray">
                        Profit Margin: <span className="font-semibold text-rich-gold">
                          {parseFloat(formData.monthly_revenue) > 0 ? 
                            (((parseFloat(formData.monthly_revenue) - parseFloat(formData.monthly_expenses)) / parseFloat(formData.monthly_revenue)) * 100).toFixed(1)
                            : '0'}%
                        </span>
                      </div>
                    </motion.div>
                  )}

                  <Button
                    type="submit"
                    variant="primary"
                    loading={loading}
                    className="w-full btn-gradient-gold py-4 text-base font-semibold"
                  >
                    {loading ? 'Saving Data...' : 'Update Business Metrics'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>

        
        {/* Mobile Navigation */}
        <MobileNavigation />
        <FloatingActionButton />
        </main>
      </div>
    </ProtectedRoute>
  )
}