// ProfitPulse - Client Profitability Analytics Service
// Advanced analytics with CAC-inclusive ranking and performance insights

import { supabase } from '@/lib/supabase'
import { profitabilityCalculationService } from './profitabilityCalculationService'
import { cacTrackingService } from './cacTrackingService'

// Advanced analytics interfaces
interface ClientAnalyticsData {
  clientId: string
  clientName: string
  companyName: string
  metrics: DetailedProfitabilityMetrics
  ranking: ClientRanking
  performance: ClientPerformance
  predictions: ClientPredictions
  recommendations: ClientRecommendation[]
}

interface DetailedProfitabilityMetrics {
  // Revenue metrics
  totalRevenue: number
  monthlyRecurringRevenue: number
  averageProjectValue: number
  revenueGrowthRate: number
  
  // Cost metrics
  totalDeliveryCosts: number
  allocatedCAC: number
  totalCosts: number // Delivery + CAC
  costPerHour: number
  
  // Profitability metrics
  grossProfit: number
  trueProfit: number // Including CAC
  grossMargin: number
  trueMargin: number
  profitPerHour: number
  trueProfitPerHour: number
  
  // Efficiency metrics
  hoursWorked: number
  utilizationRate: number
  efficiencyScore: number
  
  // CAC metrics
  ltvCacRatio: number
  paybackMonths: number
  cacHealthScore: string
  acquisitionChannel: string
}

interface ClientRanking {
  overallRank: number
  totalClients: number
  percentile: number
  rankByMetric: {
    trueProfit: number
    trueMargin: number
    ltvCacRatio: number
    efficiencyScore: number
    revenue: number
  }
}

interface ClientPerformance {
  trend: 'improving' | 'stable' | 'declining' | 'volatile'
  trendStrength: number // 0-100
  seasonality: SeasonalityData
  benchmarkComparison: BenchmarkComparison
  riskFactors: RiskFactor[]
}

interface SeasonalityData {
  hasSeasonality: boolean
  peakMonths: string[]
  lowMonths: string[]
  seasonalityStrength: number
}

interface BenchmarkComparison {
  industry: string
  percentileRank: number
  vsIndustryAverage: {
    revenue: number // % difference
    margin: number
    cac: number
    ltv: number
  }
}

interface RiskFactor {
  type: 'payment_delay' | 'scope_creep' | 'churn_risk' | 'margin_decline' | 'cac_inflation'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  likelihood: number // 0-100
  impact: number // 0-100
  mitigation: string[]
}

interface ClientPredictions {
  nextQuarterRevenue: number
  nextQuarterProfit: number
  churnProbability: number
  ltvForecast: number
  optimalPricing: PricingRecommendation
}

interface PricingRecommendation {
  currentRate: number
  recommendedRate: number
  increasePercentage: number
  rationale: string[]
  implementationStrategy: string
  expectedImpact: {
    revenueIncrease: number
    marginImprovement: number
    churnRisk: number
  }
}

interface ClientRecommendation {
  id: string
  type: 'pricing' | 'efficiency' | 'scope' | 'retention' | 'upsell'
  priority: 'critical' | 'high' | 'medium' | 'low'
  title: string
  description: string
  actions: string[]
  expectedOutcome: string
  estimatedImpact: number
  timeframe: string
}

interface ClientSegmentation {
  segment: 'champions' | 'rising_stars' | 'cash_cows' | 'attention_needed' | 'candidates_for_firing'
  criteria: string[]
  clientCount: number
  totalRevenue: number
  averageMargin: number
  recommendedActions: string[]
}

export class ClientProfitabilityAnalyticsService {
  
