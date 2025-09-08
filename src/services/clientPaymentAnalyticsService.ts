import { supabase } from '@/lib/supabase'

export interface ClientPaymentScore {
  clientId: string
  userId: string
  overallScore: number
  scoreGrade: ScoreGrade
  riskLevel: RiskLevel
  componentScores: ComponentScores
  behaviorMetrics: PaymentBehaviorMetrics
  insights: PaymentInsight[]
  recommendations: ScoreRecommendation[]
  scoreHistory: ScoreHistoryPoint[]
  lastUpdated: string
  nextUpdateDue: string
}

export interface ComponentScores {
  paymentTimingScore: number        // 0-100: How consistently they pay on time
  reliabilityScore: number          // 0-100: Overall payment reliability
  communicationScore: number       // 0-100: How responsive they are
  volumeScore: number              // 0-100: Based on invoice volume and amounts
  relationshipScore: number        // 0-100: Length and depth of relationship
  financialStabilityScore: number  // 0-100: Inferred financial health
  disputeScore: number             // 0-100: How often they dispute invoices (inverted)
  growthScore: number              // 0-100: Growth in business volume
}

export interface PaymentBehaviorMetrics {
  averagePaymentDays: number
  paymentVariability: number           // Standard deviation of payment days
  onTimePaymentRate: number           // Percentage paid within terms
  earlyPaymentRate: number            // Percentage paid early
  latePaymentRate: number             // Percentage paid late
  averageLatenessDays: number         // Average days late when late
  longestDelayDays: number
  totalInvoicesIssued: number
  totalInvoicesPaid: number
  totalInvoicesDisputed: number
  averageInvoiceAmount: number
  largestInvoiceAmount: number
  totalAmountPaid: number
  preferredPaymentMethod: string
  communicationResponseTime: number   // Hours to respond to communications
  lastPaymentDate: string
  paymentFrequency: PaymentFrequency
  seasonalPatterns: SeasonalPaymentPattern[]
  paymentMethodHistory: PaymentMethodUsage[]
}

export interface PaymentFrequency {
  weekly: number
  monthly: number
  quarterly: number
  irregular: number
  averageDaysBetweenPayments: number
}

export interface SeasonalPaymentPattern {
  month: number
  averagePaymentDays: number
  paymentVolume: number
  onTimeRate: number
  notes?: string
}

export interface PaymentMethodUsage {
  method: string
  usage: number        // Percentage of payments
  averagePaymentDays: number
  preferenceScore: number
}

export interface PaymentInsight {
  type: InsightType
  title: string
  description: string
  impact: 'positive' | 'negative' | 'neutral'
  confidence: number      // 0-100
  actionable: boolean
  relatedMetrics: string[]
  timeframe?: string
}

export interface ScoreRecommendation {
  type: RecommendationType
  title: string
  description: string
  expectedImpact: string
  difficulty: 'easy' | 'medium' | 'hard'
  timeToImplement: string
  priority: 'low' | 'medium' | 'high'
  estimatedScoreImprovement?: number
}

export interface ScoreHistoryPoint {
  date: string
  overallScore: number
  componentScores: ComponentScores
  significantChanges: string[]
  triggerEvents: string[]
}

export interface ClientSegment {
  segmentId: string
  name: string
  description: string
  criteria: SegmentCriteria
  clients: string[]
  averageScore: number
  characteristics: string[]
  recommendations: string[]
}

export interface SegmentCriteria {
  scoreRange?: { min: number; max: number }
  riskLevels?: RiskLevel[]
  paymentBehaviors?: string[]
  industryTypes?: string[]
  relationshipLength?: { min?: number; max?: number }
  averageInvoiceAmount?: { min?: number; max?: number }
}

export interface BehaviorTrendAnalysis {
  clientId: string
  period: { start: string; end: string }
  trends: BehaviorTrend[]
  predictions: BehaviorPrediction[]
  riskIndicators: RiskIndicator[]
  opportunities: OpportunityIndicator[]
}

export interface BehaviorTrend {
  metric: string
  direction: 'improving' | 'declining' | 'stable'
  magnitude: number      // Rate of change
  confidence: number     // 0-100
  description: string
}

