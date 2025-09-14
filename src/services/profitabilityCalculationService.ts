// ProfitPulse - Profitability Calculation Service with CAC Integration
// Calculates true profitability including Customer Acquisition Costs

import { supabase } from '@/lib/supabase'

// Core profitability interfaces
interface ProfitabilityMetrics {
  revenue: number
  deliveryCosts: number
  allocatedCAC: number
  profit: number
  trueProfit: number // Including CAC
  profitMargin: number
  trueProfitMargin: number
  profitPerHour: number
  trueProfitPerHour: number
  hoursWorked: number
}

interface ClientProfitabilityData {
  clientId: string
  clientName: string
  metrics: ProfitabilityMetrics
  healthScore: number
  profitabilityStatus: 'excellent' | 'healthy' | 'warning' | 'critical' | 'unprofitable'
  cacHealthScore: 'excellent' | 'good' | 'acceptable' | 'poor' | 'critical'
  ltvCacRatio: number
  paybackMonths: number
  trendDirection: 'improving' | 'stable' | 'declining'
  alerts: ProfitabilityAlert[]
}

interface ProfitabilityAlert {
  id: string
  type: 'cac_warning' | 'ltv_risk' | 'margin_decline' | 'efficiency_drop'
  severity: 'critical' | 'warning' | 'info'
  title: string
  description: string
  recommendations: string[]
  impact: number
}

interface ChannelPerformance {
  channelId: string
  channelName: string
  totalSpend: number
  clientsAcquired: number
  averageCAC: number
  totalRevenue: number
  averageLTV: number
  cacLtvRatio: number
  roi: number
  healthScore: 'excellent' | 'good' | 'acceptable' | 'poor' | 'critical'
  paybackPeriod: number
  conversionRate: number
}

export class ProfitabilityCalculationService {
  
  // Calculate comprehensive client profitability including CAC
  async calculateClientProfitability(userId: string, clientId: string, options?: {
    startDate?: string
    endDate?: string
    includeForecasting?: boolean
  }): Promise<ClientProfitabilityData> {
    const { startDate, endDate } = options || {}
    
    try {
      // Get client data with CAC information
      const { data: client, error: clientError } = await supabase
        .from('profit_clients')
        .select(`
          *,
          client_acquisition (
            acquisition_cost,
            acquisition_date,
            ltv_estimate,
            acquisition_channel_id
          )
        `)
        .eq('user_id', userId)
        .eq('id', clientId)
        .single()
      
      if (clientError) throw clientError
      
      // Calculate revenue from all projects
      const revenue = await this.calculateClientRevenue(userId, clientId, startDate, endDate)
      
      // Calculate delivery costs (team time + overhead)
      const deliveryCosts = await this.calculateClientDeliveryCosts(userId, clientId, startDate, endDate)
      
      // Get allocated CAC
      const allocatedCAC = client.client_acquisition?.[0]?.acquisition_cost || 0
      
      // Calculate hours worked
      const hoursWorked = await this.calculateClientHours(userId, clientId, startDate, endDate)
      
      // Calculate metrics
      const profit = revenue - deliveryCosts
      const trueProfit = profit - allocatedCAC
      const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0
      const trueProfitMargin = revenue > 0 ? (trueProfit / revenue) * 100 : 0
      const profitPerHour = hoursWorked > 0 ? profit / hoursWorked : 0
      const trueProfitPerHour = hoursWorked > 0 ? trueProfit / hoursWorked : 0
      
      // Calculate LTV:CAC ratio and health scores
      const ltvCacRatio = allocatedCAC > 0 ? client.lifetime_value / allocatedCAC : 0
      const cacHealthScore = this.calculateCACHealthScore(client.lifetime_value, allocatedCAC)
      const profitabilityStatus = this.calculateProfitabilityStatus(trueProfitMargin)
      
      // Calculate payback period in months
      const monthlyProfit = trueProfitPerHour > 0 ? trueProfitPerHour * (hoursWorked / 12) : 0
      const paybackMonths = monthlyProfit > 0 ? allocatedCAC / monthlyProfit : 0
      
      // Calculate trend direction
      const trendDirection = await this.calculateTrendDirection(userId, clientId)
      
      // Generate alerts
      const alerts = await this.generateProfitabilityAlerts(userId, clientId, {
        trueProfitMargin,
        ltvCacRatio,
        trendDirection,
        profitPerHour: trueProfitPerHour
      })
      
      const metrics: ProfitabilityMetrics = {
        revenue,
        deliveryCosts,
        allocatedCAC,
        profit,
        trueProfit,
        profitMargin,
        trueProfitMargin,
        profitPerHour,
        trueProfitPerHour,
        hoursWorked
      }
      
      return {
        clientId,
        clientName: client.name,
        metrics,
        healthScore: client.health_score || 0,
        profitabilityStatus,
        cacHealthScore,
        ltvCacRatio,
        paybackMonths,
        trendDirection,
        alerts
      }
      
    } catch (error) {
      console.error('Error calculating client profitability:', error)
      throw error
    }
  }
  
