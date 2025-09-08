// ProfitPulse API - Dashboard Data Endpoints
// Consolidated dashboard data for ProfitPulse overview

import { NextRequest, NextResponse } from 'next/server'
import { profitabilityCalculationService } from '@/services/profitabilityCalculationService'
import { cacTrackingService } from '@/services/cacTrackingService'
import { teamROITrackingService } from '@/services/teamROITrackingService'
import { aiPricingIntelligenceService } from '@/services/aiPricingIntelligenceService'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const timeframe = searchParams.get('timeframe') || 'month' // week, month, quarter, year
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Calculate date range based on timeframe
    const now = new Date()
    let startDate: Date
    
    switch (timeframe) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'quarter':
        startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)
        break
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1)
        break
      default: // month
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    }

    // Fetch parallel dashboard data
    const [
      clientProfitabilityRanking,
      cacMetrics,
      teamOverview,
      pricingOptimizationDashboard
    ] = await Promise.allSettled([
      profitabilityCalculationService.getClientProfitabilityRanking(userId, { 
        limit: 10, 
        sortBy: 'true_profit' 
      }),
      cacTrackingService.calculateCACMetrics(userId, { 
        startDate: startDate.toISOString().split('T')[0],
        includeTrends: true 
      }),
      teamROITrackingService.getTeamOverview(userId),
      aiPricingIntelligenceService.getPricingOptimizationDashboard(userId)
    ])

    // Process results and handle any errors
    const topClients = clientProfitabilityRanking.status === 'fulfilled' 
      ? clientProfitabilityRanking.value.slice(0, 5) 
      : []

    const cac = cacMetrics.status === 'fulfilled' 
      ? cacMetrics.value 
      : { averageCAC: 0, totalAcquisitionCost: 0, clientsAcquired: 0, cacByChannel: [] }

    const team = teamOverview.status === 'fulfilled' 
      ? teamOverview.value 
      : { totalMembers: 0, averageROI: 0, keyMetrics: { totalRevenue: 0, totalProfit: 0 } }

    const pricing = pricingOptimizationDashboard.status === 'fulfilled' 
      ? pricingOptimizationDashboard.value 
      : { totalRevenueOpportunity: 0, overallOptimizationScore: 0 }

    // Calculate key performance indicators
    const totalRevenue = topClients.reduce((sum, client) => sum + client.metrics.revenue, 0)
    const totalProfit = topClients.reduce((sum, client) => sum + client.metrics.trueProfit, 0)
    const avgProfitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0
    
    // Identify critical alerts
    const criticalAlerts = []
    
    // CAC alerts
    if (cac.averageCAC > 0) {
      const avgLTV = totalRevenue / Math.max(1, topClients.length) 
      if (cac.averageCAC > avgLTV * 0.5) {
        criticalAlerts.push({
          type: 'cac_warning',
          message: 'CAC approaching 50% of average LTV',
          severity: 'high',
          impact: 'Client acquisition may become unprofitable'
        })
      }
    }
    
    // Profit margin alerts
    if (avgProfitMargin < 25) {
      criticalAlerts.push({
        type: 'margin_warning',
        message: `Average profit margin at ${avgProfitMargin.toFixed(1)}%`,
        severity: avgProfitMargin < 15 ? 'critical' : 'medium',
        impact: 'Business sustainability at risk'
      })
    }
    
    // Pricing opportunity alerts
    if (pricing.totalRevenueOpportunity > 50000) {
      criticalAlerts.push({
        type: 'pricing_opportunity',
        message: `$${Math.round(pricing.totalRevenueOpportunity).toLocaleString()} revenue opportunity identified`,
        severity: 'info',
        impact: 'Potential significant revenue increase through pricing optimization'
      })
    }

    // Build comprehensive dashboard response
    const dashboardData = {
      overview: {
        timeframe,
        period: {
          start: startDate.toISOString().split('T')[0],
          end: now.toISOString().split('T')[0]
        },
        keyMetrics: {
          totalRevenue,
          totalProfit,
          profitMargin: avgProfitMargin,
          clientsTracked: topClients.length,
          averageCAC: cac.averageCAC,
          teamMembers: team.totalMembers,
          revenueOpportunity: pricing.totalRevenueOpportunity
        }
      },
      
      profitability: {
        topClients: topClients.map(client => ({
          id: client.clientId,
          name: client.clientName,
          revenue: client.metrics.revenue,
          profit: client.metrics.trueProfit,
          margin: client.metrics.trueProfitMargin,
          healthScore: client.cacHealthScore,
          trend: client.trendDirection
        })),
        totalClients: topClients.length,
        profitableClients: topClients.filter(c => c.metrics.trueProfit > 0).length,
        avgMargin: avgProfitMargin
      },
      
      acquisition: {
        totalSpend: cac.totalAcquisitionCost,
        averageCAC: cac.averageCAC,
        clientsAcquired: cac.clientsAcquired,
        topChannels: cac.cacByChannel.slice(0, 3).map(channel => ({
          name: channel.channelName,
          cac: channel.averageCAC,
          clients: channel.clientsAcquired,
          efficiency: channel.efficiency
        })),
        efficiency: cac.cacByChannel.length > 0 
          ? cac.cacByChannel.reduce((sum, ch) => sum + ch.efficiency, 0) / cac.cacByChannel.length 
          : 0
      },
      
      team: {
        totalMembers: team.totalMembers,
        averageROI: team.averageROI,
        totalTeamRevenue: team.keyMetrics.totalRevenue,
        totalTeamProfit: team.keyMetrics.totalProfit,
        topPerformers: team.topPerformers.slice(0, 3).map(member => ({
          id: member.teamMemberId,
          name: member.name,
          role: member.role,
          roi: member.metrics.roiRatio,
          efficiency: member.metrics.efficiencyScore
        })),
        optimizationScore: team.teamOptimizationScore
      },
      
      pricing: {
        optimizationScore: pricing.overallOptimizationScore,
        revenueOpportunity: pricing.totalRevenueOpportunity,
        clientOptimizations: pricing.clientOptimizations.slice(0, 5),
        marketPosition: pricing.marketPositioning
      },
      
      alerts: criticalAlerts,
      
      recommendations: [
        ...(avgProfitMargin < 30 ? ['Review pricing strategy for margin improvement'] : []),
        ...(cac.averageCAC > 2000 ? ['Optimize marketing channels to reduce CAC'] : []),
        ...(team.averageROI < 2 ? ['Focus on team performance optimization'] : []),
        ...(pricing.totalRevenueOpportunity > 25000 ? ['Implement pricing recommendations for revenue growth'] : [])
      ]
    }

    return NextResponse.json({
      success: true,
      data: dashboardData,
      timestamp: new Date().toISOString(),
      performance: {
        dataFreshness: 'real-time',
        lastUpdated: new Date().toISOString(),
        computationTime: Date.now() - now.getTime() + 'ms'
      }
    })

  } catch (error) {
    console.error('ProfitPulse Dashboard API error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch dashboard data',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}