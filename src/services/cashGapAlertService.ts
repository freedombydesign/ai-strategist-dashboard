import { supabase } from '@/lib/supabase'
import { cashFlowForecastService } from './cashFlowForecastService'

export interface CashGapAlert {
  id?: string
  userId: string
  alertType: AlertType
  severity: AlertSeverity
  title: string
  description: string
  projectedShortfall: number
  projectedDate: string
  weekNumber: number
  triggers: AlertTrigger[]
  recommendations: AlertRecommendation[]
  status: AlertStatus
  metadata: AlertMetadata
  createdAt?: string
  updatedAt?: string
  acknowledgedAt?: string
  resolvedAt?: string
}

export interface AlertTrigger {
  type: TriggerType
  threshold: number
  actualValue: number
  description: string
}

export interface AlertRecommendation {
  type: RecommendationType
  title: string
  description: string
  impact: string
  urgency: 'low' | 'medium' | 'high' | 'critical'
  estimatedImprovement: number
  timeToImplement: string
  difficulty: 'easy' | 'medium' | 'hard'
}

export interface AlertMetadata {
  currentCashPosition: number
  projectedMinimumCash: number
  daysUntilShortfall: number
  affectedWeeks: number[]
  confidenceLevel: number
  scenarioType: 'conservative' | 'realistic' | 'optimistic'
  contributingFactors: string[]
}

export interface AlertSettings {
  userId: string
  minimumCashBuffer: number
  warningThresholdDays: number
  criticalThresholdDays: number
  enableEmailNotifications: boolean
  enableSmsNotifications: boolean
  enableSlackNotifications: boolean
  notificationTiming: NotificationTiming[]
  customRules: CustomAlertRule[]
}

export interface NotificationTiming {
  daysBeforeShortfall: number
  repeatInterval: 'daily' | 'weekly' | 'once'
  channels: NotificationChannel[]
}

export interface CustomAlertRule {
  name: string
  condition: string
  threshold: number
  operator: 'less_than' | 'greater_than' | 'equals'
  severity: AlertSeverity
  enabled: boolean
}

export type AlertType = 
  | 'cash_gap_warning' 
  | 'cash_gap_critical' 
  | 'payment_delay_risk' 
  | 'seasonal_cash_dip' 
  | 'expense_spike' 
  | 'revenue_drop' 
  | 'custom_threshold'

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical'

export type AlertStatus = 'active' | 'acknowledged' | 'resolved' | 'dismissed'

export type TriggerType = 
  | 'minimum_cash_breach' 
  | 'projected_negative_cash' 
  | 'buffer_threshold_breach' 
  | 'payment_delay_risk' 
  | 'large_expense_upcoming'

export type RecommendationType = 
  | 'accelerate_collections' 
  | 'delay_expenses' 
  | 'secure_financing' 
  | 'adjust_pricing' 
  | 'reduce_costs' 
  | 'negotiate_terms'

export type NotificationChannel = 'email' | 'sms' | 'slack' | 'in_app' | 'webhook'

class CashGapAlertService {
  
  // Main alert monitoring function
  async monitorCashGaps(userId: string): Promise<{ alerts: CashGapAlert[]; summary: any }> {
    try {
      // Get current cash flow forecast
      const forecast = await cashFlowForecastService.generateCashFlowForecast(userId, {
        includeScenarios: true,
        refreshData: true
      })

      // Get alert settings
      const settings = await this.getAlertSettings(userId)

      // Analyze for potential cash gaps
      const detectedAlerts: CashGapAlert[] = []

      // Check each scenario for cash gaps
      for (const scenario of ['conservative', 'realistic', 'optimistic'] as const) {
        const scenarioForecast = forecast.scenarios.find(s => s.scenario === scenario)
        if (!scenarioForecast) continue

        const scenarioAlerts = await this.analyzeScenarioForAlerts(
          userId, 
          scenarioForecast, 
          scenario, 
          settings
        )
        
        detectedAlerts.push(...scenarioAlerts)
      }

      // Remove duplicate alerts and prioritize
      const uniqueAlerts = this.deduplicateAndPrioritizeAlerts(detectedAlerts)

      // Store new alerts and update existing ones
      const processedAlerts = await this.processAndStoreAlerts(uniqueAlerts)

      // Send notifications for new critical alerts
      await this.sendNotifications(processedAlerts.filter(alert => 
        alert.severity === 'critical' && alert.status === 'active'
      ))

      // Generate monitoring summary
      const summary = this.generateAlertSummary(processedAlerts, forecast)

      return { alerts: processedAlerts, summary }

    } catch (error) {
      console.error('[CASH-GAP-ALERT] Error monitoring cash gaps:', error)
      return { alerts: [], summary: {} }
    }
  }

