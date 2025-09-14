// ProfitPulse - CAC Tracking & Channel Performance Service
// Advanced Customer Acquisition Cost analysis with multi-channel attribution

import { supabase } from '@/lib/supabase'

// CAC and Channel Performance interfaces
interface CACMetrics {
  totalMarketingSpend: number
  totalSalesSpend: number
  totalAcquisitionCost: number
  clientsAcquired: number
  averageCAC: number
  cacByChannel: ChannelCAC[]
  cacTrend: CACTrendData[]
  benchmarkComparison: CACBenchmark
}

interface ChannelCAC {
  channelId: string
  channelName: string
  channelType: string
  totalSpend: number
  clientsAcquired: number
  averageCAC: number
  efficiency: number // CAC efficiency score 0-100
  conversionRate: number
  costPerClick?: number
  costPerLead?: number
}

interface CACTrendData {
  period: string
  totalCAC: number
  averageCAC: number
  clientsAcquired: number
  efficiency: number
  topChannel: string
}

interface CACBenchmark {
  industry: string
  benchmarkCAC: number
  userCAC: number
  percentageVsBenchmark: number
  performanceRating: 'excellent' | 'good' | 'average' | 'below_average' | 'poor'
}

interface ChannelOptimization {
  channelId: string
  currentSpend: number
  recommendedSpend: number
  expectedCAC: number
  expectedClients: number
  roiImpact: number
  reasoning: string[]
}

interface CACAlert {
  id: string
  type: 'cac_increase' | 'channel_inefficient' | 'ltv_risk' | 'budget_overrun'
  severity: 'critical' | 'warning' | 'info'
  title: string
  description: string
  affectedChannel?: string
  currentValue: number
  targetValue: number
  recommendations: string[]
  estimatedImpact: number
}

export class CACTrackingService {
  
  // Calculate comprehensive CAC metrics for a user
  async calculateCACMetrics(userId: string, options?: {
    startDate?: string
    endDate?: string
    includeTrends?: boolean
    includeBenchmarks?: boolean
  }): Promise<CACMetrics> {
    const { startDate, endDate, includeTrends = true, includeBenchmarks = true } = options || {}
    
    try {
      // Calculate total marketing spend
      const totalMarketingSpend = await this.calculateTotalMarketingSpend(userId, startDate, endDate)
      
      // Calculate total sales spend
      const totalSalesSpend = await this.calculateTotalSalesSpend(userId, startDate, endDate)
      
      // Get total clients acquired
      const clientsAcquired = await this.getClientsAcquiredCount(userId, startDate, endDate)
      
      // Calculate overall metrics
      const totalAcquisitionCost = totalMarketingSpend + totalSalesSpend
      const averageCAC = clientsAcquired > 0 ? totalAcquisitionCost / clientsAcquired : 0
      
      // Get CAC by channel
      const cacByChannel = await this.calculateCACByChannel(userId, startDate, endDate)
      
      // Get trend data if requested
      let cacTrend: CACTrendData[] = []
      if (includeTrends) {
        cacTrend = await this.getCACTrendData(userId)
      }
      
      // Get benchmark comparison if requested
      let benchmarkComparison: CACBenchmark = {
        industry: 'Professional Services',
        benchmarkCAC: 0,
        userCAC: averageCAC,
        percentageVsBenchmark: 0,
        performanceRating: 'average'
      }
      if (includeBenchmarks) {
        benchmarkComparison = await this.getBenchmarkComparison(userId, averageCAC)
      }
      
      return {
        totalMarketingSpend,
        totalSalesSpend,
        totalAcquisitionCost,
        clientsAcquired,
        averageCAC,
        cacByChannel,
        cacTrend,
        benchmarkComparison
      }
      
    } catch (error) {
      console.error('Error calculating CAC metrics:', error)
      throw error
    }
  }
  
  // Calculate total marketing spend for period
  private async calculateTotalMarketingSpend(userId: string, startDate?: string, endDate?: string): Promise<number> {
    let query = supabase
      .from('marketing_costs')
      .select('amount')
      .eq('user_id', userId)
    
    if (startDate) query = query.gte('spend_date', startDate)
    if (endDate) query = query.lte('spend_date', endDate)
    
    const { data, error } = await query
    if (error) throw error
    
    return data?.reduce((sum, cost) => sum + cost.amount, 0) || 0
  }
  