  // Calculate revenue for a specific client
  private async calculateClientRevenue(userId: string, clientId: string, startDate?: string, endDate?: string): Promise<number> {
    let query = supabase
      .from('time_entries')
      .select('revenue')
      .eq('user_id', userId)
      .eq('project_id', 
        supabase.from('profit_projects')
          .select('id')
          .eq('client_id', clientId)
      )
    
    if (startDate) query = query.gte('date', startDate)
    if (endDate) query = query.lte('date', endDate)
    
    const { data, error } = await query
    if (error) throw error
    
    return data?.reduce((sum, entry) => sum + (entry.revenue || 0), 0) || 0
  }
  
  // Calculate delivery costs including team costs and overhead
  private async calculateClientDeliveryCosts(userId: string, clientId: string, startDate?: string, endDate?: string): Promise<number> {
    let query = supabase
      .from('time_entries')
      .select('cost')
      .eq('user_id', userId)
      .eq('project_id', 
        supabase.from('profit_projects')
          .select('id')
          .eq('client_id', clientId)
      )
    
    if (startDate) query = query.gte('date', startDate)
    if (endDate) query = query.lte('date', endDate)
    
    const { data, error } = await query
    if (error) throw error
    
    return data?.reduce((sum, entry) => sum + (entry.cost || 0), 0) || 0
  }
  
  // Calculate total hours worked for client
  private async calculateClientHours(userId: string, clientId: string, startDate?: string, endDate?: string): Promise<number> {
    let query = supabase
      .from('time_entries')
      .select('hours')
      .eq('user_id', userId)
      .eq('project_id', 
        supabase.from('profit_projects')
          .select('id')
          .eq('client_id', clientId)
      )
    
    if (startDate) query = query.gte('date', startDate)
    if (endDate) query = query.lte('date', endDate)
    
    const { data, error } = await query
    if (error) throw error
    
    return data?.reduce((sum, entry) => sum + entry.hours, 0) || 0
  }
  
  // Calculate CAC health score based on LTV:CAC ratio
  private calculateCACHealthScore(ltv: number, cac: number): 'excellent' | 'good' | 'acceptable' | 'poor' | 'critical' {
    if (cac === 0) return 'excellent'
    const ratio = ltv / cac
    
    if (ratio >= 5) return 'excellent'
    if (ratio >= 3) return 'good'
    if (ratio >= 2) return 'acceptable'
    if (ratio >= 1) return 'poor'
    return 'critical'
  }
  
  // Calculate overall profitability status
  private calculateProfitabilityStatus(trueProfitMargin: number): 'excellent' | 'healthy' | 'warning' | 'critical' | 'unprofitable' {
    if (trueProfitMargin >= 50) return 'excellent'
    if (trueProfitMargin >= 30) return 'healthy'
    if (trueProfitMargin >= 15) return 'warning'
    if (trueProfitMargin >= 0) return 'critical'
    return 'unprofitable'
  }
  
  // Calculate trend direction based on historical data
  private async calculateTrendDirection(userId: string, clientId: string): Promise<'improving' | 'stable' | 'declining'> {
    const { data, error } = await supabase
      .from('profitability_snapshots')
      .select('true_profit_margin, snapshot_date')
      .eq('user_id', userId)
      .eq('client_id', clientId)
      .order('snapshot_date', { ascending: false })
      .limit(6) // Last 6 periods
    
    if (error || !data || data.length < 3) return 'stable'
    
    // Calculate trend using simple linear regression
    const margins = data.map(d => d.true_profit_margin).reverse()
    const trend = this.calculateTrend(margins)
    
    if (trend > 2) return 'improving'
    if (trend < -2) return 'declining'
    return 'stable'
  }
  
  // Simple trend calculation
  private calculateTrend(values: number[]): number {
    const n = values.length
    const sum = values.reduce((a, b) => a + b, 0)
    const sumOfProducts = values.reduce((acc, val, i) => acc + val * i, 0)
    const sumOfSquares = values.reduce((acc, _, i) => acc + i * i, 0)
    const sumOfIndices = values.reduce((acc, _, i) => acc + i, 0)
    
    return (n * sumOfProducts - sum * sumOfIndices) / (n * sumOfSquares - sumOfIndices * sumOfIndices)
  }
  
