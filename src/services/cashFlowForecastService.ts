import { supabase } from '@/lib/supabase'

export interface CashFlowForecast {
  weekEnding: string
  projectedInflow: number
  projectedOutflow: number
  netPosition: number
  cumulativePosition: number
  confidenceScore: number
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  cashRunwayDays: number
  seasonalFactor: number
  marketFactor: number
}

export interface ForecastScenario {
  type: 'conservative' | 'realistic' | 'optimistic'
  name: string
  assumptions: Record<string, any>
  forecasts: CashFlowForecast[]
  totalProjectedCash: number
  minimumCashPosition: number
  worstWeek: string
  averageWeeklyBurn: number
}

export interface CashFlowAnalysis {
  scenarios: ForecastScenario[]
  keyInsights: CashFlowInsight[]
  criticalAlerts: CashFlowAlert[]
  recommendations: CashFlowRecommendation[]
  summaryMetrics: CashFlowSummary
}

export interface CashFlowInsight {
  type: 'opportunity' | 'risk' | 'pattern' | 'optimization'
  title: string
  description: string
  impactAmount: number
  confidenceLevel: number
  actionable: boolean
  recommendedActions: string[]
  timeframe: string
}

export interface CashFlowAlert {
  severity: 'low' | 'medium' | 'high' | 'critical'
  type: string
  message: string
  projectedDate: string
  impactAmount: number
  suggestedActions: string[]
  daysToImpact: number
}

export interface CashFlowRecommendation {
  category: 'payment_terms' | 'collection' | 'expense_timing' | 'funding' | 'pricing'
  priority: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  estimatedImpact: number
  implementationEffort: 'low' | 'medium' | 'high'
  timeToImplement: string
  steps: string[]
}

export interface CashFlowSummary {
  currentCashPosition: number
  projectedCashIn13Weeks: number
  totalInflowNext13Weeks: number
  totalOutflowNext13Weeks: number
  netCashFlow13Weeks: number
  cashRunwayDays: number
  riskScore: number
  healthScore: number
}

class CashFlowForecastService {
  // Generate comprehensive 13-week cash flow forecast with multiple scenarios
  async generateCashFlowForecast(userId: string, options?: {
    startDate?: string
    includeScenarios?: boolean
    refreshData?: boolean
  }): Promise<CashFlowAnalysis> {
    try {
      const startDate = options?.startDate || this.getNextMonday()
      const includeScenarios = options?.includeScenarios !== false
      
      // Get current cash position (would integrate with bank APIs)
      const currentCashPosition = await this.getCurrentCashPosition(userId)
      
      // Get all forecast inputs
      const [invoices, expenses, paymentHistory, clientProfiles] = await Promise.all([
        this.getUnpaidInvoices(userId),
        this.getRecurringExpenses(userId),
        this.getPaymentHistory(userId),
        this.getClientProfiles(userId)
      ])

      // Generate base realistic scenario
      const realisticScenario = await this.generateScenarioForecast(
        userId,
        'realistic',
        startDate,
        currentCashPosition,
        { invoices, expenses, paymentHistory, clientProfiles }
      )

      const scenarios: ForecastScenario[] = [realisticScenario]

      // Generate additional scenarios if requested
      if (includeScenarios) {
        const [conservativeScenario, optimisticScenario] = await Promise.all([
          this.generateScenarioForecast(
            userId,
            'conservative',
            startDate,
            currentCashPosition,
            { invoices, expenses, paymentHistory, clientProfiles }
          ),
          this.generateScenarioForecast(
            userId,
            'optimistic', 
            startDate,
            currentCashPosition,
            { invoices, expenses, paymentHistory, clientProfiles }
          )
        ])

        scenarios.unshift(conservativeScenario)
        scenarios.push(optimisticScenario)
      }

      // Generate insights and recommendations
      const keyInsights = this.generateKeyInsights(scenarios, { invoices, expenses, clientProfiles })
      const criticalAlerts = this.generateCriticalAlerts(scenarios[0] || realisticScenario)
      const recommendations = this.generateRecommendations(scenarios, { invoices, expenses, clientProfiles })
      
      // Calculate summary metrics
      const summaryMetrics = this.calculateSummaryMetrics(realisticScenario, currentCashPosition)

      // Save forecasts to database
      await this.saveForecastsToDatabase(userId, scenarios)

      return {
        scenarios,
        keyInsights,
        criticalAlerts,
        recommendations,
        summaryMetrics
      }

    } catch (error) {
      console.error('[CASH-FLOW] Error generating cash flow forecast:', error)
      throw error
    }
  }

