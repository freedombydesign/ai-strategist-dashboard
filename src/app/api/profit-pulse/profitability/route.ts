// ProfitPulse API - Client Profitability Endpoints
// GET /api/profit-pulse/profitability - Get comprehensive profitability data

import { NextRequest, NextResponse } from 'next/server'
import { profitabilityCalculationService } from '@/services/profitabilityCalculationService'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')
    const userId = searchParams.get('userId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const includeForecasting = searchParams.get('includeForecasting') === 'true'
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    if (clientId) {
      // Get specific client profitability
      const profitabilityData = await profitabilityCalculationService
        .calculateClientProfitability(userId, clientId, {
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          includeForecasting
        })

      return NextResponse.json({
        success: true,
        data: profitabilityData,
        timestamp: new Date().toISOString()
      })
    } else {
      // Get all clients profitability ranking
      const sortBy = searchParams.get('sortBy') as 'true_profit' | 'true_margin' | 'ltv_cac_ratio' | 'profit_per_hour' || 'true_profit'
      const limit = parseInt(searchParams.get('limit') || '50')
      
      const rankingData = await profitabilityCalculationService
        .getClientProfitabilityRanking(userId, {
          limit,
          sortBy,
          includeAlerts: true
        })

      return NextResponse.json({
        success: true,
        data: {
          clients: rankingData,
          totalClients: rankingData.length,
          sortedBy: sortBy
        },
        timestamp: new Date().toISOString()
      })
    }

  } catch (error) {
    console.error('Profitability API error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch profitability data',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, clientId, date } = body
    
    if (!userId || !clientId || !date) {
      return NextResponse.json({ 
        error: 'User ID, client ID, and date are required' 
      }, { status: 400 })
    }

    // Update profitability snapshot
    await profitabilityCalculationService
      .updateProfitabilitySnapshot(userId, clientId, date)

    return NextResponse.json({
      success: true,
      message: 'Profitability snapshot updated',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Update profitability snapshot error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to update profitability snapshot',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}