  // Get comprehensive analytics for a specific client
  async getClientAnalytics(userId: string, clientId: string, options?: {
    includePredictions?: boolean
    includeSeasonality?: boolean
    benchmarkPeriod?: 'quarter' | 'year'
  }): Promise<ClientAnalyticsData> {
    const { includePredictions = true, includeSeasonality = true, benchmarkPeriod = 'quarter' } = options || {}
    
    try {
      // Get basic profitability data
      const profitabilityData = await profitabilityCalculationService
        .calculateClientProfitability(userId, clientId)
      
      // Get detailed metrics
      const detailedMetrics = await this.calculateDetailedMetrics(userId, clientId)
      
      // Calculate rankings
      const ranking = await this.calculateClientRanking(userId, clientId)
      
      // Analyze performance
      const performance = await this.analyzeClientPerformance(userId, clientId, {
        includeSeasonality,
        benchmarkPeriod
      })
      
      // Generate predictions if requested
      let predictions: ClientPredictions | null = null
      if (includePredictions) {
        predictions = await this.generateClientPredictions(userId, clientId)
      }
      
      // Generate recommendations
      const recommendations = await this.generateClientRecommendations(
        userId, 
        clientId, 
        detailedMetrics, 
        performance
      )
      
      const { data: client, error } = await supabase
        .from('profit_clients')
        .select('name, company')
        .eq('id', clientId)
        .single()
      
      if (error) throw error
      
      return {
        clientId,
        clientName: client.name,
        companyName: client.company || client.name,
        metrics: detailedMetrics,
        ranking,
        performance,
        predictions: predictions || {
          nextQuarterRevenue: 0,
          nextQuarterProfit: 0,
          churnProbability: 0,
          ltvForecast: 0,
          optimalPricing: {
            currentRate: 0,
            recommendedRate: 0,
            increasePercentage: 0,
            rationale: [],
            implementationStrategy: '',
            expectedImpact: { revenueIncrease: 0, marginImprovement: 0, churnRisk: 0 }
          }
        },
        recommendations
      }
      
    } catch (error) {
      console.error('Error getting client analytics:', error)
      throw error
    }
  }
  
  // Calculate detailed profitability metrics
  private async calculateDetailedMetrics(userId: string, clientId: string): Promise<DetailedProfitabilityMetrics> {
    // Get comprehensive financial data
    const { data: financialData, error: financialError } = await supabase
      .from('profit_projects')
      .select(`
        total_revenue,
        total_costs,
        actual_hours,
        profit_clients!inner (
          hourly_rate,
          lifetime_value,
          acquisition_cost,
          cac_ltv_ratio,
          cac_health_score,
          acquisition_channels (name)
        )
      `)
      .eq('user_id', userId)
      .eq('client_id', clientId)
    
    if (financialError) throw financialError
    
    // Get time entries for detailed hour analysis
    const { data: timeData, error: timeError } = await supabase
      .from('time_entries')
      .select(`
        hours,
        revenue,
        cost,
        date,
        profit_projects!inner (client_id)
      `)
      .eq('user_id', userId)
      .eq('profit_projects.client_id', clientId)
    
    if (timeError) throw timeError
    
    // Calculate metrics
    const totalRevenue = financialData?.reduce((sum, p) => sum + (p.total_revenue || 0), 0) || 0
    const totalDeliveryCosts = financialData?.reduce((sum, p) => sum + (p.total_costs || 0), 0) || 0
    const hoursWorked = timeData?.reduce((sum, t) => sum + t.hours, 0) || 0
    const allocatedCAC = financialData?.[0]?.profit_clients?.acquisition_cost || 0
    
    // Calculate monthly recurring revenue (for retainer clients)
    const monthlyRecurringRevenue = await this.calculateMRR(userId, clientId)
    
    // Calculate growth rate
    const revenueGrowthRate = await this.calculateRevenueGrowthRate(userId, clientId)
    
    // Calculate efficiency metrics
    const efficiencyScore = await this.calculateEfficiencyScore(userId, clientId, hoursWorked, totalRevenue)
    const utilizationRate = await this.calculateUtilizationRate(userId, clientId)
    
    const totalCosts = totalDeliveryCosts + allocatedCAC
    const grossProfit = totalRevenue - totalDeliveryCosts
    const trueProfit = totalRevenue - totalCosts
    const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0
    const trueMargin = totalRevenue > 0 ? (trueProfit / totalRevenue) * 100 : 0
    
    return {
      totalRevenue,
      monthlyRecurringRevenue,
      averageProjectValue: financialData?.length ? totalRevenue / financialData.length : 0,
      revenueGrowthRate,
      totalDeliveryCosts,
      allocatedCAC,
      totalCosts,
      costPerHour: hoursWorked > 0 ? totalCosts / hoursWorked : 0,
      grossProfit,
      trueProfit,
      grossMargin,
      trueMargin,
      profitPerHour: hoursWorked > 0 ? grossProfit / hoursWorked : 0,
      trueProfitPerHour: hoursWorked > 0 ? trueProfit / hoursWorked : 0,
      hoursWorked,
      utilizationRate,
      efficiencyScore,
      ltvCacRatio: financialData?.[0]?.profit_clients?.cac_ltv_ratio || 0,
      paybackMonths: this.calculatePaybackPeriod(allocatedCAC, monthlyRecurringRevenue),
      cacHealthScore: financialData?.[0]?.profit_clients?.cac_health_score || 'unknown',
      acquisitionChannel: financialData?.[0]?.profit_clients?.acquisition_channels?.name || 'Unknown'
    }
  }
  