  // Generate forecast for specific scenario (conservative/realistic/optimistic)
  private async generateScenarioForecast(
    userId: string,
    scenarioType: 'conservative' | 'realistic' | 'optimistic',
    startDate: string,
    currentCash: number,
    data: any
  ): Promise<ForecastScenario> {
    
    const { invoices, expenses, paymentHistory, clientProfiles } = data
    const forecasts: CashFlowForecast[] = []
    let cumulativeCash = currentCash

    // Generate 13 weeks of forecasts
    for (let week = 0; week < 13; week++) {
      const weekEnding = this.addWeeks(startDate, week)
      
      // Calculate projected inflows for this week
      const projectedInflow = this.calculateWeeklyInflow(
        weekEnding,
        invoices,
        clientProfiles,
        scenarioType,
        week
      )

      // Calculate projected outflows for this week  
      const projectedOutflow = this.calculateWeeklyOutflow(
        weekEnding,
        expenses,
        scenarioType,
        week
      )

      // Apply seasonal and market adjustments
      const seasonalFactor = this.getSeasonalAdjustmentFactor(weekEnding)
      const marketFactor = this.getMarketConditionsFactor()

      // Calculate adjusted cash flows
      const adjustedInflow = projectedInflow * seasonalFactor * marketFactor
      const adjustedOutflow = projectedOutflow * (scenarioType === 'conservative' ? 1.1 : scenarioType === 'optimistic' ? 0.9 : 1.0)
      
      const netPosition = adjustedInflow - adjustedOutflow
      cumulativeCash += netPosition

      // Calculate confidence score based on data quality and forecast distance
      const confidenceScore = this.calculateConfidenceScore(week, invoices, expenses, paymentHistory)

      // Determine risk level
      const riskLevel = this.determineRiskLevel(cumulativeCash, netPosition)

      // Calculate cash runway
      const cashRunwayDays = await this.calculateCashRunway(userId, cumulativeCash)

      forecasts.push({
        weekEnding,
        projectedInflow: Math.round(adjustedInflow * 100) / 100,
        projectedOutflow: Math.round(adjustedOutflow * 100) / 100,
        netPosition: Math.round(netPosition * 100) / 100,
        cumulativePosition: Math.round(cumulativeCash * 100) / 100,
        confidenceScore,
        riskLevel,
        cashRunwayDays,
        seasonalFactor,
        marketFactor
      })
    }

    // Calculate scenario metrics
    const totalProjectedCash = cumulativeCash
    const minimumCashPosition = Math.min(...forecasts.map(f => f.cumulativePosition))
    const worstWeek = forecasts.find(f => f.cumulativePosition === minimumCashPosition)?.weekEnding || ''
    const averageWeeklyBurn = forecasts.reduce((sum, f) => sum + f.projectedOutflow, 0) / 13

    return {
      type: scenarioType,
      name: this.getScenarioName(scenarioType),
      assumptions: this.getScenarioAssumptions(scenarioType),
      forecasts,
      totalProjectedCash,
      minimumCashPosition,
      worstWeek,
      averageWeeklyBurn: Math.round(averageWeeklyBurn * 100) / 100
    }
  }

  // Calculate weekly inflow based on invoice payment probabilities
  private calculateWeeklyInflow(
    weekEnding: string,
    invoices: any[],
    clientProfiles: any[],
    scenarioType: string,
    weekOffset: number
  ): number {
    let totalInflow = 0
    const weekEndDate = new Date(weekEnding)

    for (const invoice of invoices) {
      // Predict payment probability for this week
      const paymentProbability = this.calculatePaymentProbabilityForWeek(
        invoice,
        weekEndDate,
        clientProfiles,
        scenarioType
      )

      // Apply scenario adjustments
      let adjustedProbability = paymentProbability
      if (scenarioType === 'conservative') {
        adjustedProbability *= 0.7 // 30% haircut
      } else if (scenarioType === 'optimistic') {
        adjustedProbability *= 1.2 // 20% boost
      }

      adjustedProbability = Math.min(1, Math.max(0, adjustedProbability))

      // Calculate expected inflow for this invoice
      totalInflow += invoice.amount * adjustedProbability
    }

    return totalInflow
  }

