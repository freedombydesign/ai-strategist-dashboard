// ProfitPulse API - CAC Alerts Endpoints
// GET /api/profit-pulse/cac-analytics/alerts - Monitor CAC alerts and anomalies

import { NextRequest, NextResponse } from 'next/server'
import { cacTrackingService } from '@/services/cacTrackingService'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const cacAlerts = await cacTrackingService.monitorCACAlerts(userId)

    return NextResponse.json({
      success: true,
      data: {
        alerts: cacAlerts,
        alertCount: cacAlerts.length,
        criticalAlerts: cacAlerts.filter(alert => alert.severity === 'critical').length,
        warningAlerts: cacAlerts.filter(alert => alert.severity === 'warning').length
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('CAC Alerts API error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch CAC alerts',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}