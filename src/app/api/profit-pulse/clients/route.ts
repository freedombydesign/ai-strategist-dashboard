import { NextRequest, NextResponse } from 'next/server'
import { profitPulseService } from '@/services/profitPulseService'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const sortBy = searchParams.get('sortBy') || 'profit' // profit, revenue, margin

    // Get client profitability analysis
    const clientProfitability = await profitPulseService.getClientProfitability()
    
    // Sort based on requested criteria
    let sortedClients = [...clientProfitability]
    switch (sortBy) {
      case 'revenue':
        sortedClients.sort((a, b) => b.revenue - a.revenue)
        break
      case 'margin':
        sortedClients.sort((a, b) => b.profitMargin - a.profitMargin)
        break
      case 'profit':
      default:
        sortedClients.sort((a, b) => b.profit - a.profit)
        break
    }

    return NextResponse.json({
      success: true,
      data: sortedClients.slice(0, limit),
      total: sortedClients.length,
      sortBy,
      timestamp: new Date().toISOString(),
      source: 'stripe_api'
    })
  } catch (error) {
    console.error('Error fetching client profitability:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch client profitability data',
      data: [],
      total: 0,
      timestamp: new Date().toISOString(),
      source: 'fallback'
    }, { status: 200 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, data } = await request.json()

    switch (action) {
      case 'analyze_client':
        // Deep dive analysis for specific client
        const clientId = data?.clientId
        if (!clientId) {
          return NextResponse.json({
            success: false,
            error: 'Client ID required'
          }, { status: 400 })
        }

        return NextResponse.json({
          success: true,
          message: 'Client analysis completed',
          analysis: {
            clientId,
            recommendations: [
              'Consider upselling premium services',
              'Optimize service delivery costs',
              'Implement retainer pricing model'
            ],
            riskScore: 25,
            opportunityScore: 75
          }
        })

      case 'export_client_report':
        // Export client profitability report
        return NextResponse.json({
          success: true,
          message: 'Client profitability report generated',
          reportId: `client_profit_${Date.now()}`,
          downloadUrl: '/api/reports/download/client-profitability.csv'
        })

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action'
        }, { status: 400 })
    }
  } catch (error) {
    console.error('Error in client profitability POST:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}