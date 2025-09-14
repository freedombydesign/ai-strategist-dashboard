import { stripeHelpers } from '@/lib/stripe-client'
import { supabase } from '@/lib/supabase-client'

export interface ProfitMetrics {
  monthlyRevenue: number
  monthlyExpenses: number
  grossProfit: number
  netProfit: number
  profitMargin: number
  expenseRatio: number
  revenueGrowth: number
  expenseGrowth: number
  profitGrowth: number
  avgTransactionValue: number
  customersCount: number
  revenuePerCustomer: number
  healthScore: number
}

export interface ClientProfitability {
  customerId: string
  customerName: string
  revenue: number
  estimatedExpenses: number
  profit: number
  profitMargin: number
  transactionCount: number
  avgOrderValue: number
  lastTransaction: number
}

export interface ExpenseCategory {
  category: string
  amount: number
  percentage: number
  trend: 'increasing' | 'decreasing' | 'stable'
}

export interface ProfitInsight {
  type: 'opportunity' | 'warning' | 'success' | 'optimization'
  title: string
  message: string
  impact: 'low' | 'medium' | 'high' | 'critical'
  potentialSavings?: number
  recommendedAction: string
}

class ProfitPulseService {
  // Get comprehensive profit metrics from Stripe + expense tracking
  async getProfitMetrics(): Promise<ProfitMetrics> {
    try {
      const now = Math.floor(Date.now() / 1000)
      const thirtyDaysAgo = now - (30 * 24 * 60 * 60)
      const sixtyDaysAgo = now - (60 * 24 * 60 * 60)

      // Get revenue data from Stripe
      const currentCharges = await stripeHelpers.getCharges({
        created: { gte: thirtyDaysAgo },
        limit: 100
      })

      const previousCharges = await stripeHelpers.getCharges({
        created: { gte: sixtyDaysAgo, lte: thirtyDaysAgo },
        limit: 100
      })

      // Calculate current month revenue
      const monthlyRevenue = currentCharges.data
        .filter(charge => charge.status === 'succeeded')
        .reduce((sum, charge) => sum + (charge.amount / 100), 0)

      // Calculate previous month revenue for growth
      const previousRevenue = previousCharges.data
        .filter(charge => charge.status === 'succeeded')
        .reduce((sum, charge) => sum + (charge.amount / 100), 0)

      // Get subscription revenue (recurring)
      const subscriptions = await stripeHelpers.getSubscriptions({ status: 'active' })
      const recurringRevenue = subscriptions.data.reduce((sum, sub) => {
        if (sub.items.data[0]?.price.recurring?.interval === 'month') {
          return sum + (sub.items.data[0].price.unit_amount || 0) / 100
        }
        return sum
      }, 0)

      // Calculate expenses (this would typically come from an accounting system)
      // For now, we'll estimate based on industry standards and user input
      const estimatedExpenses = await this.calculateEstimatedExpenses(monthlyRevenue)
      const monthlyExpenses = estimatedExpenses.total

      // Calculate profit metrics
      const grossProfit = monthlyRevenue - estimatedExpenses.cogs
      const netProfit = monthlyRevenue - monthlyExpenses
      const profitMargin = monthlyRevenue > 0 ? (netProfit / monthlyRevenue) * 100 : 0
      const expenseRatio = monthlyRevenue > 0 ? (monthlyExpenses / monthlyRevenue) * 100 : 0

      // Calculate growth rates
      const revenueGrowth = previousRevenue > 0 
        ? ((monthlyRevenue - previousRevenue) / previousRevenue) * 100 
        : 0

      // Estimate expense growth (simplified)
      const expenseGrowth = revenueGrowth * 0.7 // Assume expenses grow at 70% of revenue growth

      const profitGrowth = previousRevenue > 0 && monthlyRevenue > 0
        ? (((netProfit / monthlyRevenue) - ((previousRevenue * 0.7) / previousRevenue)) / ((previousRevenue * 0.7) / previousRevenue)) * 100
        : 0

      // Calculate customer metrics
      const customers = await stripeHelpers.getCustomers({ limit: 100 })
      const customersCount = customers.data.length
      const revenuePerCustomer = customersCount > 0 ? monthlyRevenue / customersCount : 0

      // Calculate average transaction value
      const successfulCharges = currentCharges.data.filter(charge => charge.status === 'succeeded')
      const avgTransactionValue = successfulCharges.length > 0
        ? successfulCharges.reduce((sum, charge) => sum + (charge.amount / 100), 0) / successfulCharges.length
        : 0

      // Calculate health score
      const healthScore = this.calculateProfitHealthScore({
        profitMargin,
        revenueGrowth,
        expenseRatio,
        netProfit
      })

      return {
        monthlyRevenue,
        monthlyExpenses,
        grossProfit,
        netProfit,
        profitMargin,
        expenseRatio,
        revenueGrowth,
        expenseGrowth,
        profitGrowth,
        avgTransactionValue,
        customersCount,
        revenuePerCustomer,
        healthScore
      }
    } catch (error) {
      console.error('Error calculating profit metrics:', error)
      
      // Return fallback data
      return {
        monthlyRevenue: 0,
        monthlyExpenses: 0,
        grossProfit: 0,
        netProfit: 0,
        profitMargin: 0,
        expenseRatio: 0,
        revenueGrowth: 0,
        expenseGrowth: 0,
        profitGrowth: 0,
        avgTransactionValue: 0,
        customersCount: 0,
        revenuePerCustomer: 0,
        healthScore: 0
      }
    }
  }

