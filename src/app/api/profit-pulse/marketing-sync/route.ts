// ProfitPulse API - Marketing Platform Sync Endpoints
// Sync marketing costs and performance data from external platforms

import { NextRequest, NextResponse } from 'next/server'
import { cacTrackingService } from '@/services/cacTrackingService'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, userId } = body
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    switch (action) {
      case 'sync_marketing_costs':
        const { platform, costs } = body
        
        if (!platform || !costs || !Array.isArray(costs)) {
          return NextResponse.json({ 
            error: 'Platform and costs array are required' 
          }, { status: 400 })
        }

        await cacTrackingService.syncMarketingCosts(userId, {
          platform,
          costs
        })

        return NextResponse.json({
          success: true,
          message: `Marketing costs synced from ${platform}`,
          data: {
            platform,
            costsSynced: costs.length,
            totalSpend: costs.reduce((sum: number, cost: any) => sum + cost.amount, 0)
          },
          timestamp: new Date().toISOString()
        })

      default:
        return NextResponse.json({ error: 'Invalid action parameter' }, { status: 400 })
    }

  } catch (error) {
    console.error('Marketing Sync API error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to sync marketing data',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Return available sync platforms and their status
    const syncPlatforms = [
      {
        platform: 'google_ads',
        name: 'Google Ads',
        supported: true,
        features: ['cost_sync', 'conversion_tracking', 'campaign_performance']
      },
      {
        platform: 'facebook_ads',
        name: 'Facebook Ads',
        supported: true,
        features: ['cost_sync', 'conversion_tracking', 'audience_insights']
      },
      {
        platform: 'linkedin_ads',
        name: 'LinkedIn Ads',
        supported: true,
        features: ['cost_sync', 'lead_generation', 'b2b_targeting']
      },
      {
        platform: 'hubspot',
        name: 'HubSpot',
        supported: true,
        features: ['cost_attribution', 'lead_scoring', 'pipeline_tracking']
      },
      {
        platform: 'salesforce',
        name: 'Salesforce',
        supported: true,
        features: ['opportunity_tracking', 'cost_attribution', 'roi_analysis']
      }
    ]

    return NextResponse.json({
      success: true,
      data: {
        supportedPlatforms: syncPlatforms,
        totalPlatforms: syncPlatforms.length,
        recommendedIntegrations: [
          'google_ads',
          'facebook_ads',
          'hubspot'
        ]
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Marketing Sync GET API error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch marketing sync data',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}