export interface BehaviorPrediction {
  metric: string
  predictedValue: number
  timeframe: string
  confidence: number
  factors: string[]
}

export interface RiskIndicator {
  type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  probability: number    // 0-100
  potentialImpact: number
  mitigation: string[]
}

export interface OpportunityIndicator {
  type: string
  description: string
  potentialValue: number
  probability: number    // 0-100
  actions: string[]
}

export type ScoreGrade = 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D+' | 'D' | 'F'
export type RiskLevel = 'very_low' | 'low' | 'medium' | 'high' | 'very_high'
export type InsightType = 
  | 'payment_improvement' 
  | 'payment_decline' 
  | 'seasonal_pattern' 
  | 'method_preference' 
  | 'communication_issue' 
  | 'growth_opportunity'
export type RecommendationType = 
  | 'payment_terms_adjustment' 
  | 'communication_improvement' 
  | 'incentive_offer' 
  | 'relationship_building' 
  | 'risk_mitigation'

class ClientPaymentAnalyticsService {
  
  // Main scoring function
  async calculateClientScore(clientId: string): Promise<ClientPaymentScore> {
    try {
      // Get client data
      const { data: client, error: clientError } = await supabase
        .from('cash_flow_clients')
        .select('*')
        .eq('id', clientId)
        .single()

      if (clientError || !client) {
        throw new Error('Client not found')
      }

      // Get payment history
      const paymentHistory = await this.getClientPaymentHistory(clientId)
      
      // Calculate behavior metrics
      const behaviorMetrics = this.calculateBehaviorMetrics(paymentHistory)
      
      // Calculate component scores
      const componentScores = await this.calculateComponentScores(client, behaviorMetrics, paymentHistory)
      
      // Calculate overall score
      const overallScore = this.calculateOverallScore(componentScores)
      
      // Determine grade and risk level
      const scoreGrade = this.determineScoreGrade(overallScore)
      const riskLevel = this.determineRiskLevel(overallScore, componentScores)
      
      // Generate insights
      const insights = await this.generatePaymentInsights(client, behaviorMetrics, componentScores)
      
      // Generate recommendations
      const recommendations = await this.generateScoreRecommendations(client, componentScores, behaviorMetrics)
      
      // Get score history
      const scoreHistory = await this.getScoreHistory(clientId)
      
      const clientScore: ClientPaymentScore = {
        clientId,
        userId: client.user_id,
        overallScore: Math.round(overallScore * 100) / 100,
        scoreGrade,
        riskLevel,
        componentScores,
        behaviorMetrics,
        insights,
        recommendations,
        scoreHistory,
        lastUpdated: new Date().toISOString(),
        nextUpdateDue: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
      }

      // Store the calculated score
      await this.storeClientScore(clientScore)

      return clientScore

    } catch (error) {
      console.error('[CLIENT-ANALYTICS] Error calculating client score:', error)
      throw error
    }
  }