  // Calculate monthly recurring revenue
  private async calculateMRR(userId: string, clientId: string): Promise<number> {
    const { data: client, error } = await supabase
      .from('profit_clients')
      .select('billing_type, retainer_amount, hourly_rate')
      .eq('id', clientId)
      .single()
    
    if (error) return 0
    
    if (client.billing_type === 'retainer') {
      return client.retainer_amount || 0
    }
    
    // For hourly clients, estimate based on average monthly hours
    const { data: avgHours } = await supabase
      .from('time_entries')
      .select('hours')
      .eq('user_id', userId)
      .eq('project_id', supabase.from('profit_projects').select('id').eq('client_id', clientId))
      .gte('date', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
    
    if (avgHours && avgHours.length > 0) {
      const totalHours = avgHours.reduce((sum, entry) => sum + entry.hours, 0)
      const monthlyAvgHours = totalHours / 3 // 3 months
      return monthlyAvgHours * (client.hourly_rate || 0)
    }
    
    return 0
  }
  
  // Calculate revenue growth rate
  private async calculateRevenueGrowthRate(userId: string, clientId: string): Promise<number> {
    const now = new Date()
    const currentQuarter = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)
    const previousQuarter = new Date(currentQuarter.getTime() - 90 * 24 * 60 * 60 * 1000)
    
    const currentRevenue = await this.getRevenueForPeriod(userId, clientId, currentQuarter, now)
    const previousRevenue = await this.getRevenueForPeriod(userId, clientId, previousQuarter, currentQuarter)
    
    if (previousRevenue === 0) return 0
    return ((currentRevenue - previousRevenue) / previousRevenue) * 100
  }
  
  // Get revenue for specific period
  private async getRevenueForPeriod(userId: string, clientId: string, startDate: Date, endDate: Date): Promise<number> {
    const { data, error } = await supabase
      .from('time_entries')
      .select('revenue')
      .eq('user_id', userId)
      .eq('project_id', supabase.from('profit_projects').select('id').eq('client_id', clientId))
      .gte('date', startDate.toISOString())
      .lte('date', endDate.toISOString())
    
    if (error) return 0
    return data?.reduce((sum, entry) => sum + (entry.revenue || 0), 0) || 0
  }
  
