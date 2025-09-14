import { supabase } from '@/lib/supabase'
import { invoicePaymentTrackingService } from './invoicePaymentTrackingService'

export interface PaymentAccelerationStrategy {
  id?: string
  userId: string
  strategyType: AccelerationStrategyType
  name: string
  description: string
  targetCriteria: TargetCriteria
  actions: AccelerationAction[]
  incentives: PaymentIncentive[]
  automationRules: AutomationRule[]
  performance: StrategyPerformance
  status: 'active' | 'paused' | 'draft'
  createdAt?: string
  updatedAt?: string
}

export interface PaymentIncentive {
  id?: string
  type: IncentiveType
  name: string
  description: string
  discountType: 'percentage' | 'fixed_amount'
  discountValue: number
  maxDiscountAmount?: number
  conditions: IncentiveCondition[]
  validityPeriod: number // days
  usageLimit?: number
  applicableInvoiceTypes?: string[]
  minimumInvoiceAmount?: number
  exclusions?: string[]
  performance: IncentivePerformance
  isActive: boolean
}

export interface AccelerationAction {
  id?: string
  type: ActionType
  name: string
  description: string
  timing: ActionTiming
  content: ActionContent
  channels: CommunicationChannel[]
  escalationRules: EscalationRule[]
  success: ActionSuccess
}

export interface AutomationRule {
  id?: string
  name: string
  trigger: AutomationTrigger
  conditions: RuleCondition[]
  actions: string[] // Action IDs
  frequency: 'once' | 'daily' | 'weekly'
  maxAttempts?: number
  cooldownPeriod?: number // hours
  isActive: boolean
}

export interface TargetCriteria {
  clientRiskLevels?: ('low' | 'medium' | 'high' | 'critical')[]
  invoiceAmountRange?: { min?: number; max?: number }
  daysPastDue?: { min?: number; max?: number }
  industryTypes?: string[]
  paymentHistory?: ('good' | 'average' | 'poor')[]
  clientTypes?: string[]
  excludeClients?: string[]
}

export interface ActionTiming {
  triggerEvent: 'invoice_created' | 'payment_due' | 'payment_overdue' | 'custom_date'
  delayDays?: number
  specificDate?: string
  recurringSchedule?: 'daily' | 'weekly' | 'biweekly' | 'monthly'
}

export interface ActionContent {
  subject?: string
  message: string
  templateVariables?: Record<string, string>
  attachments?: string[]
  callToAction?: string
  urgencyLevel: 'low' | 'medium' | 'high'
}

export interface EscalationRule {
  triggerAfterDays: number
  escalateTo: 'manager' | 'collections_team' | 'external_agency'
  escalationAction: ActionType
  notificationMessage?: string
}

export interface IncentiveCondition {
  type: 'payment_within_days' | 'full_payment_only' | 'minimum_amount' | 'first_time_client'
  value: number | string | boolean
  description: string
}

export interface StrategyPerformance {
  totalInvoicesTargeted: number
  totalInvoicesAccelerated: number
  averageAccelerationDays: number
  totalAmountAccelerated: number
  conversionRate: number
  costEffectiveness: number
  lastUpdated: string
}

export interface IncentivePerformance {
  timesOffered: number
  timesAccepted: number
  acceptanceRate: number
  averageDiscountAmount: number
  totalDiscountGiven: number
  averageAccelerationDays: number
  netBenefit: number // revenue preserved minus discounts
}

export interface ActionSuccess {
  openRate?: number
  responseRate?: number
  paymentRate?: number
  averageResponseTime?: number // hours
  lastExecuted?: string
}

export interface CollectionCampaign {
  id?: string
  userId: string
  name: string
  description: string
  strategyId: string
  targetInvoices: string[]
  status: 'draft' | 'active' | 'paused' | 'completed'
  startDate: string
  endDate?: string
  progress: CampaignProgress
  results: CampaignResults
  createdAt?: string
  updatedAt?: string
}

