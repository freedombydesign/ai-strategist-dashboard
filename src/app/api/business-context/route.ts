import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { userId, contextData } = await request.json()
    
    if (!userId || !contextData) {
      return NextResponse.json({ error: 'User ID and context data are required' }, { status: 400 })
    }

    // Save business context to Supabase
    const { data, error } = await supabase
      .from('business_context')
      .upsert({
        user_id: userId,
        business_name: contextData.businessName,
        business_model: contextData.businessModel,
        revenue_model: contextData.revenueModel,
        current_revenue: contextData.currentRevenue,
        team_size: contextData.teamSize,
        growth_stage: contextData.growthStage,
        target_market: contextData.targetMarket,
        ideal_client_profile: contextData.idealClientProfile,
        unique_value_proposition: contextData.uniqueValueProposition,
        main_competitors: contextData.mainCompetitors,
        competitive_advantage: contextData.competitiveAdvantage,
        top_bottlenecks: contextData.topBottlenecks,
        biggest_challenge: contextData.biggestChallenge,
        previous_frameworks: contextData.previousFrameworks,
        primary_goal: contextData.primaryGoal,
        success_metrics: contextData.successMetrics,
        timeframe: contextData.timeframe,
        industry: contextData.industry,
        business_age: contextData.businessAge,
        website_url: contextData.websiteUrl,
        additional_context: contextData.additionalContext,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select()

    if (error) {
      console.error('[BUSINESS-CONTEXT] Error saving context:', error)
      return NextResponse.json({ error: 'Failed to save business context' }, { status: 500 })
    }

    console.log('[BUSINESS-CONTEXT] Business context saved successfully for user:', userId)

    return NextResponse.json({
      success: true,
      message: 'Business context saved successfully',
      data: data?.[0]
    })

  } catch (error) {
    console.error('[BUSINESS-CONTEXT] API error:', error)
    return NextResponse.json({
      error: 'Failed to save business context',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Get business context from Supabase
    const { data, error } = await supabase
      .from('business_context')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('[BUSINESS-CONTEXT] Error fetching context:', error)
      return NextResponse.json({ error: 'Failed to fetch business context' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: data || null,
      hasContext: !!data
    })

  } catch (error) {
    console.error('[BUSINESS-CONTEXT] API error:', error)
    return NextResponse.json({
      error: 'Failed to fetch business context',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}