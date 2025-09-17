import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../../lib/supabase'

// GET /api/dashboard/activity
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const period = searchParams.get('period') || '30' // days

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'User ID is required'
      }, { status: 400 })
    }

    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - parseInt(period))

    // Get activity data for the current period
    const { data: activityData, error: activityError } = await supabase
      .from('daily_activity_tracking')
      .select('*')
      .eq('user_id', userId)
      .gte('tracking_date', startDate.toISOString().split('T')[0])
      .lte('tracking_date', endDate.toISOString().split('T')[0])
      .order('tracking_date', { ascending: true })

    if (activityError) {
      console.error('Error fetching activity data:', activityError)
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch activity data'
      }, { status: 500 })
    }

    // Get previous period data for comparison
    const prevEndDate = new Date(startDate)
    const prevStartDate = new Date(startDate)
    prevStartDate.setDate(prevStartDate.getDate() - parseInt(period))

    const { data: prevActivityData, error: prevError } = await supabase
      .from('daily_activity_tracking')
      .select('*')
      .eq('user_id', userId)
      .gte('tracking_date', prevStartDate.toISOString().split('T')[0])
      .lt('tracking_date', startDate.toISOString().split('T')[0])

    if (prevError) {
      console.error('Error fetching previous period data:', prevError)
    }

    // Calculate current period metrics
    const currentPeriod = calculatePeriodMetrics(activityData || [])
    const previousPeriod = calculatePeriodMetrics(prevActivityData || [])

    // Calculate daily breakdown
    const dailyBreakdown = (activityData || []).map(day => ({
      date: day.tracking_date,
      hoursWorked: day.hours_worked || 0,
      fulfillmentHours: day.hours_in_fulfillment || 0,
      coordinationHours: day.hours_in_coordination || 0,
      revenue: day.revenue_generated || 0,
      stressLevel: day.stress_level || 5,
      satisfactionLevel: day.job_satisfaction || 5
    }))

    // Calculate weekly averages
    const weeklyAverages = calculateWeeklyAverages(activityData || [])

    // Calculate comparisons
    const comparisons = {
      previousPeriod: {
        hoursWorked: previousPeriod.totalHours,
        change: currentPeriod.totalHours - previousPeriod.totalHours,
        changePercentage: previousPeriod.totalHours > 0
          ? ((currentPeriod.totalHours - previousPeriod.totalHours) / previousPeriod.totalHours) * 100
          : 0
      },
      baseline: {
        hoursWorked: 55.0, // Default baseline
        timeSaved: Math.max(0, 55.0 - currentPeriod.totalHours),
        timeSavedPercentage: Math.max(0, ((55.0 - currentPeriod.totalHours) / 55.0) * 100)
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        currentPeriod,
        dailyBreakdown,
        weeklyAverages,
        comparisons
      }
    })

  } catch (error) {
    console.error('Error in GET /api/dashboard/activity:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

// POST /api/dashboard/activity
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      userId,
      trackingDate,
      hoursWorked,
      hoursInFulfillment,
      hoursInCoordination,
      hoursInBusinessDevelopment,
      weekendHours,
      revenueGenerated,
      expensesIncurred,
      tasksDelegated,
      clientInteractionsHandledByTeam,
      stressLevel,
      jobSatisfaction,
      energyLevel,
      manualTasksCompleted,
      automatedProcessesTriggered,
      newClientsOnboarded,
      clientIssuesResolved,
      notes
    } = body

    if (!userId || !trackingDate) {
      return NextResponse.json({
        success: false,
        error: 'User ID and tracking date are required'
      }, { status: 400 })
    }

    // Check if entry already exists for this date
    const { data: existingEntry, error: checkError } = await supabase
      .from('daily_activity_tracking')
      .select('id')
      .eq('user_id', userId)
      .eq('tracking_date', trackingDate)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing entry:', checkError)
      return NextResponse.json({
        success: false,
        error: 'Failed to check existing entry'
      }, { status: 500 })
    }

    const activityEntry = {
      user_id: userId,
      tracking_date: trackingDate,
      hours_worked: hoursWorked || 0,
      hours_in_fulfillment: hoursInFulfillment || 0,
      hours_in_coordination: hoursInCoordination || 0,
      hours_in_business_development: hoursInBusinessDevelopment || 0,
      weekend_hours: weekendHours || 0,
      revenue_generated: revenueGenerated || 0,
      expenses_incurred: expensesIncurred || 0,
      tasks_delegated: tasksDelegated || 0,
      client_interactions_handled_by_team: clientInteractionsHandledByTeam || 0,
      stress_level: stressLevel || 5,
      job_satisfaction: jobSatisfaction || 5,
      energy_level: energyLevel || 5,
      manual_tasks_completed: manualTasksCompleted || 0,
      automated_processes_triggered: automatedProcessesTriggered || 0,
      new_clients_onboarded: newClientsOnboarded || 0,
      client_issues_resolved: clientIssuesResolved || 0,
      notes: notes || '',
      updated_at: new Date().toISOString()
    }

    let result
    if (existingEntry) {
      // Update existing entry
      const { data, error } = await supabase
        .from('daily_activity_tracking')
        .update(activityEntry)
        .eq('id', existingEntry.id)
        .select()
        .single()

      result = { data, error }
    } else {
      // Create new entry
      activityEntry.created_at = new Date().toISOString()
      const { data, error } = await supabase
        .from('daily_activity_tracking')
        .insert(activityEntry)
        .select()
        .single()

      result = { data, error }
    }

    if (result.error) {
      console.error('Error saving activity entry:', result.error)
      return NextResponse.json({
        success: false,
        error: 'Failed to save activity entry'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      message: existingEntry ? 'Activity entry updated successfully' : 'Activity entry created successfully'
    })

  } catch (error) {
    console.error('Error in POST /api/dashboard/activity:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

// Helper function to calculate period metrics
function calculatePeriodMetrics(activityData: any[]) {
  if (!activityData || activityData.length === 0) {
    return {
      totalHours: 0,
      fulfillmentHours: 0,
      coordinationHours: 0,
      businessDevHours: 0,
      revenueGenerated: 0,
      profitMargin: 0,
      tasksDelegated: 0,
      teamEfficiencyScore: 5,
      stressLevel: 5,
      satisfactionLevel: 5
    }
  }

  const totals = activityData.reduce((acc, day) => ({
    totalHours: acc.totalHours + (day.hours_worked || 0),
    fulfillmentHours: acc.fulfillmentHours + (day.hours_in_fulfillment || 0),
    coordinationHours: acc.coordinationHours + (day.hours_in_coordination || 0),
    businessDevHours: acc.businessDevHours + (day.hours_in_business_development || 0),
    revenueGenerated: acc.revenueGenerated + (day.revenue_generated || 0),
    expenses: acc.expenses + (day.expenses_incurred || 0),
    tasksDelegated: acc.tasksDelegated + (day.tasks_delegated || 0),
    stressLevelSum: acc.stressLevelSum + (day.stress_level || 5),
    satisfactionSum: acc.satisfactionSum + (day.job_satisfaction || 5),
    teamInteractions: acc.teamInteractions + (day.client_interactions_handled_by_team || 0),
    totalInteractions: acc.totalInteractions + (day.client_interactions_handled_by_team || 0) + (day.client_issues_resolved || 0)
  }), {
    totalHours: 0,
    fulfillmentHours: 0,
    coordinationHours: 0,
    businessDevHours: 0,
    revenueGenerated: 0,
    expenses: 0,
    tasksDelegated: 0,
    stressLevelSum: 0,
    satisfactionSum: 0,
    teamInteractions: 0,
    totalInteractions: 0
  })

  const profitMargin = totals.revenueGenerated > 0
    ? ((totals.revenueGenerated - totals.expenses) / totals.revenueGenerated) * 100
    : 0

  const teamEfficiencyScore = totals.totalInteractions > 0
    ? Math.round((totals.teamInteractions / totals.totalInteractions) * 10)
    : 5

  return {
    totalHours: Math.round(totals.totalHours * 10) / 10,
    fulfillmentHours: Math.round(totals.fulfillmentHours * 10) / 10,
    coordinationHours: Math.round(totals.coordinationHours * 10) / 10,
    businessDevHours: Math.round(totals.businessDevHours * 10) / 10,
    revenueGenerated: Math.round(totals.revenueGenerated * 100) / 100,
    profitMargin: Math.round(profitMargin * 10) / 10,
    tasksDelegated: totals.tasksDelegated,
    teamEfficiencyScore,
    stressLevel: Math.round((totals.stressLevelSum / activityData.length) * 10) / 10,
    satisfactionLevel: Math.round((totals.satisfactionSum / activityData.length) * 10) / 10
  }
}

// Helper function to calculate weekly averages
function calculateWeeklyAverages(activityData: any[]) {
  if (!activityData || activityData.length === 0) {
    return {
      hoursWorked: 0,
      weekendHours: 0,
      delegationRate: 0,
      automationRate: 0
    }
  }

  const totals = activityData.reduce((acc, day) => ({
    totalHours: acc.totalHours + (day.hours_worked || 0),
    weekendHours: acc.weekendHours + (day.weekend_hours || 0),
    tasksDelegated: acc.tasksDelegated + (day.tasks_delegated || 0),
    manualTasks: acc.manualTasks + (day.manual_tasks_completed || 0),
    automatedTasks: acc.automatedTasks + (day.automated_processes_triggered || 0)
  }), {
    totalHours: 0,
    weekendHours: 0,
    tasksDelegated: 0,
    manualTasks: 0,
    automatedTasks: 0
  })

  const weeks = Math.max(1, activityData.length / 7)
  const totalTasks = totals.manualTasks + totals.automatedTasks + totals.tasksDelegated

  return {
    hoursWorked: Math.round((totals.totalHours / weeks) * 10) / 10,
    weekendHours: Math.round((totals.weekendHours / weeks) * 10) / 10,
    delegationRate: totalTasks > 0 ? Math.round((totals.tasksDelegated / totalTasks) * 100) / 100 : 0,
    automationRate: totalTasks > 0 ? Math.round((totals.automatedTasks / totalTasks) * 100) / 100 : 0
  }
}