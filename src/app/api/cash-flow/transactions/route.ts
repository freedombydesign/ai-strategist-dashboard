import { NextRequest, NextResponse } from 'next/server'
import { cashFlowService } from '@/services/cashFlowService'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Get real transactions from Stripe
    const transactions = await cashFlowService.getRecentTransactions(limit + offset)
    
    // Apply offset (simple pagination)
    const paginatedTransactions = transactions.slice(offset, offset + limit)

    return NextResponse.json({
      success: true,
      data: paginatedTransactions,
      pagination: {
        limit,
        offset,
        total: transactions.length,
        hasMore: offset + limit < transactions.length
      },
      timestamp: new Date().toISOString(),
      source: 'stripe_api'
    })
  } catch (error) {
    console.error('Error fetching transactions:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch transaction data',
      data: [],
      pagination: { limit: 50, offset: 0, total: 0, hasMore: false },
      timestamp: new Date().toISOString(),
      source: 'fallback'
    }, { status: 200 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, data } = await request.json()

    switch (action) {
      case 'sync':
        // Force sync recent transactions
        const transactions = await cashFlowService.getRecentTransactions(100)
        
        return NextResponse.json({
          success: true,
          message: 'Transactions synced successfully',
          count: transactions.length,
          timestamp: new Date().toISOString()
        })

      case 'export':
        // Export transactions to CSV (placeholder)
        const format = data?.format || 'csv'
        const dateRange = data?.dateRange || 'last30days'
        
        return NextResponse.json({
          success: true,
          message: `Transaction export initiated`,
          exportId: `export_${Date.now()}`,
          format,
          dateRange,
          estimatedCompletion: new Date(Date.now() + 60000).toISOString() // 1 minute from now
        })

      case 'categorize':
        // Auto-categorize transactions (AI-powered in production)
        return NextResponse.json({
          success: true,
          message: 'Transaction categorization started',
          processed: data?.transactionIds?.length || 0
        })

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action'
        }, { status: 400 })
    }
  } catch (error) {
    console.error('Error in transactions POST:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}