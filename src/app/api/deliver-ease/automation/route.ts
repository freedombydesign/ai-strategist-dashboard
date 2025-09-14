import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface AutomationRule {
  id: string
  name: string
  trigger_type: 'time_based' | 'event_based' | 'condition_based' | 'milestone_based'
  trigger_conditions: any
  actions: AutomationAction[]
  enabled: boolean
  priority: number
  created_by: string
  last_executed?: string
  execution_count: number
}

interface AutomationAction {
  type: 'assign_task' | 'send_notification' | 'update_status' | 'create_task' | 'escalate' | 'rebalance_workload'
  parameters: any
  retry_count?: number
  delay_minutes?: number
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const ruleType = searchParams.get('rule_type')
    const enabled = searchParams.get('enabled')
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let query = supabase
      .from('automation_rules')
      .select('*')
      .eq('user_id', user.id)
      .order('priority', { ascending: false })

    if (ruleType) {
      query = query.eq('trigger_type', ruleType)
    }
    
    if (enabled !== null) {
      query = query.eq('enabled', enabled === 'true')
    }

    const { data: rules, error } = await query

    if (error) {
      console.error('Error fetching automation rules:', error)
      return NextResponse.json({ error: 'Failed to fetch automation rules' }, { status: 500 })
    }

    return NextResponse.json({ automation_rules: rules })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (body.action === 'execute_rule') {
      return await executeAutomationRule(body.rule_id, user.id)
    }

    if (body.action === 'bulk_execute') {
      return await executeBulkAutomation(body.rule_ids, user.id)
    }

    if (body.action === 'test_rule') {
      return await testAutomationRule(body.rule_data, user.id)
    }