export interface CampaignProgress {
  totalInvoices: number
  contactsAttempted: number
  responsesReceived: number
  paymentsReceived: number
  currentStage: string
  completionRate: number
}

export interface CampaignResults {
  totalCollected: number
  averageCollectionTime: number
  costPerCollection: number
  roi: number
  clientSatisfactionScore?: number
  nextActions: string[]
}

export type AccelerationStrategyType = 
  | 'early_payment_discount' 
  | 'payment_plan_offer' 
  | 'gentle_reminder' 
  | 'firm_follow_up' 
  | 'incentive_based' 
  | 'relationship_building'

export type IncentiveType = 
  | 'early_payment_discount' 
  | 'volume_discount' 
  | 'loyalty_discount' 
  | 'payment_method_discount' 
  | 'seasonal_promotion'

export type ActionType = 
  | 'email_reminder' 
  | 'sms_notification' 
  | 'phone_call' 
  | 'letter_mail' 
  | 'personal_visit' 
  | 'legal_notice'

export type CommunicationChannel = 
  | 'email' 
  | 'sms' 
  | 'phone' 
  | 'mail' 
  | 'in_person' 
  | 'slack' 
  | 'whatsapp'

export type AutomationTrigger = 
  | 'invoice_overdue' 
  | 'payment_partial' 
  | 'client_unresponsive' 
  | 'payment_promise_broken' 
  | 'custom_date'

export interface RuleCondition {
  field: string
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains'
  value: any
}

class PaymentAccelerationService {
  
  // Strategy Management
  async createAccelerationStrategy(strategy: PaymentAccelerationStrategy): Promise<{ success: boolean; strategy?: PaymentAccelerationStrategy; error?: string }> {
    try {
      // Validate strategy data
      const validation = this.validateStrategy(strategy)
      if (!validation.isValid) {
        return { success: false, error: validation.errors.join(', ') }
      }

      // Insert strategy
      const { data: newStrategy, error } = await supabase
        .from('cash_flow_acceleration_strategies')
        .insert([{
          user_id: strategy.userId,
          strategy_type: strategy.strategyType,
          name: strategy.name,
          description: strategy.description,
          target_criteria: strategy.targetCriteria,
          actions: strategy.actions,
          incentives: strategy.incentives,
          automation_rules: strategy.automationRules,
          performance: strategy.performance,
          status: strategy.status
        }])
        .select()
        .single()

      if (error) throw error

      return { 
        success: true, 
        strategy: {
          ...strategy,
          id: newStrategy.id,
          createdAt: newStrategy.created_at,
          updatedAt: newStrategy.updated_at
        }
      }

    } catch (error) {
      console.error('[PAYMENT-ACCELERATION] Error creating strategy:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error creating strategy'
      }
    }
  }

  // Payment Incentive Management
  async createPaymentIncentive(userId: string, incentive: PaymentIncentive): Promise<{ success: boolean; incentive?: PaymentIncentive; error?: string }> {
    try {
      const { data: newIncentive, error } = await supabase
        .from('cash_flow_payment_incentives')
        .insert([{
          user_id: userId,
          type: incentive.type,
          name: incentive.name,
          description: incentive.description,
          discount_type: incentive.discountType,
          discount_value: incentive.discountValue,
          max_discount_amount: incentive.maxDiscountAmount,
          conditions: incentive.conditions,
          validity_period: incentive.validityPeriod,
          usage_limit: incentive.usageLimit,
          applicable_invoice_types: incentive.applicableInvoiceTypes,
          minimum_invoice_amount: incentive.minimumInvoiceAmount,
          exclusions: incentive.exclusions,
          performance: incentive.performance,
          is_active: incentive.isActive
        }])
        .select()
        .single()

      if (error) throw error

      return { 
        success: true, 
        incentive: {
          ...incentive,
          id: newIncentive.id
        }
      }

    } catch (error) {
      console.error('[PAYMENT-ACCELERATION] Error creating incentive:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error creating incentive'
      }
    }
  }

