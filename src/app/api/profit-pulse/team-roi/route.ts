// ProfitPulse API - Team ROI Tracking Endpoints
// Comprehensive team performance and ROI analytics

import { NextRequest, NextResponse } from 'next/server'
import { teamROITrackingService } from '@/services/teamROITrackingService'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const teamMemberId = searchParams.get('teamMemberId')
    const action = searchParams.get('action')
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    switch (action) {
      case 'overview':
        const overview = await teamROITrackingService.getTeamOverview(userId)
        return NextResponse.json({
          success: true,
          data: overview,
          timestamp: new Date().toISOString()
        })

      case 'member_roi':
        if (!teamMemberId) {
          return NextResponse.json({ error: 'Team member ID required for ROI analysis' }, { status: 400 })
        }

        const startDate = searchParams.get('startDate')
        const endDate = searchParams.get('endDate')
        const includeRecommendations = searchParams.get('includeRecommendations') === 'true'
        const includeBenchmarks = searchParams.get('includeBenchmarks') === 'true'

        const memberROI = await teamROITrackingService.getTeamMemberROI(userId, teamMemberId, {
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          includeRecommendations,
          includeBenchmarks
        })

        return NextResponse.json({
          success: true,
          data: memberROI,
          timestamp: new Date().toISOString()
        })

      case 'optimization':
        const optimization = await teamROITrackingService.getTeamOptimization(userId)
        return NextResponse.json({
          success: true,
          data: optimization,
          timestamp: new Date().toISOString()
        })

      case 'benchmarks':
        if (!teamMemberId) {
          return NextResponse.json({ error: 'Team member ID required for benchmarks' }, { status: 400 })
        }

        const benchmarks = await teamROITrackingService.getTeamBenchmarks(userId, teamMemberId)
        return NextResponse.json({
          success: true,
          data: benchmarks,
          timestamp: new Date().toISOString()
        })

      default:
        return NextResponse.json({ error: 'Invalid action parameter' }, { status: 400 })
    }

  } catch (error) {
    console.error('Team ROI API error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch team ROI data',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}