  // Calculate estimated expenses (would be replaced with real accounting data)
  private async calculateEstimatedExpenses(revenue: number) {
    // In a real system, this would pull from QuickBooks/Xero
    // For now, we use industry-standard expense ratios
    
    const cogs = revenue * 0.30 // 30% Cost of Goods Sold
    const marketing = revenue * 0.15 // 15% Marketing
    const operations = revenue * 0.20 // 20% Operations
    const personnel = revenue * 0.25 // 25% Personnel
    const overhead = revenue * 0.10 // 10% Overhead
    
    return {
      cogs,
      marketing,
      operations,
      personnel,
      overhead,
      total: cogs + marketing + operations + personnel + overhead,
      breakdown: [
        { category: 'Cost of Goods Sold', amount: cogs, percentage: 30 },
        { category: 'Marketing & Sales', amount: marketing, percentage: 15 },
        { category: 'Operations', amount: operations, percentage: 20 },
        { category: 'Personnel', amount: personnel, percentage: 25 },
        { category: 'Overhead', amount: overhead, percentage: 10 }
      ]
    }
  }

  // Get profitability by customer from Stripe data
  async getClientProfitability(): Promise<ClientProfitability[]> {
    try {
      const now = Math.floor(Date.now() / 1000)
      const thirtyDaysAgo = now - (30 * 24 * 60 * 60)

      // Get recent charges grouped by customer
      const charges = await stripeHelpers.getCharges({
        created: { gte: thirtyDaysAgo },
        limit: 100
      })

      const customerMetrics = new Map<string, {
        revenue: number
        transactionCount: number
        lastTransaction: number
        customerName: string
      }>()

      // Group charges by customer
      for (const charge of charges.data) {
        if (charge.status === 'succeeded' && charge.customer) {
          const customerId = charge.customer as string
          const current = customerMetrics.get(customerId) || {
            revenue: 0,
            transactionCount: 0,
            lastTransaction: 0,
            customerName: charge.billing_details?.name || `Customer ${customerId.slice(-4)}`
          }

          current.revenue += charge.amount / 100
          current.transactionCount += 1
          current.lastTransaction = Math.max(current.lastTransaction, charge.created)
          
          customerMetrics.set(customerId, current)
        }
      }

      // Calculate profitability for each customer
      const profitability: ClientProfitability[] = []
      
      for (const [customerId, metrics] of customerMetrics.entries()) {
        // Estimate expenses as 70% of revenue (simplified)
        const estimatedExpenses = metrics.revenue * 0.7
        const profit = metrics.revenue - estimatedExpenses
        const profitMargin = metrics.revenue > 0 ? (profit / metrics.revenue) * 100 : 0
        const avgOrderValue = metrics.transactionCount > 0 ? metrics.revenue / metrics.transactionCount : 0

        profitability.push({
          customerId,
          customerName: metrics.customerName,
          revenue: metrics.revenue,
          estimatedExpenses,
          profit,
          profitMargin,
          transactionCount: metrics.transactionCount,
          avgOrderValue,
          lastTransaction: metrics.lastTransaction
        })
      }

      // Sort by profit (highest first)
      return profitability.sort((a, b) => b.profit - a.profit).slice(0, 20)
    } catch (error) {
      console.error('Error calculating client profitability:', error)
      return []
    }
  }

