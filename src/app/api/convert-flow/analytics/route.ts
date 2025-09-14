import { NextRequest, NextResponse } from 'next/server'
import { analyticsService } from '@/services/analyticsService'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const funnelId = searchParams.get('funnelId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const timeframe = searchParams.get('timeframe') as 'monthly' | 'quarterly' | 'annual'

    const dateRange = startDate && endDate ? { start: startDate, end: endDate } : undefined

    switch (type) {
      case 'funnel_conversion':
        if (!funnelId) {
          return NextResponse.json({ error: 'funnelId required for funnel conversion analysis' }, { status: 400 })
        }
        
        const funnelAnalytics = await analyticsService.analyzeFunnelConversion(funnelId, dateRange)
        return NextResponse.json({ analytics: funnelAnalytics })

      case 'revenue_forecast':
        const forecast = await analyticsService.generateRevenueForecast(timeframe || 'monthly')
        return NextResponse.json({ forecast })

      case 'lead_scoring':
        const leadAnalytics = await analyticsService.analyzeLeadScoring(dateRange)
        return NextResponse.json({ analytics: leadAnalytics })

      case 'proposal_performance':
        const proposalAnalytics = await analyticsService.analyzeProposalPerformance(dateRange)
        return NextResponse.json({ analytics: proposalAnalytics })

      case 'business_intelligence':
        const userId = searchParams.get('userId')
        if (!userId) {
          return NextResponse.json({ error: 'userId required for business intelligence' }, { status: 400 })
        }
        
        const businessIntel = await analyticsService.generateBusinessIntelligence(userId)
        return NextResponse.json({ intelligence: businessIntel })

      case 'dashboard_summary':
        return await this.getDashboardSummary(dateRange)

      case 'conversion_funnel_overview':
        return await this.getConversionFunnelOverview()

      default:
        return NextResponse.json({ error: 'Invalid analytics type' }, { status: 400 })
    }

  } catch (error) {
    console.error('[CONVERT-FLOW-ANALYTICS] Error fetching analytics:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch analytics data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Get comprehensive dashboard summary
async function getDashboardSummary(dateRange?: { start: string; end: string }) {
  try {
    const endDate = dateRange?.end || new Date().toISOString().split('T')[0]
    const startDate = dateRange?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    // Get key metrics in parallel
    const [
      totalLeads,
      totalProposals,
      totalRevenue,
      activeFunnels,
      recentActivities,
      topPerformingFunnels
    ] = await Promise.all([
      getTotalLeadsCount(startDate, endDate),
      getTotalProposalsMetrics(startDate, endDate),
      getTotalRevenueMetrics(startDate, endDate),
      getActiveFunnelsCount(),
      getRecentActivities(10),
      getTopPerformingFunnels(startDate, endDate, 5)
    ])

    // Calculate period-over-period changes
    const previousPeriodStart = new Date(new Date(startDate).getTime() - (new Date(endDate).getTime() - new Date(startDate).getTime()))
    const previousPeriodEnd = new Date(startDate)
    
    const [previousLeads, previousRevenue] = await Promise.all([
      getTotalLeadsCount(previousPeriodStart.toISOString().split('T')[0], previousPeriodEnd.toISOString().split('T')[0]),
      getTotalRevenueMetrics(previousPeriodStart.toISOString().split('T')[0], previousPeriodEnd.toISOString().split('T')[0])
    ])

    const leadsGrowth = previousLeads.total > 0 ? ((totalLeads.total - previousLeads.total) / previousLeads.total) * 100 : 0
    const revenueGrowth = previousRevenue.total > 0 ? ((totalRevenue.total - previousRevenue.total) / previousRevenue.total) * 100 : 0

    return NextResponse.json({
      summary: {
        leads: {
          ...totalLeads,
          growth: Math.round(leadsGrowth * 100) / 100
        },
        proposals: totalProposals,
        revenue: {
          ...totalRevenue,
          growth: Math.round(revenueGrowth * 100) / 100
        },
        funnels: activeFunnels
      },
      recentActivities,
      topPerformingFunnels,
      dateRange: { startDate, endDate }
    })

  } catch (error) {
    console.error('[ANALYTICS] Error getting dashboard summary:', error)
    return NextResponse.json({ error: 'Failed to get dashboard summary' }, { status: 500 })
  }
}

// Get conversion funnel overview for all funnels
async function getConversionFunnelOverview() {
  try {
    // Get all active funnels with recent analytics
    const { data: funnels, error } = await supabase
      .from('convert_flow_funnels')
      .select(`
        *,
        convert_flow_funnel_analytics!convert_flow_funnel_analytics_funnel_id_fkey(
          date,
          unique_visitors,
          opt_ins,
          conversions,
          revenue,
          opt_in_rate,
          conversion_rate
        )
      `)
      .eq('status', 'active')
      .limit(20)

    if (error) {
      throw new Error(`Failed to fetch funnels: ${error.message}`)
    }

    // Process each funnel's performance
    const funnelOverviews = (funnels || []).map(funnel => {
      const analytics = funnel.convert_flow_funnel_analytics || []
      const recent30Days = analytics.slice(-30)

      const totalVisitors = recent30Days.reduce((sum, day) => sum + (day.unique_visitors || 0), 0)
      const totalConversions = recent30Days.reduce((sum, day) => sum + (day.conversions || 0), 0)
      const totalRevenue = recent30Days.reduce((sum, day) => sum + (day.revenue || 0), 0)
      const avgConversionRate = recent30Days.length > 0
        ? recent30Days.reduce((sum, day) => sum + (day.conversion_rate || 0), 0) / recent30Days.length
        : 0

      // Calculate health score
      let healthScore = 70 // Base score
      if (avgConversionRate >= 15) healthScore += 20
      else if (avgConversionRate >= 10) healthScore += 10
      else if (avgConversionRate < 5) healthScore -= 20

      if (totalVisitors >= 1000) healthScore += 10
      else if (totalVisitors < 100) healthScore -= 10

      const status = healthScore >= 85 ? 'excellent' : 
                     healthScore >= 70 ? 'good' : 
                     healthScore >= 50 ? 'needs_attention' : 'critical'

      return {
        id: funnel.id,
        name: funnel.name,
        type: funnel.funnel_type,
        status: funnel.status,
        industry: funnel.industry,
        performance: {
          visitors: totalVisitors,
          conversions: totalConversions,
          revenue: Math.round(totalRevenue * 100) / 100,
          conversionRate: Math.round(avgConversionRate * 100) / 100,
          healthScore: Math.max(0, Math.min(100, healthScore)),
          healthStatus: status
        },
        trends: {
          visitorsTrend: calculateTrend(recent30Days.slice(-14), recent30Days.slice(-28, -14), 'unique_visitors'),
          conversionTrend: calculateTrend(recent30Days.slice(-14), recent30Days.slice(-28, -14), 'conversion_rate'),
          revenueTrend: calculateTrend(recent30Days.slice(-14), recent30Days.slice(-28, -14), 'revenue')
        },
        lastUpdated: funnel.updated_at
      }
    })

    // Sort by performance (health score + revenue)
    funnelOverviews.sort((a, b) => 
      (b.performance.healthScore + (b.performance.revenue / 1000)) - 
      (a.performance.healthScore + (a.performance.revenue / 1000))
    )

    return NextResponse.json({
      funnels: funnelOverviews,
      summary: {
        totalFunnels: funnelOverviews.length,
        totalVisitors: funnelOverviews.reduce((sum, f) => sum + f.performance.visitors, 0),
        totalConversions: funnelOverviews.reduce((sum, f) => sum + f.performance.conversions, 0),
        totalRevenue: Math.round(funnelOverviews.reduce((sum, f) => sum + f.performance.revenue, 0) * 100) / 100,
        avgHealthScore: Math.round(funnelOverviews.reduce((sum, f) => sum + f.performance.healthScore, 0) / funnelOverviews.length || 0),
        excellentFunnels: funnelOverviews.filter(f => f.performance.healthStatus === 'excellent').length,
        needsAttention: funnelOverviews.filter(f => f.performance.healthStatus === 'needs_attention' || f.performance.healthStatus === 'critical').length
      }
    })

  } catch (error) {
    console.error('[ANALYTICS] Error getting funnel overview:', error)
    return NextResponse.json({ error: 'Failed to get funnel overview' }, { status: 500 })
  }
}

// Helper functions
async function getTotalLeadsCount(startDate: string, endDate: string) {
  const { data, error } = await supabase
    .from('convert_flow_leads')
    .select('id, qualification_status, lead_score, created_at')
    .gte('created_at', startDate)
    .lte('created_at', endDate)

  if (error) throw error

  const total = data?.length || 0
  const qualified = data?.filter(lead => ['hot', 'warm'].includes(lead.qualification_status)).length || 0
  const avgScore = data?.reduce((sum, lead) => sum + (lead.lead_score || 0), 0) / total || 0

  return {
    total,
    qualified,
    qualificationRate: total > 0 ? (qualified / total) * 100 : 0,
    avgScore: Math.round(avgScore * 100) / 100
  }
}

async function getTotalProposalsMetrics(startDate: string, endDate: string) {
  const { data, error } = await supabase
    .from('convert_flow_proposals')
    .select('id, status, total_amount, created_at')
    .gte('created_at', startDate)
    .lte('created_at', endDate)

  if (error) throw error

  const total = data?.length || 0
  const accepted = data?.filter(p => p.status === 'accepted').length || 0
  const totalValue = data?.reduce((sum, p) => sum + (p.total_amount || 0), 0) || 0
  const avgValue = total > 0 ? totalValue / total : 0

  return {
    total,
    accepted,
    winRate: total > 0 ? (accepted / total) * 100 : 0,
    totalValue: Math.round(totalValue * 100) / 100,
    avgValue: Math.round(avgValue * 100) / 100
  }
}

async function getTotalRevenueMetrics(startDate: string, endDate: string) {
  // Get revenue from accepted proposals
  const { data: proposals, error: proposalsError } = await supabase
    .from('convert_flow_proposals')
    .select('total_amount, created_at')
    .eq('status', 'accepted')
    .gte('created_at', startDate)
    .lte('created_at', endDate)

  if (proposalsError) throw proposalsError

  // Get revenue from funnel analytics
  const { data: funnelRevenue, error: funnelError } = await supabase
    .from('convert_flow_funnel_analytics')
    .select('revenue, date')
    .gte('date', startDate)
    .lte('date', endDate)

  if (funnelError) throw funnelError

  const proposalRevenue = proposals?.reduce((sum, p) => sum + (p.total_amount || 0), 0) || 0
  const analyticsRevenue = funnelRevenue?.reduce((sum, f) => sum + (f.revenue || 0), 0) || 0
  const total = Math.max(proposalRevenue, analyticsRevenue) // Use the higher of the two

  return {
    total: Math.round(total * 100) / 100,
    proposals: Math.round(proposalRevenue * 100) / 100,
    funnels: Math.round(analyticsRevenue * 100) / 100
  }
}

async function getActiveFunnelsCount() {
  const { count, error } = await supabase
    .from('convert_flow_funnels')
    .select('id', { count: 'exact' })
    .eq('is_published', true)
    .eq('status', 'active')

  if (error) throw error

  return { active: count || 0 }
}

async function getRecentActivities(limit: number = 10) {
  const { data, error } = await supabase
    .from('convert_flow_lead_activities')
    .select(`
      *,
      convert_flow_leads!inner(first_name, last_name, company)
    `)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error

  return (data || []).map(activity => ({
    id: activity.id,
    type: activity.activity_type,
    leadName: `${activity.convert_flow_leads.first_name} ${activity.convert_flow_leads.last_name}`,
    company: activity.convert_flow_leads.company,
    description: formatActivityDescription(activity.activity_type, activity.activity_data),
    timestamp: activity.created_at,
    scoreChange: activity.score_change || 0
  }))
}

async function getTopPerformingFunnels(startDate: string, endDate: string, limit: number = 5) {
  const { data, error } = await supabase
    .from('convert_flow_funnel_analytics')
    .select(`
      funnel_id,
      revenue,
      conversions,
      unique_visitors,
      conversion_rate,
      convert_flow_funnels!inner(name, funnel_type)
    `)
    .gte('date', startDate)
    .lte('date', endDate)

  if (error) throw error

  // Group by funnel and calculate totals
  const funnelPerformance = (data || []).reduce((acc, analytics) => {
    const funnelId = analytics.funnel_id
    if (!acc[funnelId]) {
      acc[funnelId] = {
        id: funnelId,
        name: analytics.convert_flow_funnels.name,
        type: analytics.convert_flow_funnels.funnel_type,
        revenue: 0,
        conversions: 0,
        visitors: 0,
        days: 0
      }
    }

    acc[funnelId].revenue += analytics.revenue || 0
    acc[funnelId].conversions += analytics.conversions || 0
    acc[funnelId].visitors += analytics.unique_visitors || 0
    acc[funnelId].days += 1

    return acc
  }, {} as Record<string, any>)

  // Calculate averages and sort by revenue
  const funnels = Object.values(funnelPerformance)
    .map((funnel: any) => ({
      ...funnel,
      avgConversionRate: funnel.visitors > 0 ? (funnel.conversions / funnel.visitors) * 100 : 0,
      revenuePerVisitor: funnel.visitors > 0 ? funnel.revenue / funnel.visitors : 0
    }))
    .sort((a: any, b: any) => b.revenue - a.revenue)
    .slice(0, limit)

  return funnels
}

function formatActivityDescription(activityType: string, activityData: any): string {
  const descriptions: Record<string, string> = {
    'lead_created': 'New lead created',
    'lead_updated': 'Lead information updated',
    'lead_qualified': 'Lead qualification completed',
    'proposal_created': 'New proposal generated',
    'proposal_viewed': 'Proposal viewed by prospect',
    'email_opened': 'Opened marketing email',
    'email_clicked': 'Clicked link in email',
    'page_visit': 'Visited landing page',
    'form_submit': 'Submitted form',
    'call_scheduled': 'Scheduled consultation call'
  }

  return descriptions[activityType] || 'Unknown activity'
}

function calculateTrend(current: any[], previous: any[], field: string): number {
  const currentAvg = current.length > 0 
    ? current.reduce((sum, day) => sum + (day[field] || 0), 0) / current.length 
    : 0
  
  const previousAvg = previous.length > 0 
    ? previous.reduce((sum, day) => sum + (day[field] || 0), 0) / previous.length 
    : 0

  if (previousAvg === 0) return currentAvg > 0 ? 100 : 0
  
  return Math.round(((currentAvg - previousAvg) / previousAvg) * 100 * 100) / 100
}