  // Generate profitability alerts
  private async generateProfitabilityAlerts(userId: string, clientId: string, metrics: {
    trueProfitMargin: number
    ltvCacRatio: number
    trendDirection: 'improving' | 'stable' | 'declining'
    profitPerHour: number
  }): Promise<ProfitabilityAlert[]> {
    const alerts: ProfitabilityAlert[] = []
    const { trueProfitMargin, ltvCacRatio, trendDirection, profitPerHour } = metrics
    
    // CAC Warning Alert
    if (ltvCacRatio < 2) {
      alerts.push({
        id: `cac_warning_${clientId}`,
        type: 'cac_warning',
        severity: ltvCacRatio < 1 ? 'critical' : 'warning',
        title: 'CAC Exceeds LTV',
        description: `Client LTV:CAC ratio is ${ltvCacRatio.toFixed(2)}x, below healthy threshold of 3x`,
        recommendations: [
          'Consider raising rates to improve LTV',
          'Evaluate client acquisition channel efficiency',
          'Implement value-based pricing strategy',
          'Review client onboarding process to reduce churn'
        ],
        impact: 85
      })
    }
    
    // Margin Decline Alert
    if (trendDirection === 'declining' && trueProfitMargin < 30) {
      alerts.push({
        id: `margin_decline_${clientId}`,
        type: 'margin_decline',
        severity: trueProfitMargin < 15 ? 'critical' : 'warning',
        title: 'Declining Profit Margins',
        description: `True profit margin is ${trueProfitMargin.toFixed(1)}% and declining`,
        recommendations: [
          'Audit project scope for scope creep',
          'Implement time tracking improvements',
          'Consider rate increase discussion',
          'Review team efficiency on this client'
        ],
        impact: 75
      })
    }
    
    // Efficiency Drop Alert
    if (profitPerHour < 50) {
      alerts.push({
        id: `efficiency_drop_${clientId}`,
        type: 'efficiency_drop',
        severity: profitPerHour < 25 ? 'critical' : 'warning',
        title: 'Low Profit Per Hour',
        description: `Current profit per hour is $${profitPerHour.toFixed(0)}, below target threshold`,
        recommendations: [
          'Review task complexity and delegation',
          'Implement productivity optimization tools',
          'Consider specialization or process improvements',
          'Evaluate if client work matches team expertise'
        ],
        impact: 60
      })
    }
    
    return alerts
  }
  
  // Get all clients ranked by true profitability
  async getClientProfitabilityRanking(userId: string, options?: {
    limit?: number
    sortBy?: 'true_profit' | 'true_margin' | 'ltv_cac_ratio' | 'profit_per_hour'
    includeAlerts?: boolean
  }): Promise<ClientProfitabilityData[]> {
    const { limit = 50, sortBy = 'true_profit', includeAlerts = true } = options || {}
    
    try {
      const { data: clients, error } = await supabase
        .from('profit_clients')
        .select(`
          *,
          client_acquisition (
            acquisition_cost,
            acquisition_date,
            ltv_estimate
          )
        `)
        .eq('user_id', userId)
        .eq('active', true)
        .limit(limit)
      
      if (error) throw error
      
      const profitabilityData: ClientProfitabilityData[] = []
      
      for (const client of clients || []) {
        const clientData = await this.calculateClientProfitability(userId, client.id, {
          includeForecasting: false
        })
        profitabilityData.push(clientData)
      }
      
      // Sort based on requested criteria
      profitabilityData.sort((a, b) => {
        switch (sortBy) {
          case 'true_margin':
            return b.metrics.trueProfitMargin - a.metrics.trueProfitMargin
          case 'ltv_cac_ratio':
            return b.ltvCacRatio - a.ltvCacRatio
          case 'profit_per_hour':
            return b.metrics.trueProfitPerHour - a.metrics.trueProfitPerHour
          default:
            return b.metrics.trueProfit - a.metrics.trueProfit
        }
      })
      
      return profitabilityData
      
    } catch (error) {
      console.error('Error getting client profitability ranking:', error)
      throw error
    }
  }
  
