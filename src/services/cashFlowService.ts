import { stripeHelpers } from '@/lib/stripe-client'
import { supabase } from '@/lib/supabase-client'

export interface CashFlowMetrics {
  currentBalance: number
  monthlyRecurring: number
  pendingInvoices: number
  overdueInvoices: number
  cashRunway: number
  healthScore: number
  revenueGrowth: number
  avgTransactionValue: number
  customersCount: number
  churnRate: number
}

export interface CashFlowAlert {
  id: string
  type: 'warning' | 'info' | 'success' | 'critical'
  title: string
  message: string
  urgency: 'low' | 'medium' | 'high' | 'critical'
  amount?: number
  dueDate?: string
  customerId?: string
  createdAt: string
}

export interface TransactionData {
  id: string
  amount: number
  status: string
  created: number
  description: string | null
  customer: string | null
  currency: string
  type: 'payment' | 'refund' | 'payout' | 'invoice'
}

class CashFlowService {
  // Get comprehensive cash flow metrics from Stripe
  async getCashFlowMetrics(): Promise<CashFlowMetrics> {
    try {
      const now = Math.floor(Date.now() / 1000)
      const thirtyDaysAgo = now - (30 * 24 * 60 * 60)
      const sixtyDaysAgo = now - (60 * 24 * 60 * 60)

      // Get current balance
      const balance = await stripeHelpers.getBalance()
      const currentBalance = balance.available.reduce((sum, bal) => sum + bal.amount, 0) / 100

      // Get recent charges for revenue analysis
      const recentCharges = await stripeHelpers.getCharges({
        created: { gte: thirtyDaysAgo },
        limit: 100
      })

      const previousCharges = await stripeHelpers.getCharges({
        created: { gte: sixtyDaysAgo, lte: thirtyDaysAgo },
        limit: 100
      })

      // Calculate monthly recurring revenue from subscriptions
      const subscriptions = await stripeHelpers.getSubscriptions({ status: 'active' })
      const monthlyRecurring = subscriptions.data.reduce((sum, sub) => {
        if (sub.items.data[0]?.price.recurring?.interval === 'month') {
          return sum + (sub.items.data[0].price.unit_amount || 0) / 100
        }
        return sum
      }, 0)

      // Get pending and overdue invoices
      const openInvoices = await stripeHelpers.getInvoices({ status: 'open' })
      const pendingInvoices = openInvoices.data.reduce((sum, inv) => sum + (inv.amount_due / 100), 0)
      
      const overdueInvoices = openInvoices.data
        .filter(inv => inv.due_date && inv.due_date < now)
        .reduce((sum, inv) => sum + (inv.amount_due / 100), 0)

      // Calculate revenue growth
      const currentRevenue = recentCharges.data
        .filter(charge => charge.status === 'succeeded')
        .reduce((sum, charge) => sum + (charge.amount / 100), 0)
      
      const previousRevenue = previousCharges.data
        .filter(charge => charge.status === 'succeeded')
        .reduce((sum, charge) => sum + (charge.amount / 100), 0)

      const revenueGrowth = previousRevenue > 0 
        ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 
        : 0

      // Calculate average transaction value
      const successfulCharges = recentCharges.data.filter(charge => charge.status === 'succeeded')
      const avgTransactionValue = successfulCharges.length > 0
        ? successfulCharges.reduce((sum, charge) => sum + (charge.amount / 100), 0) / successfulCharges.length
        : 0

      // Get customer count
      const customers = await stripeHelpers.getCustomers({ limit: 100 })
      const customersCount = customers.data.length

      // Calculate cash runway (simplified: current balance / average monthly expenses)
      // This is a basic calculation - in a real system you'd track expenses separately
      const estimatedMonthlyExpenses = currentRevenue * 0.7 // Assume 70% expense ratio
      const cashRunway = estimatedMonthlyExpenses > 0 ? currentBalance / estimatedMonthlyExpenses : 0

      // Calculate health score based on multiple factors
      const healthScore = this.calculateHealthScore({
        currentBalance,
        revenueGrowth,
        overdueInvoices,
        pendingInvoices,
        monthlyRecurring,
        cashRunway
      })

      // Basic churn calculation (this would be more sophisticated in production)
      const churnRate = 0 // Placeholder - would need historical subscription data

      return {
        currentBalance,
        monthlyRecurring,
        pendingInvoices,
        overdueInvoices,
        cashRunway,
        healthScore,
        revenueGrowth,
        avgTransactionValue,
        customersCount,
        churnRate
      }
    } catch (error) {
      console.error('Error calculating cash flow metrics:', error)
      
      // Return fallback data if Stripe is not available
      return {
        currentBalance: 0,
        monthlyRecurring: 0,
        pendingInvoices: 0,
        overdueInvoices: 0,
        cashRunway: 0,
        healthScore: 0,
        revenueGrowth: 0,
        avgTransactionValue: 0,
        customersCount: 0,
        churnRate: 0
      }
    }
  }