  // Calculate efficiency score
  private async calculateEfficiencyScore(userId: string, clientId: string, hoursWorked: number, revenue: number): Promise<number> {
    if (hoursWorked === 0 || revenue === 0) return 0
    
    const revenuePerHour = revenue / hoursWorked
    
    // Get user's average revenue per hour across all clients for comparison
    const { data: allTimeEntries } = await supabase
      .from('time_entries')
      .select('hours, revenue')
      .eq('user_id', userId)
      .gt('hours', 0)
      .gt('revenue', 0)
    
    if (!allTimeEntries || allTimeEntries.length === 0) return 50 // Default
    
    const totalHours = allTimeEntries.reduce((sum, entry) => sum + entry.hours, 0)
    const totalRevenue = allTimeEntries.reduce((sum, entry) => sum + entry.revenue, 0)
    const avgRevenuePerHour = totalRevenue / totalHours
    
    // Calculate efficiency as percentage vs. average
    const efficiency = (revenuePerHour / avgRevenuePerHour) * 100
    
    // Cap at 100 and ensure minimum of 0
    return Math.min(100, Math.max(0, efficiency))
  }
  
  // Calculate utilization rate
  private async calculateUtilizationRate(userId: string, clientId: string): Promise<number> {
    // For simplicity, returning a calculated rate based on hours vs. available time
    // In practice, this would need team capacity data
    
    const { data: timeEntries } = await supabase
      .from('time_entries')
      .select('hours, date')
      .eq('user_id', userId)
      .eq('project_id', supabase.from('profit_projects').select('id').eq('client_id', clientId))
      .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    
    if (!timeEntries || timeEntries.length === 0) return 0
    
    const totalHours = timeEntries.reduce((sum, entry) => sum + entry.hours, 0)
    const workingDays = 22 // Approximate working days per month
    const availableHours = workingDays * 8 // 8 hours per day
    
    return Math.min(100, (totalHours / availableHours) * 100)
  }
  
  // Calculate payback period in months
  private calculatePaybackPeriod(cac: number, mrr: number): number {
    if (mrr === 0) return 0
    return cac / mrr
  }
  
  // Calculate client ranking across all metrics
  private async calculateClientRanking(userId: string, clientId: string): Promise<ClientRanking> {
    // Get all clients for comparison
    const allClients = await profitabilityCalculationService
      .getClientProfitabilityRanking(userId, { limit: 1000 })
    
    const totalClients = allClients.length
    const targetClient = allClients.find(c => c.clientId === clientId)
    
    if (!targetClient) {
      return {
        overallRank: totalClients,
        totalClients,
        percentile: 0,
        rankByMetric: {
          trueProfit: totalClients,
          trueMargin: totalClients,
          ltvCacRatio: totalClients,
          efficiencyScore: totalClients,
          revenue: totalClients
        }
      }
    }
    
    // Find rank by each metric
    const sortedByTrueProfit = [...allClients].sort((a, b) => b.metrics.trueProfit - a.metrics.trueProfit)
    const sortedByTrueMargin = [...allClients].sort((a, b) => b.metrics.trueProfitMargin - a.metrics.trueProfitMargin)
    const sortedByLtvCac = [...allClients].sort((a, b) => b.ltvCacRatio - a.ltvCacRatio)
    const sortedByRevenue = [...allClients].sort((a, b) => b.metrics.revenue - a.metrics.revenue)
    
    const overallRank = allClients.findIndex(c => c.clientId === clientId) + 1
    const percentile = ((totalClients - overallRank) / totalClients) * 100
    
    return {
      overallRank,
      totalClients,
      percentile,
      rankByMetric: {
        trueProfit: sortedByTrueProfit.findIndex(c => c.clientId === clientId) + 1,
        trueMargin: sortedByTrueMargin.findIndex(c => c.clientId === clientId) + 1,
        ltvCacRatio: sortedByLtvCac.findIndex(c => c.clientId === clientId) + 1,
        efficiencyScore: overallRank, // Placeholder - would need efficiency data
        revenue: sortedByRevenue.findIndex(c => c.clientId === clientId) + 1
      }
    }
  }
  
