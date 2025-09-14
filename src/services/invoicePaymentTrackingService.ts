import { supabase } from '@/lib/supabase'
import { analyticsService } from './analyticsService'

export interface InvoiceData {
  id?: string
  userId: string
  clientId: string
  invoiceNumber: string
  description: string
  totalAmount: number
  taxAmount: number
  subtotalAmount: number
  issueDate: string
  dueDate: string
  status: InvoiceStatus
  paymentTerms: PaymentTerms
  currency: string
  recurringSchedule?: RecurringSchedule
  projectId?: string
  lineItems: InvoiceLineItem[]
  paymentHistory: PaymentRecord[]
  createdAt?: string
  updatedAt?: string
}

export interface PaymentRecord {
  id?: string
  invoiceId: string
  paymentDate: string
  amount: number
  paymentMethod: PaymentMethod
  reference?: string
  notes?: string
  status: 'completed' | 'failed' | 'pending'
  processingFee?: number
  netAmount?: number
}

export interface InvoiceLineItem {
  id?: string
  description: string
  quantity: number
  unitPrice: number
  totalPrice: number
  taxRate?: number
  category?: string
}

export interface PaymentProbabilityAnalysis {
  invoiceId: string
  paymentProbability: number
  expectedPaymentDate: string
  confidenceLevel: number
  riskFactors: PaymentRiskFactor[]
  recommendations: PaymentAccelerationRecommendation[]
  historicalContext: ClientPaymentBehavior
}

export interface ClientPaymentBehavior {
  clientId: string
  averagePaymentDays: number
  paymentReliabilityScore: number
  totalInvoicesIssued: number
  totalInvoicesPaid: number
  averageInvoiceAmount: number
  preferredPaymentMethod: PaymentMethod
  seasonalPaymentPatterns: SeasonalPattern[]
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  lastPaymentDate?: string
  longestDelayDays: number
  communicationResponsiveness: number
}

export interface PaymentRiskFactor {
  factor: string
  impact: 'positive' | 'negative'
  weight: number
  description: string
}

export interface PaymentAccelerationRecommendation {
  type: 'early_payment_discount' | 'payment_plan' | 'automated_reminder' | 'personal_follow_up' | 'credit_terms_adjustment'
  title: string
  description: string
  expectedImpact: string
  urgency: 'low' | 'medium' | 'high' | 'critical'
  estimatedRevenue?: number
}

export interface SeasonalPattern {
  month: number
  averagePaymentDays: number
  paymentVolume: number
  reliabilityFactor: number
}

export type InvoiceStatus = 
  | 'draft' 
  | 'pending' 
  | 'sent' 
  | 'viewed' 
  | 'partial_payment' 
  | 'paid' 
  | 'overdue' 
  | 'cancelled'

export type PaymentTerms = 
  | 'immediate' 
  | 'net_7' 
  | 'net_15' 
  | 'net_30' 
  | 'net_45' 
  | 'net_60' 
  | 'custom'

export type PaymentMethod = 
  | 'bank_transfer' 
  | 'credit_card' 
  | 'check' 
  | 'paypal' 
  | 'stripe' 
  | 'zelle' 
  | 'venmo' 
  | 'other'

export type RecurringSchedule = 
  | 'weekly' 
  | 'bi_weekly' 
  | 'monthly' 
  | 'quarterly' 
  | 'annually'

class InvoicePaymentTrackingService {
  