  // Calculate weekly outflow based on recurring expenses
  private calculateWeeklyOutflow(
    weekEnding: string,
    expenses: any[],
    scenarioType: string,
    weekOffset: number
  ): number {
    let totalOutflow = 0
    const weekEndDate = new Date(weekEnding)

    for (const expense of expenses) {
      if (this.isExpenseDueInWeek(expense, weekEndDate)) {
        let expenseAmount = expense.amount

        // Apply scenario adjustments
        if (scenarioType === 'conservative') {
          expenseAmount *= 1.1 // 10% buffer for unexpected costs
        } else if (scenarioType === 'optimistic') {
          expenseAmount *= 0.95 // 5% savings from optimization
        }

        totalOutflow += expenseAmount
      }
    }

    return totalOutflow
  }

  // Calculate payment probability for specific week
  private calculatePaymentProbabilityForWeek(
    invoice: any,
    weekEndDate: Date,
    clientProfiles: any[],
    scenarioType: string
  ): number {
    const client = clientProfiles.find(c => c.client_name === invoice.client_name)
    const daysFromDue = Math.floor((weekEndDate.getTime() - new Date(invoice.due_date).getTime()) / (1000 * 60 * 60 * 24))
    
    let baseProbability = invoice.payment_probability || 50

    // Adjust based on client payment behavior
    if (client) {
      const clientReliability = client.payment_reliability_score || 50
      baseProbability = (baseProbability + clientReliability) / 2

      // Factor in typical payment days
      const avgPaymentDays = client.avg_payment_days || 30
      const daysFromInvoice = Math.floor((weekEndDate.getTime() - new Date(invoice.issue_date).getTime()) / (1000 * 60 * 60 * 24))
      
      if (daysFromInvoice >= avgPaymentDays - 3 && daysFromInvoice <= avgPaymentDays + 7) {
        baseProbability += 20 // Higher probability in typical payment window
      }
    }

    // Adjust for overdue invoices
    if (daysFromDue > 0) {
      baseProbability -= Math.min(daysFromDue * 2, 40) // Reduce probability for overdue
    }

    // Time decay - probability decreases for future weeks
    const weeksOut = Math.floor(Math.max(0, weekEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 7))
    if (weeksOut > 0) {
      baseProbability *= Math.pow(0.95, weeksOut) // 5% decay per week
    }

    return Math.max(0, Math.min(100, baseProbability)) / 100
  }

  // Check if expense is due in specific week
  private isExpenseDueInWeek(expense: any, weekEndDate: Date): boolean {
    const nextDueDate = new Date(expense.next_due_date)
    const weekStartDate = new Date(weekEndDate)
    weekStartDate.setDate(weekStartDate.getDate() - 6) // Week starts 6 days before end

    return nextDueDate >= weekStartDate && nextDueDate <= weekEndDate
  }