  // Analyze client performance trends and patterns
  private async analyzeClientPerformance(userId: string, clientId: string, options: {
    includeSeasonality?: boolean
    benchmarkPeriod?: 'quarter' | 'year'
  }): Promise<ClientPerformance> {
    const { includeSeasonality = true, benchmarkPeriod = 'quarter' } = options
    
    // Get historical data
    const { data: snapshots, error } = await supabase
      .from('profitability_snapshots')
      .select('*')
      .eq('user_id', userId)
      .eq('client_id', clientId)
      .order('snapshot_date', { ascending: true })
    
    if (error) throw error
    
    // Analyze trend
    const margins = snapshots?.map(s => s.true_profit_margin) || []
    const trend = this.calculateTrendDirection(margins)
    const trendStrength = this.calculateTrendStrength(margins)
    
    // Analyze seasonality if requested
    let seasonality: SeasonalityData = {
      hasSeasonality: false,
      peakMonths: [],
      lowMonths: [],
      seasonalityStrength: 0
    }
    
    if (includeSeasonality && snapshots && snapshots.length >= 12) {
      seasonality = this.analyzeSeasonality(snapshots)
    }
    
    // Generate benchmark comparison
    const benchmarkComparison = await this.generateBenchmarkComparison(userId, clientId, benchmarkPeriod)
    
    // Identify risk factors
    const riskFactors = await this.identifyRiskFactors(userId, clientId, snapshots || [])
    
    return {
      trend,
      trendStrength,
      seasonality,
      benchmarkComparison,
      riskFactors
    }
  }
  
  // Calculate trend direction
  private calculateTrendDirection(margins: number[]): 'improving' | 'stable' | 'declining' | 'volatile' {
    if (margins.length < 3) return 'stable'
    
    const slope = this.calculateSlope(margins)
    const volatility = this.calculateVolatility(margins)
    
    if (volatility > 15) return 'volatile'
    if (slope > 2) return 'improving'
    if (slope < -2) return 'declining'
    return 'stable'
  }
  
  // Calculate trend strength
  private calculateTrendStrength(margins: number[]): number {
    if (margins.length < 3) return 0
    
    const slope = Math.abs(this.calculateSlope(margins))
    const volatility = this.calculateVolatility(margins)
    
    // Strength is high slope with low volatility
    return Math.max(0, Math.min(100, (slope * 10) - volatility))
  }
  
  // Calculate slope of trend line
  private calculateSlope(values: number[]): number {
    const n = values.length
    const sumX = values.reduce((acc, _, i) => acc + i, 0)
    const sumY = values.reduce((acc, val) => acc + val, 0)
    const sumXY = values.reduce((acc, val, i) => acc + val * i, 0)
    const sumXX = values.reduce((acc, _, i) => acc + i * i, 0)
    
    return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
  }
  
  // Calculate volatility
  private calculateVolatility(values: number[]): number {
    if (values.length < 2) return 0
    
    const mean = values.reduce((acc, val) => acc + val, 0) / values.length
    const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length
    
    return Math.sqrt(variance)
  }
  
  // Analyze seasonality patterns
  private analyzeSeasonality(snapshots: any[]): SeasonalityData {
    const monthlyData: Record<string, number[]> = {}
    
    // Group data by month
    snapshots.forEach(snapshot => {
      const month = new Date(snapshot.snapshot_date).toLocaleDateString('en-US', { month: 'short' })
      if (!monthlyData[month]) monthlyData[month] = []
      monthlyData[month].push(snapshot.true_profit_margin)
    })
    
    // Calculate averages by month
    const monthlyAverages = Object.entries(monthlyData).map(([month, values]) => ({
      month,
      average: values.reduce((sum, val) => sum + val, 0) / values.length
    }))
    
    // Find peaks and lows
    const sortedByAverage = [...monthlyAverages].sort((a, b) => b.average - a.average)
    const peakMonths = sortedByAverage.slice(0, 2).map(m => m.month)
    const lowMonths = sortedByAverage.slice(-2).map(m => m.month)
    
    // Calculate seasonality strength
    const maxAvg = Math.max(...monthlyAverages.map(m => m.average))
    const minAvg = Math.min(...monthlyAverages.map(m => m.average))
    const seasonalityStrength = maxAvg > 0 ? ((maxAvg - minAvg) / maxAvg) * 100 : 0
    
    return {
      hasSeasonality: seasonalityStrength > 15,
      peakMonths,
      lowMonths,
      seasonalityStrength
    }
  }
  