  // Invoice Management
  async createInvoice(invoiceData: InvoiceData): Promise<{ success: boolean; invoice?: InvoiceData; error?: string }> {
    try {
      // Validate invoice data
      const validation = this.validateInvoiceData(invoiceData)
      if (!validation.isValid) {
        return { success: false, error: validation.errors.join(', ') }
      }

      // Generate invoice number if not provided
      if (!invoiceData.invoiceNumber) {
        invoiceData.invoiceNumber = await this.generateInvoiceNumber(invoiceData.userId)
      }

      // Calculate amounts
      const calculations = this.calculateInvoiceAmounts(invoiceData.lineItems, invoiceData.taxAmount)
      invoiceData.subtotalAmount = calculations.subtotal
      invoiceData.totalAmount = calculations.total

      // Insert invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from('cash_flow_invoices')
        .insert([{
          user_id: invoiceData.userId,
          client_id: invoiceData.clientId,
          invoice_number: invoiceData.invoiceNumber,
          description: invoiceData.description,
          total_amount: invoiceData.totalAmount,
          tax_amount: invoiceData.taxAmount,
          subtotal_amount: invoiceData.subtotalAmount,
          issue_date: invoiceData.issueDate,
          due_date: invoiceData.dueDate,
          status: invoiceData.status,
          payment_terms: invoiceData.paymentTerms,
          currency: invoiceData.currency,
          recurring_schedule: invoiceData.recurringSchedule,
          project_id: invoiceData.projectId
        }])
        .select()
        .single()

      if (invoiceError) throw invoiceError

      // Insert line items
      const lineItemsWithInvoiceId = invoiceData.lineItems.map(item => ({
        invoice_id: invoice.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total_price: item.totalPrice,
        tax_rate: item.taxRate,
        category: item.category
      }))

      const { error: lineItemsError } = await supabase
        .from('cash_flow_invoice_line_items')
        .insert(lineItemsWithInvoiceId)

      if (lineItemsError) throw lineItemsError

      // Trigger payment probability analysis
      await this.analyzePaymentProbability(invoice.id)

      // Update cash flow forecast
      await this.updateCashFlowForecast(invoiceData.userId)

      return { 
        success: true, 
        invoice: {
          ...invoiceData,
          id: invoice.id,
          createdAt: invoice.created_at,
          updatedAt: invoice.updated_at
        }
      }

    } catch (error) {
      console.error('[INVOICE-TRACKING] Error creating invoice:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error creating invoice'
      }
    }
  }

  async recordPayment(paymentData: PaymentRecord): Promise<{ success: boolean; payment?: PaymentRecord; error?: string }> {
    try {
      // Insert payment record
      const { data: payment, error: paymentError } = await supabase
        .from('cash_flow_payment_history')
        .insert([{
          invoice_id: paymentData.invoiceId,
          payment_date: paymentData.paymentDate,
          amount: paymentData.amount,
          payment_method: paymentData.paymentMethod,
          reference: paymentData.reference,
          notes: paymentData.notes,
          status: paymentData.status,
          processing_fee: paymentData.processingFee,
          net_amount: paymentData.netAmount || paymentData.amount
        }])
        .select()
        .single()

      if (paymentError) throw paymentError

      // Update invoice status
      await this.updateInvoicePaymentStatus(paymentData.invoiceId)

      // Update client payment behavior
      await this.updateClientPaymentBehavior(paymentData.invoiceId, paymentData)

      // Trigger cash flow forecast update
      const { data: invoice } = await supabase
        .from('cash_flow_invoices')
        .select('user_id')
        .eq('id', paymentData.invoiceId)
        .single()

      if (invoice) {
        await this.updateCashFlowForecast(invoice.user_id)
      }

      return { 
        success: true, 
        payment: {
          ...paymentData,
          id: payment.id
        }
      }

    } catch (error) {
      console.error('[INVOICE-TRACKING] Error recording payment:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error recording payment'
      }
    }
  }

