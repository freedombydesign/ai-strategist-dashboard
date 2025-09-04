import { supabase } from '../lib/supabase'

export interface BusinessSnapshot {
  id: string
  user_id: string
  snapshot_date: string
  monthly_revenue: number
  monthly_expenses: number
  profit_margin: number
  notes: string
  created_at: string
  updated_at: string
}

class BusinessMetricsService {

  async saveSnapshot(snapshotData: Omit<BusinessSnapshot, 'id' | 'created_at' | 'updated_at'>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('business_snapshots')
        .upsert(snapshotData, { 
          onConflict: 'user_id,snapshot_date' 
        })

      if (error) throw error

      console.log('[BUSINESS-METRICS] Snapshot saved:', snapshotData)
      return true
    } catch (error) {
      console.error('[BUSINESS-METRICS] Error saving snapshot:', error)
      return false
    }
  }

  async getRecentSnapshots(userId: string, limit: number = 6): Promise<BusinessSnapshot[]> {
    try {
      const { data, error } = await supabase
        .from('business_snapshots')
        .select('*')
        .eq('user_id', userId)
        .order('snapshot_date', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('[BUSINESS-METRICS] Error fetching snapshots:', error)
      return []
    }
  }

  async getSnapshotForMonth(userId: string, year: number, month: number): Promise<BusinessSnapshot | null> {
    try {
      const date = `${year}-${month.toString().padStart(2, '0')}-01`
      
      const { data, error } = await supabase
        .from('business_snapshots')
        .select('*')
        .eq('user_id', userId)
        .gte('snapshot_date', date)
        .lt('snapshot_date', new Date(year, month, 1).toISOString().split('T')[0])
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return data
    } catch (error) {
      console.error('[BUSINESS-METRICS] Error fetching monthly snapshot:', error)
      return null
    }
  }

  calculateProfitMargin(revenue: number, expenses: number): number {
    if (revenue <= 0) return 0
    return ((revenue - expenses) / revenue) * 100
  }

  calculateGrowthRate(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0
    return ((current - previous) / Math.abs(previous)) * 100
  }

  async getBusinessAnalytics(userId: string): Promise<{
    totalSnapshots: number
    averageRevenue: number
    averageExpenses: number
    averageProfit: number
    averageMargin: number
    recentTrend: 'up' | 'down' | 'neutral'
    recentTrendPercentage: number
    profitTrend: number[]
  }> {
    try {
      const snapshots = await this.getRecentSnapshots(userId, 12) // Last 12 months
      
      if (snapshots.length === 0) {
        return {
          totalSnapshots: 0,
          averageRevenue: 0,
          averageExpenses: 0,
          averageProfit: 0,
          averageMargin: 0,
          recentTrend: 'neutral',
          recentTrendPercentage: 0,
          profitTrend: []
        }
      }

      const totalSnapshots = snapshots.length
      const averageRevenue = snapshots.reduce((sum, s) => sum + s.monthly_revenue, 0) / totalSnapshots
      const averageExpenses = snapshots.reduce((sum, s) => sum + s.monthly_expenses, 0) / totalSnapshots
      const averageProfit = averageRevenue - averageExpenses
      const averageMargin = snapshots.reduce((sum, s) => sum + s.profit_margin, 0) / totalSnapshots

      // Calculate trend
      let recentTrend: 'up' | 'down' | 'neutral' = 'neutral'
      let recentTrendPercentage = 0
      
      if (snapshots.length >= 2) {
        const latest = snapshots[0]
        const previous = snapshots[1]
        const latestProfit = latest.monthly_revenue - latest.monthly_expenses
        const previousProfit = previous.monthly_revenue - previous.monthly_expenses
        
        if (previousProfit !== 0) {
          const change = ((latestProfit - previousProfit) / Math.abs(previousProfit)) * 100
          recentTrendPercentage = Math.abs(change)
          recentTrend = change > 0 ? 'up' : change < 0 ? 'down' : 'neutral'
        }
      }

      // Profit trend for visualization (last 6 months)
      const profitTrend = snapshots
        .slice(0, 6)
        .reverse()
        .map(s => s.monthly_revenue - s.monthly_expenses)

      return {
        totalSnapshots,
        averageRevenue: Math.round(averageRevenue),
        averageExpenses: Math.round(averageExpenses),
        averageProfit: Math.round(averageProfit),
        averageMargin: Math.round(averageMargin * 100) / 100,
        recentTrend,
        recentTrendPercentage: Math.round(recentTrendPercentage * 100) / 100,
        profitTrend
      }
    } catch (error) {
      console.error('[BUSINESS-METRICS] Error calculating analytics:', error)
      return {
        totalSnapshots: 0,
        averageRevenue: 0,
        averageExpenses: 0,
        averageProfit: 0,
        averageMargin: 0,
        recentTrend: 'neutral',
        recentTrendPercentage: 0,
        profitTrend: []
      }
    }
  }
}

export const businessMetricsService = new BusinessMetricsService()