  // Generate profit optimization insights
  async getProfitInsights(): Promise<ProfitInsight[]> {
    try {
      const metrics = await this.getProfitMetrics()
      const insights: ProfitInsight[] = []

      // Profit margin analysis
      if (metrics.profitMargin < 20) {
        insights.push({
          type: 'warning',
          title: 'Low Profit Margin',
          message: `Your profit margin of ${metrics.profitMargin.toFixed(1)}% is below the industry average of 20-25%`,
          impact: 'high',
          potentialSavings: metrics.monthlyRevenue * 0.05, // 5% improvement
          recommendedAction: 'Review pricing strategy and reduce variable costs'
        })
      } else if (metrics.profitMargin > 35) {
        insights.push({
          type: 'success',
          title: 'Excellent Profit Margin',
          message: `Your ${metrics.profitMargin.toFixed(1)}% profit margin is well above industry average`,
          impact: 'high',
          recommendedAction: 'Consider reinvesting in growth initiatives'
        })
      }

      // Revenue growth analysis
      if (metrics.revenueGrowth < 0) {
        insights.push({
          type: 'warning',
          title: 'Declining Revenue',
          message: `Revenue declined by ${Math.abs(metrics.revenueGrowth).toFixed(1)}% compared to last month`,
          impact: 'critical',
          recommendedAction: 'Analyze customer churn and implement retention strategies'
        })
      } else if (metrics.revenueGrowth > 10) {
        insights.push({
          type: 'success',
          title: 'Strong Revenue Growth',
          message: `Revenue grew by ${metrics.revenueGrowth.toFixed(1)}% - excellent momentum`,
          impact: 'high',
          recommendedAction: 'Scale successful initiatives and optimize for continued growth'
        })
      }

      // Expense ratio analysis
      if (metrics.expenseRatio > 80) {
        insights.push({
          type: 'warning',
          title: 'High Expense Ratio',
          message: `Expenses are ${metrics.expenseRatio.toFixed(1)}% of revenue - optimization needed`,
          impact: 'high',
          potentialSavings: metrics.monthlyExpenses * 0.10, // 10% reduction
          recommendedAction: 'Conduct expense audit and identify cost reduction opportunities'
        })
      }

      // Customer value analysis
      if (metrics.customersCount > 0 && metrics.revenuePerCustomer < 1000) {
        insights.push({
          type: 'opportunity',
          title: 'Low Revenue Per Customer',
          message: `Average revenue per customer is $${metrics.revenuePerCustomer.toFixed(0)} - upsell opportunity`,
          impact: 'medium',
          potentialSavings: metrics.customersCount * 200, // $200 increase per customer
          recommendedAction: 'Implement upselling and cross-selling strategies'
        })
      }

      // Transaction value optimization
      if (metrics.avgTransactionValue < 500) {
        insights.push({
          type: 'opportunity',
          title: 'Increase Average Order Value',
          message: `Average transaction of $${metrics.avgTransactionValue.toFixed(0)} could be improved with bundling`,
          impact: 'medium',
          recommendedAction: 'Create product bundles and implement minimum order incentives'
        })
      }

      return insights
    } catch (error) {
      console.error('Error generating profit insights:', error)
      return []
    }
  }

  // Calculate profit health score
  private calculateProfitHealthScore(metrics: {
    profitMargin: number
    revenueGrowth: number
    expenseRatio: number
    netProfit: number
  }): number {
    let score = 100

    // Profit margin impact (40% weight)
    if (metrics.profitMargin < 10) score -= 30
    else if (metrics.profitMargin < 20) score -= 15
    else if (metrics.profitMargin > 35) score += 10

    // Revenue growth impact (30% weight)
    if (metrics.revenueGrowth < -10) score -= 25
    else if (metrics.revenueGrowth < 0) score -= 15
    else if (metrics.revenueGrowth > 10) score += 15

    // Expense ratio impact (20% weight)
    if (metrics.expenseRatio > 85) score -= 20
    else if (metrics.expenseRatio > 75) score -= 10
    else if (metrics.expenseRatio < 60) score += 10

    // Net profit impact (10% weight)
    if (metrics.netProfit < 0) score -= 10
    else if (metrics.netProfit > 50000) score += 5

    return Math.max(0, Math.min(100, Math.round(score)))
  }

  // Store profit metrics snapshot
  async storeProfitSnapshot(metrics: ProfitMetrics): Promise<void> {
    try {
      const { error } = await supabase
        .from('profit_snapshots')
        .insert({
          monthly_revenue: metrics.monthlyRevenue,
          monthly_expenses: metrics.monthlyExpenses,
          gross_profit: metrics.grossProfit,
          net_profit: metrics.netProfit,
          profit_margin: metrics.profitMargin,
          expense_ratio: metrics.expenseRatio,
          revenue_growth: metrics.revenueGrowth,
          expense_growth: metrics.expenseGrowth,
          profit_growth: metrics.profitGrowth,
          avg_transaction_value: metrics.avgTransactionValue,
          customers_count: metrics.customersCount,
          revenue_per_customer: metrics.revenuePerCustomer,
          health_score: metrics.healthScore,
          snapshot_date: new Date().toISOString()
        })

      if (error) {
        console.error('Error storing profit snapshot:', error)
      }
    } catch (error) {
      console.error('Error storing profit snapshot:', error)
    }
  }
}

export const profitPulseService = new ProfitPulseService()