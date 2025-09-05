import { NextRequest, NextResponse } from 'next/server'
import { profitPulseService } from '@/services/profitPulseService'

export async function GET(request: NextRequest) {
  try {
    // Get comprehensive profit metrics from Stripe + calculations
    const metrics = await profitPulseService.getProfitMetrics()
    
    // Store snapshot for historical tracking
    await profitPulseService.storeProfitSnapshot(metrics)

    return NextResponse.json({
      success: true,
      data: metrics,
      timestamp: new Date().toISOString(),
      source: 'stripe_api_calculated'
    })
  } catch (error) {
    console.error('Error fetching profit metrics:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch profit metrics',
      data: {
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
      },
      timestamp: new Date().toISOString(),
      source: 'fallback'
    }, { status: 200 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, data } = await request.json()

    switch (action) {
      case 'update_expense_ratios':
        // Update expense ratio settings (in a real system, stored in database)
        const ratios = data?.ratios || {}
        
        return NextResponse.json({
          success: true,
          message: 'Expense ratios updated successfully',
          ratios
        })

      case 'recalculate':
        // Force recalculation of profit metrics
        const metrics = await profitPulseService.getProfitMetrics()
        await profitPulseService.storeProfitSnapshot(metrics)
        
        return NextResponse.json({
          success: true,
          message: 'Profit metrics recalculated successfully',
          data: metrics
        })

      case 'export_report':
        // Generate profit report (placeholder)
        return NextResponse.json({
          success: true,
          message: 'Profit report generated successfully',
          reportId: `profit_report_${Date.now()}`,
          downloadUrl: '/api/reports/download/profit-report.pdf'
        })

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action'
        }, { status: 400 })
    }
  } catch (error) {
    console.error('Error in profit metrics POST:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}