  // Generate benchmark comparison
  private async generateBenchmarkComparison(userId: string, clientId: string, period: 'quarter' | 'year'): Promise<BenchmarkComparison> {
    // Get user's client data
    const clientData = await this.calculateDetailedMetrics(userId, clientId)
    
    // Industry benchmarks (would typically come from external data)
    const industryBenchmarks = {
      revenue: 50000, // Average quarterly revenue
      margin: 35, // Average profit margin
      cac: 1200, // Average CAC
      ltv: 45000 // Average LTV
    }
    
    // Calculate percentile rank (simplified)
    const allClients = await profitabilityCalculationService.getClientProfitabilityRanking(userId)
    const clientRank = allClients.findIndex(c => c.clientId === clientId) + 1
    const percentileRank = ((allClients.length - clientRank) / allClients.length) * 100
    
    return {
      industry: 'Professional Services',
      percentileRank,
      vsIndustryAverage: {
        revenue: ((clientData.totalRevenue - industryBenchmarks.revenue) / industryBenchmarks.revenue) * 100,
        margin: clientData.trueMargin - industryBenchmarks.margin,
        cac: ((clientData.allocatedCAC - industryBenchmarks.cac) / industryBenchmarks.cac) * 100,
        ltv: ((clientData.totalRevenue - industryBenchmarks.ltv) / industryBenchmarks.ltv) * 100
      }
    }
  }
  
  // Identify risk factors
  private async identifyRiskFactors(userId: string, clientId: string, snapshots: any[]): Promise<RiskFactor[]> {
    const risks: RiskFactor[] = []
    
    // Payment delay risk
    const { data: invoiceData } = await supabase
      .from('time_entries')
      .select('billed, date')
      .eq('user_id', userId)
      .eq('project_id', supabase.from('profit_projects').select('id').eq('client_id', clientId))
      .eq('billable', true)
      .eq('billed', false)
    
    if (invoiceData && invoiceData.length > 10) {
      risks.push({
        type: 'payment_delay',
        severity: 'medium',
        description: `${invoiceData.length} unbilled time entries may indicate payment delays`,
        likelihood: 60,
        impact: 40,
        mitigation: [
          'Implement weekly billing cycles',
          'Set up automated payment reminders',
          'Consider requiring deposits for new projects'
        ]
      })
    }
    
    // Margin decline risk
    if (snapshots.length >= 3) {
      const recentMargins = snapshots.slice(-3).map(s => s.true_profit_margin)
      const trend = this.calculateSlope(recentMargins)
      
      if (trend < -2) {
        risks.push({
          type: 'margin_decline',
          severity: trend < -5 ? 'high' : 'medium',
          description: 'Profit margins declining over recent periods',
          likelihood: 75,
          impact: 80,
          mitigation: [
            'Review project scopes for creep',
            'Consider rate increase',
            'Optimize team efficiency',
            'Renegotiate contract terms'
          ]
        })
      }
    }
    
    return risks
  }
  
  // Generate client predictions
  private async generateClientPredictions(userId: string, clientId: string): Promise<ClientPredictions> {
    const metrics = await this.calculateDetailedMetrics(userId, clientId)
    
    // Simple prediction models (in practice, would use more sophisticated ML)
    const nextQuarterRevenue = metrics.monthlyRecurringRevenue * 3 * (1 + metrics.revenueGrowthRate / 100)
    const nextQuarterProfit = nextQuarterRevenue * (metrics.trueMargin / 100)
    
    // Churn probability based on margin and trend
    const churnProbability = Math.max(0, Math.min(100, 
      50 - metrics.trueMargin + (metrics.ltvCacRatio < 2 ? 20 : 0)
    ))
    
    // LTV forecast
    const ltvForecast = metrics.monthlyRecurringRevenue * 24 * (1 - churnProbability / 100)
    
    // Optimal pricing recommendation
    const optimalPricing = this.calculateOptimalPricing(metrics)
    
    return {
      nextQuarterRevenue,
      nextQuarterProfit,
      churnProbability,
      ltvForecast,
      optimalPricing
    }
  }
  