  // Payment Probability Engine
  async analyzePaymentProbability(invoiceId: string): Promise<PaymentProbabilityAnalysis> {
    try {
      // Get invoice and client data
      const { data: invoice, error: invoiceError } = await supabase
        .from('cash_flow_invoices')
        .select(`
          *,
          cash_flow_clients!inner(*)
        `)
        .eq('id', invoiceId)
        .single()

      if (invoiceError) throw invoiceError

      const client = invoice.cash_flow_clients
      
      // Get client payment behavior
      const clientBehavior = await this.getClientPaymentBehavior(client.id)
      
      // Calculate base probability using multiple factors
      let probability = 0.85 // Base probability for service businesses

      // Client reliability factor (40% weight)
      const reliabilityFactor = clientBehavior.paymentReliabilityScore / 100
      probability = probability * (0.6 + 0.4 * reliabilityFactor)

      // Invoice amount factor (20% weight)
      const amountFactor = this.calculateAmountRiskFactor(invoice.total_amount, clientBehavior.averageInvoiceAmount)
      probability = probability * (0.8 + 0.2 * amountFactor)

      // Payment terms factor (15% weight)
      const termsFactor = this.calculatePaymentTermsFactor(invoice.payment_terms)
      probability = probability * (0.85 + 0.15 * termsFactor)

      // Seasonal factor (10% weight)
      const issueDate = new Date(invoice.issue_date)
      const seasonalFactor = this.calculateSeasonalFactor(issueDate, clientBehavior.seasonalPaymentPatterns)
      probability = probability * (0.9 + 0.1 * seasonalFactor)

      // Industry/economic factor (10% weight)
      const industryFactor = await this.calculateIndustryFactor(client.industry)
      probability = probability * (0.9 + 0.1 * industryFactor)

      // Communication responsiveness factor (5% weight)
      const communicationFactor = clientBehavior.communicationResponsiveness / 100
      probability = probability * (0.95 + 0.05 * communicationFactor)

      // Ensure probability is between 0 and 1
      probability = Math.max(0.05, Math.min(0.98, probability))

      // Calculate expected payment date
      const dueDate = new Date(invoice.due_date)
      const expectedDelayDays = this.calculateExpectedDelay(clientBehavior, probability)
      const expectedPaymentDate = new Date(dueDate)
      expectedPaymentDate.setDate(expectedPaymentDate.getDate() + expectedDelayDays)

      // Calculate confidence level
      const confidenceLevel = this.calculateConfidenceLevel(clientBehavior, invoice)

      // Generate risk factors
      const riskFactors = this.generateRiskFactors(invoice, clientBehavior, probability)

      // Generate recommendations
      const recommendations = this.generatePaymentRecommendations(invoice, clientBehavior, probability)

      // Store analysis
      await supabase
        .from('cash_flow_payment_predictions')
        .upsert([{
          invoice_id: invoiceId,
          payment_probability: Math.round(probability * 10000) / 100, // Store as percentage with 2 decimals
          expected_payment_date: expectedPaymentDate.toISOString().split('T')[0],
          confidence_level: confidenceLevel,
          risk_factors: riskFactors,
          recommendations: recommendations,
          analysis_date: new Date().toISOString()
        }])

      return {
        invoiceId,
        paymentProbability: Math.round(probability * 10000) / 100,
        expectedPaymentDate: expectedPaymentDate.toISOString().split('T')[0],
        confidenceLevel,
        riskFactors,
        recommendations,
        historicalContext: clientBehavior
      }

    } catch (error) {
      console.error('[INVOICE-TRACKING] Error analyzing payment probability:', error)
      
      // Return default analysis if error occurs
      return {
        invoiceId,
        paymentProbability: 75,
        expectedPaymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        confidenceLevel: 50,
        riskFactors: [{ factor: 'Analysis Error', impact: 'negative', weight: 0.1, description: 'Unable to complete full risk analysis' }],
        recommendations: [{ type: 'automated_reminder', title: 'Set Up Payment Reminders', description: 'Configure automated reminders to ensure timely payment', expectedImpact: 'Improved payment timing', urgency: 'medium' }],
        historicalContext: await this.getDefaultClientBehavior()
      }
    }
  }