  // Calculate total sales spend for period
  private async calculateTotalSalesSpend(userId: string, startDate?: string, endDate?: string): Promise<number> {
    let query = supabase
      .from('sales_costs')
      .select('amount')
      .eq('user_id', userId)
    
    if (startDate) query = query.gte('cost_date', startDate)
    if (endDate) query = query.lte('cost_date', endDate)
    
    const { data, error } = await query
    if (error) throw error
    
    return data?.reduce((sum, cost) => sum + cost.amount, 0) || 0
  }
  
  // Get number of clients acquired in period
  private async getClientsAcquiredCount(userId: string, startDate?: string, endDate?: string): Promise<number> {
    let query = supabase
      .from('client_acquisition')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
    
    if (startDate) query = query.gte('acquisition_date', startDate)
    if (endDate) query = query.lte('acquisition_date', endDate)
    
    const { count, error } = await query
    if (error) throw error
    
    return count || 0
  }
  
  // Calculate CAC by channel with efficiency scoring
  private async calculateCACByChannel(userId: string, startDate?: string, endDate?: string): Promise<ChannelCAC[]> {
    // Get all channels
    const { data: channels, error: channelsError } = await supabase
      .from('acquisition_channels')
      .select('*')
      .eq('user_id', userId)
      .eq('active', true)
    
    if (channelsError) throw channelsError
    
    const channelCACs: ChannelCAC[] = []
    
    for (const channel of channels || []) {
      // Calculate spend for this channel
      let spendQuery = supabase
        .from('marketing_costs')
        .select('amount')
        .eq('user_id', userId)
        .eq('channel_id', channel.id)
      
      if (startDate) spendQuery = spendQuery.gte('spend_date', startDate)
      if (endDate) spendQuery = spendQuery.lte('spend_date', endDate)
      
      const { data: spendData, error: spendError } = await spendQuery
      if (spendError) throw spendError
      
      const totalSpend = spendData?.reduce((sum, cost) => sum + cost.amount, 0) || 0
      
      // Get clients acquired through this channel
      let acquisitionQuery = supabase
        .from('client_acquisition')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
        .eq('acquisition_channel_id', channel.id)
      
      if (startDate) acquisitionQuery = acquisitionQuery.gte('acquisition_date', startDate)
      if (endDate) acquisitionQuery = acquisitionQuery.lte('acquisition_date', endDate)
      
      const { count: clientsAcquired, error: acquisitionError } = await acquisitionQuery
      if (acquisitionError) throw acquisitionError
      
      const averageCAC = (clientsAcquired || 0) > 0 ? totalSpend / (clientsAcquired || 1) : 0
      const efficiency = this.calculateChannelEfficiency(averageCAC, channel.channel_type)
      
      channelCACs.push({
        channelId: channel.id,
        channelName: channel.name,
        channelType: channel.channel_type,
        totalSpend,
        clientsAcquired: clientsAcquired || 0,
        averageCAC,
        efficiency,
        conversionRate: 0 // Would need additional tracking data
      })
    }
    
    // Sort by efficiency (best first)
    channelCACs.sort((a, b) => b.efficiency - a.efficiency)
    
    return channelCACs
  }
  
  // Calculate channel efficiency score (0-100)
  private calculateChannelEfficiency(cac: number, channelType: string): number {
    // Industry benchmarks for different channel types (professional services)
    const benchmarks: Record<string, number> = {
      'referral': 500,
      'content': 800,
      'direct': 200,
      'linkedin': 1200,
      'google_ads': 1500,
      'facebook_ads': 1800,
      'other': 1000
    }
    
    const benchmark = benchmarks[channelType] || benchmarks.other
    
    if (cac === 0) return 100
    if (cac <= benchmark * 0.5) return 100
    if (cac <= benchmark * 0.7) return 85
    if (cac <= benchmark) return 70
    if (cac <= benchmark * 1.5) return 50
    if (cac <= benchmark * 2) return 25
    return 10
  }
  