  // Analyze a specific scenario for potential alerts
  private async analyzeScenarioForAlerts(
    userId: string, 
    forecast: any, 
    scenarioType: 'conservative' | 'realistic' | 'optimistic',
    settings: AlertSettings
  ): Promise<CashGapAlert[]> {
    const alerts: CashGapAlert[] = []
    const weeks = forecast.weeklyBreakdown

    let currentCash = forecast.startingCash
    
    for (let i = 0; i < weeks.length; i++) {
      const week = weeks[i]
      const weekEndCash = currentCash + week.netCashFlow
      const daysUntilWeek = i * 7

      // Check for minimum cash buffer breach
      if (weekEndCash < settings.minimumCashBuffer) {
        const shortfall = settings.minimumCashBuffer - weekEndCash
        
        let severity: AlertSeverity
        let alertType: AlertType
        
        if (daysUntilWeek <= settings.criticalThresholdDays) {
          severity = 'critical'
          alertType = 'cash_gap_critical'
        } else if (daysUntilWeek <= settings.warningThresholdDays) {
          severity = 'high'
          alertType = 'cash_gap_warning'
        } else {
          severity = 'medium'
          alertType = 'cash_gap_warning'
        }

        // Generate specific recommendations for this alert
        const recommendations = await this.generateCashGapRecommendations(
          userId, 
          shortfall, 
          daysUntilWeek, 
          week
        )

        alerts.push({
          userId,
          alertType,
          severity,
          title: this.generateAlertTitle(alertType, shortfall, daysUntilWeek),
          description: this.generateAlertDescription(alertType, shortfall, week.weekEnding, scenarioType),
          projectedShortfall: shortfall,
          projectedDate: week.weekEnding,
          weekNumber: i + 1,
          triggers: [
            {
              type: 'minimum_cash_breach',
              threshold: settings.minimumCashBuffer,
              actualValue: weekEndCash,
              description: `Projected cash balance falls below minimum buffer of $${settings.minimumCashBuffer.toLocaleString()}`
            }
          ],
          recommendations,
          status: 'active',
          metadata: {
            currentCashPosition: forecast.startingCash,
            projectedMinimumCash: weekEndCash,
            daysUntilShortfall: daysUntilWeek,
            affectedWeeks: [i + 1],
            confidenceLevel: forecast.confidence,
            scenarioType,
            contributingFactors: this.identifyContributingFactors(week, forecast)
          }
        })
      }

      // Check for negative cash flow (cash gap)
      if (weekEndCash < 0) {
        const shortfall = Math.abs(weekEndCash)
        
        alerts.push({
          userId,
          alertType: 'cash_gap_critical',
          severity: 'critical',
          title: `Critical Cash Gap Alert - Week ${i + 1}`,
          description: `Projected negative cash position of $${shortfall.toLocaleString()} on ${week.weekEnding} (${scenarioType} scenario)`,
          projectedShortfall: shortfall,
          projectedDate: week.weekEnding,
          weekNumber: i + 1,
          triggers: [
            {
              type: 'projected_negative_cash',
              threshold: 0,
              actualValue: weekEndCash,
              description: 'Cash balance projected to go negative'
            }
          ],
          recommendations: await this.generateEmergencyCashRecommendations(userId, shortfall, daysUntilWeek),
          status: 'active',
          metadata: {
            currentCashPosition: forecast.startingCash,
            projectedMinimumCash: weekEndCash,
            daysUntilShortfall: daysUntilWeek,
            affectedWeeks: [i + 1],
            confidenceLevel: forecast.confidence,
            scenarioType,
            contributingFactors: this.identifyContributingFactors(week, forecast)
          }
        })
      }

      // Check for large expense spikes
      if (week.totalOutflow > forecast.averageWeeklyOutflow * 2) {
        const excessExpense = week.totalOutflow - forecast.averageWeeklyOutflow
        
        alerts.push({
          userId,
          alertType: 'expense_spike',
          severity: 'medium',
          title: `Expense Spike Alert - Week ${i + 1}`,
          description: `Unusually high expenses of $${week.totalOutflow.toLocaleString()} projected for week of ${week.weekEnding}`,
          projectedShortfall: 0,
          projectedDate: week.weekEnding,
          weekNumber: i + 1,
          triggers: [
            {
              type: 'large_expense_upcoming',
              threshold: forecast.averageWeeklyOutflow * 2,
              actualValue: week.totalOutflow,
              description: `Weekly expenses exceed average by $${excessExpense.toLocaleString()}`
            }
          ],
          recommendations: await this.generateExpenseManagementRecommendations(userId, excessExpense, week),
          status: 'active',
          metadata: {
            currentCashPosition: forecast.startingCash,
            projectedMinimumCash: weekEndCash,
            daysUntilShortfall: daysUntilWeek,
            affectedWeeks: [i + 1],
            confidenceLevel: forecast.confidence,
            scenarioType,
            contributingFactors: this.identifyContributingFactors(week, forecast)
          }
        })
      }

      // Check for revenue drop risks
      if (week.totalInflow < forecast.averageWeeklyInflow * 0.7) {
        const revenueShortfall = forecast.averageWeeklyInflow - week.totalInflow
        
        alerts.push({
          userId,
          alertType: 'revenue_drop',
          severity: 'medium',
          title: `Revenue Drop Alert - Week ${i + 1}`,
          description: `Projected revenue of $${week.totalInflow.toLocaleString()} is below average for week of ${week.weekEnding}`,
          projectedShortfall: revenueShortfall,
          projectedDate: week.weekEnding,
          weekNumber: i + 1,
          triggers: [
            {
              type: 'payment_delay_risk',
              threshold: forecast.averageWeeklyInflow * 0.7,
              actualValue: week.totalInflow,
              description: `Weekly revenue below 70% of average ($${revenueShortfall.toLocaleString()} shortfall)`
            }
          ],
          recommendations: await this.generateRevenueAccelerationRecommendations(userId, revenueShortfall, week),
          status: 'active',
          metadata: {
            currentCashPosition: forecast.startingCash,
            projectedMinimumCash: weekEndCash,
            daysUntilShortfall: daysUntilWeek,
            affectedWeeks: [i + 1],
            confidenceLevel: forecast.confidence,
            scenarioType,
            contributingFactors: this.identifyContributingFactors(week, forecast)
          }
        })
      }

      currentCash = weekEndCash
    }

    return alerts
  }