  // Client Payment Behavior Analytics
  async getClientPaymentBehavior(clientId: string): Promise<ClientPaymentBehavior> {
    try {
      // Get all paid invoices for this client
      const { data: invoices, error: invoicesError } = await supabase
        .from('cash_flow_invoices')
        .select(`
          *,
          cash_flow_payment_history(*)
        `)
        .eq('client_id', clientId)
        .in('status', ['paid', 'partial_payment'])
        .order('issue_date', { ascending: false })
        .limit(50)

      if (invoicesError) throw invoicesError

      if (!invoices || invoices.length === 0) {
        return this.getDefaultClientBehavior()
      }

      // Calculate payment analytics
      const paidInvoices = invoices.filter(inv => inv.cash_flow_payment_history.length > 0)
      let totalPaymentDays = 0
      let paymentDelays = []
      let paymentMethods: Record<PaymentMethod, number> = {} as Record<PaymentMethod, number>
      const monthlyPatterns: Record<number, { days: number[], amounts: number[] }> = {}

      paidInvoices.forEach(invoice => {
        const lastPayment = invoice.cash_flow_payment_history
          .sort((a: any, b: any) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime())[0]
        
        if (lastPayment) {
          // Calculate days to payment
          const issueDate = new Date(invoice.issue_date)
          const paymentDate = new Date(lastPayment.payment_date)
          const daysToPay = Math.ceil((paymentDate.getTime() - issueDate.getTime()) / (1000 * 60 * 60 * 24))
          
          totalPaymentDays += daysToPay
          paymentDelays.push(daysToPay)

          // Track payment methods
          const method = lastPayment.payment_method as PaymentMethod
          paymentMethods[method] = (paymentMethods[method] || 0) + 1

          // Track seasonal patterns
          const month = paymentDate.getMonth()
          if (!monthlyPatterns[month]) {
            monthlyPatterns[month] = { days: [], amounts: [] }
          }
          monthlyPatterns[month].days.push(daysToPay)
          monthlyPatterns[month].amounts.push(invoice.total_amount)
        }
      })

      // Calculate metrics
      const averagePaymentDays = Math.round(totalPaymentDays / paidInvoices.length)
      const longestDelayDays = Math.max(...paymentDelays)
      const totalInvoicesIssued = invoices.length
      const totalInvoicesPaid = paidInvoices.length
      const averageInvoiceAmount = invoices.reduce((sum, inv) => sum + inv.total_amount, 0) / invoices.length

      // Calculate reliability score (0-100)
      const onTimePayments = paymentDelays.filter(days => days <= 30).length
      const latePayments = paymentDelays.filter(days => days > 30 && days <= 60).length
      const veryLatePayments = paymentDelays.filter(days => days > 60).length
      
      let reliabilityScore = 100
      reliabilityScore -= (latePayments * 10) // -10 points per late payment
      reliabilityScore -= (veryLatePayments * 25) // -25 points per very late payment
      reliabilityScore = Math.max(0, Math.min(100, reliabilityScore))

      // Determine preferred payment method
      const preferredPaymentMethod = Object.entries(paymentMethods)
        .sort((a, b) => b[1] - a[1])[0]?.[0] as PaymentMethod || 'bank_transfer'

      // Calculate seasonal patterns
      const seasonalPatterns: SeasonalPattern[] = Object.entries(monthlyPatterns)
        .map(([month, data]) => ({
          month: parseInt(month),
          averagePaymentDays: Math.round(data.days.reduce((sum, days) => sum + days, 0) / data.days.length),
          paymentVolume: data.amounts.length,
          reliabilityFactor: data.days.filter(days => days <= 30).length / data.days.length
        }))

      // Calculate risk level
      let riskLevel: 'low' | 'medium' | 'high' | 'critical'
      if (reliabilityScore >= 85 && averagePaymentDays <= 35) riskLevel = 'low'
      else if (reliabilityScore >= 70 && averagePaymentDays <= 50) riskLevel = 'medium'
      else if (reliabilityScore >= 50 && averagePaymentDays <= 75) riskLevel = 'high'
      else riskLevel = 'critical'

      // Communication responsiveness (simplified calculation)
      const communicationResponsiveness = Math.max(50, Math.min(100, 100 - (averagePaymentDays - 30)))

      const lastPaymentDate = paidInvoices[0]?.cash_flow_payment_history[0]?.payment_date

      return {
        clientId,
        averagePaymentDays,
        paymentReliabilityScore: reliabilityScore,
        totalInvoicesIssued,
        totalInvoicesPaid,
        averageInvoiceAmount: Math.round(averageInvoiceAmount * 100) / 100,
        preferredPaymentMethod,
        seasonalPaymentPatterns: seasonalPatterns,
        riskLevel,
        lastPaymentDate,
        longestDelayDays,
        communicationResponsiveness
      }

    } catch (error) {
      console.error('[INVOICE-TRACKING] Error getting client payment behavior:', error)
      return this.getDefaultClientBehavior()
    }
  }