  // Calculate optimal pricing
  private calculateOptimalPricing(metrics: DetailedProfitabilityMetrics): PricingRecommendation {
    const currentRate = metrics.totalRevenue / metrics.hoursWorked || 0
    let recommendedRate = currentRate
    let rationale: string[] = []
    
    // Rate increase recommendations
    if (metrics.trueMargin < 30) {
      const targetMargin = 35
      const requiredIncrease = (targetMargin - metrics.trueMargin) / metrics.trueMargin
      recommendedRate = currentRate * (1 + requiredIncrease)
      rationale.push(`Increase rate by ${(requiredIncrease * 100).toFixed(0)}% to achieve ${targetMargin}% margin`)
    }
    
    if (metrics.efficiencyScore > 80) {
      recommendedRate = Math.max(recommendedRate, currentRate * 1.15)
      rationale.push('High efficiency score supports premium pricing')
    }
    
    if (metrics.ltvCacRatio > 5) {
      recommendedRate = Math.max(recommendedRate, currentRate * 1.10)
      rationale.push('Strong LTV:CAC ratio indicates pricing power')
    }
    
    const increasePercentage = ((recommendedRate - currentRate) / currentRate) * 100
    
    return {
      currentRate,
      recommendedRate,
      increasePercentage,
      rationale,
      implementationStrategy: increasePercentage > 20 
        ? 'Implement in two phases over 6 months'
        : 'Implement with next contract renewal',
      expectedImpact: {
        revenueIncrease: increasePercentage,
        marginImprovement: increasePercentage * 0.8, // Most goes to margin
        churnRisk: Math.min(15, increasePercentage * 0.3) // Some churn risk
      }
    }
  }
  
