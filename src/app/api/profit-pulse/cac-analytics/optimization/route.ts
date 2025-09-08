// ProfitPulse API - CAC Optimization Endpoints
// GET /api/profit-pulse/cac-analytics/optimization - Get CAC optimization recommendations

import { NextRequest, NextResponse } from 'next/server'
import { cacTrackingService } from '@/services/cacTrackingService'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const optimizationRecommendations = await cacTrackingService
      .generateCACOptimizationRecommendations(userId)

    // Calculate total potential impact
    const totalImpact = optimizationRecommendations.reduce(
      (sum, opt) => sum + Math.abs(opt.roiImpact), 0
    )

    return NextResponse.json({
      success: true,
      data: {
        recommendations: optimizationRecommendations,
        totalChannels: optimizationRecommendations.length,
        totalPotentialImpact: totalImpact,
        highImpactRecommendations: optimizationRecommendations.filter(
          opt => Math.abs(opt.roiImpact) > 1000
        ).length
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('CAC Optimization API error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch CAC optimization recommendations',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}