  // Payment Acceleration Tools
  async generatePaymentAccelerationStrategies(invoiceId: string): Promise<PaymentAccelerationRecommendation[]> {
    try {
      const analysis = await this.analyzePaymentProbability(invoiceId)
      const { data: invoice } = await supabase
        .from('cash_flow_invoices')
        .select('*, cash_flow_clients!inner(*)')
        .eq('id', invoiceId)
        .single()

      if (!invoice) return []

      const strategies: PaymentAccelerationRecommendation[] = []
      const client = invoice.cash_flow_clients
      const behavior = analysis.historicalContext

      // Early payment discount strategy
      if (analysis.paymentProbability < 80 && invoice.total_amount > 1000) {
        const discountAmount = Math.min(invoice.total_amount * 0.02, 500) // 2% max $500
        strategies.push({
          type: 'early_payment_discount',
          title: 'Early Payment Discount',
          description: `Offer ${Math.round(discountAmount)} discount for payment within 7 days`,
          expectedImpact: `Accelerate payment by 10-15 days, save ${Math.round(invoice.total_amount * 0.01)} in collection costs`,
          urgency: analysis.paymentProbability < 60 ? 'high' : 'medium',
          estimatedRevenue: invoice.total_amount - discountAmount
        })
      }

      // Payment plan strategy for large invoices
      if (invoice.total_amount > 5000 && behavior.riskLevel !== 'low') {
        strategies.push({
          type: 'payment_plan',
          title: 'Flexible Payment Plan',
          description: 'Offer 2-3 installment payment options to reduce payment friction',
          expectedImpact: 'Increase payment probability by 15-25%',
          urgency: analysis.paymentProbability < 70 ? 'high' : 'medium',
          estimatedRevenue: invoice.total_amount * 0.95 // Slight discount for payment plan
        })
      }

      // Automated reminder strategy
      if (behavior.communicationResponsiveness < 80) {
        strategies.push({
          type: 'automated_reminder',
          title: 'Smart Payment Reminders',
          description: 'Set up personalized automated reminders based on client payment patterns',
          expectedImpact: 'Reduce payment delays by 5-8 days',
          urgency: 'medium'
        })
      }

      // Personal follow-up for high-value clients
      if (invoice.total_amount > 3000 && behavior.riskLevel === 'high') {
        strategies.push({
          type: 'personal_follow_up',
          title: 'Personal Account Manager Follow-up',
          description: 'Schedule personal check-in call to address any payment concerns',
          expectedImpact: 'Improve relationship and payment timing',
          urgency: 'high'
        })
      }

      // Credit terms adjustment
      if (behavior.averagePaymentDays > 45 && invoice.payment_terms === 'net_30') {
        strategies.push({
          type: 'credit_terms_adjustment',
          title: 'Adjust Payment Terms',
          description: 'Consider shorter payment terms or require partial upfront payment',
          expectedImpact: 'Improve cash flow timing for future invoices',
          urgency: 'low'
        })
      }

      return strategies.sort((a, b) => {
        const urgencyWeight = { critical: 4, high: 3, medium: 2, low: 1 }
        return urgencyWeight[b.urgency] - urgencyWeight[a.urgency]
      })

    } catch (error) {
      console.error('[INVOICE-TRACKING] Error generating acceleration strategies:', error)
      return []
    }
  }