  // Generate cash gap specific recommendations
  private async generateCashGapRecommendations(
    userId: string, 
    shortfall: number, 
    daysUntil: number, 
    week: any
  ): Promise<AlertRecommendation[]> {
    const recommendations: AlertRecommendation[] = []
    
    // Get overdue invoices for acceleration opportunities
    const { data: overdueInvoices } = await supabase
      .from('cash_flow_invoices')
      .select('id, total_amount, due_date, status')
      .eq('user_id', userId)
      .in('status', ['overdue', 'sent', 'viewed'])
      .order('total_amount', { ascending: false })
      .limit(10)

    const overdueAmount = (overdueInvoices || []).reduce((sum, inv) => sum + inv.total_amount, 0)

    if (overdueAmount > shortfall * 0.5) {
      recommendations.push({
        type: 'accelerate_collections',
        title: 'Accelerate Outstanding Collections',
        description: `Focus on collecting $${overdueAmount.toLocaleString()} in overdue invoices to bridge the cash gap`,
        impact: `Could eliminate ${Math.min(100, (overdueAmount / shortfall) * 100).toFixed(0)}% of the projected shortfall`,
        urgency: daysUntil <= 14 ? 'critical' : daysUntil <= 30 ? 'high' : 'medium',
        estimatedImprovement: Math.min(overdueAmount, shortfall),
        timeToImplement: '1-2 weeks',
        difficulty: 'medium'
      })
    }

    // Expense delay recommendations
    if (week.totalOutflow > 0) {
      const deferableExpenses = week.totalOutflow * 0.3 // Assume 30% can be deferred
      
      recommendations.push({
        type: 'delay_expenses',
        title: 'Defer Non-Critical Expenses',
        description: `Identify and postpone approximately $${deferableExpenses.toLocaleString()} in non-essential expenses`,
        impact: `Could reduce cash outflow by up to ${((deferableExpenses / week.totalOutflow) * 100).toFixed(0)}%`,
        urgency: daysUntil <= 7 ? 'critical' : 'high',
        estimatedImprovement: deferableExpenses,
        timeToImplement: 'Immediate',
        difficulty: 'easy'
      })
    }

    // Financing recommendations for larger gaps
    if (shortfall > 10000) {
      recommendations.push({
        type: 'secure_financing',
        title: 'Secure Bridge Financing',
        description: `Consider line of credit or short-term financing to cover $${shortfall.toLocaleString()} shortfall`,
        impact: 'Immediate cash flow relief',
        urgency: daysUntil <= 14 ? 'critical' : 'medium',
        estimatedImprovement: shortfall,
        timeToImplement: '1-3 weeks',
        difficulty: 'hard'
      })
    }

    // Payment term renegotiation
    recommendations.push({
      type: 'negotiate_terms',
      title: 'Renegotiate Payment Terms',
      description: 'Contact key suppliers to extend payment terms or arrange payment plans',
      impact: 'Improve cash flow timing without additional costs',
      urgency: 'medium',
      estimatedImprovement: week.totalOutflow * 0.4,
      timeToImplement: '1-2 weeks',
      difficulty: 'medium'
    })

    return recommendations.sort((a, b) => {
      const urgencyWeight = { critical: 4, high: 3, medium: 2, low: 1 }
      return urgencyWeight[b.urgency] - urgencyWeight[a.urgency]
    })
  }

