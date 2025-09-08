// ProfitPulse API - Client Analytics Endpoints
// GET /api/profit-pulse/client-analytics - Advanced client analytics and segmentation

import { NextRequest, NextResponse } from 'next/server'
import { clientProfitabilityAnalyticsService } from '@/services/clientProfitabilityAnalyticsService'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const clientId = searchParams.get('clientId')
    const includePredictions = searchParams.get('includePredictions') === 'true'
    const includeSeasonality = searchParams.get('includeSeasonality') === 'true'
    const benchmarkPeriod = searchParams.get('benchmarkPeriod') as 'quarter' | 'year' || 'quarter'
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    if (clientId) {
      // Get specific client analytics
      const clientAnalytics = await clientProfitabilityAnalyticsService
        .getClientAnalytics(userId, clientId, {
          includePredictions,
          includeSeasonality,
          benchmarkPeriod
        })

      return NextResponse.json({
        success: true,
        data: clientAnalytics,
        timestamp: new Date().toISOString()
      })
    } else {
      // Get client segmentation analysis
      const segmentation = await clientProfitabilityAnalyticsService
        .getClientSegmentation(userId)

      return NextResponse.json({
        success: true,
        data: {
          segments: segmentation,
          totalSegments: segmentation.length,
          totalClients: segmentation.reduce((sum, seg) => sum + seg.clientCount, 0),
          totalRevenue: segmentation.reduce((sum, seg) => sum + seg.totalRevenue, 0)
        },
        timestamp: new Date().toISOString()
      })
    }

  } catch (error) {
    console.error('Client Analytics API error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch client analytics',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}