  // Get CAC trend data over time
  private async getCACTrendData(userId: string): Promise<CACTrendData[]> {
    const trendData: CACTrendData[] = []
    const now = new Date()
    
    // Get last 12 months of data
    for (let i = 11; i >= 0; i--) {
      const periodStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const periodEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
      
      const periodMetrics = await this.calculateCACMetrics(userId, {
        startDate: periodStart.toISOString().split('T')[0],
        endDate: periodEnd.toISOString().split('T')[0],
        includeTrends: false,
        includeBenchmarks: false
      })
      
      const topChannel = periodMetrics.cacByChannel.length > 0 
        ? periodMetrics.cacByChannel[0].channelName 
        : 'None'
      
      trendData.push({
        period: periodStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        totalCAC: periodMetrics.totalAcquisitionCost,
        averageCAC: periodMetrics.averageCAC,
        clientsAcquired: periodMetrics.clientsAcquired,
        efficiency: periodMetrics.cacByChannel.length > 0 
          ? periodMetrics.cacByChannel[0].efficiency 
          : 0,
        topChannel
      })
    }
    
    return trendData
  }
  
  // Get benchmark comparison
  private async getBenchmarkComparison(userId: string, userCAC: number): Promise<CACBenchmark> {
    // Professional services industry benchmarks
    const benchmarkCAC = 1200 // Industry average for professional services
    
    const percentageVsBenchmark = benchmarkCAC > 0 
      ? ((userCAC - benchmarkCAC) / benchmarkCAC) * 100 
      : 0
    
    let performanceRating: CACBenchmark['performanceRating']
    if (percentageVsBenchmark <= -30) performanceRating = 'excellent'
    else if (percentageVsBenchmark <= -10) performanceRating = 'good'
    else if (percentageVsBenchmark <= 10) performanceRating = 'average'
    else if (percentageVsBenchmark <= 30) performanceRating = 'below_average'
    else performanceRating = 'poor'
    
    return {
      industry: 'Professional Services',
      benchmarkCAC,
      userCAC,
      percentageVsBenchmark,
      performanceRating
    }
  }
  
  // Generate CAC optimization recommendations
  async generateCACOptimizationRecommendations(userId: string): Promise<ChannelOptimization[]> {
    try {
      const metrics = await this.calculateCACMetrics(userId, {
        includeTrends: true,
        includeBenchmarks: true
      })
      
      const optimizations: ChannelOptimization[] = []
      
      for (const channel of metrics.cacByChannel) {
        let recommendedSpend = channel.totalSpend
        let reasoning: string[] = []
        
        // High efficiency channels - increase spend
        if (channel.efficiency >= 80 && channel.clientsAcquired > 0) {
          recommendedSpend = channel.totalSpend * 1.5
          reasoning.push(`High efficiency (${channel.efficiency}%) - scale up investment`)
          reasoning.push('Strong CAC performance indicates room for growth')
        }
        
        // Low efficiency channels - reduce spend
        else if (channel.efficiency <= 40 && channel.totalSpend > 0) {
          recommendedSpend = channel.totalSpend * 0.6
          reasoning.push(`Low efficiency (${channel.efficiency}%) - reduce investment`)
          reasoning.push('Poor CAC performance suggests optimization needed')
        }
        
        // No acquisitions but high spend - pause or optimize
        else if (channel.clientsAcquired === 0 && channel.totalSpend > 500) {
          recommendedSpend = channel.totalSpend * 0.2
          reasoning.push('No client acquisitions despite significant spend')
          reasoning.push('Consider pausing or completely restructuring approach')
        }
        
        const expectedClients = recommendedSpend > 0 && channel.averageCAC > 0
          ? Math.round(recommendedSpend / channel.averageCAC)
          : 0
        
        const expectedCAC = expectedClients > 0 ? recommendedSpend / expectedClients : 0
        
        const roiImpact = this.calculateROIImpact(channel.totalSpend, recommendedSpend, channel.efficiency)
        
        optimizations.push({
          channelId: channel.channelId,
          currentSpend: channel.totalSpend,
          recommendedSpend,
          expectedCAC,
          expectedClients,
          roiImpact,
          reasoning
        })
      }
      
      // Sort by potential ROI impact
      optimizations.sort((a, b) => b.roiImpact - a.roiImpact)
      
      return optimizations
      
    } catch (error) {
      console.error('Error generating CAC optimizations:', error)
      throw error
    }
  }
  