  // Generate intelligent insights from forecast data
  private generateKeyInsights(scenarios: ForecastScenario[], data: any): CashFlowInsight[] {
    const insights: CashFlowInsight[] = []
    const realisticScenario = scenarios.find(s => s.type === 'realistic') || scenarios[0]

    // Cash runway insight
    const minCashWeek = realisticScenario.forecasts.find(f => f.cumulativePosition === realisticScenario.minimumCashPosition)
    if (minCashWeek && minCashWeek.cumulativePosition < 10000) {
      insights.push({
        type: 'risk',
        title: 'Critical Cash Flow Risk Detected',
        description: `Your cash position drops to $${minCashWeek.cumulativePosition.toLocaleString()} in week ending ${minCashWeek.weekEnding}`,
        impactAmount: minCashWeek.cumulativePosition,
        confidenceLevel: minCashWeek.confidenceScore,
        actionable: true,
        recommendedActions: [
          'Accelerate collection of overdue invoices',
          'Negotiate extended payment terms with vendors',
          'Consider emergency funding options'
        ],
        timeframe: minCashWeek.weekEnding
      })
    }

    // Payment pattern insight
    const { invoices, clientProfiles } = data
    const slowPayingClients = clientProfiles.filter(c => c.avg_payment_days > 45)
    if (slowPayingClients.length > 0) {
      const slowPayValue = invoices
        .filter((inv: any) => slowPayingClients.some(c => c.client_name === inv.client_name))
        .reduce((sum: number, inv: any) => sum + inv.amount, 0)

      insights.push({
        type: 'opportunity',
        title: 'Payment Acceleration Opportunity',
        description: `$${slowPayValue.toLocaleString()} in outstanding invoices from slow-paying clients`,
        impactAmount: slowPayValue * 0.7, // Potential to collect 70% faster
        confidenceLevel: 75,
        actionable: true,
        recommendedActions: [
          'Offer early payment discounts to slow-paying clients',
          'Implement more aggressive collection procedures',
          'Consider factoring for immediate cash'
        ],
        timeframe: '2-4 weeks'
      })
    }

    // Seasonal pattern insight
    const currentMonth = new Date().getMonth()
    if (currentMonth >= 10 || currentMonth <= 1) { // Q4/Q1 seasonal patterns
      insights.push({
        type: 'pattern',
        title: 'Seasonal Cash Flow Pattern',
        description: 'Q4/Q1 typically shows slower payment patterns - plan accordingly',
        impactAmount: realisticScenario.averageWeeklyBurn * 2,
        confidenceLevel: 85,
        actionable: true,
        recommendedActions: [
          'Build cash reserves during strong quarters',
          'Adjust payment terms for Q4/Q1 projects',
          'Increase collection efforts before holiday periods'
        ],
        timeframe: '4-12 weeks'
      })
    }

    return insights
  }