  // Generate cash flow alerts based on Stripe data
  async getCashFlowAlerts(): Promise<CashFlowAlert[]> {
    try {
      const alerts: CashFlowAlert[] = []
      const now = Math.floor(Date.now() / 1000)

      // Check for overdue invoices
      const openInvoices = await stripeHelpers.getInvoices({ status: 'open' })
      const overdueInvoices = openInvoices.data.filter(inv => inv.due_date && inv.due_date < now)

      for (const invoice of overdueInvoices) {
        const daysPastDue = Math.floor((now - (invoice.due_date || 0)) / (24 * 60 * 60))
        alerts.push({
          id: `overdue-${invoice.id}`,
          type: daysPastDue > 30 ? 'critical' : 'warning',
          title: 'Invoice Overdue',
          message: `Invoice ${invoice.number} - $${(invoice.amount_due / 100).toLocaleString()} overdue by ${daysPastDue} days`,
          urgency: daysPastDue > 30 ? 'critical' : daysPastDue > 14 ? 'high' : 'medium',
          amount: invoice.amount_due / 100,
          dueDate: new Date((invoice.due_date || 0) * 1000).toISOString(),
          customerId: invoice.customer as string,
          createdAt: new Date().toISOString()
        })
      }

      // Check for upcoming payments
      const upcomingInvoices = openInvoices.data.filter(inv => {
        if (!inv.due_date) return false
        const daysUntilDue = Math.floor(((inv.due_date * 1000) - Date.now()) / (24 * 60 * 60 * 1000))
        return daysUntilDue <= 7 && daysUntilDue >= 0
      })

      for (const invoice of upcomingInvoices) {
        const daysUntilDue = Math.floor(((invoice.due_date! * 1000) - Date.now()) / (24 * 60 * 60 * 1000))
        alerts.push({
          id: `upcoming-${invoice.id}`,
          type: 'info',
          title: 'Payment Due Soon',
          message: `Invoice ${invoice.number} - $${(invoice.amount_due / 100).toLocaleString()} due in ${daysUntilDue} day${daysUntilDue === 1 ? '' : 's'}`,
          urgency: daysUntilDue <= 3 ? 'high' : 'medium',
          amount: invoice.amount_due / 100,
          dueDate: new Date((invoice.due_date || 0) * 1000).toISOString(),
          customerId: invoice.customer as string,
          createdAt: new Date().toISOString()
        })
      }

      // Check balance and cash flow trends
      const balance = await stripeHelpers.getBalance()
      const currentBalance = balance.available.reduce((sum, bal) => sum + bal.amount, 0) / 100

      if (currentBalance < 10000) { // Configurable threshold
        alerts.push({
          id: 'low-balance',
          type: currentBalance < 5000 ? 'critical' : 'warning',
          title: 'Low Cash Balance',
          message: `Current available balance is $${currentBalance.toLocaleString()} - consider reviewing cash flow`,
          urgency: currentBalance < 5000 ? 'critical' : 'high',
          amount: currentBalance,
          createdAt: new Date().toISOString()
        })
      }

      return alerts.slice(0, 10) // Limit to 10 most important alerts
    } catch (error) {
      console.error('Error generating cash flow alerts:', error)
      return []
    }
  }

