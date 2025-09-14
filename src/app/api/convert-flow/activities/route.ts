import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const leadId = searchParams.get('leadId')
    const activityType = searchParams.get('type')
    const limit = parseInt(searchParams.get('limit') || '50')
    const page = parseInt(searchParams.get('page') || '1')

    let query = supabase
      .from('convert_flow_lead_activities')
      .select(`
        *,
        convert_flow_leads!inner(
          id,
          first_name,
          last_name,
          email,
          company
        )
      `)
      .order('created_at', { ascending: false })

    if (leadId) {
      query = query.eq('lead_id', leadId)
    }

    if (activityType) {
      query = query.eq('activity_type', activityType)
    }

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data: activities, error } = await query

    if (error) {
      console.error('[CONVERT-FLOW] Error fetching activities:', error)
      return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 })
    }

    // Get activity summary if no specific lead requested
    let summary = null
    if (!leadId) {
      summary = await getActivitySummary()
    }

    return NextResponse.json({
      activities: activities || [],
      summary
    })

  } catch (error) {
    console.error('[CONVERT-FLOW] Unexpected error fetching activities:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const activityData = await request.json()

    // Validate required fields
    if (!activityData.lead_id || !activityData.activity_type) {
      return NextResponse.json({ 
        error: 'Missing required fields: lead_id, activity_type' 
      }, { status: 400 })
    }

    // Calculate score impact based on activity type
    const scoreChange = calculateActivityScore(activityData.activity_type, activityData.activity_data)

    // Create activity record
    const { data: activity, error } = await supabase
      .from('convert_flow_lead_activities')
      .insert({
        ...activityData,
        score_change: scoreChange,
        created_at: new Date().toISOString()
      })
      .select(`
        *,
        convert_flow_leads!inner(
          id,
          first_name,
          last_name,
          email,
          company,
          lead_score
        )
      `)
      .single()

    if (error) {
      console.error('[CONVERT-FLOW] Error creating activity:', error)
      return NextResponse.json({ error: 'Failed to create activity' }, { status: 500 })
    }

    // Update lead score if there's a score change
    if (scoreChange !== 0) {
      const currentScore = activity.convert_flow_leads.lead_score || 0
      const newScore = Math.max(0, Math.min(100, currentScore + scoreChange))

      await supabase
        .from('convert_flow_leads')
        .update({ 
          lead_score: newScore,
          last_activity_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', activityData.lead_id)
    }

    // Update activity counters based on type
    await updateActivityCounters(activityData.lead_id, activityData.activity_type)

    return NextResponse.json({
      activity,
      message: 'Activity recorded successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('[CONVERT-FLOW] Unexpected error creating activity:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Calculate score impact based on activity type
function calculateActivityScore(activityType: string, activityData: any): number {
  const scoreMap: Record<string, number> = {
    'page_visit': 1,
    'content_download': 10,
    'email_open': 2,
    'email_click': 5,
    'form_submit': 15,
    'webinar_attended': 20,
    'demo_requested': 25,
    'proposal_viewed': 15,
    'pricing_page_visit': 8,
    'call_scheduled': 30,
    'call_completed': 25,
    'meeting_attended': 35,
    'contract_downloaded': 20,
    'unsubscribe': -20,
    'bounced_email': -5,
    'complaint': -30
  }

  let baseScore = scoreMap[activityType] || 0

  // Adjust based on activity data
  if (activityType === 'page_visit' && activityData?.time_on_page > 120) {
    baseScore += 2 // Bonus for engaged page visits
  }

  if (activityType === 'email_click' && activityData?.link_type === 'cta') {
    baseScore += 3 // Bonus for CTA clicks
  }

  if (activityType === 'content_download' && activityData?.content_type === 'case_study') {
    baseScore += 5 // Bonus for high-value content
  }

  return baseScore
}

// Update activity counters on lead record
async function updateActivityCounters(leadId: string, activityType: string) {
  try {
    const counterMap: Record<string, string> = {
      'page_visit': 'page_views',
      'email_open': 'email_opens',
      'email_click': 'email_clicks',
      'website_session': 'website_sessions',
      'content_download': 'content_downloads'
    }

    const counterField = counterMap[activityType]
    if (!counterField) return

    // Get current counter value
    const { data: lead } = await supabase
      .from('convert_flow_leads')
      .select(counterField)
      .eq('id', leadId)
      .single()

    if (lead) {
      const currentValue = lead[counterField] || 0
      await supabase
        .from('convert_flow_leads')
        .update({ 
          [counterField]: currentValue + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', leadId)
    }

  } catch (error) {
    console.error('[CONVERT-FLOW] Failed to update activity counters:', error)
  }
}

// Get activity summary for dashboard
async function getActivitySummary() {
  try {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    const weekAgo = new Date(today)
    weekAgo.setDate(weekAgo.getDate() - 7)

    // Get today's activities
    const { data: todayActivities } = await supabase
      .from('convert_flow_lead_activities')
      .select('activity_type')
      .gte('created_at', today.toISOString().split('T')[0])

    // Get this week's activities
    const { data: weekActivities } = await supabase
      .from('convert_flow_lead_activities')
      .select('activity_type')
      .gte('created_at', weekAgo.toISOString())

    // Get top activity types
    const { data: topActivities } = await supabase
      .from('convert_flow_lead_activities')
      .select('activity_type')
      .gte('created_at', weekAgo.toISOString())

    const activityTypeCount = topActivities?.reduce((acc, activity) => {
      acc[activity.activity_type] = (acc[activity.activity_type] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    const sortedActivities = Object.entries(activityTypeCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)

    return {
      todayTotal: todayActivities?.length || 0,
      weekTotal: weekActivities?.length || 0,
      topActivityTypes: sortedActivities,
      activityTrend: await getActivityTrend()
    }

  } catch (error) {
    console.error('[CONVERT-FLOW] Error calculating activity summary:', error)
    return {
      todayTotal: 0,
      weekTotal: 0,
      topActivityTypes: [],
      activityTrend: []
    }
  }
}

// Get activity trend for the last 30 days
async function getActivityTrend() {
  try {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: activities } = await supabase
      .from('convert_flow_lead_activities')
      .select('created_at')
      .gte('created_at', thirtyDaysAgo.toISOString())

    // Group by day
    const dailyCount: Record<string, number> = {}
    
    activities?.forEach(activity => {
      const date = activity.created_at.split('T')[0]
      dailyCount[date] = (dailyCount[date] || 0) + 1
    })

    // Fill in missing days with 0
    const trend = []
    for (let i = 29; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      
      trend.push({
        date: dateStr,
        count: dailyCount[dateStr] || 0
      })
    }

    return trend

  } catch (error) {
    console.error('[CONVERT-FLOW] Error calculating activity trend:', error)
    return []
  }
}