  // Apply payment incentive to invoice
  async applyIncentiveToInvoice(incentiveId: string, invoiceId: string): Promise<{ success: boolean; appliedIncentive?: any; error?: string }> {
    try {
      // Get incentive details
      const { data: incentive, error: incentiveError } = await supabase
        .from('cash_flow_payment_incentives')
        .select('*')
        .eq('id', incentiveId)
        .single()

      if (incentiveError || !incentive) {
        return { success: false, error: 'Incentive not found' }
      }

      // Get invoice details
      const { data: invoice, error: invoiceError } = await supabase
        .from('cash_flow_invoices')
        .select('*')
        .eq('id', invoiceId)
        .single()

      if (invoiceError || !invoice) {
        return { success: false, error: 'Invoice not found' }
      }

      // Validate incentive can be applied
      const validation = await this.validateIncentiveApplication(incentive, invoice)
      if (!validation.isValid) {
        return { success: false, error: validation.error }
      }

      // Calculate discount amount
      const discountAmount = this.calculateDiscountAmount(incentive, invoice.total_amount)

      // Create incentive application record
      const { data: application, error: applicationError } = await supabase
        .from('cash_flow_incentive_applications')
        .insert([{
          incentive_id: incentiveId,
          invoice_id: invoiceId,
          original_amount: invoice.total_amount,
          discount_amount: discountAmount,
          new_amount: invoice.total_amount - discountAmount,
          applied_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + incentive.validity_period * 24 * 60 * 60 * 1000).toISOString(),
          status: 'active'
        }])
        .select()
        .single()

      if (applicationError) throw applicationError

      // Update incentive usage
      await this.updateIncentiveUsage(incentiveId)

      return { 
        success: true, 
        appliedIncentive: {
          id: application.id,
          incentiveId: incentiveId,
          invoiceId: invoiceId,
          originalAmount: invoice.total_amount,
          discountAmount: discountAmount,
          newAmount: invoice.total_amount - discountAmount,
          appliedAt: application.applied_at,
          expiresAt: application.expires_at,
          incentiveName: incentive.name,
          incentiveDescription: incentive.description
        }
      }

    } catch (error) {
      console.error('[PAYMENT-ACCELERATION] Error applying incentive:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error applying incentive'
      }
    }
  }

  // Automated Collection Campaigns
  async createCollectionCampaign(campaign: CollectionCampaign): Promise<{ success: boolean; campaign?: CollectionCampaign; error?: string }> {
    try {
      const { data: newCampaign, error } = await supabase
        .from('cash_flow_collection_campaigns')
        .insert([{
          user_id: campaign.userId,
          name: campaign.name,
          description: campaign.description,
          strategy_id: campaign.strategyId,
          target_invoices: campaign.targetInvoices,
          status: campaign.status,
          start_date: campaign.startDate,
          end_date: campaign.endDate,
          progress: campaign.progress,
          results: campaign.results
        }])
        .select()
        .single()

      if (error) throw error

      return { 
        success: true, 
        campaign: {
          ...campaign,
          id: newCampaign.id,
          createdAt: newCampaign.created_at,
          updatedAt: newCampaign.updated_at
        }
      }

    } catch (error) {
      console.error('[PAYMENT-ACCELERATION] Error creating campaign:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error creating campaign'
      }
    }
  }

  // Execute automated collection actions
  async executeAutomatedCollections(userId: string): Promise<{ success: boolean; actionsExecuted: number; results: any[] }> {
    try {
      const results: any[] = []
      let actionsExecuted = 0

      // Get active strategies
      const { data: strategies, error: strategiesError } = await supabase
        .from('cash_flow_acceleration_strategies')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')

      if (strategiesError) throw strategiesError

      for (const strategy of strategies || []) {
        // Process each automation rule
        for (const rule of strategy.automation_rules || []) {
          if (!rule.isActive) continue

          // Find invoices that match the rule criteria
          const targetInvoices = await this.findInvoicesForRule(userId, rule, strategy.target_criteria)
          
          for (const invoice of targetInvoices) {
            // Check if action should be executed
            const shouldExecute = await this.shouldExecuteAction(invoice.id, rule)
            
            if (shouldExecute) {
              // Execute the automation action
              const actionResult = await this.executeAutomationAction(invoice, rule, strategy)
              results.push(actionResult)
              actionsExecuted++
            }
          }
        }
      }

      return { success: true, actionsExecuted, results }

    } catch (error) {
      console.error('[PAYMENT-ACCELERATION] Error executing automated collections:', error)
      return { success: false, actionsExecuted: 0, results: [] }
    }
  }

  // Generate optimization recommendations
  async generateOptimizationRecommendations(userId: string): Promise<{ recommendations: OptimizationRecommendation[]; analytics: OptimizationAnalytics }> {
    try {
      // Analyze current collection performance
      const performance = await this.analyzeCollectionPerformance(userId)
      
      // Analyze client payment patterns
      const paymentPatterns = await this.analyzePaymentPatterns(userId)
      
      // Generate recommendations based on analysis
      const recommendations = this.generateRecommendations(performance, paymentPatterns)
      
      // Compile analytics
      const analytics = {
        currentPerformance: performance,
        paymentPatterns,
        opportunityValue: recommendations.reduce((sum, rec) => sum + (rec.estimatedImpact || 0), 0),
        implementationPriority: this.prioritizeRecommendations(recommendations)
      }

      return { recommendations, analytics }

    } catch (error) {
      console.error('[PAYMENT-ACCELERATION] Error generating recommendations:', error)
      return { recommendations: [], analytics: {} as OptimizationAnalytics }
    }
  }

  // Performance Analytics
  async getAccelerationAnalytics(userId: string, timeframe: 'week' | 'month' | 'quarter' | 'year' = 'month'): Promise<AccelerationAnalytics> {
    try {
      const endDate = new Date()
      const startDate = this.calculateStartDate(endDate, timeframe)

      // Get strategy performance
      const strategies = await this.getStrategyPerformance(userId, startDate, endDate)
      
      // Get incentive performance
      const incentives = await this.getIncentivePerformance(userId, startDate, endDate)
      
      // Get collection trends
      const trends = await this.getCollectionTrends(userId, startDate, endDate)
      
      // Calculate key metrics
      const keyMetrics = await this.calculateKeyMetrics(userId, startDate, endDate)

      return {
        timeframe,
        period: { start: startDate.toISOString(), end: endDate.toISOString() },
        strategies,
        incentives,
        trends,
        keyMetrics,
        generatedAt: new Date().toISOString()
      }

    } catch (error) {
      console.error('[PAYMENT-ACCELERATION] Error getting analytics:', error)
      return {} as AccelerationAnalytics
    }
  }

  // Private helper methods
  private validateStrategy(strategy: PaymentAccelerationStrategy): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!strategy.name) errors.push('Strategy name is required')
    if (!strategy.strategyType) errors.push('Strategy type is required')
    if (!strategy.targetCriteria) errors.push('Target criteria is required')
    if (!strategy.actions || strategy.actions.length === 0) errors.push('At least one action is required')

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  private async validateIncentiveApplication(incentive: any, invoice: any): Promise<{ isValid: boolean; error?: string }> {
    // Check if incentive is active
    if (!incentive.is_active) {
      return { isValid: false, error: 'Incentive is not active' }
    }

    // Check minimum invoice amount
    if (incentive.minimum_invoice_amount && invoice.total_amount < incentive.minimum_invoice_amount) {
      return { isValid: false, error: 'Invoice amount below minimum threshold' }
    }

    // Check usage limit
    if (incentive.usage_limit) {
      const { count } = await supabase
        .from('cash_flow_incentive_applications')
        .select('id', { count: 'exact' })
        .eq('incentive_id', incentive.id)

      if (count && count >= incentive.usage_limit) {
        return { isValid: false, error: 'Incentive usage limit reached' }
      }
    }

    // Check if already applied to this invoice
    const { data: existing } = await supabase
      .from('cash_flow_incentive_applications')
      .select('id')
      .eq('incentive_id', incentive.id)
      .eq('invoice_id', invoice.id)
      .eq('status', 'active')
      .single()

    if (existing) {
      return { isValid: false, error: 'Incentive already applied to this invoice' }
    }

    return { isValid: true }
  }

  private calculateDiscountAmount(incentive: any, invoiceAmount: number): number {
    let discount = 0

    if (incentive.discount_type === 'percentage') {
      discount = (invoiceAmount * incentive.discount_value) / 100
    } else if (incentive.discount_type === 'fixed_amount') {
      discount = incentive.discount_value
    }

    // Apply maximum discount limit
    if (incentive.max_discount_amount && discount > incentive.max_discount_amount) {
      discount = incentive.max_discount_amount
    }

    return Math.round(discount * 100) / 100
  }

  private async updateIncentiveUsage(incentiveId: string): Promise<void> {
    // Increment usage count and update performance metrics
    await supabase
      .rpc('increment_incentive_usage', { incentive_id: incentiveId })
  }

  private async findInvoicesForRule(userId: string, rule: AutomationRule, criteria: TargetCriteria): Promise<any[]> {
    let query = supabase
      .from('cash_flow_invoices')
      .select('*, cash_flow_clients!inner(*)')
      .eq('user_id', userId)

    // Apply target criteria
    if (criteria.invoiceAmountRange?.min) {
      query = query.gte('total_amount', criteria.invoiceAmountRange.min)
    }
    if (criteria.invoiceAmountRange?.max) {
      query = query.lte('total_amount', criteria.invoiceAmountRange.max)
    }
    
    // Apply rule-specific conditions
    if (rule.conditions) {
      rule.conditions.forEach(condition => {
        switch (condition.operator) {
          case 'equals':
            query = query.eq(condition.field, condition.value)
            break
          case 'greater_than':
            query = query.gt(condition.field, condition.value)
            break
          case 'less_than':
            query = query.lt(condition.field, condition.value)
            break
        }
      })
    }

    const { data: invoices, error } = await query.limit(50)
    
    if (error) {
      console.error('Error finding invoices for rule:', error)
      return []
    }

    return invoices || []
  }

  private async shouldExecuteAction(invoiceId: string, rule: AutomationRule): Promise<boolean> {
    // Check if action was already executed recently
    if (rule.cooldownPeriod) {
      const cooldownThreshold = new Date(Date.now() - rule.cooldownPeriod * 60 * 60 * 1000)
      
      const { data: recentExecution } = await supabase
        .from('cash_flow_automation_executions')
        .select('executed_at')
        .eq('invoice_id', invoiceId)
        .eq('rule_id', rule.id)
        .gte('executed_at', cooldownThreshold.toISOString())
        .single()

      if (recentExecution) return false
    }

    // Check execution count against max attempts
    if (rule.maxAttempts) {
      const { count } = await supabase
        .from('cash_flow_automation_executions')
        .select('id', { count: 'exact' })
        .eq('invoice_id', invoiceId)
        .eq('rule_id', rule.id)

      if (count && count >= rule.maxAttempts) return false
    }

    return true
  }

  private async executeAutomationAction(invoice: any, rule: AutomationRule, strategy: any): Promise<any> {
    try {
      // Log execution attempt
      const { data: execution, error: executionError } = await supabase
        .from('cash_flow_automation_executions')
        .insert([{
          invoice_id: invoice.id,
          rule_id: rule.id,
          strategy_id: strategy.id,
          executed_at: new Date().toISOString(),
          status: 'pending'
        }])
        .select()
        .single()

      if (executionError) throw executionError

      // Execute the specific actions defined in the rule
      const actionResults = []
      
      for (const actionId of rule.actions) {
        const action = strategy.actions.find((a: any) => a.id === actionId)
        if (action) {
          const actionResult = await this.executeSpecificAction(action, invoice, strategy)
          actionResults.push(actionResult)
        }
      }

      // Update execution status
      await supabase
        .from('cash_flow_automation_executions')
        .update({ 
          status: 'completed',
          results: actionResults,
          completed_at: new Date().toISOString()
        })
        .eq('id', execution.id)

      return {
        executionId: execution.id,
        invoiceId: invoice.id,
        ruleId: rule.id,
        success: true,
        actions: actionResults
      }

    } catch (error) {
      console.error('[PAYMENT-ACCELERATION] Error executing automation action:', error)
      return {
        invoiceId: invoice.id,
        ruleId: rule.id,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  private async executeSpecificAction(action: AccelerationAction, invoice: any, strategy: any): Promise<any> {
    // This would implement specific action types like sending emails, SMS, etc.
    // For now, returning a placeholder
    console.log(`[PAYMENT-ACCELERATION] Executing ${action.type} for invoice ${invoice.id}`)
    
    return {
      actionType: action.type,
      actionName: action.name,
      success: true,
      executedAt: new Date().toISOString(),
      details: `${action.type} sent to client for invoice ${invoice.invoice_number}`
    }
  }

  private calculateStartDate(endDate: Date, timeframe: string): Date {
    const startDate = new Date(endDate)
    
    switch (timeframe) {
      case 'week':
        startDate.setDate(startDate.getDate() - 7)
        break
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1)
        break
      case 'quarter':
        startDate.setMonth(startDate.getMonth() - 3)
        break
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1)
        break
    }
    
    return startDate
  }

  // Placeholder methods for analytics - would be fully implemented in production
  private async analyzeCollectionPerformance(userId: string): Promise<any> {
    return { averageCollectionTime: 25, collectionRate: 85, totalCollected: 150000 }
  }

  private async analyzePaymentPatterns(userId: string): Promise<any> {
    return { earlyPaymentRate: 35, onTimeRate: 45, latePaymentRate: 20 }
  }

  private generateRecommendations(performance: any, patterns: any): OptimizationRecommendation[] {
    return [
      {
        id: '1',
        type: 'early_payment_incentive',
        title: 'Implement Early Payment Discounts',
        description: 'Offer 2% discount for payments within 10 days',
        estimatedImpact: 25000,
        implementationDifficulty: 'easy',
        timeToImplement: '1 week',
        priority: 'high'
      }
    ]
  }

  private prioritizeRecommendations(recommendations: OptimizationRecommendation[]): any {
    return recommendations.sort((a, b) => (b.estimatedImpact || 0) - (a.estimatedImpact || 0))
  }

  private async getStrategyPerformance(userId: string, startDate: Date, endDate: Date): Promise<any[]> {
    return []
  }

  private async getIncentivePerformance(userId: string, startDate: Date, endDate: Date): Promise<any[]> {
    return []
  }

  private async getCollectionTrends(userId: string, startDate: Date, endDate: Date): Promise<any> {
    return {}
  }

  private async calculateKeyMetrics(userId: string, startDate: Date, endDate: Date): Promise<any> {
    return {}
  }
}

// Supporting interfaces
export interface OptimizationRecommendation {
  id: string
  type: string
  title: string
  description: string
  estimatedImpact?: number
  implementationDifficulty: 'easy' | 'medium' | 'hard'
  timeToImplement: string
  priority: 'low' | 'medium' | 'high'
}

export interface OptimizationAnalytics {
  currentPerformance: any
  paymentPatterns: any
  opportunityValue: number
  implementationPriority: OptimizationRecommendation[]
}

export interface AccelerationAnalytics {
  timeframe: string
  period: { start: string; end: string }
  strategies: any[]
  incentives: any[]
  trends: any
  keyMetrics: any
  generatedAt: string
}

export const paymentAccelerationService = new PaymentAccelerationService()