  // Get recent transactions from Stripe
  async getRecentTransactions(limit: number = 50): Promise<TransactionData[]> {
    try {
      const transactions: TransactionData[] = []
      
      // Get recent charges
      const charges = await stripeHelpers.getCharges({ limit: Math.floor(limit / 2) })
      
      for (const charge of charges.data) {
        transactions.push({
          id: charge.id,
          amount: charge.amount / 100,
          status: charge.status,
          created: charge.created,
          description: charge.description,
          customer: charge.customer as string,
          currency: charge.currency,
          type: charge.refunded ? 'refund' : 'payment'
        })
      }

      // Get recent payouts
      const payouts = await stripeHelpers.getPayouts({ limit: Math.floor(limit / 2) })
      
      for (const payout of payouts.data) {
        transactions.push({
          id: payout.id,
          amount: payout.amount / 100,
          status: payout.status,
          created: payout.created,
          description: `Payout to ${payout.destination}`,
          customer: null,
          currency: payout.currency,
          type: 'payout'
        })
      }

      // Sort by creation date (most recent first)
      return transactions
        .sort((a, b) => b.created - a.created)
        .slice(0, limit)
    } catch (error) {
      console.error('Error fetching recent transactions:', error)
      return []
    }
  }

  // Calculate health score based on multiple financial metrics
  private calculateHealthScore(metrics: {
    currentBalance: number
    revenueGrowth: number
    overdueInvoices: number
    pendingInvoices: number
    monthlyRecurring: number
    cashRunway: number
  }): number {
    let score = 100

    // Deduct points for overdue invoices
    if (metrics.overdueInvoices > 0) {
      score -= Math.min(30, (metrics.overdueInvoices / 10000) * 20)
    }

    // Deduct points for negative revenue growth
    if (metrics.revenueGrowth < 0) {
      score -= Math.min(20, Math.abs(metrics.revenueGrowth))
    }

    // Deduct points for low cash runway
    if (metrics.cashRunway < 3) {
      score -= Math.min(25, (3 - metrics.cashRunway) * 10)
    }

    // Add points for strong recurring revenue
    if (metrics.monthlyRecurring > metrics.currentBalance * 0.1) {
      score += 5
    }

    // Add points for positive growth
    if (metrics.revenueGrowth > 10) {
      score += Math.min(10, metrics.revenueGrowth / 10)
    }

    return Math.max(0, Math.min(100, Math.round(score)))
  }

  // Store metrics in database for historical tracking
  async storeCashFlowSnapshot(metrics: CashFlowMetrics): Promise<void> {
    try {
      const { error } = await supabase
        .from('cash_flow_snapshots')
        .insert({
          current_balance: metrics.currentBalance,
          monthly_recurring: metrics.monthlyRecurring,
          pending_invoices: metrics.pendingInvoices,
          overdue_invoices: metrics.overdueInvoices,
          cash_runway: metrics.cashRunway,
          health_score: metrics.healthScore,
          revenue_growth: metrics.revenueGrowth,
          avg_transaction_value: metrics.avgTransactionValue,
          customers_count: metrics.customersCount,
          churn_rate: metrics.churnRate,
          snapshot_date: new Date().toISOString()
        })

      if (error) {
        console.error('Error storing cash flow snapshot:', error)
      }
    } catch (error) {
      console.error('Error storing cash flow snapshot:', error)
    }
  }
}

export const cashFlowService = new CashFlowService()