  // Calculate ROI impact of spend change
  private calculateROIImpact(currentSpend: number, recommendedSpend: number, efficiency: number): number {
    const spendChange = recommendedSpend - currentSpend
    const efficiencyMultiplier = efficiency / 100
    return spendChange * efficiencyMultiplier * 0.3 // Estimated ROI multiplier
  }
  
  // Monitor for CAC alerts and anomalies
  async monitorCACAlerts(userId: string): Promise<CACAlert[]> {
    try {
      const currentMetrics = await this.calculateCACMetrics(userId, {
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Last 30 days
      })
      
      const previousMetrics = await this.calculateCACMetrics(userId, {
        startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30-60 days ago
        endDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      })
      
      const alerts: CACAlert[] = []
      
      // CAC Increase Alert
      if (previousMetrics.averageCAC > 0 && currentMetrics.averageCAC > previousMetrics.averageCAC * 1.25) {
        const increase = ((currentMetrics.averageCAC - previousMetrics.averageCAC) / previousMetrics.averageCAC) * 100
        
        alerts.push({
          id: `cac_increase_${userId}`,
          type: 'cac_increase',
          severity: increase > 50 ? 'critical' : 'warning',
          title: 'CAC Increased Significantly',
          description: `Average CAC increased by ${increase.toFixed(1)}% from $${previousMetrics.averageCAC.toFixed(0)} to $${currentMetrics.averageCAC.toFixed(0)}`,
          currentValue: currentMetrics.averageCAC,
          targetValue: previousMetrics.averageCAC,
          recommendations: [
            'Audit recent marketing campaigns for efficiency drops',
            'Review targeting and messaging for underperforming channels',
            'Consider pausing high-CAC channels temporarily',
            'Analyze conversion funnel for potential leaks'
          ],
          estimatedImpact: increase * currentMetrics.clientsAcquired * 10 // Rough impact estimate
        })
      }
      
      // Channel Inefficiency Alerts
      for (const channel of currentMetrics.cacByChannel) {
        if (channel.efficiency < 30 && channel.totalSpend > 1000) {
          alerts.push({
            id: `channel_inefficient_${channel.channelId}`,
            type: 'channel_inefficient',
            severity: channel.efficiency < 15 ? 'critical' : 'warning',
            title: `${channel.channelName} Performing Poorly`,
            description: `${channel.channelName} has ${channel.efficiency}% efficiency with CAC of $${channel.averageCAC.toFixed(0)}`,
            affectedChannel: channel.channelName,
            currentValue: channel.averageCAC,
            targetValue: channel.averageCAC * 0.7,
            recommendations: [
              `Pause or reduce ${channel.channelName} spend immediately`,
              'Analyze campaign targeting and creative performance',
              'Consider switching to higher-performing channels',
              'Implement A/B testing for campaign optimization'
            ],
            estimatedImpact: channel.totalSpend * 0.3
          })
        }
      }
      
      // LTV Risk Alert
      const averageLTV = await this.calculateAverageLTV(userId)
      if (averageLTV > 0 && currentMetrics.averageCAC > averageLTV * 0.5) {
        alerts.push({
          id: `ltv_risk_${userId}`,
          type: 'ltv_risk',
          severity: currentMetrics.averageCAC > averageLTV ? 'critical' : 'warning',
          title: 'CAC Approaching LTV Threshold',
          description: `Current CAC ($${currentMetrics.averageCAC.toFixed(0)}) is ${((currentMetrics.averageCAC / averageLTV) * 100).toFixed(0)}% of average LTV ($${averageLTV.toFixed(0)})`,
          currentValue: currentMetrics.averageCAC,
          targetValue: averageLTV * 0.33, // Target 3:1 LTV:CAC ratio
          recommendations: [
            'Focus on improving client lifetime value',
            'Implement strategies to reduce churn',
            'Consider raising prices to improve unit economics',
            'Optimize onboarding to increase initial contract values'
          ],
          estimatedImpact: (currentMetrics.averageCAC - averageLTV * 0.33) * currentMetrics.clientsAcquired
        })
      }
      
      return alerts
      
    } catch (error) {
      console.error('Error monitoring CAC alerts:', error)
      throw error
    }
  }
  
