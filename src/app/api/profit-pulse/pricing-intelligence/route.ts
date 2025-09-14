// ProfitPulse API - AI-Powered Pricing Intelligence Endpoints
// Advanced pricing optimization and recommendations

import { NextRequest, NextResponse } from 'next/server'
import { aiPricingIntelligenceService } from '@/services/aiPricingIntelligenceService'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const clientId = searchParams.get('clientId')
    const action = searchParams.get('action')
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    switch (action) {
      case 'recommendations':
        if (!clientId) {
          return NextResponse.json({ error: 'Client ID required for pricing recommendations' }, { status: 400 })
        }

        const includeMarketIntelligence = searchParams.get('includeMarketIntelligence') === 'true'
        const includeDynamicPricing = searchParams.get('includeDynamicPricing') === 'true'
        const includeValueBased = searchParams.get('includeValueBased') === 'true'

        const recommendations = await aiPricingIntelligenceService
          .generatePricingRecommendations(userId, clientId, {
            includeMarketIntelligence,
            includeDynamicPricing,
            includeValueBased
          })

        return NextResponse.json({
          success: true,
          data: recommendations,
          timestamp: new Date().toISOString()
        })

      case 'dynamic_pricing':
        if (!clientId) {
          return NextResponse.json({ error: 'Client ID required for dynamic pricing' }, { status: 400 })
        }

        const dynamicModel = await aiPricingIntelligenceService
          .generateDynamicPricingModel(userId, clientId)

        return NextResponse.json({
          success: true,
          data: dynamicModel,
          timestamp: new Date().toISOString()
        })

      case 'value_based_analysis':
        if (!clientId) {
          return NextResponse.json({ error: 'Client ID required for value-based analysis' }, { status: 400 })
        }

        const valueAnalysis = await aiPricingIntelligenceService
          .generateValueBasedPricingAnalysis(userId, clientId)

        return NextResponse.json({
          success: true,
          data: valueAnalysis,
          timestamp: new Date().toISOString()
        })

      case 'optimization_dashboard':
        const dashboard = await aiPricingIntelligenceService
          .getPricingOptimizationDashboard(userId)

        return NextResponse.json({
          success: true,
          data: dashboard,
          timestamp: new Date().toISOString()
        })

      default:
        return NextResponse.json({ error: 'Invalid action parameter' }, { status: 400 })
    }

  } catch (error) {
    console.error('Pricing Intelligence API error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch pricing intelligence data',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}