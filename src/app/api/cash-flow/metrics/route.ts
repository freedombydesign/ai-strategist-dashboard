import { NextRequest, NextResponse } from 'next/server'
import { cashFlowService } from '@/services/cashFlowService'

export async function GET(request: NextRequest) {
  try {
    // Get fresh metrics from Stripe
    const metrics = await cashFlowService.getCashFlowMetrics()
    
    // Store snapshot for historical tracking
    await cashFlowService.storeCashFlowSnapshot(metrics)

    return NextResponse.json({
      success: true,
      data: metrics,
      timestamp: new Date().toISOString(),
      source: 'stripe_api'
    })
  } catch (error) {
    console.error('Error fetching cash flow metrics:', error)
    
    // Return fallback data with error indication
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch real-time cash flow data',
      data: {
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
      },
      timestamp: new Date().toISOString(),
      source: 'fallback'
    }, { status: 200 }) // Return 200 with fallback data instead of error
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, data } = await request.json()

    switch (action) {
      case 'sync':
        // Force sync with Stripe API
        const metrics = await cashFlowService.getCashFlowMetrics()
        await cashFlowService.storeCashFlowSnapshot(metrics)
        
        return NextResponse.json({
          success: true,
          message: 'Cash flow data synced successfully',
          data: metrics,
          timestamp: new Date().toISOString()
        })

      case 'forecast':
        // Generate cash flow forecast (placeholder for now)
        const forecastDays = data?.days || 30
        const currentMetrics = await cashFlowService.getCashFlowMetrics()
        
        const forecast = []
        for (let i = 1; i <= forecastDays; i++) {
          const date = new Date()
          date.setDate(date.getDate() + i)
          
          // Simple forecast calculation (in production, you'd use ML models)
          const dailyGrowth = currentMetrics.revenueGrowth / 30 / 100
          const projectedBalance = currentMetrics.currentBalance * (1 + (dailyGrowth * i))
          
          forecast.push({
            date: date.toISOString().split('T')[0],
            projectedBalance: Math.round(projectedBalance),
            confidence: Math.max(50, 90 - (i * 2)) // Confidence decreases over time
          })
        }
        
        return NextResponse.json({
          success: true,
          data: { forecast },
          timestamp: new Date().toISOString()
        })

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action'
        }, { status: 400 })
    }
  } catch (error) {
    console.error('Error in cash flow metrics POST:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}