  // Calculate average LTV for comparison
  private async calculateAverageLTV(userId: string): Promise<number> {
    const { data, error } = await supabase
      .from('profit_clients')
      .select('lifetime_value')
      .eq('user_id', userId)
      .gt('lifetime_value', 0)
    
    if (error) throw error
    
    if (!data || data.length === 0) return 0
    
    const totalLTV = data.reduce((sum, client) => sum + client.lifetime_value, 0)
    return totalLTV / data.length
  }
  
  // Update client acquisition record
  async recordClientAcquisition(userId: string, clientId: string, acquisitionData: {
    channelId: string
    acquisitionCost: number
    acquisitionDate: string
    ltvEstimate: number
    sourceCampaign?: string
    referrerClientId?: string
  }): Promise<void> {
    try {
      const { channelId, acquisitionCost, acquisitionDate, ltvEstimate, sourceCampaign, referrerClientId } = acquisitionData
      
      // Record acquisition
      const { error: acquisitionError } = await supabase
        .from('client_acquisition')
        .insert({
          user_id: userId,
          client_id: clientId,
          acquisition_channel_id: channelId,
          acquisition_cost: acquisitionCost,
          acquisition_date: acquisitionDate,
          ltv_estimate: ltvEstimate,
          source_campaign: sourceCampaign,
          referrer_client_id: referrerClientId
        })
      
      if (acquisitionError) throw acquisitionError
      
      // Update client record with CAC information
      const { error: clientError } = await supabase
        .from('profit_clients')
        .update({
          acquisition_cost: acquisitionCost,
          acquisition_channel_id: channelId,
          acquisition_date: acquisitionDate,
          predicted_ltv: ltvEstimate,
          cac_ltv_ratio: ltvEstimate > 0 ? ltvEstimate / acquisitionCost : 0,
          cac_health_score: this.calculateCACHealthScore(ltvEstimate, acquisitionCost)
        })
        .eq('id', clientId)
        .eq('user_id', userId)
      
      if (clientError) throw clientError
      
    } catch (error) {
      console.error('Error recording client acquisition:', error)
      throw error
    }
  }
  
  // Calculate CAC health score
  private calculateCACHealthScore(ltv: number, cac: number): string {
    if (cac === 0) return 'excellent'
    const ratio = ltv / cac
    
    if (ratio >= 5) return 'excellent'
    if (ratio >= 3) return 'good'
    if (ratio >= 2) return 'acceptable'
    if (ratio >= 1) return 'poor'
    return 'critical'
  }
  
  // Sync marketing costs from external platforms (placeholder for integration)
  async syncMarketingCosts(userId: string, integrationData: {
    platform: string
    costs: Array<{
      campaignId: string
      campaignName: string
      amount: number
      date: string
      clicks?: number
      impressions?: number
      conversions?: number
    }>
  }): Promise<void> {
    try {
      const { platform, costs } = integrationData
      
      // Get or create channel for this platform
      let { data: channel } = await supabase
        .from('acquisition_channels')
        .select('id')
        .eq('user_id', userId)
        .eq('channel_type', platform.toLowerCase())
        .single()
      
      if (!channel) {
        const { data: newChannel, error: channelError } = await supabase
          .from('acquisition_channels')
          .insert({
            user_id: userId,
            name: platform,
            channel_type: platform.toLowerCase()
          })
          .select('id')
          .single()
        
        if (channelError) throw channelError
        channel = newChannel
      }
      
      // Insert marketing costs
      const costRecords = costs.map(cost => ({
        user_id: userId,
        channel_id: channel.id,
        campaign_name: cost.campaignName,
        amount: cost.amount,
        spend_date: cost.date,
        clicks: cost.clicks || 0,
        impressions: cost.impressions || 0,
        conversions: cost.conversions || 0,
        external_campaign_id: cost.campaignId
      }))
      
      const { error } = await supabase
        .from('marketing_costs')
        .upsert(costRecords, { 
          onConflict: 'user_id,external_campaign_id,spend_date'
        })
      
      if (error) throw error
      
    } catch (error) {
      console.error('Error syncing marketing costs:', error)
      throw error
    }
  }
}

export const cacTrackingService = new CACTrackingService()