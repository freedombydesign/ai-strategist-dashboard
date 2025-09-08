import { NextRequest, NextResponse } from 'next/server'
import { paymentAccelerationService } from '@/services/paymentAccelerationService'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const action = searchParams.get('action')
    const strategyId = searchParams.get('strategyId')
    const campaignId = searchParams.get('campaignId')
    const timeframe = searchParams.get('timeframe') as 'week' | 'month' | 'quarter' | 'year'

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    switch (action) {
      case 'strategies':
        return await getAccelerationStrategies(userId)
      
      case 'strategy_details':
        if (!strategyId) {
          return NextResponse.json({ error: 'strategyId required' }, { status: 400 })
        }
        return await getStrategyDetails(strategyId, userId)
      
      case 'incentives':
        return await getPaymentIncentives(userId)
      
      case 'campaigns':
        return await getCollectionCampaigns(userId)
      
      case 'campaign_details':
        if (!campaignId) {
          return NextResponse.json({ error: 'campaignId required' }, { status: 400 })
        }
        return await getCampaignDetails(campaignId, userId)
      
      case 'analytics':
        return await getAccelerationAnalytics(userId, timeframe || 'month')
      
      case 'recommendations':
        return await getOptimizationRecommendations(userId)
      
      case 'dashboard':
        return await getAccelerationDashboard(userId)
      
      default:
        return await getAccelerationStrategies(userId)
    }

  } catch (error) {
    console.error('[ACCELERATION-API] Error in GET:', error)
    return NextResponse.json({
      error: 'Failed to fetch acceleration data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, userId } = body

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    switch (action) {
      case 'create_strategy':
        return await createAccelerationStrategy(body.strategy)
      
      case 'create_incentive':
        return await createPaymentIncentive(userId, body.incentive)
      
      case 'apply_incentive':
        return await applyIncentiveToInvoice(body.incentiveId, body.invoiceId)
      
      case 'create_campaign':
        return await createCollectionCampaign(body.campaign)
      
      case 'execute_automation':
        return await executeAutomatedCollections(userId)
      
      case 'update_strategy':
        return await updateAccelerationStrategy(body.strategyId, body.updates)
      
      case 'pause_strategy':
        return await pauseStrategy(body.strategyId, userId)
      
      case 'activate_strategy':
        return await activateStrategy(body.strategyId, userId)
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error) {
    console.error('[ACCELERATION-API] Error in POST:', error)
    return NextResponse.json({
      error: 'Failed to process acceleration action',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Get acceleration strategies
async function getAccelerationStrategies(userId: string) {
  const { data: strategies, error } = await supabase
    .from('cash_flow_acceleration_strategies')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch strategies: ${error.message}`)
  }

  const formattedStrategies = (strategies || []).map(formatStrategy)

  return NextResponse.json({
    strategies: formattedStrategies
  })
}

// Get specific strategy details
async function getStrategyDetails(strategyId: string, userId: string) {
  const { data: strategy, error } = await supabase
    .from('cash_flow_acceleration_strategies')
    .select('*')
    .eq('id', strategyId)
    .eq('user_id', userId)
    .single()

  if (error) {
    throw new Error(`Failed to fetch strategy details: ${error.message}`)
  }

  if (!strategy) {
    return NextResponse.json({ error: 'Strategy not found' }, { status: 404 })
  }

  // Get strategy performance metrics
  const performance = await getStrategyPerformanceMetrics(strategyId)

  return NextResponse.json({
    strategy: formatStrategy(strategy),
    performance
  })
}

// Get payment incentives
async function getPaymentIncentives(userId: string) {
  const { data: incentives, error } = await supabase
    .from('cash_flow_payment_incentives')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch incentives: ${error.message}`)
  }

  const formattedIncentives = (incentives || []).map(formatIncentive)

  return NextResponse.json({
    incentives: formattedIncentives
  })
}

// Get collection campaigns
async function getCollectionCampaigns(userId: string) {
  const { data: campaigns, error } = await supabase
    .from('cash_flow_collection_campaigns')
    .select(`
      *,
      cash_flow_acceleration_strategies!inner(name)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch campaigns: ${error.message}`)
  }

  const formattedCampaigns = (campaigns || []).map(campaign => ({
    id: campaign.id,
    userId: campaign.user_id,
    name: campaign.name,
    description: campaign.description,
    strategyId: campaign.strategy_id,
    strategyName: campaign.cash_flow_acceleration_strategies?.name,
    targetInvoices: campaign.target_invoices,
    status: campaign.status,
    startDate: campaign.start_date,
    endDate: campaign.end_date,
    progress: campaign.progress,
    results: campaign.results,
    createdAt: campaign.created_at,
    updatedAt: campaign.updated_at
  }))

  return NextResponse.json({
    campaigns: formattedCampaigns
  })
}

// Get campaign details
async function getCampaignDetails(campaignId: string, userId: string) {
  const { data: campaign, error } = await supabase
    .from('cash_flow_collection_campaigns')
    .select(`
      *,
      cash_flow_acceleration_strategies!inner(*)
    `)
    .eq('id', campaignId)
    .eq('user_id', userId)
    .single()

  if (error) {
    throw new Error(`Failed to fetch campaign details: ${error.message}`)
  }

  if (!campaign) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
  }

  // Get campaign execution history
  const { data: executions, error: executionsError } = await supabase
    .from('cash_flow_automation_executions')
    .select('*')
    .eq('strategy_id', campaign.strategy_id)
    .order('executed_at', { ascending: false })
    .limit(50)

  if (executionsError) {
    console.error('Error fetching campaign executions:', executionsError)
  }

  return NextResponse.json({
    campaign: {
      id: campaign.id,
      userId: campaign.user_id,
      name: campaign.name,
      description: campaign.description,
      strategy: formatStrategy(campaign.cash_flow_acceleration_strategies),
      targetInvoices: campaign.target_invoices,
      status: campaign.status,
      startDate: campaign.start_date,
      endDate: campaign.end_date,
      progress: campaign.progress,
      results: campaign.results,
      createdAt: campaign.created_at,
      updatedAt: campaign.updated_at
    },
    executions: executions || []
  })
}

// Get acceleration analytics
async function getAccelerationAnalytics(userId: string, timeframe: 'week' | 'month' | 'quarter' | 'year') {
  const analytics = await paymentAccelerationService.getAccelerationAnalytics(userId, timeframe)
  
  return NextResponse.json({
    analytics
  })
}

// Get optimization recommendations
async function getOptimizationRecommendations(userId: string) {
  const { recommendations, analytics } = await paymentAccelerationService.generateOptimizationRecommendations(userId)
  
  return NextResponse.json({
    recommendations,
    analytics
  })
}

// Get acceleration dashboard data
async function getAccelerationDashboard(userId: string) {
  // Get summary metrics
  const [
    activeStrategies,
    activeIncentives,
    activeCampaigns,
    recentExecutions,
    performanceMetrics
  ] = await Promise.all([
    getActiveStrategiesCount(userId),
    getActiveIncentivesCount(userId),
    getActiveCampaignsCount(userId),
    getRecentExecutions(userId, 10),
    getOverallPerformanceMetrics(userId)
  ])

  return NextResponse.json({
    dashboard: {
      summary: {
        activeStrategies,
        activeIncentives,
        activeCampaigns,
        totalAccelerated: performanceMetrics.totalAccelerated,
        avgAccelerationDays: performanceMetrics.avgAccelerationDays,
        conversionRate: performanceMetrics.conversionRate
      },
      recentExecutions,
      performanceMetrics,
      quickActions: [
        {
          id: 'create_strategy',
          title: 'Create New Strategy',
          description: 'Set up automated payment acceleration',
          icon: 'strategy'
        },
        {
          id: 'create_incentive',
          title: 'Add Payment Incentive',
          description: 'Encourage early payments with discounts',
          icon: 'incentive'
        },
        {
          id: 'run_automation',
          title: 'Execute Collections',
          description: 'Run automated collection processes',
          icon: 'automation'
        }
      ]
    }
  })
}

// Create acceleration strategy
async function createAccelerationStrategy(strategy: any) {
  const result = await paymentAccelerationService.createAccelerationStrategy(strategy)
  
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return NextResponse.json({
    success: true,
    strategy: result.strategy
  }, { status: 201 })
}

// Create payment incentive
async function createPaymentIncentive(userId: string, incentive: any) {
  const result = await paymentAccelerationService.createPaymentIncentive(userId, incentive)
  
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return NextResponse.json({
    success: true,
    incentive: result.incentive
  }, { status: 201 })
}

// Apply incentive to invoice
async function applyIncentiveToInvoice(incentiveId: string, invoiceId: string) {
  if (!incentiveId || !invoiceId) {
    return NextResponse.json({ error: 'incentiveId and invoiceId are required' }, { status: 400 })
  }

  const result = await paymentAccelerationService.applyIncentiveToInvoice(incentiveId, invoiceId)
  
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return NextResponse.json({
    success: true,
    appliedIncentive: result.appliedIncentive
  })
}

// Create collection campaign
async function createCollectionCampaign(campaign: any) {
  const result = await paymentAccelerationService.createCollectionCampaign(campaign)
  
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return NextResponse.json({
    success: true,
    campaign: result.campaign
  }, { status: 201 })
}

// Execute automated collections
async function executeAutomatedCollections(userId: string) {
  const result = await paymentAccelerationService.executeAutomatedCollections(userId)
  
  return NextResponse.json({
    success: result.success,
    actionsExecuted: result.actionsExecuted,
    results: result.results
  })
}

// Update acceleration strategy
async function updateAccelerationStrategy(strategyId: string, updates: any) {
  const { data: strategy, error } = await supabase
    .from('cash_flow_acceleration_strategies')
    .update({
      name: updates.name,
      description: updates.description,
      target_criteria: updates.targetCriteria,
      actions: updates.actions,
      incentives: updates.incentives,
      automation_rules: updates.automationRules,
      status: updates.status,
      updated_at: new Date().toISOString()
    })
    .eq('id', strategyId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update strategy: ${error.message}`)
  }

  return NextResponse.json({
    success: true,
    strategy: formatStrategy(strategy)
  })
}

// Pause strategy
async function pauseStrategy(strategyId: string, userId: string) {
  const { data: strategy, error } = await supabase
    .from('cash_flow_acceleration_strategies')
    .update({ status: 'paused', updated_at: new Date().toISOString() })
    .eq('id', strategyId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to pause strategy: ${error.message}`)
  }

  return NextResponse.json({
    success: true,
    message: 'Strategy paused successfully',
    strategy: formatStrategy(strategy)
  })
}

// Activate strategy
async function activateStrategy(strategyId: string, userId: string) {
  const { data: strategy, error } = await supabase
    .from('cash_flow_acceleration_strategies')
    .update({ status: 'active', updated_at: new Date().toISOString() })
    .eq('id', strategyId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to activate strategy: ${error.message}`)
  }

  return NextResponse.json({
    success: true,
    message: 'Strategy activated successfully',
    strategy: formatStrategy(strategy)
  })
}

// Helper functions
function formatStrategy(strategy: any) {
  return {
    id: strategy.id,
    userId: strategy.user_id,
    strategyType: strategy.strategy_type,
    name: strategy.name,
    description: strategy.description,
    targetCriteria: strategy.target_criteria,
    actions: strategy.actions,
    incentives: strategy.incentives,
    automationRules: strategy.automation_rules,
    performance: strategy.performance,
    status: strategy.status,
    createdAt: strategy.created_at,
    updatedAt: strategy.updated_at
  }
}

function formatIncentive(incentive: any) {
  return {
    id: incentive.id,
    type: incentive.type,
    name: incentive.name,
    description: incentive.description,
    discountType: incentive.discount_type,
    discountValue: incentive.discount_value,
    maxDiscountAmount: incentive.max_discount_amount,
    conditions: incentive.conditions,
    validityPeriod: incentive.validity_period,
    usageLimit: incentive.usage_limit,
    applicableInvoiceTypes: incentive.applicable_invoice_types,
    minimumInvoiceAmount: incentive.minimum_invoice_amount,
    exclusions: incentive.exclusions,
    performance: incentive.performance,
    isActive: incentive.is_active,
    createdAt: incentive.created_at,
    updatedAt: incentive.updated_at
  }
}

async function getStrategyPerformanceMetrics(strategyId: string) {
  // Get execution statistics
  const { data: executions, error } = await supabase
    .from('cash_flow_automation_executions')
    .select('*')
    .eq('strategy_id', strategyId)

  if (error) {
    console.error('Error fetching strategy performance:', error)
    return { executionsCount: 0, successRate: 0, avgResponseTime: 0 }
  }

  const totalExecutions = executions?.length || 0
  const successfulExecutions = executions?.filter(e => e.status === 'completed').length || 0
  const successRate = totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 0

  return {
    executionsCount: totalExecutions,
    successfulExecutions,
    successRate: Math.round(successRate * 100) / 100,
    lastExecuted: executions?.[0]?.executed_at
  }
}

async function getActiveStrategiesCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('cash_flow_acceleration_strategies')
    .select('id', { count: 'exact' })
    .eq('user_id', userId)
    .eq('status', 'active')

  return count || 0
}

async function getActiveIncentivesCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('cash_flow_payment_incentives')
    .select('id', { count: 'exact' })
    .eq('user_id', userId)
    .eq('is_active', true)

  return count || 0
}

async function getActiveCampaignsCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('cash_flow_collection_campaigns')
    .select('id', { count: 'exact' })
    .eq('user_id', userId)
    .in('status', ['active', 'draft'])

  return count || 0
}

async function getRecentExecutions(userId: string, limit: number) {
  const { data: executions, error } = await supabase
    .from('cash_flow_automation_executions')
    .select(`
      *,
      cash_flow_acceleration_strategies!inner(name, user_id)
    `)
    .eq('cash_flow_acceleration_strategies.user_id', userId)
    .order('executed_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching recent executions:', error)
    return []
  }

  return (executions || []).map(execution => ({
    id: execution.id,
    strategyName: execution.cash_flow_acceleration_strategies.name,
    status: execution.status,
    executedAt: execution.executed_at,
    completedAt: execution.completed_at,
    results: execution.results
  }))
}

async function getOverallPerformanceMetrics(userId: string) {
  // This would calculate overall performance across all strategies
  // For now, returning mock data
  return {
    totalAccelerated: 125000,
    avgAccelerationDays: 8.5,
    conversionRate: 72.5,
    totalSaved: 15000
  }
}