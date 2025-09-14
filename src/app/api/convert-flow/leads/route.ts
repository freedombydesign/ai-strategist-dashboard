import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { hubspotIntegrationService } from '@/services/hubspotIntegrationService'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '25')
    const stage = searchParams.get('stage')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    let query = supabase
      .from('convert_flow_leads')
      .select(`
        *,
        convert_flow_proposals!convert_flow_proposals_lead_id_fkey(
          id,
          proposal_number,
          title,
          total_amount,
          status,
          created_at
        )
      `, { count: 'exact' })

    // Apply filters
    if (stage && stage !== 'all') {
      query = query.eq('stage', stage)
    }

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,company.ilike.%${search}%`)
    }

    // Apply sorting
    const validSortColumns = ['created_at', 'updated_at', 'lead_score', 'first_name', 'last_name', 'company', 'stage', 'estimated_value']
    if (validSortColumns.includes(sortBy)) {
      query = query.order(sortBy, { ascending: sortOrder === 'asc' })
    }

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data: leads, error, count } = await query

    if (error) {
      console.error('[CONVERT-FLOW] Error fetching leads:', error)
      return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 })
    }

    // Calculate analytics
    const analytics = await calculateLeadAnalytics()

    return NextResponse.json({
      leads: leads || [],
      pagination: {
        total: count || 0,
        page,
        limit,
        pages: Math.ceil((count || 0) / limit)
      },
      analytics
    })

  } catch (error) {
    console.error('[CONVERT-FLOW] Unexpected error fetching leads:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const leadData = await request.json()

    // Validate required fields
    const requiredFields = ['first_name', 'last_name', 'email']
    for (const field of requiredFields) {
      if (!leadData[field]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 })
      }
    }

    // Calculate initial lead score
    const initialScore = calculateInitialLeadScore(leadData)

    // Create lead in database
    const { data: newLead, error } = await supabase
      .from('convert_flow_leads')
      .insert({
        ...leadData,
        lead_score: initialScore,
        stage: leadData.stage || 'new',
        status: leadData.status || 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('[CONVERT-FLOW] Error creating lead:', error)
      return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 })
    }

    // Sync to HubSpot in background (don't wait for completion)
    hubspotIntegrationService.syncLeadToHubSpot(newLead.id).catch(error => {
      console.error('[CONVERT-FLOW] Failed to sync lead to HubSpot:', error)
    })

    // Log activity
    await supabase
      .from('convert_flow_lead_activities')
      .insert({
        lead_id: newLead.id,
        activity_type: 'lead_created',
        activity_data: { source: leadData.lead_source || 'manual' },
        created_at: new Date().toISOString()
      })

    return NextResponse.json({
      lead: newLead,
      message: 'Lead created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('[CONVERT-FLOW] Unexpected error creating lead:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Calculate lead analytics
async function calculateLeadAnalytics() {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    
    // Get lead counts by stage
    const { data: stageData } = await supabase
      .from('convert_flow_leads')
      .select('stage')

    const stageCount = stageData?.reduce((acc, lead) => {
      acc[lead.stage] = (acc[lead.stage] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    // Get recent leads
    const { data: recentLeads } = await supabase
      .from('convert_flow_leads')
      .select('created_at, lead_score')
      .gte('created_at', thirtyDaysAgo)

    const recentLeadCount = recentLeads?.length || 0
    const avgLeadScore = recentLeads?.length 
      ? recentLeads.reduce((sum, lead) => sum + (lead.lead_score || 0), 0) / recentLeads.length
      : 0

    // Get conversion rate (leads that became opportunities)
    const { data: convertedLeads } = await supabase
      .from('convert_flow_leads')
      .select('id')
      .in('stage', ['opportunity', 'proposal', 'negotiation', 'closed_won'])
      .gte('created_at', thirtyDaysAgo)

    const conversionRate = recentLeadCount > 0 
      ? ((convertedLeads?.length || 0) / recentLeadCount) * 100 
      : 0

    // Get pipeline value
    const { data: pipelineLeads } = await supabase
      .from('convert_flow_leads')
      .select('estimated_value')
      .not('stage', 'in', '("closed_lost", "unqualified")')

    const pipelineValue = pipelineLeads?.reduce((sum, lead) => sum + (lead.estimated_value || 0), 0) || 0

    return {
      totalLeads: stageData?.length || 0,
      recentLeads: recentLeadCount,
      conversionRate: Math.round(conversionRate * 100) / 100,
      avgLeadScore: Math.round(avgLeadScore * 100) / 100,
      pipelineValue,
      stageDistribution: stageCount
    }

  } catch (error) {
    console.error('[CONVERT-FLOW] Error calculating analytics:', error)
    return {
      totalLeads: 0,
      recentLeads: 0,
      conversionRate: 0,
      avgLeadScore: 0,
      pipelineValue: 0,
      stageDistribution: {}
    }
  }
}

// Calculate initial lead score based on available data
function calculateInitialLeadScore(leadData: any): number {
  let score = 50 // Base score

  // Company information adds points
  if (leadData.company) score += 15
  if (leadData.title) score += 10
  if (leadData.industry) score += 8

  // Budget and timeline indicators
  if (leadData.budget_range) {
    const budgetPoints = getBudgetScore(leadData.budget_range)
    score += budgetPoints
  }

  if (leadData.decision_timeline) {
    const timelinePoints = getTimelineScore(leadData.decision_timeline)
    score += timelinePoints
  }

  // Lead source quality
  if (leadData.lead_source) {
    const sourcePoints = getSourceScore(leadData.lead_source)
    score += sourcePoints
  }

  // Company size
  if (leadData.company_size) {
    const sizePoints = getCompanySizeScore(leadData.company_size)
    score += sizePoints
  }

  // Annual revenue
  if (leadData.annual_revenue) {
    const revenuePoints = getRevenueScore(leadData.annual_revenue)
    score += revenuePoints
  }

  return Math.min(Math.max(score, 0), 100) // Keep between 0-100
}

function getBudgetScore(budgetRange: string): number {
  const budgetScores: Record<string, number> = {
    'under_10k': 5,
    '10k_25k': 10,
    '25k_50k': 15,
    '50k_100k': 20,
    'over_100k': 25
  }
  return budgetScores[budgetRange] || 0
}

function getTimelineScore(timeline: string): number {
  const timelineScores: Record<string, number> = {
    'immediate': 20,
    '1_month': 15,
    '3_months': 10,
    '6_months': 5,
    'no_timeline': 0
  }
  return timelineScores[timeline] || 0
}

function getSourceScore(source: string): number {
  const sourceScores: Record<string, number> = {
    'referral': 20,
    'direct': 15,
    'organic_search': 12,
    'paid_search': 10,
    'social_media': 8,
    'email_campaign': 8,
    'content_download': 12,
    'webinar': 15,
    'unknown': 0
  }
  return sourceScores[source] || 5
}

function getCompanySizeScore(size: string): number {
  const sizeScores: Record<string, number> = {
    '1_10': 5,
    '11_50': 10,
    '51_200': 15,
    '201_500': 18,
    '500_plus': 20
  }
  return sizeScores[size] || 0
}

function getRevenueScore(revenue: string): number {
  const revenueScores: Record<string, number> = {
    'under_1m': 5,
    '1m_5m': 10,
    '5m_20m': 15,
    '20m_100m': 18,
    'over_100m': 20
  }
  return revenueScores[revenue] || 0
}