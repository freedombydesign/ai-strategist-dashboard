import { NextRequest, NextResponse } from 'next/server'
import { clientPaymentAnalyticsService } from '@/services/clientPaymentAnalyticsService'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const clientId = searchParams.get('clientId')
    const action = searchParams.get('action')
    const timeframe = searchParams.get('timeframe')

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    switch (action) {
      case 'client_score':
        if (!clientId) {
          return NextResponse.json({ error: 'clientId required for client score' }, { status: 400 })
        }
        return await getClientScore(clientId)
      
      case 'client_scores':
        return await getAllClientScores(userId)
      
      case 'behavior_trends':
        if (!clientId) {
          return NextResponse.json({ error: 'clientId required for behavior trends' }, { status: 400 })
        }
        const months = parseInt(searchParams.get('months') || '12')
        return await getBehaviorTrends(clientId, months)
      
      case 'client_segments':
        return await getClientSegments(userId)
      
      case 'analytics_dashboard':
        return await getAnalyticsDashboard(userId)
      
      case 'score_distribution':
        return await getScoreDistribution(userId)
      
      case 'risk_analysis':
        return await getRiskAnalysis(userId)
      
      case 'top_performers':
        const limit = parseInt(searchParams.get('limit') || '10')
        return await getTopPerformers(userId, limit)
      
      case 'score_history':
        if (!clientId) {
          return NextResponse.json({ error: 'clientId required for score history' }, { status: 400 })
        }
        return await getScoreHistory(clientId)
      
      default:
        return await getAllClientScores(userId)
    }

  } catch (error) {
    console.error('[CLIENT-ANALYTICS-API] Error in GET:', error)
    return NextResponse.json({
      error: 'Failed to fetch client analytics data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, userId, clientId } = body

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    switch (action) {
      case 'calculate_score':
        if (!clientId) {
          return NextResponse.json({ error: 'clientId required for score calculation' }, { status: 400 })
        }
        return await calculateClientScore(clientId)
      
      case 'update_all_scores':
        return await updateAllClientScores(userId)
      
      case 'analyze_trends':
        if (!clientId) {
          return NextResponse.json({ error: 'clientId required for trend analysis' }, { status: 400 })
        }
        const months = body.months || 12
        return await analyzeBehaviorTrends(clientId, months)
      
      case 'segment_clients':
        return await segmentClients(userId)
      
      case 'export_analytics':
        return await exportAnalytics(userId, body.format || 'json')
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error) {
    console.error('[CLIENT-ANALYTICS-API] Error in POST:', error)
    return NextResponse.json({
      error: 'Failed to process client analytics action',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Get individual client score
async function getClientScore(clientId: string) {
  const score = await clientPaymentAnalyticsService.calculateClientScore(clientId)
  
  return NextResponse.json({
    clientScore: score
  })
}

// Get all client scores for a user
async function getAllClientScores(userId: string) {
  const { data: clientScores, error } = await supabase
    .from('cash_flow_client_scores')
    .select(`
      *,
      cash_flow_clients!inner(name, company, email, industry)
    `)
    .eq('user_id', userId)
    .order('overall_score', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch client scores: ${error.message}`)
  }

  const formattedScores = (clientScores || []).map(score => ({
    clientId: score.client_id,
    clientInfo: {
      name: score.cash_flow_clients.name,
      company: score.cash_flow_clients.company,
      email: score.cash_flow_clients.email,
      industry: score.cash_flow_clients.industry
    },
    overallScore: score.overall_score,
    scoreGrade: score.score_grade,
    riskLevel: score.risk_level,
    componentScores: score.component_scores,
    behaviorMetrics: score.behavior_metrics,
    insights: score.insights,
    recommendations: score.recommendations,
    lastUpdated: score.last_updated,
    nextUpdateDue: score.next_update_due
  }))

  return NextResponse.json({
    clientScores: formattedScores,
    summary: {
      totalClients: formattedScores.length,
      averageScore: formattedScores.length > 0 
        ? Math.round(formattedScores.reduce((sum, s) => sum + s.overallScore, 0) / formattedScores.length * 100) / 100
        : 0,
      scoreDistribution: calculateScoreDistribution(formattedScores),
      riskDistribution: calculateRiskDistribution(formattedScores)
    }
  })
}

// Get behavior trends for a client
async function getBehaviorTrends(clientId: string, months: number) {
  const trends = await clientPaymentAnalyticsService.analyzeBehaviorTrends(clientId, months)
  
  return NextResponse.json({
    behaviorTrends: trends
  })
}

// Get client segments
async function getClientSegments(userId: string) {
  const segments = await clientPaymentAnalyticsService.segmentClients(userId)
  
  return NextResponse.json({
    segments
  })
}

// Get analytics dashboard data
async function getAnalyticsDashboard(userId: string) {
  // Get overall analytics data
  const [
    clientScores,
    segments,
    riskAnalysis,
    topPerformers,
    scoreTrends
  ] = await Promise.all([
    getAllClientScoresData(userId),
    clientPaymentAnalyticsService.segmentClients(userId),
    getRiskAnalysisData(userId),
    getTopPerformersData(userId, 5),
    getScoreTrendsData(userId)
  ])

  const totalClients = clientScores.length
  const averageScore = totalClients > 0 
    ? Math.round(clientScores.reduce((sum, s) => sum + s.overall_score, 0) / totalClients * 100) / 100
    : 0

  // Calculate key metrics
  const highRiskClients = clientScores.filter(s => s.risk_level === 'high' || s.risk_level === 'very_high').length
  const excellentClients = clientScores.filter(s => s.overall_score >= 85).length
  const improvingClients = clientScores.filter(s => {
    const recentRecommendations = s.recommendations?.filter((r: any) => r.priority === 'high') || []
    return recentRecommendations.length > 0
  }).length

  return NextResponse.json({
    dashboard: {
      summary: {
        totalClients,
        averageScore,
        highRiskClients,
        excellentClients,
        improvingClients,
        scoreImprovement: 2.3 // Would calculate from historical data
      },
      scoreDistribution: calculateScoreDistribution(clientScores),
      riskDistribution: calculateRiskDistribution(clientScores),
      segments: segments.map(segment => ({
        ...segment,
        clientCount: segment.clients.length
      })),
      topPerformers: topPerformers.slice(0, 5),
      bottomPerformers: clientScores.slice(-5).reverse(),
      scoreTrends,
      insights: generateDashboardInsights(clientScores, segments),
      recommendations: generateDashboardRecommendations(clientScores, segments)
    }
  })
}

// Get score distribution
async function getScoreDistribution(userId: string) {
  const clientScores = await getAllClientScoresData(userId)
  const distribution = calculateScoreDistribution(clientScores)
  
  return NextResponse.json({
    scoreDistribution: distribution
  })
}

// Get risk analysis
async function getRiskAnalysis(userId: string) {
  const riskAnalysis = await getRiskAnalysisData(userId)
  
  return NextResponse.json({
    riskAnalysis
  })
}

// Get top performers
async function getTopPerformers(userId: string, limit: number) {
  const topPerformers = await getTopPerformersData(userId, limit)
  
  return NextResponse.json({
    topPerformers
  })
}

// Get score history for a client
async function getScoreHistory(clientId: string) {
  const { data: history, error } = await supabase
    .from('cash_flow_score_history')
    .select('*')
    .eq('client_id', clientId)
    .order('date', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch score history: ${error.message}`)
  }

  return NextResponse.json({
    scoreHistory: history || []
  })
}

// Calculate client score
async function calculateClientScore(clientId: string) {
  const score = await clientPaymentAnalyticsService.calculateClientScore(clientId)
  
  return NextResponse.json({
    success: true,
    clientScore: score
  })
}

// Update all client scores
async function updateAllClientScores(userId: string) {
  const result = await clientPaymentAnalyticsService.updateAllClientScores(userId)
  
  return NextResponse.json({
    success: true,
    updated: result.updated,
    errors: result.errors,
    message: `Successfully updated ${result.updated} client scores${result.errors > 0 ? ` with ${result.errors} errors` : ''}`
  })
}

// Analyze behavior trends
async function analyzeBehaviorTrends(clientId: string, months: number) {
  const trends = await clientPaymentAnalyticsService.analyzeBehaviorTrends(clientId, months)
  
  return NextResponse.json({
    success: true,
    behaviorTrends: trends
  })
}

// Segment clients
async function segmentClients(userId: string) {
  const segments = await clientPaymentAnalyticsService.segmentClients(userId)
  
  return NextResponse.json({
    success: true,
    segments
  })
}

// Export analytics
async function exportAnalytics(userId: string, format: string) {
  const clientScores = await getAllClientScoresData(userId)
  const segments = await clientPaymentAnalyticsService.segmentClients(userId)
  
  const exportData = {
    exportDate: new Date().toISOString(),
    userId,
    totalClients: clientScores.length,
    averageScore: clientScores.length > 0 
      ? Math.round(clientScores.reduce((sum, s) => sum + s.overall_score, 0) / clientScores.length * 100) / 100
      : 0,
    scoreDistribution: calculateScoreDistribution(clientScores),
    segments,
    clientScores: clientScores.map(score => ({
      clientId: score.client_id,
      overallScore: score.overall_score,
      scoreGrade: score.score_grade,
      riskLevel: score.risk_level,
      componentScores: score.component_scores,
      behaviorMetrics: score.behavior_metrics,
      lastUpdated: score.last_updated
    }))
  }

  return NextResponse.json({
    success: true,
    format,
    data: exportData,
    message: `Analytics exported successfully in ${format} format`
  })
}

// Helper functions
async function getAllClientScoresData(userId: string) {
  const { data: clientScores, error } = await supabase
    .from('cash_flow_client_scores')
    .select('*')
    .eq('user_id', userId)

  if (error) {
    console.error('Error fetching client scores data:', error)
    return []
  }

  return clientScores || []
}

async function getRiskAnalysisData(userId: string) {
  const clientScores = await getAllClientScoresData(userId)
  
  const riskLevels = {
    very_high: clientScores.filter(s => s.risk_level === 'very_high'),
    high: clientScores.filter(s => s.risk_level === 'high'),
    medium: clientScores.filter(s => s.risk_level === 'medium'),
    low: clientScores.filter(s => s.risk_level === 'low'),
    very_low: clientScores.filter(s => s.risk_level === 'very_low')
  }

  // Calculate potential revenue at risk
  const potentialRevenueAtRisk = riskLevels.very_high.concat(riskLevels.high)
    .reduce((sum, client) => {
      const avgAmount = client.behavior_metrics?.averageInvoiceAmount || 0
      const frequency = client.behavior_metrics?.totalInvoicesPaid || 0
      return sum + (avgAmount * Math.min(frequency, 12)) // Annualized potential
    }, 0)

  return {
    riskLevels: Object.entries(riskLevels).map(([level, clients]) => ({
      level,
      count: clients.length,
      percentage: Math.round((clients.length / clientScores.length) * 10000) / 100,
      clients: clients.slice(0, 5).map(c => ({
        clientId: c.client_id,
        overallScore: c.overall_score,
        riskLevel: c.risk_level,
        lastUpdated: c.last_updated
      }))
    })),
    potentialRevenueAtRisk: Math.round(potentialRevenueAtRisk * 100) / 100,
    highestRiskClients: riskLevels.very_high.concat(riskLevels.high)
      .sort((a, b) => a.overall_score - b.overall_score)
      .slice(0, 10)
      .map(client => ({
        clientId: client.client_id,
        overallScore: client.overall_score,
        riskLevel: client.risk_level,
        primaryRiskFactors: extractRiskFactors(client)
      })),
    recommendations: [
      'Implement early payment incentives for high-risk clients',
      'Establish more frequent communication with very high-risk clients',
      'Consider credit terms adjustment for problem payers',
      'Set up automated payment reminders'
    ]
  }
}

async function getTopPerformersData(userId: string, limit: number) {
  const { data: topPerformers, error } = await supabase
    .from('cash_flow_client_scores')
    .select(`
      *,
      cash_flow_clients!inner(name, company, email)
    `)
    .eq('user_id', userId)
    .order('overall_score', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching top performers:', error)
    return []
  }

  return (topPerformers || []).map(client => ({
    clientId: client.client_id,
    name: client.cash_flow_clients.name,
    company: client.cash_flow_clients.company,
    email: client.cash_flow_clients.email,
    overallScore: client.overall_score,
    scoreGrade: client.score_grade,
    riskLevel: client.risk_level,
    strengths: extractClientStrengths(client),
    behaviorSummary: {
      averagePaymentDays: client.behavior_metrics?.averagePaymentDays,
      onTimePaymentRate: client.behavior_metrics?.onTimePaymentRate,
      totalAmountPaid: client.behavior_metrics?.totalAmountPaid
    }
  }))
}

async function getScoreTrendsData(userId: string) {
  // Get score trends over time (would need historical data)
  // For now, returning mock trend data
  return {
    period: 'last_6_months',
    overallTrend: 'improving',
    averageScoreChange: 2.3,
    monthlyAverages: [
      { month: '2024-01', averageScore: 72.5 },
      { month: '2024-02', averageScore: 73.1 },
      { month: '2024-03', averageScore: 73.8 },
      { month: '2024-04', averageScore: 74.2 },
      { month: '2024-05', averageScore: 74.6 },
      { month: '2024-06', averageScore: 74.8 }
    ]
  }
}

function calculateScoreDistribution(clientScores: any[]) {
  const ranges = [
    { range: '90-100', min: 90, max: 100, grade: 'A+/A' },
    { range: '80-89', min: 80, max: 89, grade: 'B+/B' },
    { range: '70-79', min: 70, max: 79, grade: 'C+/C' },
    { range: '60-69', min: 60, max: 69, grade: 'D+/D' },
    { range: '0-59', min: 0, max: 59, grade: 'F' }
  ]

  return ranges.map(range => {
    const count = clientScores.filter(s => 
      s.overall_score >= range.min && s.overall_score <= range.max
    ).length
    
    return {
      ...range,
      count,
      percentage: clientScores.length > 0 
        ? Math.round((count / clientScores.length) * 10000) / 100
        : 0
    }
  })
}

function calculateRiskDistribution(clientScores: any[]) {
  const riskLevels = ['very_low', 'low', 'medium', 'high', 'very_high']
  
  return riskLevels.map(level => {
    const count = clientScores.filter(s => s.riskLevel === level).length
    
    return {
      level,
      count,
      percentage: clientScores.length > 0 
        ? Math.round((count / clientScores.length) * 10000) / 100
        : 0
    }
  })
}

function generateDashboardInsights(clientScores: any[], segments: any[]) {
  const insights = []

  // High performers insight
  const excellentClients = clientScores.filter(s => s.overall_score >= 85).length
  if (excellentClients > 0) {
    insights.push({
      type: 'positive',
      title: 'Strong Client Portfolio',
      description: `${excellentClients} clients (${Math.round((excellentClients / clientScores.length) * 100)}%) have excellent payment scores`,
      actionable: false
    })
  }

  // Risk insight
  const highRiskClients = clientScores.filter(s => 
    s.risk_level === 'high' || s.risk_level === 'very_high'
  ).length
  
  if (highRiskClients > 0) {
    insights.push({
      type: 'warning',
      title: 'Payment Risk Detected',
      description: `${highRiskClients} clients require immediate attention due to high payment risk`,
      actionable: true,
      action: 'Review high-risk clients and implement mitigation strategies'
    })
  }

  // Improvement opportunity
  const improvableClients = clientScores.filter(s => 
    s.overall_score >= 60 && s.overall_score < 85
  ).length
  
  if (improvableClients > 0) {
    insights.push({
      type: 'opportunity',
      title: 'Score Improvement Potential',
      description: `${improvableClients} clients show potential for significant score improvements`,
      actionable: true,
      action: 'Implement targeted improvement strategies'
    })
  }

  return insights
}

function generateDashboardRecommendations(clientScores: any[], segments: any[]) {
  const recommendations = []

  // High-risk client recommendations
  const highRiskCount = clientScores.filter(s => 
    s.risk_level === 'high' || s.risk_level === 'very_high'
  ).length

  if (highRiskCount > 0) {
    recommendations.push({
      priority: 'high',
      title: 'Address High-Risk Clients',
      description: `Review ${highRiskCount} high-risk clients and implement payment acceleration strategies`,
      estimatedImpact: 'Reduce payment delays by 15-20 days',
      timeToImplement: '1-2 weeks'
    })
  }

  // Automation recommendation
  if (clientScores.length > 10) {
    recommendations.push({
      priority: 'medium',
      title: 'Automate Score Updates',
      description: 'Set up weekly automated score calculations to stay current with client behavior changes',
      estimatedImpact: 'Improved early risk detection',
      timeToImplement: '1 week'
    })
  }

  // Segmentation strategy
  if (segments.length > 0) {
    recommendations.push({
      priority: 'medium',
      title: 'Implement Segment-Based Strategies',
      description: 'Create targeted payment acceleration strategies for each client segment',
      estimatedImpact: 'Improved collection rates across all segments',
      timeToImplement: '2-3 weeks'
    })
  }

  return recommendations
}

function extractRiskFactors(client: any): string[] {
  const factors = []
  
  if (client.behavior_metrics?.latePaymentRate > 50) {
    factors.push('High late payment rate')
  }
  
  if (client.behavior_metrics?.averagePaymentDays > 45) {
    factors.push('Consistently slow payments')
  }
  
  if (client.behavior_metrics?.communicationResponseTime > 72) {
    factors.push('Poor communication responsiveness')
  }
  
  if (client.behavior_metrics?.paymentVariability > 15) {
    factors.push('Inconsistent payment timing')
  }
  
  return factors
}

function extractClientStrengths(client: any): string[] {
  const strengths = []
  
  if (client.behavior_metrics?.onTimePaymentRate >= 80) {
    strengths.push('Excellent payment timing')
  }
  
  if (client.behavior_metrics?.averagePaymentDays <= 25) {
    strengths.push('Fast payment processing')
  }
  
  if (client.behavior_metrics?.paymentVariability < 5) {
    strengths.push('Highly consistent payments')
  }
  
  if (client.behavior_metrics?.communicationResponseTime < 24) {
    strengths.push('Responsive communication')
  }
  
  return strengths
}