  // Private helper methods
  private validateInvoiceData(data: InvoiceData): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!data.clientId) errors.push('Client ID is required')
    if (!data.description) errors.push('Invoice description is required')
    if (!data.totalAmount || data.totalAmount <= 0) errors.push('Total amount must be greater than 0')
    if (!data.issueDate) errors.push('Issue date is required')
    if (!data.dueDate) errors.push('Due date is required')
    if (!data.lineItems || data.lineItems.length === 0) errors.push('At least one line item is required')

    // Validate dates
    const issueDate = new Date(data.issueDate)
    const dueDate = new Date(data.dueDate)
    if (dueDate <= issueDate) errors.push('Due date must be after issue date')

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  private async generateInvoiceNumber(userId: string): Promise<string> {
    const { count } = await supabase
      .from('cash_flow_invoices')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)

    const invoiceNumber = `INV-${new Date().getFullYear()}-${String((count || 0) + 1).padStart(4, '0')}`
    return invoiceNumber
  }

  private calculateInvoiceAmounts(lineItems: InvoiceLineItem[], taxAmount: number): { subtotal: number; total: number } {
    const subtotal = lineItems.reduce((sum, item) => sum + item.totalPrice, 0)
    const total = subtotal + taxAmount
    return { subtotal, total }
  }

  private async updateInvoicePaymentStatus(invoiceId: string): Promise<void> {
    // Get invoice and payment history
    const { data: invoice, error } = await supabase
      .from('cash_flow_invoices')
      .select(`
        *,
        cash_flow_payment_history(*)
      `)
      .eq('id', invoiceId)
      .single()

    if (error || !invoice) return

    // Calculate total payments
    const totalPaid = invoice.cash_flow_payment_history
      .filter((p: any) => p.status === 'completed')
      .reduce((sum: number, p: any) => sum + p.amount, 0)

    // Determine status
    let status: InvoiceStatus
    if (totalPaid >= invoice.total_amount) {
      status = 'paid'
    } else if (totalPaid > 0) {
      status = 'partial_payment'
    } else if (new Date() > new Date(invoice.due_date)) {
      status = 'overdue'
    } else {
      status = invoice.status
    }

    // Update status
    await supabase
      .from('cash_flow_invoices')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', invoiceId)
  }

  private async updateClientPaymentBehavior(invoiceId: string, payment: PaymentRecord): Promise<void> {
    // This would update client scoring and behavior metrics
    // Implementation would involve complex calculations based on payment timing, amount, etc.
    console.log(`[INVOICE-TRACKING] Updating client behavior for invoice ${invoiceId}`)
  }

  private async updateCashFlowForecast(userId: string): Promise<void> {
    // Trigger cash flow forecast recalculation
    try {
      const { cashFlowForecastService } = await import('./cashFlowForecastService')
      await cashFlowForecastService.generateCashFlowForecast(userId, { refreshData: true })
    } catch (error) {
      console.error('[INVOICE-TRACKING] Error updating cash flow forecast:', error)
    }
  }

  private calculateAmountRiskFactor(invoiceAmount: number, avgAmount: number): number {
    if (avgAmount === 0) return 0.5
    const ratio = invoiceAmount / avgAmount
    if (ratio <= 0.5) return 1.0 // Small invoices are safer
    if (ratio <= 1.0) return 0.9
    if (ratio <= 2.0) return 0.7
    return 0.5 // Very large invoices are riskier
  }

  private calculatePaymentTermsFactor(terms: PaymentTerms): number {
    const factors: Record<PaymentTerms, number> = {
      immediate: 1.0,
      net_7: 0.95,
      net_15: 0.9,
      net_30: 0.85,
      net_45: 0.8,
      net_60: 0.7,
      custom: 0.75
    }
    return factors[terms] || 0.75
  }

  private calculateSeasonalFactor(date: Date, patterns: SeasonalPattern[]): number {
    const month = date.getMonth()
    const pattern = patterns.find(p => p.month === month)
    return pattern ? pattern.reliabilityFactor : 0.85
  }

  private async calculateIndustryFactor(industry?: string): Promise<number> {
    // Industry-specific payment reliability factors
    const industryFactors: Record<string, number> = {
      'technology': 0.9,
      'healthcare': 0.85,
      'finance': 0.95,
      'retail': 0.8,
      'construction': 0.75,
      'manufacturing': 0.8,
      'consulting': 0.9,
      'legal': 0.95,
      'marketing': 0.85,
      'education': 0.9
    }
    return industryFactors[industry?.toLowerCase() || ''] || 0.85
  }

  private calculateExpectedDelay(behavior: ClientPaymentBehavior, probability: number): number {
    // Higher probability = less expected delay
    const baseDelay = behavior.averagePaymentDays - 30 // Days beyond due date
    const probabilityFactor = 1 - probability // Lower probability increases delay
    return Math.max(0, Math.round(baseDelay + (probabilityFactor * 15)))
  }

  private calculateConfidenceLevel(behavior: ClientPaymentBehavior, invoice: any): number {
    let confidence = 70 // Base confidence

    // More invoices = higher confidence
    if (behavior.totalInvoicesIssued >= 10) confidence += 20
    else if (behavior.totalInvoicesIssued >= 5) confidence += 10

    // Consistent payment behavior increases confidence
    if (behavior.paymentReliabilityScore >= 90) confidence += 15
    else if (behavior.paymentReliabilityScore >= 80) confidence += 10
    else if (behavior.paymentReliabilityScore < 60) confidence -= 15

    // Recent activity increases confidence
    if (behavior.lastPaymentDate) {
      const daysSinceLastPayment = Math.floor(
        (Date.now() - new Date(behavior.lastPaymentDate).getTime()) / (1000 * 60 * 60 * 24)
      )
      if (daysSinceLastPayment <= 30) confidence += 10
      else if (daysSinceLastPayment > 90) confidence -= 10
    }

    return Math.max(30, Math.min(95, confidence))
  }

  private generateRiskFactors(invoice: any, behavior: ClientPaymentBehavior, probability: number): PaymentRiskFactor[] {
    const factors: PaymentRiskFactor[] = []

    // Payment reliability
    if (behavior.paymentReliabilityScore < 70) {
      factors.push({
        factor: 'Low Payment Reliability',
        impact: 'negative',
        weight: 0.3,
        description: `Client has ${behavior.paymentReliabilityScore}% reliability score`
      })
    } else if (behavior.paymentReliabilityScore > 90) {
      factors.push({
        factor: 'High Payment Reliability',
        impact: 'positive',
        weight: 0.3,
        description: `Client has excellent ${behavior.paymentReliabilityScore}% reliability score`
      })
    }

    // Invoice amount vs average
    const amountRatio = invoice.total_amount / behavior.averageInvoiceAmount
    if (amountRatio > 2) {
      factors.push({
        factor: 'Above Average Amount',
        impact: 'negative',
        weight: 0.2,
        description: `Invoice is ${Math.round(amountRatio * 100)}% of typical amount`
      })
    }

    // Payment timing
    if (behavior.averagePaymentDays > 45) {
      factors.push({
        factor: 'Slow Payment History',
        impact: 'negative',
        weight: 0.25,
        description: `Client typically pays in ${behavior.averagePaymentDays} days`
      })
    } else if (behavior.averagePaymentDays < 25) {
      factors.push({
        factor: 'Fast Payment History',
        impact: 'positive',
        weight: 0.25,
        description: `Client typically pays quickly (${behavior.averagePaymentDays} days)`
      })
    }

    // Communication responsiveness
    if (behavior.communicationResponsiveness < 70) {
      factors.push({
        factor: 'Poor Communication',
        impact: 'negative',
        weight: 0.15,
        description: 'Client has low communication responsiveness'
      })
    }

    return factors
  }

  private generatePaymentRecommendations(invoice: any, behavior: ClientPaymentBehavior, probability: number): PaymentAccelerationRecommendation[] {
    const recommendations: PaymentAccelerationRecommendation[] = []

    // Low probability recommendations
    if (probability < 0.7) {
      recommendations.push({
        type: 'personal_follow_up',
        title: 'Schedule Follow-up Call',
        description: 'Personal outreach to address potential payment concerns',
        expectedImpact: 'Improve payment likelihood by 15-20%',
        urgency: 'high'
      })

      if (invoice.total_amount > 2000) {
        recommendations.push({
          type: 'payment_plan',
          title: 'Offer Payment Plan',
          description: 'Break large invoice into manageable installments',
          expectedImpact: 'Reduce payment friction and improve cash flow',
          urgency: 'high'
        })
      }
    }

    // Medium probability recommendations
    if (probability >= 0.7 && probability < 0.85) {
      recommendations.push({
        type: 'automated_reminder',
        title: 'Set Automated Reminders',
        description: 'Configure gentle payment reminders based on due date',
        expectedImpact: 'Prevent late payments',
        urgency: 'medium'
      })
    }

    // Early payment incentives for reliable clients
    if (behavior.paymentReliabilityScore > 80 && probability > 0.8) {
      recommendations.push({
        type: 'early_payment_discount',
        title: 'Early Payment Incentive',
        description: 'Offer small discount for payment within 10 days',
        expectedImpact: 'Accelerate cash flow by 10-15 days',
        urgency: 'low'
      })
    }

    return recommendations
  }

  private async getDefaultClientBehavior(): Promise<ClientPaymentBehavior> {
    return {
      clientId: '',
      averagePaymentDays: 35,
      paymentReliabilityScore: 75,
      totalInvoicesIssued: 0,
      totalInvoicesPaid: 0,
      averageInvoiceAmount: 0,
      preferredPaymentMethod: 'bank_transfer',
      seasonalPaymentPatterns: [],
      riskLevel: 'medium',
      longestDelayDays: 0,
      communicationResponsiveness: 70
    }
  }
}

export const invoicePaymentTrackingService = new InvoicePaymentTrackingService()