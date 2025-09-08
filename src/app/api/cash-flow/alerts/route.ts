import { NextRequest, NextResponse } from 'next/server'
import { cashGapAlertService } from '@/services/cashGapAlertService'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const action = searchParams.get('action')
    const alertId = searchParams.get('alertId')
    const status = searchParams.get('status')
    const severity = searchParams.get('severity')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    switch (action) {
      case 'monitor':
        return await monitorCashGaps(userId)
      
      case 'list':
        return await getAlerts(userId, { status, severity, startDate, endDate })
      
      case 'settings':
        return await getAlertSettings(userId)
      
      case 'dashboard':
        return await getAlertDashboard(userId)
      
      case 'history':
        return await getAlertHistory(userId, { startDate, endDate })
      
      case 'details':
        if (!alertId) {
          return NextResponse.json({ error: 'alertId required for details' }, { status: 400 })
        }
        return await getAlertDetails(alertId, userId)
      
      default:
        return await getAlerts(userId, { status, severity, startDate, endDate })
    }

  } catch (error) {
    console.error('[ALERTS-API] Error in GET:', error)
    return NextResponse.json({
      error: 'Failed to fetch alert data',
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
      case 'acknowledge':
        return await acknowledgeAlert(body.alertId, userId)
      
      case 'resolve':
        return await resolveAlert(body.alertId, userId, body.resolution)
      
      case 'dismiss':
        return await dismissAlert(body.alertId, userId, body.reason)
      
      case 'update_settings':
        return await updateAlertSettings(userId, body.settings)
      
      case 'test_alert':
        return await testAlertSystem(userId)
      
      case 'run_monitor':
        return await runAlertMonitoring(userId)
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error) {
    console.error('[ALERTS-API] Error in POST:', error)
    return NextResponse.json({
      error: 'Failed to process alert action',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Monitor cash gaps and generate alerts
async function monitorCashGaps(userId: string) {
  const result = await cashGapAlertService.monitorCashGaps(userId)
  
  return NextResponse.json({
    success: true,
    alerts: result.alerts,
    summary: result.summary,
    monitoredAt: new Date().toISOString()
  })
}

// Get alerts with filters
async function getAlerts(userId: string, filters: any) {
  let query = supabase
    .from('cash_flow_alerts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (filters.status) query = query.eq('status', filters.status)
  if (filters.severity) query = query.eq('severity', filters.severity)
  if (filters.startDate) query = query.gte('created_at', filters.startDate)
  if (filters.endDate) query = query.lte('created_at', filters.endDate)

  const { data: alerts, error } = await query.limit(100)

  if (error) {
    throw new Error(`Failed to fetch alerts: ${error.message}`)
  }

  const formattedAlerts = (alerts || []).map(formatAlert)
  const summary = calculateAlertsSummary(formattedAlerts)

  return NextResponse.json({
    alerts: formattedAlerts,
    summary
  })
}

// Get alert settings
async function getAlertSettings(userId: string) {
  const settings = await cashGapAlertService.getAlertSettings(userId)
  return NextResponse.json({ settings })
}

// Get alert dashboard data
async function getAlertDashboard(userId: string) {
  const { data: recentAlerts, error } = await supabase
    .from('cash_flow_alerts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    throw new Error(`Failed to fetch recent alerts: ${error.message}`)
  }

  const formattedAlerts = (recentAlerts || []).map(formatAlert)
  const activeAlerts = formattedAlerts.filter(a => a.status === 'active')
  const criticalAlerts = activeAlerts.filter(a => a.severity === 'critical')
  
  const upcomingShortfalls = activeAlerts
    .filter(a => a.metadata?.daysUntilShortfall <= 28)
    .sort((a, b) => (a.metadata?.daysUntilShortfall || 999) - (b.metadata?.daysUntilShortfall || 999))
    .slice(0, 10)

  return NextResponse.json({
    dashboard: {
      summary: {
        totalActiveAlerts: activeAlerts.length,
        criticalAlerts: criticalAlerts.length,
        highPriorityAlerts: activeAlerts.filter(a => a.severity === 'high').length,
        nextShortfallDays: upcomingShortfalls[0]?.metadata?.daysUntilShortfall || null,
        totalProjectedShortfall: activeAlerts.reduce((sum, a) => sum + (a.projectedShortfall || 0), 0)
      },
      recentAlerts: formattedAlerts.slice(0, 10),
      upcomingShortfalls,
      severityBreakdown: calculateSeverityBreakdown(activeAlerts),
      typeBreakdown: calculateTypeBreakdown(activeAlerts)
    }
  })
}

// Get alert history
async function getAlertHistory(userId: string, filters: any) {
  let query = supabase
    .from('cash_flow_alerts')
    .select('*')
    .eq('user_id', userId)
    .in('status', ['resolved', 'dismissed'])
    .order('updated_at', { ascending: false })

  if (filters.startDate) query = query.gte('created_at', filters.startDate)
  if (filters.endDate) query = query.lte('created_at', filters.endDate)

  const { data: alerts, error } = await query.limit(100)

  if (error) {
    throw new Error(`Failed to fetch alert history: ${error.message}`)
  }

  return NextResponse.json({
    history: (alerts || []).map(formatAlert)
  })
}

// Get specific alert details
async function getAlertDetails(alertId: string, userId: string) {
  const { data: alert, error } = await supabase
    .from('cash_flow_alerts')
    .select('*')
    .eq('id', alertId)
    .eq('user_id', userId)
    .single()

  if (error) {
    throw new Error(`Failed to fetch alert details: ${error.message}`)
  }

  if (!alert) {
    return NextResponse.json({ error: 'Alert not found' }, { status: 404 })
  }

  return NextResponse.json({ alert: formatAlert(alert) })
}

// Acknowledge an alert
async function acknowledgeAlert(alertId: string, userId: string) {
  if (!alertId) {
    return NextResponse.json({ error: 'alertId is required' }, { status: 400 })
  }

  const { data: alert, error } = await supabase
    .from('cash_flow_alerts')
    .update({
      status: 'acknowledged',
      acknowledged_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', alertId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to acknowledge alert: ${error.message}`)
  }

  return NextResponse.json({
    success: true,
    alert: formatAlert(alert)
  })
}

// Resolve an alert
async function resolveAlert(alertId: string, userId: string, resolution?: string) {
  if (!alertId) {
    return NextResponse.json({ error: 'alertId is required' }, { status: 400 })
  }

  const { data: alert, error } = await supabase
    .from('cash_flow_alerts')
    .update({
      status: 'resolved',
      resolved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      resolution_notes: resolution
    })
    .eq('id', alertId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to resolve alert: ${error.message}`)
  }

  return NextResponse.json({
    success: true,
    alert: formatAlert(alert)
  })
}

// Dismiss an alert
async function dismissAlert(alertId: string, userId: string, reason?: string) {
  if (!alertId) {
    return NextResponse.json({ error: 'alertId is required' }, { status: 400 })
  }

  const { data: alert, error } = await supabase
    .from('cash_flow_alerts')
    .update({
      status: 'dismissed',
      updated_at: new Date().toISOString(),
      dismissal_reason: reason
    })
    .eq('id', alertId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to dismiss alert: ${error.message}`)
  }

  return NextResponse.json({
    success: true,
    alert: formatAlert(alert)
  })
}

// Update alert settings
async function updateAlertSettings(userId: string, settings: any) {
  await cashGapAlertService.updateAlertSettings(userId, settings)
  
  return NextResponse.json({
    success: true,
    message: 'Alert settings updated successfully'
  })
}

// Test alert system
async function testAlertSystem(userId: string) {
  const testAlert = {
    user_id: userId,
    alert_type: 'cash_gap_warning',
    severity: 'medium',
    title: 'Test Alert - System Check',
    description: 'This is a test alert to verify the alert system is functioning properly.',
    projected_shortfall: 5000,
    projected_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    week_number: 2,
    triggers: [{
      type: 'minimum_cash_breach',
      threshold: 25000,
      actualValue: 20000,
      description: 'Test trigger for system verification'
    }],
    recommendations: [{
      type: 'accelerate_collections',
      title: 'Test Recommendation',
      description: 'This is a test recommendation',
      impact: 'Test impact',
      urgency: 'medium',
      estimatedImprovement: 2500,
      timeToImplement: 'Test time',
      difficulty: 'easy'
    }],
    status: 'active',
    metadata: {
      currentCashPosition: 30000,
      projectedMinimumCash: 20000,
      daysUntilShortfall: 7,
      affectedWeeks: [2],
      confidenceLevel: 85,
      scenarioType: 'realistic',
      contributingFactors: ['System test']
    }
  }

  const { data: alert, error } = await supabase
    .from('cash_flow_alerts')
    .insert([testAlert])
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create test alert: ${error.message}`)
  }

  return NextResponse.json({
    success: true,
    message: 'Test alert created successfully',
    testAlert: formatAlert(alert)
  })
}

// Run alert monitoring manually
async function runAlertMonitoring(userId: string) {
  const result = await cashGapAlertService.monitorCashGaps(userId)
  
  return NextResponse.json({
    success: true,
    message: 'Alert monitoring completed',
    newAlerts: result.alerts.length,
    summary: result.summary
  })
}

// Helper functions
function formatAlert(alert: any) {
  return {
    id: alert.id,
    userId: alert.user_id,
    alertType: alert.alert_type,
    severity: alert.severity,
    title: alert.title,
    description: alert.description,
    projectedShortfall: alert.projected_shortfall,
    projectedDate: alert.projected_date,
    weekNumber: alert.week_number,
    triggers: alert.triggers || [],
    recommendations: alert.recommendations || [],
    status: alert.status,
    metadata: alert.metadata || {},
    createdAt: alert.created_at,
    updatedAt: alert.updated_at,
    acknowledgedAt: alert.acknowledged_at,
    resolvedAt: alert.resolved_at,
    resolutionNotes: alert.resolution_notes,
    dismissalReason: alert.dismissal_reason
  }
}

function calculateAlertsSummary(alerts: any[]) {
  const activeAlerts = alerts.filter(a => a.status === 'active')
  
  return {
    total: alerts.length,
    active: activeAlerts.length,
    acknowledged: alerts.filter(a => a.status === 'acknowledged').length,
    resolved: alerts.filter(a => a.status === 'resolved').length,
    dismissed: alerts.filter(a => a.status === 'dismissed').length,
    bySeverity: {
      critical: activeAlerts.filter(a => a.severity === 'critical').length,
      high: activeAlerts.filter(a => a.severity === 'high').length,
      medium: activeAlerts.filter(a => a.severity === 'medium').length,
      low: activeAlerts.filter(a => a.severity === 'low').length
    },
    totalProjectedShortfall: activeAlerts.reduce((sum, a) => sum + (a.projectedShortfall || 0), 0),
    nearestShortfall: Math.min(...activeAlerts.map(a => a.metadata?.daysUntilShortfall || 999))
  }
}

function calculateSeverityBreakdown(alerts: any[]) {
  const breakdown = { critical: 0, high: 0, medium: 0, low: 0 }
  alerts.forEach(alert => {
    if (breakdown[alert.severity as keyof typeof breakdown] !== undefined) {
      breakdown[alert.severity as keyof typeof breakdown]++
    }
  })
  return breakdown
}

function calculateTypeBreakdown(alerts: any[]) {
  const breakdown: Record<string, number> = {}
  alerts.forEach(alert => {
    breakdown[alert.alertType] = (breakdown[alert.alertType] || 0) + 1
  })
  return breakdown
}