  // Generate critical alerts for immediate attention
  private generateCriticalAlerts(scenario: ForecastScenario): CashFlowAlert[] {
    const alerts: CashFlowAlert[] = []

    // Check for cash shortfalls
    const criticalWeeks = scenario.forecasts.filter(f => f.cumulativePosition < 5000)
    if (criticalWeeks.length > 0) {
      const firstCritical = criticalWeeks[0]
      const daysToImpact = Math.floor((new Date(firstCritical.weekEnding).getTime() - Date.now()) / (1000 * 60 * 60 * 24))

      alerts.push({
        severity: 'critical',
        type: 'cash_shortage',
        message: `URGENT: Cash position drops to $${firstCritical.cumulativePosition.toLocaleString()} on ${firstCritical.weekEnding}`,
        projectedDate: firstCritical.weekEnding,
        impactAmount: firstCritical.cumulativePosition,
        suggestedActions: [
          'Immediate collection of all overdue invoices',
          'Delay non-critical expenses',
          'Secure emergency line of credit',
          'Contact clients for early payment'
        ],
        daysToImpact
      })
    }

    // Check for negative cash flow weeks
    const negativeWeeks = scenario.forecasts.filter(f => f.netPosition < -5000)
    if (negativeWeeks.length > 0) {
      alerts.push({
        severity: 'high',
        type: 'negative_cash_flow',
        message: `${negativeWeeks.length} weeks with significant negative cash flow detected`,
        projectedDate: negativeWeeks[0].weekEnding,
        impactAmount: Math.min(...negativeWeeks.map(w => w.netPosition)),
        suggestedActions: [
          'Review and optimize expense timing',
          'Accelerate invoicing for completed work',
          'Consider interim financing options'
        ],
        daysToImpact: Math.floor((new Date(negativeWeeks[0].weekEnding).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      })
    }

    return alerts
  }

  // Generate actionable recommendations
  private generateRecommendations(scenarios: ForecastScenario[], data: any): CashFlowRecommendation[] {
    const recommendations: CashFlowRecommendation[] = []
    const realisticScenario = scenarios.find(s => s.type === 'realistic') || scenarios[0]

    // Payment terms optimization
    const { invoices, clientProfiles } = data
    const avgPaymentDays = clientProfiles.reduce((sum, c) => sum + (c.avg_payment_days || 30), 0) / clientProfiles.length
    
    if (avgPaymentDays > 35) {
      recommendations.push({
        category: 'payment_terms',
        priority: 'high',
        title: 'Optimize Payment Terms',
        description: `Average client payment time is ${Math.round(avgPaymentDays)} days - consider stricter terms`,
        estimatedImpact: realisticScenario.averageWeeklyBurn * 1.5,
        implementationEffort: 'medium',
        timeToImplement: '2-4 weeks',
        steps: [
          'Analyze client-by-client payment patterns',
          'Implement NET 15 terms for new projects',
          'Offer 2% discount for payments within 10 days',
          'Set up automatic payment reminders'
        ]
      })
    }

    // Collection optimization
    const overdueInvoices = invoices.filter((inv: any) => new Date(inv.due_date) < new Date())
    if (overdueInvoices.length > 0) {
      const overdueAmount = overdueInvoices.reduce((sum: number, inv: any) => sum + inv.amount, 0)
      
      recommendations.push({
        category: 'collection',
        priority: 'critical',
        title: 'Accelerate Collection Process',
        description: `$${overdueAmount.toLocaleString()} in overdue invoices needs immediate attention`,
        estimatedImpact: overdueAmount * 0.8,
        implementationEffort: 'low',
        timeToImplement: '1-2 weeks',
        steps: [
          'Send immediate collection notices to all overdue accounts',
          'Offer payment plans for large overdue amounts',
          'Implement daily follow-up calls for critical accounts',
          'Consider collection agency for accounts >90 days'
        ]
      })
    }

    return recommendations
  }

  // Helper methods for calculations
  private calculateConfidenceScore(weekOffset: number, invoices: any[], expenses: any[], paymentHistory: any[]): number {
    let baseConfidence = 85
    
    // Confidence decreases for future weeks
    baseConfidence -= weekOffset * 3
    
    // Confidence increases with more data
    if (paymentHistory.length > 50) baseConfidence += 10
    else if (paymentHistory.length < 10) baseConfidence -= 15
    
    return Math.max(20, Math.min(95, baseConfidence))
  }

  private determineRiskLevel(cumulativeCash: number, netPosition: number): 'low' | 'medium' | 'high' | 'critical' {
    if (cumulativeCash < 0) return 'critical'
    if (cumulativeCash < 5000 || netPosition < -10000) return 'high'
    if (cumulativeCash < 25000 || netPosition < -5000) return 'medium'
    return 'low'
  }

  private async calculateCashRunway(userId: string, currentCash: number): Promise<number> {
    try {
      const { data } = await supabase
        .rpc('calculate_cash_runway_days', {
          user_uuid: userId,
          current_cash_position: currentCash
        })
      
      return data || 0
    } catch (error) {
      console.error('[CASH-FLOW] Error calculating runway:', error)
      return 0
    }
  }

  private calculateSummaryMetrics(scenario: ForecastScenario, currentCash: number): CashFlowSummary {
    const projectedCashIn13Weeks = scenario.totalProjectedCash
    const totalInflow = scenario.forecasts.reduce((sum, f) => sum + f.projectedInflow, 0)
    const totalOutflow = scenario.forecasts.reduce((sum, f) => sum + f.projectedOutflow, 0)
    
    // Calculate health score (0-100)
    let healthScore = 70 // Base score
    if (scenario.minimumCashPosition > 50000) healthScore += 20
    else if (scenario.minimumCashPosition < 0) healthScore -= 40
    
    const avgConfidence = scenario.forecasts.reduce((sum, f) => sum + f.confidenceScore, 0) / scenario.forecasts.length
    healthScore += (avgConfidence - 75) / 5
    
    // Calculate risk score (0-100, higher = more risk)
    const riskScore = Math.max(0, 100 - healthScore)

    return {
      currentCashPosition: currentCash,
      projectedCashIn13Weeks,
      totalInflowNext13Weeks: totalInflow,
      totalOutflowNext13Weeks: totalOutflow,
      netCashFlow13Weeks: totalInflow - totalOutflow,
      cashRunwayDays: scenario.forecasts[scenario.forecasts.length - 1]?.cashRunwayDays || 0,
      riskScore: Math.round(riskScore),
      healthScore: Math.round(Math.max(0, Math.min(100, healthScore)))
    }
  }

  // Data retrieval methods
  private async getCurrentCashPosition(userId: string): Promise<number> {
    // In production, this would integrate with bank APIs
    // For now, return a mock value or user-entered amount
    return 45000 // Mock current cash position
  }

  private async getUnpaidInvoices(userId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('cash_flow_invoices')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['sent', 'viewed', 'overdue'])

    if (error) throw error
    return data || []
  }

  private async getRecurringExpenses(userId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('cash_flow_recurring_expenses')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)

    if (error) throw error
    return data || []
  }

