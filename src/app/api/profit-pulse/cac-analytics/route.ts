// ProfitPulse API - CAC Analytics Endpoints
// GET /api/profit-pulse/cac-analytics - Get comprehensive CAC data and channel performance

import { NextRequest, NextResponse } from 'next/server'
import { cacTrackingService } from '@/services/cacTrackingService'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const includeTrends = searchParams.get('includeTrends') === 'true'
    const includeBenchmarks = searchParams.get('includeBenchmarks') === 'true'
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const cacMetrics = await cacTrackingService.calculateCACMetrics(userId, {
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      includeTrends,
      includeBenchmarks
    })

    return NextResponse.json({
      success: true,
      data: cacMetrics,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('CAC Analytics API error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch CAC analytics data',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, clientId, acquisitionData } = body
    
    if (!userId || !clientId || !acquisitionData) {
      return NextResponse.json({ 
        error: 'User ID, client ID, and acquisition data are required' 
      }, { status: 400 })
    }

    await cacTrackingService.recordClientAcquisition(userId, clientId, acquisitionData)

    return NextResponse.json({
      success: true,
      message: 'Client acquisition recorded successfully',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Record client acquisition error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to record client acquisition',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}