  // Generate actionable recommendations
  private async generateClientRecommendations(
    userId: string,
    clientId: string,
    metrics: DetailedProfitabilityMetrics,
    performance: ClientPerformance
  ): Promise<ClientRecommendation[]> {
    const recommendations: ClientRecommendation[] = []
    
    // Pricing recommendations
    if (metrics.trueMargin < 30) {
      recommendations.push({
        id: `pricing_${clientId}`,
        type: 'pricing',
        priority: 'high',
        title: 'Rate Increase Needed',
        description: `True profit margin of ${metrics.trueMargin.toFixed(1)}% is below healthy threshold`,
        actions: [
          'Schedule rate discussion with client',
          'Prepare value justification document',
          'Consider phased increase approach',
          'Review market rates for similar services'
        ],
        expectedOutcome: 'Improve margin to 35%+ within 3 months',
        estimatedImpact: (35 - metrics.trueMargin) * metrics.totalRevenue / 100,
        timeframe: '3 months'
      })
    }
    
    // Efficiency recommendations
    if (metrics.efficiencyScore < 70) {
      recommendations.push({
        id: `efficiency_${clientId}`,
        type: 'efficiency',
        priority: 'medium',
        title: 'Improve Team Efficiency',
        description: `Efficiency score of ${metrics.efficiencyScore.toFixed(0)}% indicates optimization opportunities`,
        actions: [
          'Audit project workflows and processes',
          'Implement time tracking improvements',
          'Consider task automation tools',
          'Review team skill alignment with tasks'
        ],
        expectedOutcome: 'Increase efficiency to 80%+ and improve profit per hour',
        estimatedImpact: metrics.totalRevenue * 0.15,
        timeframe: '2 months'
      })
    }
    
    // Retention recommendations for at-risk clients
    const highRiskFactors = performance.riskFactors.filter(r => r.severity === 'high' || r.severity === 'critical')
    if (highRiskFactors.length > 0) {
      recommendations.push({
        id: `retention_${clientId}`,
        type: 'retention',
        priority: 'critical',
        title: 'Client Retention Risk',
        description: `${highRiskFactors.length} critical risk factors identified`,
        actions: [
          'Schedule immediate client check-in meeting',
          'Address identified risk factors',
          'Develop client success plan',
          'Implement proactive communication strategy'
        ],
        expectedOutcome: 'Reduce churn risk and maintain client relationship',
        estimatedImpact: metrics.totalRevenue, // Potential lost revenue
        timeframe: '2 weeks'
      })
    }
    
    return recommendations.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })
  }
  
  // Get client segmentation analysis
  async getClientSegmentation(userId: string): Promise<ClientSegmentation[]> {
    const allClients = await profitabilityCalculationService
      .getClientProfitabilityRanking(userId, { limit: 1000 })
    
    const segments: ClientSegmentation[] = []
    
    // Champions: High LTV, High Margin, Low CAC
    const champions = allClients.filter(c => 
      c.ltvCacRatio > 4 && 
      c.metrics.trueProfitMargin > 40 && 
      c.metrics.revenue > 20000
    )
    
    segments.push({
      segment: 'champions',
      criteria: ['LTV:CAC > 4x', 'Margin > 40%', 'Revenue > $20k'],
      clientCount: champions.length,
      totalRevenue: champions.reduce((sum, c) => sum + c.metrics.revenue, 0),
      averageMargin: champions.reduce((sum, c) => sum + c.metrics.trueProfitMargin, 0) / Math.max(1, champions.length),
      recommendedActions: [
        'Prioritize these clients for expansion opportunities',
        'Use as case studies for new business',
        'Replicate success patterns with other clients',
        'Consider premium service offerings'
      ]
    })
    
    // Rising Stars: Good metrics, growth potential
    const risingStars = allClients.filter(c => 
      c.ltvCacRatio > 2 && 
      c.metrics.trueProfitMargin > 25 && 
      c.trendDirection === 'improving' &&
      !champions.includes(c)
    )
    
    segments.push({
      segment: 'rising_stars',
      criteria: ['LTV:CAC > 2x', 'Margin > 25%', 'Improving trend'],
      clientCount: risingStars.length,
      totalRevenue: risingStars.reduce((sum, c) => sum + c.metrics.revenue, 0),
      averageMargin: risingStars.reduce((sum, c) => sum + c.metrics.trueProfitMargin, 0) / Math.max(1, risingStars.length),
      recommendedActions: [
        'Invest in relationship development',
        'Look for upsell opportunities',
        'Monitor and maintain growth trajectory',
        'Consider strategic partnerships'
      ]
    })
    
    // Candidates for firing: Poor metrics, high CAC, declining
    const candidatesForFiring = allClients.filter(c => 
      (c.ltvCacRatio < 1.5 || c.metrics.trueProfitMargin < 10) && 
      c.trendDirection === 'declining'
    )
    
    segments.push({
      segment: 'candidates_for_firing',
      criteria: ['LTV:CAC < 1.5x OR Margin < 10%', 'Declining trend'],
      clientCount: candidatesForFiring.length,
      totalRevenue: candidatesForFiring.reduce((sum, c) => sum + c.metrics.revenue, 0),
      averageMargin: candidatesForFiring.reduce((sum, c) => sum + c.metrics.trueProfitMargin, 0) / Math.max(1, candidatesForFiring.length),
      recommendedActions: [
        'Attempt to improve profitability first',
        'Consider rate increases or scope reductions',
        'If no improvement, gracefully transition out',
        'Focus resources on better clients'
      ]
    })
    
    return segments
  }
}

export const clientProfitabilityAnalyticsService = new ClientProfitabilityAnalyticsService()