  // Generate emergency cash recommendations
  private async generateEmergencyCashRecommendations(
    userId: string, 
    shortfall: number, 
    daysUntil: number
  ): Promise<AlertRecommendation[]> {
    const recommendations: AlertRecommendation[] = []

    // Immediate collection focus
    recommendations.push({
      type: 'accelerate_collections',
      title: 'URGENT: Immediate Collection Blitz',
      description: 'Contact all outstanding clients immediately. Offer payment incentives if necessary',
      impact: 'Critical for avoiding cash crisis',
      urgency: 'critical',
      estimatedImprovement: shortfall * 0.6,
      timeToImplement: 'Immediate',
      difficulty: 'medium'
    })

    // Emergency financing
    recommendations.push({
      type: 'secure_financing',
      title: 'Emergency Credit Line',
      description: 'Contact bank immediately for emergency credit facility or advance against receivables',
      impact: 'Immediate cash injection',
      urgency: 'critical',
      estimatedImprovement: shortfall,
      timeToImplement: '3-7 days',
      difficulty: 'hard'
    })

    // Cost cutting
    recommendations.push({
      type: 'reduce_costs',
      title: 'Immediate Cost Reduction',
      description: 'Cancel or postpone all non-essential expenses and payments',
      impact: 'Preserve cash for critical operations',
      urgency: 'critical',
      estimatedImprovement: shortfall * 0.3,
      timeToImplement: 'Immediate',
      difficulty: 'easy'
    })

    return recommendations
  }

  // Generate expense management recommendations
  private async generateExpenseManagementRecommendations(
    userId: string, 
    excessExpense: number, 
    week: any
  ): Promise<AlertRecommendation[]> {
    const recommendations: AlertRecommendation[] = []

    recommendations.push({
      type: 'delay_expenses',
      title: 'Review and Defer Excess Expenses',
      description: `Analyze the projected $${excessExpense.toLocaleString()} in additional expenses and defer non-critical items`,
      impact: 'Smooth out cash flow fluctuations',
      urgency: 'medium',
      estimatedImprovement: excessExpense * 0.5,
      timeToImplement: '1 week',
      difficulty: 'easy'
    })

    recommendations.push({
      type: 'negotiate_terms',
      title: 'Negotiate Vendor Payment Terms',
      description: 'Contact vendors for the large expenses and request extended payment terms',
      impact: 'Spread expense impact over multiple weeks',
      urgency: 'medium',
      estimatedImprovement: excessExpense * 0.7,
      timeToImplement: '1-2 weeks',
      difficulty: 'medium'
    })

    return recommendations
  }

  // Generate revenue acceleration recommendations
  private async generateRevenueAccelerationRecommendations(
    userId: string, 
    shortfall: number, 
    week: any
  ): Promise<AlertRecommendation[]> {
    const recommendations: AlertRecommendation[] = []

    recommendations.push({
      type: 'accelerate_collections',
      title: 'Accelerate Invoice Collections',
      description: `Focus on collecting payments to make up for the $${shortfall.toLocaleString()} revenue shortfall`,
      impact: 'Compensate for reduced projected revenue',
      urgency: 'high',
      estimatedImprovement: shortfall * 0.8,
      timeToImplement: '1-2 weeks',
      difficulty: 'medium'
    })

    recommendations.push({
      type: 'adjust_pricing',
      title: 'Emergency Revenue Generation',
      description: 'Consider special promotions or rush service premiums to boost week revenue',
      impact: 'Generate additional revenue quickly',
      urgency: 'medium',
      estimatedImprovement: shortfall * 0.4,
      timeToImplement: '1 week',
      difficulty: 'medium'
    })

    return recommendations
  }