  private async getPaymentHistory(userId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('cash_flow_payment_history')
      .select('*')
      .eq('user_id', userId)
      .order('payment_date', { ascending: false })
      .limit(200)

    if (error) throw error
    return data || []
  }

  private async getClientProfiles(userId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('cash_flow_client_profiles')
      .select('*')
      .eq('user_id', userId)

    if (error) throw error
    return data || []
  }

  // Save forecasts to database
  private async saveForecastsToDatabase(userId: string, scenarios: ForecastScenario[]): Promise<void> {
    try {
      for (const scenario of scenarios) {
        const forecastData = scenario.forecasts.map(forecast => ({
          user_id: userId,
          week_ending: forecast.weekEnding,
          forecast_type: scenario.type,
          projected_inflow: forecast.projectedInflow,
          projected_outflow: forecast.projectedOutflow,
          net_position: forecast.netPosition,
          cumulative_position: forecast.cumulativePosition,
          confidence_score: forecast.confidenceScore,
          risk_level: forecast.riskLevel,
          cash_runway_days: forecast.cashRunwayDays,
          seasonal_adjustment_factor: forecast.seasonalFactor,
          market_conditions_factor: forecast.marketFactor,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }))

        await supabase
          .from('cash_flow_forecasts')
          .upsert(forecastData, {
            onConflict: 'user_id,week_ending,forecast_type'
          })
      }
    } catch (error) {
      console.error('[CASH-FLOW] Error saving forecasts:', error)
    }
  }

  // Utility methods
  private getNextMonday(): string {
    const today = new Date()
    const nextMonday = new Date(today)
    nextMonday.setDate(today.getDate() + (1 + 7 - today.getDay()) % 7)
    return nextMonday.toISOString().split('T')[0]
  }

  private addWeeks(dateString: string, weeks: number): string {
    const date = new Date(dateString)
    date.setDate(date.getDate() + (weeks * 7))
    return date.toISOString().split('T')[0]
  }

  private getSeasonalAdjustmentFactor(weekEnding: string): number {
    const date = new Date(weekEnding)
    const month = date.getMonth()
    
    // Q4 holiday season - slower payments
    if (month >= 10 || month <= 0) return 0.85
    
    // Summer months - variable
    if (month >= 5 && month <= 7) return 0.95
    
    // Spring/Fall - normal
    return 1.0
  }

  private getMarketConditionsFactor(): number {
    // In production, this would factor in economic indicators
    return 1.0
  }

  private getScenarioName(type: string): string {
    const names = {
      conservative: 'Conservative (Safety First)',
      realistic: 'Realistic (Most Likely)',
      optimistic: 'Optimistic (Best Case)'
    }
    return names[type] || type
  }

  private getScenarioAssumptions(type: string): Record<string, any> {
    const assumptions = {
      conservative: {
        paymentDelayFactor: 1.3,
        collectionRate: 0.7,
        expenseBuffer: 1.1,
        description: 'Assumes slower payments, higher expenses, collection challenges'
      },
      realistic: {
        paymentDelayFactor: 1.0,
        collectionRate: 0.85,
        expenseBuffer: 1.0,
        description: 'Based on historical patterns and current trends'
      },
      optimistic: {
        paymentDelayFactor: 0.8,
        collectionRate: 0.95,
        expenseBuffer: 0.9,
        description: 'Assumes faster payments, cost savings, optimal conditions'
      }
    }
    return assumptions[type] || assumptions.realistic
  }
}

export const cashFlowForecastService = new CashFlowForecastService()