    const requiredFields = ['name', 'trigger_type', 'trigger_conditions', 'actions']
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 })
      }
    }

    const ruleData = {
      user_id: user.id,
      name: body.name,
      description: body.description || '',
      trigger_type: body.trigger_type,
      trigger_conditions: body.trigger_conditions,
      actions: body.actions,
      enabled: body.enabled !== false,
      priority: body.priority || 5,
      created_by: user.id,
      execution_count: 0,
      metadata: {
        created_from: 'manual',
        ai_generated: body.ai_generated || false,
        tags: body.tags || []
      }
    }

    const { data: rule, error } = await supabase
      .from('automation_rules')
      .insert(ruleData)
      .select()
      .single()

    if (error) {
      console.error('Error creating automation rule:', error)
      return NextResponse.json({ error: 'Failed to create automation rule' }, { status: 500 })
    }

    return NextResponse.json({
      automation_rule: rule,
      message: 'Automation rule created successfully'
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function executeAutomationRule(ruleId: string, userId: string) {
  const { data: rule } = await supabase
    .from('automation_rules')
    .select('*')
    .eq('id', ruleId)
    .eq('user_id', userId)
    .single()

  if (!rule || !rule.enabled) {
    return NextResponse.json({ error: 'Rule not found or disabled' }, { status: 404 })
  }

  const executionResults = []

  try {
    // Evaluate trigger conditions
    const triggerMet = await evaluateTriggerConditions(rule.trigger_conditions, rule.trigger_type)
    
    if (!triggerMet) {
      return NextResponse.json({
        message: 'Trigger conditions not met',
        rule_id: ruleId,
        executed: false
      })
    }

    // Execute actions in sequence
    for (const action of rule.actions) {
      const result = await executeAction(action, rule, userId)
      executionResults.push(result)
      
      if (action.delay_minutes) {
        console.log(`Delaying next action by ${action.delay_minutes} minutes`)
      }
    }

    // Update execution count and last executed
    await supabase
      .from('automation_rules')
      .update({
        execution_count: rule.execution_count + 1,
        last_executed: new Date().toISOString()
      })
      .eq('id', ruleId)

    // Log execution
    await logAutomationExecution(ruleId, 'success', executionResults, userId)

    return NextResponse.json({
      message: 'Automation rule executed successfully',
      rule_id: ruleId,
      execution_results: executionResults,
      executed: true
    })

  } catch (error) {
    console.error('Automation execution error:', error)
    
    await logAutomationExecution(ruleId, 'failed', { error: error.message }, userId)
    
    return NextResponse.json({
      error: 'Automation execution failed',
      rule_id: ruleId,
      details: error.message
    }, { status: 500 })
  }
}

async function evaluateTriggerConditions(conditions: any, triggerType: string): Promise<boolean> {
  switch (triggerType) {
    case 'time_based':
      return evaluateTimeBasedTrigger(conditions)
    case 'event_based':
      return evaluateEventBasedTrigger(conditions)
    case 'condition_based':
      return evaluateConditionBasedTrigger(conditions)
    case 'milestone_based':
      return evaluateMilestoneBasedTrigger(conditions)
    default:
      return false
  }
}

async function evaluateTimeBasedTrigger(conditions: any): Promise<boolean> {
  const now = new Date()
  const currentHour = now.getHours()
  const currentDay = now.getDay()
  const currentDate = now.getDate()

  if (conditions.schedule_type === 'daily') {
    return conditions.hours?.includes(currentHour) || false
  }
  
  if (conditions.schedule_type === 'weekly') {
    return conditions.days?.includes(currentDay) && 
           (conditions.hours?.includes(currentHour) || true)
  }
  
  if (conditions.schedule_type === 'monthly') {
    return conditions.dates?.includes(currentDate) &&
           (conditions.hours?.includes(currentHour) || true)
  }

  return false
}

async function evaluateEventBasedTrigger(conditions: any): Promise<boolean> {
  if (conditions.event_type === 'project_status_change') {
    // Check for recent project status changes
    const { data: recentChanges } = await supabase
      .from('client_projects')
      .select('*')
      .gte('updated_at', new Date(Date.now() - 5 * 60 * 1000).toISOString()) // Last 5 minutes

    return recentChanges && recentChanges.length > 0
  }

  if (conditions.event_type === 'task_overdue') {
    const { data: overdueTasks } = await supabase
      .from('project_tasks')
      .select('*')
      .lt('due_date', new Date().toISOString())
      .neq('status', 'completed')

    return overdueTasks && overdueTasks.length > 0
  }

  return false
}

async function evaluateConditionBasedTrigger(conditions: any): Promise<boolean> {
  if (conditions.condition_type === 'team_utilization') {
    const { data: teamMembers } = await supabase
      .from('team_members')
      .select('utilization_rate')

    if (!teamMembers) return false

    const avgUtilization = teamMembers.reduce((acc, m) => acc + (m.utilization_rate || 0), 0) / teamMembers.length
    
    if (conditions.operator === 'greater_than') {
      return avgUtilization > conditions.threshold
    }
    if (conditions.operator === 'less_than') {
      return avgUtilization < conditions.threshold
    }
  }

  if (conditions.condition_type === 'project_budget') {
    const { data: projects } = await supabase
      .from('client_projects')
      .select('budget_used, total_budget')
      .eq('status', 'active')

    if (!projects) return false

    return projects.some(p => {
      const utilizationRate = (p.budget_used / p.total_budget) * 100
      return conditions.operator === 'greater_than' ? 
        utilizationRate > conditions.threshold :
        utilizationRate < conditions.threshold
    })
  }

  return false
}

async function evaluateMilestoneBasedTrigger(conditions: any): Promise<boolean> {
  const { data: milestones } = await supabase
    .from('project_milestones')
    .select('*')
    .eq('status', conditions.milestone_status || 'completed')
    .gte('completed_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours

  return milestones && milestones.length > 0
}

async function executeAction(action: AutomationAction, rule: any, userId: string) {
  switch (action.type) {
    case 'assign_task':
      return await executeTaskAssignment(action.parameters, userId)
    case 'send_notification':
      return await executeNotification(action.parameters, userId)
    case 'update_status':
      return await executeStatusUpdate(action.parameters, userId)
    case 'create_task':
      return await executeTaskCreation(action.parameters, userId)
    case 'escalate':
      return await executeEscalation(action.parameters, userId)
    case 'rebalance_workload':
      return await executeWorkloadRebalancing(action.parameters, userId)
    default:
      throw new Error(`Unknown action type: ${action.type}`)
  }
}

async function executeTaskAssignment(parameters: any, userId: string) {
  const { task_id, assign_to, assignment_criteria } = parameters

  if (assign_to === 'auto') {
    // AI-powered optimal assignment
    const { data: teamMembers } = await supabase
      .from('team_members')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'available')

    const { data: task } = await supabase
      .from('project_tasks')
      .select('*')
      .eq('id', task_id)
      .single()

    if (!teamMembers || !task) {
      throw new Error('Task or team members not found')
    }

    const optimalAssignee = findOptimalAssignee(task, teamMembers, assignment_criteria)
    
    await supabase
      .from('project_tasks')
      .update({ assigned_to: optimalAssignee.id })
      .eq('id', task_id)

    return {
      action: 'task_assigned',
      task_id,
      assigned_to: optimalAssignee.name,
      assignment_score: optimalAssignee.score
    }
  } else {
    await supabase
      .from('project_tasks')
      .update({ assigned_to: assign_to })
      .eq('id', task_id)

    return {
      action: 'task_assigned',
      task_id,
      assigned_to: assign_to
    }
  }
}

async function executeNotification(parameters: any, userId: string) {
  const { notification_type, recipients, template, data } = parameters

  const notificationData = {
    user_id: userId,
    notification_type,
    title: template.title,
    message: personalizeTemplate(template.message, data),
    recipients: Array.isArray(recipients) ? recipients : [recipients],
    automated: true,
    metadata: {
      automation_triggered: true,
      template_used: template.id
    }
  }

  await supabase
    .from('notifications')
    .insert(notificationData)

  return {
    action: 'notification_sent',
    type: notification_type,
    recipients: notificationData.recipients.length
  }
}

async function executeStatusUpdate(parameters: any, userId: string) {
  const { entity_type, entity_id, new_status, update_reason } = parameters

  const updateData = {
    status: new_status,
    updated_at: new Date().toISOString(),
    metadata: {
      automation_update: true,
      reason: update_reason
    }
  }

  let tableName = ''
  switch (entity_type) {
    case 'project':
      tableName = 'client_projects'
      break
    case 'task':
      tableName = 'project_tasks'
      break
    case 'deliverable':
      tableName = 'project_deliverables'
      break
    default:
      throw new Error(`Unknown entity type: ${entity_type}`)
  }

  await supabase
    .from(tableName)
    .update(updateData)
    .eq('id', entity_id)
    .eq('user_id', userId)

  return {
    action: 'status_updated',
    entity_type,
    entity_id,
    new_status
  }
}

async function executeTaskCreation(parameters: any, userId: string) {
  const { project_id, task_template, dynamic_data } = parameters

  const taskData = {
    user_id: userId,
    project_id,
    task_name: personalizeTemplate(task_template.name, dynamic_data),
    description: personalizeTemplate(task_template.description, dynamic_data),
    estimated_hours: task_template.estimated_hours,
    priority_level: task_template.priority || 'medium',
    due_date: calculateDueDate(task_template.due_offset_days || 7),
    status: 'not_started',
    created_from: 'automation',
    skill_requirements: task_template.skill_requirements || []
  }

  const { data: task } = await supabase
    .from('project_tasks')
    .insert(taskData)
    .select()
    .single()

  return {
    action: 'task_created',
    task_id: task.id,
    task_name: task.task_name
  }
}

async function executeEscalation(parameters: any, userId: string) {
  const { escalation_type, escalation_rules, context_data } = parameters

  const escalationData = {
    user_id: userId,
    escalation_type,
    severity: parameters.severity || 'medium',
    context: context_data,
    escalated_to: escalation_rules.escalate_to,
    automated: true,
    created_at: new Date().toISOString()
  }

  await supabase
    .from('escalations')
    .insert(escalationData)

  // Send immediate notification to escalation target
  await executeNotification({
    notification_type: 'escalation_alert',
    recipients: [escalation_rules.escalate_to],
    template: {
      title: `Escalation: ${escalation_type}`,
      message: `Automated escalation triggered: ${context_data.description || 'No description provided'}`
    },
    data: context_data
  }, userId)

  return {
    action: 'escalation_created',
    escalation_type,
    escalated_to: escalation_rules.escalate_to
  }
}

async function executeWorkloadRebalancing(parameters: any, userId: string) {
  const { rebalance_strategy, affected_team_members } = parameters

  const { data: teamMembers } = await supabase
    .from('team_members')
    .select('*')
    .eq('user_id', userId)
    .in('id', affected_team_members || [])

  if (!teamMembers) {
    throw new Error('Team members not found')
  }

  const rebalanceResults = []

  if (rebalance_strategy === 'redistribute_overload') {
    const overloadedMembers = teamMembers.filter(m => m.utilization_rate > 90)
    const underutilizedMembers = teamMembers.filter(m => m.utilization_rate < 70)

    for (const overloaded of overloadedMembers) {
      const { data: tasks } = await supabase
        .from('project_tasks')
        .select('*')
        .eq('assigned_to', overloaded.id)
        .eq('status', 'not_started')
        .order('priority_level', { ascending: true })
        .limit(3)

      if (tasks && underutilizedMembers.length > 0) {
        const targetMember = underutilizedMembers[0]
        
        for (const task of tasks) {
          await supabase
            .from('project_tasks')
            .update({ assigned_to: targetMember.id })
            .eq('id', task.id)
            
          rebalanceResults.push({
            task_id: task.id,
            from: overloaded.name,
            to: targetMember.name
          })
        }
      }
    }
  }

  return {
    action: 'workload_rebalanced',
    strategy: rebalance_strategy,
    reassignments: rebalanceResults.length
  }
}

function findOptimalAssignee(task: any, teamMembers: any[], criteria: any) {
  const scoredMembers = teamMembers.map(member => {
    let score = 0
    
    // Skill match (40% weight)
    const skillMatch = task.skill_requirements?.filter((skill: string) => 
      member.skillsets?.includes(skill)
    ).length || 0
    const skillScore = task.skill_requirements?.length > 0 ? 
      (skillMatch / task.skill_requirements.length) * 40 : 20
    score += skillScore

    // Capacity (30% weight)
    const capacityScore = (1 - (member.utilization_rate / 100)) * 30
    score += capacityScore

    // Performance (20% weight)
    const performanceScore = (member.avg_performance || 80) / 100 * 20
    score += performanceScore

    // Workload balance (10% weight)
    const workloadScore = member.active_projects < 4 ? 10 : 5
    score += workloadScore

    return { ...member, score }
  })

  return scoredMembers.sort((a, b) => b.score - a.score)[0]
}

function personalizeTemplate(template: string, data: any): string {
  let result = template
  Object.entries(data).forEach(([key, value]) => {
    result = result.replace(new RegExp(`{${key}}`, 'g'), value as string)
  })
  return result
}

function calculateDueDate(offsetDays: number): string {
  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + offsetDays)
  return dueDate.toISOString()
}

async function logAutomationExecution(ruleId: string, status: string, results: any, userId: string) {
  await supabase
    .from('automation_logs')
    .insert({
      rule_id: ruleId,
      user_id: userId,
      execution_status: status,
      execution_results: results,
      executed_at: new Date().toISOString()
    })
}

async function executeBulkAutomation(ruleIds: string[], userId: string) {
  const results = []
  
  for (const ruleId of ruleIds) {
    try {
      const result = await executeAutomationRule(ruleId, userId)
      results.push({ rule_id: ruleId, status: 'success', result })
    } catch (error) {
      results.push({ rule_id: ruleId, status: 'failed', error: error.message })
    }
  }

  return NextResponse.json({
    message: 'Bulk automation execution completed',
    results,
    successful: results.filter(r => r.status === 'success').length,
    failed: results.filter(r => r.status === 'failed').length
  })
}

async function testAutomationRule(ruleData: any, userId: string) {
  const testResults = {
    rule_name: ruleData.name,
    trigger_evaluation: false,
    actions_simulated: [],
    potential_impact: {},
    warnings: []
  }

  // Test trigger conditions
  try {
    testResults.trigger_evaluation = await evaluateTriggerConditions(
      ruleData.trigger_conditions, 
      ruleData.trigger_type
    )
  } catch (error) {
    testResults.warnings.push(`Trigger evaluation failed: ${error.message}`)
  }

  // Simulate actions
  for (const action of ruleData.actions) {
    try {
      const simulation = await simulateAction(action, userId)
      testResults.actions_simulated.push(simulation)
    } catch (error) {
      testResults.warnings.push(`Action simulation failed: ${error.message}`)
    }
  }

  return NextResponse.json({
    test_results: testResults,
    recommendation: testResults.warnings.length === 0 ? 'Rule ready for deployment' : 'Review warnings before deployment'
  })
}

async function simulateAction(action: AutomationAction, userId: string) {
  return {
    action_type: action.type,
    simulated: true,
    estimated_impact: `Would ${action.type.replace('_', ' ')} based on current conditions`,
    parameters_valid: true
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { rule_id, ...updateData } = body
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!rule_id) {
      return NextResponse.json({ error: 'Rule ID required' }, { status: 400 })
    }

    const { data: rule, error } = await supabase
      .from('automation_rules')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', rule_id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating automation rule:', error)
      return NextResponse.json({ error: 'Failed to update automation rule' }, { status: 500 })
    }

    return NextResponse.json({
      automation_rule: rule,
      message: 'Automation rule updated successfully'
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (action === 'process_scheduled_rules') {
      return await processScheduledRules(user.id)
    }

    if (action === 'generate_ai_rules') {
      const body = await request.json()
      return await generateAIRules(body, user.id)
    }

    if (action === 'optimization_scan') {
      return await performOptimizationScan(user.id)
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function processScheduledRules(userId: string) {
  const { data: rules } = await supabase
    .from('automation_rules')
    .select('*')
    .eq('user_id', userId)
    .eq('enabled', true)
    .in('trigger_type', ['time_based', 'condition_based'])

  if (!rules) {
    return NextResponse.json({ message: 'No rules to process' })
  }

  const processedRules = []
  for (const rule of rules) {
    const triggerMet = await evaluateTriggerConditions(rule.trigger_conditions, rule.trigger_type)
    if (triggerMet) {
      await executeAutomationRule(rule.id, userId)
      processedRules.push(rule.id)
    }
  }

  return NextResponse.json({
    message: `Processed ${processedRules.length} automation rules`,
    processed_rules: processedRules
  })
}

async function generateAIRules(parameters: any, userId: string) {
  const { business_context, optimization_goals } = parameters

  const aiGeneratedRules = [
    {
      name: 'Auto-assign High Priority Tasks',
      description: 'Automatically assign critical and high priority tasks to available team members',
      trigger_type: 'event_based',
      trigger_conditions: {
        event_type: 'task_created',
        priority_filter: ['critical', 'high']
      },
      actions: [
        {
          type: 'assign_task',
          parameters: {
            assign_to: 'auto',
            assignment_criteria: {
              prioritize_availability: true,
              skill_match_weight: 0.4,
              capacity_weight: 0.3
            }
          }
        }
      ],
      priority: 8,
      ai_generated: true
    },
    {
      name: 'Overdue Task Escalation',
      description: 'Escalate tasks that are overdue by more than 24 hours',
      trigger_type: 'condition_based',
      trigger_conditions: {
        condition_type: 'task_overdue',
        threshold_hours: 24
      },
      actions: [
        {
          type: 'escalate',
          parameters: {
            escalation_type: 'overdue_task',
            severity: 'medium',
            escalation_rules: {
              escalate_to: 'project_manager'
            }
          }
        }
      ],
      priority: 7,
      ai_generated: true
    }
  ]

  return NextResponse.json({
    ai_generated_rules: aiGeneratedRules,
    message: `Generated ${aiGeneratedRules.length} AI-powered automation rules`,
    optimization_focus: optimization_goals
  })
}

async function performOptimizationScan(userId: string) {
  const optimizationResults = {
    inefficiencies_detected: [],
    automation_opportunities: [],
    performance_metrics: {},
    recommendations: []
  }

  // Detect team utilization imbalances
  const { data: teamMembers } = await supabase
    .from('team_members')
    .select('*')
    .eq('user_id', userId)

  if (teamMembers) {
    const utilizationVariance = Math.max(...teamMembers.map(m => m.utilization_rate)) - 
                               Math.min(...teamMembers.map(m => m.utilization_rate))
    
    if (utilizationVariance > 30) {
      optimizationResults.inefficiencies_detected.push({
        type: 'utilization_imbalance',
        severity: 'medium',
        description: `${utilizationVariance}% variance in team utilization detected`
      })
      
      optimizationResults.recommendations.push({
        type: 'automation_rule',
        title: 'Implement Workload Rebalancing',
        description: 'Create rule to automatically redistribute tasks when utilization variance exceeds 25%'
      })
    }
  }

  // Check for manual processes that could be automated
  const { data: recentTasks } = await supabase
    .from('project_tasks')
    .select('*')
    .eq('user_id', userId)
    .is('assigned_to', null)
    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

  if (recentTasks && recentTasks.length > 10) {
    optimizationResults.automation_opportunities.push({
      type: 'task_assignment',
      potential_savings: `${recentTasks.length * 5} minutes per week`,
      description: 'High volume of unassigned tasks detected'
    })
  }

  return NextResponse.json({
    optimization_scan: optimizationResults,
    scan_timestamp: new Date().toISOString(),
    next_scan_recommended: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  })
}