  // Alert management functions
  async getAlertSettings(userId: string): Promise<AlertSettings> {
    const { data: settings, error } = await supabase
      .from('cash_flow_alert_settings')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error || !settings) {
      // Return default settings
      return {
        userId,
        minimumCashBuffer: 25000,
        warningThresholdDays: 30,
        criticalThresholdDays: 14,
        enableEmailNotifications: true,
        enableSmsNotifications: false,
        enableSlackNotifications: false,
        notificationTiming: [
          { daysBeforeShortfall: 30, repeatInterval: 'once', channels: ['email', 'in_app'] },
          { daysBeforeShortfall: 14, repeatInterval: 'once', channels: ['email', 'in_app'] },
          { daysBeforeShortfall: 7, repeatInterval: 'daily', channels: ['email', 'in_app'] }
        ],
        customRules: []
      }
    }

    return {
      userId: settings.user_id,
      minimumCashBuffer: settings.minimum_cash_buffer,
      warningThresholdDays: settings.warning_threshold_days,
      criticalThresholdDays: settings.critical_threshold_days,
      enableEmailNotifications: settings.enable_email_notifications,
      enableSmsNotifications: settings.enable_sms_notifications,
      enableSlackNotifications: settings.enable_slack_notifications,
      notificationTiming: settings.notification_timing || [],
      customRules: settings.custom_rules || []
    }
  }

  async updateAlertSettings(userId: string, settings: Partial<AlertSettings>): Promise<void> {
    await supabase
      .from('cash_flow_alert_settings')
      .upsert([{
        user_id: userId,
        minimum_cash_buffer: settings.minimumCashBuffer,
        warning_threshold_days: settings.warningThresholdDays,
        critical_threshold_days: settings.criticalThresholdDays,
        enable_email_notifications: settings.enableEmailNotifications,
        enable_sms_notifications: settings.enableSmsNotifications,
        enable_slack_notifications: settings.enableSlackNotifications,
        notification_timing: settings.notificationTiming,
        custom_rules: settings.customRules,
        updated_at: new Date().toISOString()
      }])
  }

  // Process and store alerts
  private async processAndStoreAlerts(alerts: CashGapAlert[]): Promise<CashGapAlert[]> {
    const processedAlerts: CashGapAlert[] = []

    for (const alert of alerts) {
      // Check if similar alert already exists
      const { data: existingAlert } = await supabase
        .from('cash_flow_alerts')
        .select('*')
        .eq('user_id', alert.userId)
        .eq('alert_type', alert.alertType)
        .eq('projected_date', alert.projectedDate)
        .eq('status', 'active')
        .single()

      if (existingAlert) {
        // Update existing alert if severity changed or new recommendations
        if (existingAlert.severity !== alert.severity || 
            JSON.stringify(existingAlert.recommendations) !== JSON.stringify(alert.recommendations)) {
          
          await supabase
            .from('cash_flow_alerts')
            .update({
              severity: alert.severity,
              title: alert.title,
              description: alert.description,
              projected_shortfall: alert.projectedShortfall,
              triggers: alert.triggers,
              recommendations: alert.recommendations,
              metadata: alert.metadata,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingAlert.id)

          processedAlerts.push({ ...alert, id: existingAlert.id })
        } else {
          processedAlerts.push(existingAlert)
        }
      } else {
        // Create new alert
        const { data: newAlert, error } = await supabase
          .from('cash_flow_alerts')
          .insert([{
            user_id: alert.userId,
            alert_type: alert.alertType,
            severity: alert.severity,
            title: alert.title,
            description: alert.description,
            projected_shortfall: alert.projectedShortfall,
            projected_date: alert.projectedDate,
            week_number: alert.weekNumber,
            triggers: alert.triggers,
            recommendations: alert.recommendations,
            status: alert.status,
            metadata: alert.metadata
          }])
          .select()
          .single()

        if (!error && newAlert) {
          processedAlerts.push({ ...alert, id: newAlert.id })
        }
      }
    }

    return processedAlerts
  }

  // Helper functions
  private deduplicateAndPrioritizeAlerts(alerts: CashGapAlert[]): CashGapAlert[] {
    // Group by date and type, keep highest severity
    const alertMap = new Map<string, CashGapAlert>()
    
    alerts.forEach(alert => {
      const key = `${alert.alertType}_${alert.projectedDate}`
      const existing = alertMap.get(key)
      
      if (!existing || this.getSeverityWeight(alert.severity) > this.getSeverityWeight(existing.severity)) {
        alertMap.set(key, alert)
      }
    })
    
    return Array.from(alertMap.values())
      .sort((a, b) => this.getSeverityWeight(b.severity) - this.getSeverityWeight(a.severity))
  }

  private getSeverityWeight(severity: AlertSeverity): number {
    const weights = { critical: 4, high: 3, medium: 2, low: 1 }
    return weights[severity]
  }

  private generateAlertTitle(type: AlertType, shortfall: number, daysUntil: number): string {
    switch (type) {
      case 'cash_gap_critical':
        return `Critical Cash Gap - $${shortfall.toLocaleString()} shortfall in ${daysUntil} days`
      case 'cash_gap_warning':
        return `Cash Flow Warning - $${shortfall.toLocaleString()} below buffer in ${daysUntil} days`
      case 'expense_spike':
        return `Expense Spike Alert - Unusually high outflow projected`
      case 'revenue_drop':
        return `Revenue Drop Alert - Below average income projected`
      default:
        return `Cash Flow Alert - $${shortfall.toLocaleString()} shortfall`
    }
  }

  private generateAlertDescription(type: AlertType, shortfall: number, date: string, scenario: string): string {
    switch (type) {
      case 'cash_gap_critical':
        return `Critical cash shortfall of $${shortfall.toLocaleString()} projected for ${date} (${scenario} scenario). Immediate action required to prevent cash flow crisis.`
      case 'cash_gap_warning':
        return `Cash balance projected to fall $${shortfall.toLocaleString()} below minimum buffer on ${date} (${scenario} scenario). Consider taking preventive action.`
      case 'expense_spike':
        return `Unusually high expenses projected for ${date} may impact cash flow (${scenario} scenario).`
      case 'revenue_drop':
        return `Revenue projected below average for ${date}, potential shortfall of $${shortfall.toLocaleString()} (${scenario} scenario).`
      default:
        return `Cash flow alert for ${date} - $${shortfall.toLocaleString()} impact (${scenario} scenario).`
    }
  }

  private identifyContributingFactors(week: any, forecast: any): string[] {
    const factors: string[] = []
    
    if (week.totalOutflow > forecast.averageWeeklyOutflow * 1.5) {
      factors.push('Above average expenses')
    }
    
    if (week.totalInflow < forecast.averageWeeklyInflow * 0.8) {
      factors.push('Below average revenue')
    }
    
    if (week.netCashFlow < 0) {
      factors.push('Negative net cash flow')
    }
    
    return factors.length > 0 ? factors : ['Normal cash flow fluctuation']
  }

  private generateAlertSummary(alerts: CashGapAlert[], forecast: any): any {
    return {
      totalAlerts: alerts.length,
      bySeverity: {
        critical: alerts.filter(a => a.severity === 'critical').length,
        high: alerts.filter(a => a.severity === 'high').length,
        medium: alerts.filter(a => a.severity === 'medium').length,
        low: alerts.filter(a => a.severity === 'low').length
      },
      byType: alerts.reduce((acc, alert) => {
        acc[alert.alertType] = (acc[alert.alertType] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      worstCaseShortfall: Math.max(...alerts.map(a => a.projectedShortfall), 0),
      nearestAlert: alerts.length > 0 ? 
        Math.min(...alerts.map(a => a.metadata.daysUntilShortfall)) : null,
      forecastSummary: {
        startingCash: forecast.startingCash,
        projectedEndCash: forecast.endingCash,
        worstWeek: forecast.minimumCashWeek,
        confidence: forecast.confidence
      }
    }
  }

  private async sendNotifications(alerts: CashGapAlert[]): Promise<void> {
    // Placeholder for notification sending logic
    // Would integrate with email service, SMS service, Slack, etc.
    console.log(`[CASH-GAP-ALERT] Sending notifications for ${alerts.length} critical alerts`)
    
    for (const alert of alerts) {
      const settings = await this.getAlertSettings(alert.userId)
      
      if (settings.enableEmailNotifications) {
        // Send email notification
        console.log(`[ALERT-EMAIL] ${alert.title} - ${alert.description}`)
      }
      
      if (settings.enableSmsNotifications) {
        // Send SMS notification
        console.log(`[ALERT-SMS] Critical: ${alert.title}`)
      }
    }
  }
}

export const cashGapAlertService = new CashGapAlertService()