  // Analyze channel performance and CAC efficiency
  async analyzeChannelPerformance(userId: string, options?: {
    startDate?: string
    endDate?: string
    includeForecasting?: boolean
  }): Promise<ChannelPerformance[]> {
    const { startDate, endDate } = options || {}
    
    try {
      // Get all acquisition channels
      const { data: channels, error: channelsError } = await supabase
        .from('acquisition_channels')
        .select('*')
        .eq('user_id', userId)
        .eq('active', true)
      
      if (channelsError) throw channelsError
      
      const channelPerformance: ChannelPerformance[] = []
      
      for (const channel of channels || []) {
        // Calculate channel metrics
        const totalSpend = await this.calculateChannelSpend(userId, channel.id, startDate, endDate)
        const clientsAcquired = await this.getChannelClientCount(userId, channel.id, startDate, endDate)
        const averageCAC = clientsAcquired > 0 ? totalSpend / clientsAcquired : 0
        const { totalRevenue, averageLTV } = await this.getChannelRevenue(userId, channel.id, startDate, endDate)
        const cacLtvRatio = averageCAC > 0 ? averageLTV / averageCAC : 0
        const roi = totalSpend > 0 ? ((totalRevenue - totalSpend) / totalSpend) * 100 : 0
        
        channelPerformance.push({
          channelId: channel.id,
          channelName: channel.name,
          totalSpend,
          clientsAcquired,
          averageCAC,
          totalRevenue,
          averageLTV,
          cacLtvRatio,
          roi,
          healthScore: this.calculateCACHealthScore(averageLTV, averageCAC),
          paybackPeriod: this.calculatePaybackPeriod(averageLTV, averageCAC),
          conversionRate: 0 // Would need additional data from marketing platforms
        })
      }
      
      // Sort by ROI
      channelPerformance.sort((a, b) => b.roi - a.roi)
      
      return channelPerformance
      
    } catch (error) {
      console.error('Error analyzing channel performance:', error)
      throw error
    }
  }
  
  // Calculate total spend for a channel
  private async calculateChannelSpend(userId: string, channelId: string, startDate?: string, endDate?: string): Promise<number> {
    let query = supabase
      .from('marketing_costs')
      .select('amount')
      .eq('user_id', userId)
      .eq('channel_id', channelId)
    
    if (startDate) query = query.gte('spend_date', startDate)
    if (endDate) query = query.lte('spend_date', endDate)
    
    const { data, error } = await query
    if (error) throw error
    
    return data?.reduce((sum, cost) => sum + cost.amount, 0) || 0
  }
  
  // Get number of clients acquired through channel
  private async getChannelClientCount(userId: string, channelId: string, startDate?: string, endDate?: string): Promise<number> {
    let query = supabase
      .from('client_acquisition')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .eq('acquisition_channel_id', channelId)
    
    if (startDate) query = query.gte('acquisition_date', startDate)
    if (endDate) query = query.lte('acquisition_date', endDate)
    
    const { count, error } = await query
    if (error) throw error
    
    return count || 0
  }
  
  // Get revenue and LTV for clients from specific channel
  private async getChannelRevenue(userId: string, channelId: string, startDate?: string, endDate?: string): Promise<{ totalRevenue: number, averageLTV: number }> {
    let query = supabase
      .from('client_acquisition')
      .select(`
        ltv_actual,
        profit_clients!inner (
          lifetime_value
        )
      `)
      .eq('user_id', userId)
      .eq('acquisition_channel_id', channelId)
    
    if (startDate) query = query.gte('acquisition_date', startDate)
    if (endDate) query = query.lte('acquisition_date', endDate)
    
    const { data, error } = await query
    if (error) throw error
    
    if (!data || data.length === 0) {
      return { totalRevenue: 0, averageLTV: 0 }
    }
    
    const totalRevenue = data.reduce((sum, client) => 
      sum + (client.profit_clients?.lifetime_value || 0), 0)
    const averageLTV = totalRevenue / data.length
    
    return { totalRevenue, averageLTV }
  }
  
  // Calculate payback period in months
  private calculatePaybackPeriod(ltv: number, cac: number): number {
    if (cac === 0) return 0
    // Assuming 12-month average client lifetime for service businesses
    const monthlyRevenue = ltv / 12
    return cac / monthlyRevenue
  }
  
  // Update profitability snapshot for faster dashboard queries
  async updateProfitabilitySnapshot(userId: string, clientId: string, date: string): Promise<void> {
    try {
      const profitabilityData = await this.calculateClientProfitability(userId, clientId, {
        startDate: date,
        endDate: date
      })
      
      const { error } = await supabase
        .from('profitability_snapshots')
        .upsert({
          user_id: userId,
          client_id: clientId,
          snapshot_date: date,
          total_revenue: profitabilityData.metrics.revenue,
          total_costs: profitabilityData.metrics.deliveryCosts,
          allocated_cac: profitabilityData.metrics.allocatedCAC,
          total_profit: profitabilityData.metrics.profit,
          true_profit: profitabilityData.metrics.trueProfit,
          profit_margin: profitabilityData.metrics.profitMargin,
          true_profit_margin: profitabilityData.metrics.trueProfitMargin,
          hours_worked: profitabilityData.metrics.hoursWorked,
          profit_per_hour: profitabilityData.metrics.profitPerHour,
          true_profit_per_hour: profitabilityData.metrics.trueProfitPerHour,
          ltv_cac_ratio: profitabilityData.ltvCacRatio,
          payback_months: profitabilityData.paybackMonths
        })
      
      if (error) throw error
      
    } catch (error) {
      console.error('Error updating profitability snapshot:', error)
      throw error
    }
  }
}

export const profitabilityCalculationService = new ProfitabilityCalculationService()