  // Analyze payment behavior trends
  async analyzeBehaviorTrends(clientId: string, months: number = 12): Promise<BehaviorTrendAnalysis> {
    try {
      const endDate = new Date()
      const startDate = new Date()
      startDate.setMonth(startDate.getMonth() - months)

      // Get historical data
      const paymentHistory = await this.getClientPaymentHistory(clientId, startDate, endDate)
      
      // Calculate trends for key metrics
      const trends = this.calculateBehaviorTrends(paymentHistory)
      
      // Generate predictions
      const predictions = this.generateBehaviorPredictions(paymentHistory, trends)
      
      // Identify risks and opportunities
      const riskIndicators = this.identifyRiskIndicators(trends, paymentHistory)
      const opportunities = this.identifyOpportunities(trends, paymentHistory)

      return {
        clientId,
        period: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        },
        trends,
        predictions,
        riskIndicators,
        opportunities
      }

    } catch (error) {
      console.error('[CLIENT-ANALYTICS] Error analyzing behavior trends:', error)
      throw error
    }
  }

  // Segment clients based on payment behavior
  async segmentClients(userId: string): Promise<ClientSegment[]> {
    try {
      // Get all client scores
      const { data: clientScores, error } = await supabase
        .from('cash_flow_client_scores')
        .select('*')
        .eq('user_id', userId)

      if (error) throw error

      const scores = clientScores || []

      // Define segment criteria
      const segments: ClientSegment[] = [
        {
          segmentId: 'excellent_payers',
          name: 'Excellent Payers',
          description: 'Consistently pay early or on time with high reliability',
          criteria: {
            scoreRange: { min: 85, max: 100 },
            riskLevels: ['very_low', 'low']
          },
          clients: [],
          averageScore: 0,
          characteristics: ['Pay early or on time', 'High reliability', 'Low risk'],
          recommendations: ['Offer volume discounts', 'Prioritize for new services']
        },
        {
          segmentId: 'reliable_payers',
          name: 'Reliable Payers',
          description: 'Generally pay on time with good communication',
          criteria: {
            scoreRange: { min: 70, max: 84 },
            riskLevels: ['low', 'medium']
          },
          clients: [],
          averageScore: 0,
          characteristics: ['Mostly on-time payments', 'Good communication', 'Medium risk'],
          recommendations: ['Monitor closely', 'Offer early payment incentives']
        },
        {
          segmentId: 'slow_payers',
          name: 'Slow Payers',
          description: 'Often pay late but eventually pay full amounts',
          criteria: {
            scoreRange: { min: 50, max: 69 },
            riskLevels: ['medium', 'high']
          },
          clients: [],
          averageScore: 0,
          characteristics: ['Frequent late payments', 'Eventually pays full amount', 'Moderate risk'],
          recommendations: ['Implement payment plans', 'Increase communication frequency']
        },
        {
          segmentId: 'problem_payers',
          name: 'Problem Payers',
          description: 'Consistently late, poor communication, or partial payments',
          criteria: {
            scoreRange: { min: 0, max: 49 },
            riskLevels: ['high', 'very_high']
          },
          clients: [],
          averageScore: 0,
          characteristics: ['Very late payments', 'Poor communication', 'High risk'],
          recommendations: ['Require upfront payment', 'Consider credit terms adjustment']
        }
      ]

      // Assign clients to segments
      for (const score of scores) {
        for (const segment of segments) {
          const { min = 0, max = 100 } = segment.criteria.scoreRange || {}
          if (score.overall_score >= min && score.overall_score <= max) {
            segment.clients.push(score.client_id)
            break
          }
        }
      }

      // Calculate average scores for each segment
      segments.forEach(segment => {
        const segmentScores = scores.filter(score => segment.clients.includes(score.client_id))
        segment.averageScore = segmentScores.length > 0
          ? Math.round((segmentScores.reduce((sum, s) => sum + s.overall_score, 0) / segmentScores.length) * 100) / 100
          : 0
      })

      return segments

    } catch (error) {
      console.error('[CLIENT-ANALYTICS] Error segmenting clients:', error)
      return []
    }
  }

  // Bulk update all client scores
  async updateAllClientScores(userId: string): Promise<{ updated: number; errors: number }> {
    try {
      let updated = 0
      let errors = 0

      // Get all clients for the user
      const { data: clients, error } = await supabase
        .from('cash_flow_clients')
        .select('id')
        .eq('user_id', userId)

      if (error) throw error

      // Update each client score
      for (const client of clients || []) {
        try {
          await this.calculateClientScore(client.id)
          updated++
        } catch (error) {
          console.error(`Error updating score for client ${client.id}:`, error)
          errors++
        }
      }

      return { updated, errors }

    } catch (error) {
      console.error('[CLIENT-ANALYTICS] Error updating all client scores:', error)
      return { updated: 0, errors: 1 }
    }
  }

  // Private helper methods
  private async getClientPaymentHistory(clientId: string, startDate?: Date, endDate?: Date): Promise<any[]> {
    let query = supabase
      .from('cash_flow_payment_history')
      .select(`
        *,
        cash_flow_invoices!inner(
          id, invoice_number, total_amount, issue_date, due_date, status, client_id
        )
      `)
      .eq('cash_flow_invoices.client_id', clientId)
      .order('payment_date', { ascending: false })

    if (startDate) {
      query = query.gte('payment_date', startDate.toISOString())
    }

    if (endDate) {
      query = query.lte('payment_date', endDate.toISOString())
    }

    const { data: payments, error } = await query

    if (error) {
      console.error('Error fetching payment history:', error)
      return []
    }

    return payments || []
  }

  private calculateBehaviorMetrics(paymentHistory: any[]): PaymentBehaviorMetrics {
    if (paymentHistory.length === 0) {
      return this.getDefaultBehaviorMetrics()
    }

    const payments = paymentHistory.filter(p => p.status === 'completed')
    const paymentDelays = payments.map(payment => {
      const issueDate = new Date(payment.cash_flow_invoices.issue_date)
      const dueDate = new Date(payment.cash_flow_invoices.due_date)
      const paymentDate = new Date(payment.payment_date)
      
      return Math.ceil((paymentDate.getTime() - issueDate.getTime()) / (1000 * 60 * 60 * 24))
    })

    const paymentTerms = payments.map(payment => {
      const dueDate = new Date(payment.cash_flow_invoices.due_date)
      const paymentDate = new Date(payment.payment_date)
      
      return Math.ceil((paymentDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
    })

    const averagePaymentDays = paymentDelays.reduce((sum, days) => sum + days, 0) / paymentDelays.length
    const paymentVariability = this.calculateStandardDeviation(paymentDelays)
    
    const onTimePayments = paymentTerms.filter(days => days <= 0).length
    const earlyPayments = paymentTerms.filter(days => days < 0).length
    const latePayments = paymentTerms.filter(days => days > 0).length
    
    const latePaymentDays = paymentTerms.filter(days => days > 0)
    const averageLatenessDays = latePaymentDays.length > 0 
      ? latePaymentDays.reduce((sum, days) => sum + days, 0) / latePaymentDays.length 
      : 0
    
    const longestDelayDays = Math.max(...paymentTerms, 0)
    
    // Calculate payment method preferences
    const methodUsage = payments.reduce((acc, payment) => {
      acc[payment.payment_method] = (acc[payment.payment_method] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const preferredPaymentMethod = Object.entries(methodUsage)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'unknown'

    // Calculate seasonal patterns
    const seasonalPatterns = this.calculateSeasonalPatterns(payments)
    
    // Calculate payment method history
    const paymentMethodHistory = this.calculatePaymentMethodHistory(payments)

    return {
      averagePaymentDays: Math.round(averagePaymentDays * 100) / 100,
      paymentVariability: Math.round(paymentVariability * 100) / 100,
      onTimePaymentRate: Math.round((onTimePayments / payments.length) * 10000) / 100,
      earlyPaymentRate: Math.round((earlyPayments / payments.length) * 10000) / 100,
      latePaymentRate: Math.round((latePayments / payments.length) * 10000) / 100,
      averageLatenessDays: Math.round(averageLatenessDays * 100) / 100,
      longestDelayDays,
      totalInvoicesIssued: paymentHistory.length,
      totalInvoicesPaid: payments.length,
      totalInvoicesDisputed: 0, // Would need dispute tracking
      averageInvoiceAmount: Math.round((payments.reduce((sum, p) => sum + p.cash_flow_invoices.total_amount, 0) / payments.length) * 100) / 100,
      largestInvoiceAmount: Math.max(...payments.map(p => p.cash_flow_invoices.total_amount)),
      totalAmountPaid: Math.round(payments.reduce((sum, p) => sum + p.amount, 0) * 100) / 100,
      preferredPaymentMethod,
      communicationResponseTime: 24, // Would need communication tracking
      lastPaymentDate: payments[0]?.payment_date || '',
      paymentFrequency: {
        weekly: 0,
        monthly: 75,
        quarterly: 25,
        irregular: 0,
        averageDaysBetweenPayments: 30
      },
      seasonalPatterns,
      paymentMethodHistory
    }
  }

  private async calculateComponentScores(client: any, metrics: PaymentBehaviorMetrics, history: any[]): Promise<ComponentScores> {
    // Payment Timing Score (0-100)
    const paymentTimingScore = Math.max(0, 100 - (metrics.averagePaymentDays - 30) * 2)
    
    // Reliability Score (0-100)
    const reliabilityScore = metrics.onTimePaymentRate * 0.6 + 
                            (100 - metrics.paymentVariability) * 0.4
    
    // Communication Score (0-100)
    const communicationScore = Math.max(0, 100 - (metrics.communicationResponseTime - 24) * 2)
    
    // Volume Score (0-100) - based on invoice frequency and amounts
    const volumeScore = Math.min(100, metrics.totalInvoicesPaid * 2 + 
                               (metrics.averageInvoiceAmount / 1000) * 5)
    
    // Relationship Score (0-100) - based on history length and consistency
    const relationshipMonths = this.calculateRelationshipLength(history)
    const relationshipScore = Math.min(100, relationshipMonths * 3)
    
    // Financial Stability Score (0-100) - inferred from payment patterns
    const stabilityScore = (100 - metrics.paymentVariability) * 0.5 + 
                          metrics.onTimePaymentRate * 0.5
    
    // Dispute Score (0-100) - inverted dispute rate
    const disputeScore = Math.max(0, 100 - (metrics.totalInvoicesDisputed / metrics.totalInvoicesIssued) * 100)
    
    // Growth Score (0-100) - based on business growth
    const growthScore = this.calculateGrowthScore(history)

    return {
      paymentTimingScore: Math.min(100, Math.max(0, Math.round(paymentTimingScore * 100) / 100)),
      reliabilityScore: Math.min(100, Math.max(0, Math.round(reliabilityScore * 100) / 100)),
      communicationScore: Math.min(100, Math.max(0, Math.round(communicationScore * 100) / 100)),
      volumeScore: Math.min(100, Math.max(0, Math.round(volumeScore * 100) / 100)),
      relationshipScore: Math.min(100, Math.max(0, Math.round(relationshipScore * 100) / 100)),
      financialStabilityScore: Math.min(100, Math.max(0, Math.round(stabilityScore * 100) / 100)),
      disputeScore: Math.min(100, Math.max(0, Math.round(disputeScore * 100) / 100)),
      growthScore: Math.min(100, Math.max(0, Math.round(growthScore * 100) / 100))
    }
  }

  private calculateOverallScore(scores: ComponentScores): number {
    // Weighted average of component scores
    const weights = {
      paymentTimingScore: 0.25,
      reliabilityScore: 0.20,
      communicationScore: 0.10,
      volumeScore: 0.15,
      relationshipScore: 0.10,
      financialStabilityScore: 0.15,
      disputeScore: 0.03,
      growthScore: 0.02
    }

    return Object.entries(weights).reduce((total, [key, weight]) => {
      return total + (scores[key as keyof ComponentScores] * weight)
    }, 0)
  }

  private determineScoreGrade(score: number): ScoreGrade {
    if (score >= 95) return 'A+'
    if (score >= 90) return 'A'
    if (score >= 85) return 'B+'
    if (score >= 80) return 'B'
    if (score >= 75) return 'C+'
    if (score >= 70) return 'C'
    if (score >= 65) return 'D+'
    if (score >= 60) return 'D'
    return 'F'
  }

  private determineRiskLevel(score: number, componentScores: ComponentScores): RiskLevel {
    if (score >= 85 && componentScores.reliabilityScore >= 80) return 'very_low'
    if (score >= 75 && componentScores.reliabilityScore >= 70) return 'low'
    if (score >= 60 && componentScores.reliabilityScore >= 60) return 'medium'
    if (score >= 45) return 'high'
    return 'very_high'
  }

  private async generatePaymentInsights(client: any, metrics: PaymentBehaviorMetrics, scores: ComponentScores): Promise<PaymentInsight[]> {
    const insights: PaymentInsight[] = []

    // Payment timing insights
    if (metrics.averagePaymentDays <= 25) {
      insights.push({
        type: 'payment_improvement',
        title: 'Excellent Payment Timing',
        description: `Client pays invoices in ${metrics.averagePaymentDays.toFixed(1)} days on average, which is ahead of typical terms`,
        impact: 'positive',
        confidence: 95,
        actionable: false,
        relatedMetrics: ['averagePaymentDays', 'onTimePaymentRate']
      })
    } else if (metrics.averagePaymentDays > 45) {
      insights.push({
        type: 'payment_decline',
        title: 'Slower Payment Pattern',
        description: `Client takes ${metrics.averagePaymentDays.toFixed(1)} days to pay on average, which may impact cash flow`,
        impact: 'negative',
        confidence: 85,
        actionable: true,
        relatedMetrics: ['averagePaymentDays', 'latePaymentRate']
      })
    }

    // Consistency insights
    if (metrics.paymentVariability < 5) {
      insights.push({
        type: 'payment_improvement',
        title: 'Highly Consistent Payments',
        description: 'Client shows very consistent payment timing with low variability',
        impact: 'positive',
        confidence: 90,
        actionable: false,
        relatedMetrics: ['paymentVariability']
      })
    } else if (metrics.paymentVariability > 15) {
      insights.push({
        type: 'payment_decline',
        title: 'Inconsistent Payment Pattern',
        description: 'Client shows high variability in payment timing, making cash flow prediction difficult',
        impact: 'negative',
        confidence: 80,
        actionable: true,
        relatedMetrics: ['paymentVariability']
      })
    }

    // Seasonal patterns
    if (metrics.seasonalPatterns.length > 0) {
      const worstMonth = metrics.seasonalPatterns.reduce((worst, pattern) => 
        pattern.averagePaymentDays > worst.averagePaymentDays ? pattern : worst
      )
      
      insights.push({
        type: 'seasonal_pattern',
        title: 'Seasonal Payment Variation',
        description: `Payments are typically slower in month ${worstMonth.month} (${worstMonth.averagePaymentDays.toFixed(1)} days average)`,
        impact: 'neutral',
        confidence: 70,
        actionable: true,
        relatedMetrics: ['seasonalPatterns'],
        timeframe: 'monthly'
      })
    }

    return insights
  }

  private async generateScoreRecommendations(client: any, scores: ComponentScores, metrics: PaymentBehaviorMetrics): Promise<ScoreRecommendation[]> {
    const recommendations: ScoreRecommendation[] = []

    // Payment timing recommendations
    if (scores.paymentTimingScore < 70) {
      recommendations.push({
        type: 'payment_terms_adjustment',
        title: 'Adjust Payment Terms',
        description: 'Consider offering extended payment terms or payment plans to improve payment consistency',
        expectedImpact: 'Reduced late payments and improved client satisfaction',
        difficulty: 'easy',
        timeToImplement: '1 week',
        priority: 'high',
        estimatedScoreImprovement: 15
      })
    }

    // Early payment incentive
    if (scores.paymentTimingScore >= 60 && metrics.averagePaymentDays > 30) {
      recommendations.push({
        type: 'incentive_offer',
        title: 'Early Payment Incentive',
        description: 'Offer 2% discount for payments within 10 days to encourage faster payments',
        expectedImpact: 'Accelerate cash flow by 10-15 days',
        difficulty: 'medium',
        timeToImplement: '2 weeks',
        priority: 'medium',
        estimatedScoreImprovement: 10
      })
    }

    // Communication improvement
    if (scores.communicationScore < 70) {
      recommendations.push({
        type: 'communication_improvement',
        title: 'Improve Communication',
        description: 'Implement automated payment reminders and establish regular communication schedule',
        expectedImpact: 'Better payment predictability and stronger relationship',
        difficulty: 'medium',
        timeToImplement: '1-2 weeks',
        priority: 'medium',
        estimatedScoreImprovement: 8
      })
    }

    // Relationship building for high-value clients
    if (metrics.averageInvoiceAmount > 5000 && scores.relationshipScore < 80) {
      recommendations.push({
        type: 'relationship_building',
        title: 'Strengthen Client Relationship',
        description: 'Schedule regular check-ins and consider VIP client benefits to strengthen the relationship',
        expectedImpact: 'Improved payment reliability and potential for business growth',
        difficulty: 'hard',
        timeToImplement: '1 month',
        priority: 'low',
        estimatedScoreImprovement: 12
      })
    }

    return recommendations.sort((a, b) => {
      const priorityWeight = { high: 3, medium: 2, low: 1 }
      return priorityWeight[b.priority] - priorityWeight[a.priority]
    })
  }

  // Helper calculation methods
  private calculateStandardDeviation(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length
    const squaredDifferences = values.map(val => Math.pow(val - mean, 2))
    const variance = squaredDifferences.reduce((sum, val) => sum + val, 0) / values.length
    return Math.sqrt(variance)
  }

  private calculateSeasonalPatterns(payments: any[]): SeasonalPaymentPattern[] {
    const monthlyData: Record<number, { days: number[], amounts: number[] }> = {}
    
    payments.forEach(payment => {
      const paymentDate = new Date(payment.payment_date)
      const issueDate = new Date(payment.cash_flow_invoices.issue_date)
      const daysToPay = Math.ceil((paymentDate.getTime() - issueDate.getTime()) / (1000 * 60 * 60 * 24))
      const month = paymentDate.getMonth()
      
      if (!monthlyData[month]) {
        monthlyData[month] = { days: [], amounts: [] }
      }
      
      monthlyData[month].days.push(daysToPay)
      monthlyData[month].amounts.push(payment.amount)
    })

    return Object.entries(monthlyData).map(([month, data]) => ({
      month: parseInt(month),
      averagePaymentDays: Math.round((data.days.reduce((sum, days) => sum + days, 0) / data.days.length) * 100) / 100,
      paymentVolume: data.amounts.length,
      onTimeRate: Math.round((data.days.filter(days => days <= 30).length / data.days.length) * 10000) / 100
    }))
  }

  private calculatePaymentMethodHistory(payments: any[]): PaymentMethodUsage[] {
    const methodData: Record<string, { count: number, totalDays: number }> = {}
    
    payments.forEach(payment => {
      const method = payment.payment_method
      const paymentDate = new Date(payment.payment_date)
      const issueDate = new Date(payment.cash_flow_invoices.issue_date)
      const daysToPay = Math.ceil((paymentDate.getTime() - issueDate.getTime()) / (1000 * 60 * 60 * 24))
      
      if (!methodData[method]) {
        methodData[method] = { count: 0, totalDays: 0 }
      }
      
      methodData[method].count++
      methodData[method].totalDays += daysToPay
    })

    const totalPayments = payments.length
    
    return Object.entries(methodData).map(([method, data]) => ({
      method,
      usage: Math.round((data.count / totalPayments) * 10000) / 100,
      averagePaymentDays: Math.round((data.totalDays / data.count) * 100) / 100,
      preferenceScore: Math.min(100, (data.count / totalPayments) * 200)
    }))
  }

  private calculateRelationshipLength(history: any[]): number {
    if (history.length === 0) return 0
    
    const oldestPayment = history[history.length - 1]
    const newestPayment = history[0]
    
    const oldestDate = new Date(oldestPayment.cash_flow_invoices.issue_date)
    const newestDate = new Date(newestPayment.cash_flow_invoices.issue_date)
    
    return Math.ceil((newestDate.getTime() - oldestDate.getTime()) / (1000 * 60 * 60 * 24 * 30))
  }

  private calculateGrowthScore(history: any[]): number {
    if (history.length < 6) return 50 // Not enough data
    
    const recentHalf = history.slice(0, Math.floor(history.length / 2))
    const olderHalf = history.slice(Math.floor(history.length / 2))
    
    const recentAverage = recentHalf.reduce((sum, p) => sum + p.cash_flow_invoices.total_amount, 0) / recentHalf.length
    const olderAverage = olderHalf.reduce((sum, p) => sum + p.cash_flow_invoices.total_amount, 0) / olderHalf.length
    
    const growthRate = ((recentAverage - olderAverage) / olderAverage) * 100
    
    return Math.max(0, Math.min(100, 50 + growthRate))
  }

  private calculateBehaviorTrends(history: any[]): BehaviorTrend[] {
    // This would implement sophisticated trend analysis
    // For now, returning placeholder data
    return [
      {
        metric: 'payment_timing',
        direction: 'stable',
        magnitude: 0.5,
        confidence: 85,
        description: 'Payment timing has remained relatively stable over the past 6 months'
      }
    ]
  }

  private generateBehaviorPredictions(history: any[], trends: BehaviorTrend[]): BehaviorPrediction[] {
    // This would implement predictive modeling
    // For now, returning placeholder data
    return [
      {
        metric: 'average_payment_days',
        predictedValue: 32,
        timeframe: 'next_3_months',
        confidence: 75,
        factors: ['historical_pattern', 'seasonal_adjustment']
      }
    ]
  }

  private identifyRiskIndicators(trends: BehaviorTrend[], history: any[]): RiskIndicator[] {
    const indicators: RiskIndicator[] = []
    
    // Add risk indicators based on trends and history
    // For now, returning placeholder data
    if (history.length > 0) {
      const recentPayments = history.slice(0, 5)
      const avgDays = recentPayments.reduce((sum, p) => {
        const paymentDate = new Date(p.payment_date)
        const issueDate = new Date(p.cash_flow_invoices.issue_date)
        return sum + Math.ceil((paymentDate.getTime() - issueDate.getTime()) / (1000 * 60 * 60 * 24))
      }, 0) / recentPayments.length

      if (avgDays > 45) {
        indicators.push({
          type: 'payment_delay_risk',
          severity: 'medium',
          description: 'Recent payments are trending slower than historical average',
          probability: 70,
          potentialImpact: 5000,
          mitigation: ['Implement payment reminders', 'Offer payment plans']
        })
      }
    }
    
    return indicators
  }

  private identifyOpportunities(trends: BehaviorTrend[], history: any[]): OpportunityIndicator[] {
    // This would identify opportunities based on behavior patterns
    return [
      {
        type: 'early_payment_opportunity',
        description: 'Client shows potential for early payment incentive program',
        potentialValue: 2500,
        probability: 60,
        actions: ['Offer early payment discount', 'Implement automated incentives']
      }
    ]
  }

  private async storeClientScore(score: ClientPaymentScore): Promise<void> {
    await supabase
      .from('cash_flow_client_scores')
      .upsert([{
        client_id: score.clientId,
        user_id: score.userId,
        overall_score: score.overallScore,
        score_grade: score.scoreGrade,
        risk_level: score.riskLevel,
        component_scores: score.componentScores,
        behavior_metrics: score.behaviorMetrics,
        insights: score.insights,
        recommendations: score.recommendations,
        last_updated: score.lastUpdated,
        next_update_due: score.nextUpdateDue
      }])
  }

  private async getScoreHistory(clientId: string): Promise<ScoreHistoryPoint[]> {
    const { data: history, error } = await supabase
      .from('cash_flow_score_history')
      .select('*')
      .eq('client_id', clientId)
      .order('date', { ascending: false })
      .limit(12)

    if (error) {
      console.error('Error fetching score history:', error)
      return []
    }

    return (history || []).map(point => ({
      date: point.date,
      overallScore: point.overall_score,
      componentScores: point.component_scores,
      significantChanges: point.significant_changes || [],
      triggerEvents: point.trigger_events || []
    }))
  }

  private getDefaultBehaviorMetrics(): PaymentBehaviorMetrics {
    return {
      averagePaymentDays: 30,
      paymentVariability: 0,
      onTimePaymentRate: 0,
      earlyPaymentRate: 0,
      latePaymentRate: 0,
      averageLatenessDays: 0,
      longestDelayDays: 0,
      totalInvoicesIssued: 0,
      totalInvoicesPaid: 0,
      totalInvoicesDisputed: 0,
      averageInvoiceAmount: 0,
      largestInvoiceAmount: 0,
      totalAmountPaid: 0,
      preferredPaymentMethod: 'unknown',
      communicationResponseTime: 24,
      lastPaymentDate: '',
      paymentFrequency: {
        weekly: 0,
        monthly: 0,
        quarterly: 0,
        irregular: 0,
        averageDaysBetweenPayments: 30
      },
      seasonalPatterns: [],
      paymentMethodHistory: []
    }
  }
}

export const clientPaymentAnalyticsService = new ClientPaymentAnalyticsService()