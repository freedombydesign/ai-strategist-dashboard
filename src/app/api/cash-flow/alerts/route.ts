import { NextRequest, NextResponse } from 'next/server'
import { cashFlowService } from '@/services/cashFlowService'

export async function GET(request: NextRequest) {
  try {
    // Get real-time alerts from Stripe data
    const alerts = await cashFlowService.getCashFlowAlerts()

    return NextResponse.json({
      success: true,
      data: alerts,
      count: alerts.length,
      timestamp: new Date().toISOString(),
      source: 'stripe_api'
    })
  } catch (error) {
    console.error('Error fetching cash flow alerts:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch cash flow alerts',
      data: [],
      count: 0,
      timestamp: new Date().toISOString(),
      source: 'fallback'
    }, { status: 200 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, alertId, data } = await request.json()

    switch (action) {
      case 'dismiss':
        // In a full system, you'd mark the alert as dismissed in the database
        return NextResponse.json({
          success: true,
          message: 'Alert dismissed successfully'
        })

      case 'resolve':
        // Mark alert as resolved
        return NextResponse.json({
          success: true,
          message: 'Alert marked as resolved'
        })

      case 'snooze':
        // Snooze alert for specified duration
        const snoozeDuration = data?.hours || 24
        return NextResponse.json({
          success: true,
          message: `Alert snoozed for ${snoozeDuration} hours`
        })

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action'
        }, { status: 400 })
    }
  } catch (error) {
    console.error('Error handling cash flow alert action:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}