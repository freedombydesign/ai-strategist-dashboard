import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const assignedTo = searchParams.get('assignedTo')
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    
    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let query = supabase
      .from('project_tasks')
      .select(`
        *,
        client_projects(project_name, client_name, project_status)
      `)
      .eq('user_id', user.id)
      .order('priority_level', { ascending: false })
      .order('planned_end_date', { ascending: true })

    if (projectId) query = query.eq('project_id', projectId)
    if (assignedTo) query = query.eq('assigned_to', assignedTo)
    if (status) query = query.eq('task_status', status)
    if (priority) query = query.eq('priority_level', priority)

    const { data: tasks, error } = await query

    if (error) {
      console.error('Error fetching tasks:', error)
      return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
    }

    // Calculate additional metrics for each task
    const enrichedTasks = await Promise.all(
      tasks.map(async (task) => ({
        ...task,
        days_until_due: calculateDaysUntilDue(task.planned_end_date),
        estimated_completion: calculateEstimatedCompletion(task),
        risk_level: calculateTaskRiskLevel(task)
      }))
    )

    return NextResponse.json({ tasks: enrichedTasks })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validate required fields
    const requiredFields = ['project_id', 'task_title', 'planned_end_date']
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 })
      }
    }

    const taskData = {
      user_id: user.id,
      project_id: body.project_id,
      task_title: body.task_title,
      task_description: body.task_description || null,
      task_type: body.task_type || 'general',
      planned_start_date: body.planned_start_date || new Date().toISOString().split('T')[0],
      planned_end_date: body.planned_end_date,
      estimated_hours: body.estimated_hours || 8,
      task_status: 'not_started',
      priority_level: body.priority_level || 'medium',
      phase_name: body.phase_name || null,
      milestone_marker: body.milestone_marker || false,
      billable: body.billable ?? true,
      skill_requirements: body.skill_requirements || [],
      visible_to_client: body.visible_to_client || false,
      client_approval_required: body.client_approval_required || false,
      auto_generated: false,
      ai_complexity_score: calculateTaskComplexity(body),
      dependency_type: body.dependency_type || 'finish_to_start'
    }

    const { data: task, error } = await supabase
      .from('project_tasks')
      .insert(taskData)
      .select(`
        *,
        client_projects(project_name, client_name)
      `)
      .single()

    if (error) {
      console.error('Error creating task:', error)
      return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
    }

    // Auto-assign task if smart assignment is enabled
    if (body.auto_assign && !body.assigned_to) {
      await autoAssignTask(task)
    }

    return NextResponse.json({ 
      task,
      message: 'Task created successfully' 
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { task_id, ...updateData } = body
    
    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!task_id) {
      return NextResponse.json({ error: 'Task ID required' }, { status: 400 })
    }

    // Get current task data
    const { data: currentTask, error: fetchError } = await supabase
      .from('project_tasks')
      .select('*')
      .eq('id', task_id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !currentTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Handle status changes with automation
    if (updateData.task_status && updateData.task_status !== currentTask.task_status) {
      await handleTaskStatusChange(currentTask, updateData.task_status, user.id)
    }

    // Update task
    const { data: task, error } = await supabase
      .from('project_tasks')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
        ...(updateData.task_status === 'completed' && { 
          actual_completion_date: new Date().toISOString().split('T')[0],
          completed_at: new Date().toISOString()
        })
      })
      .eq('id', task_id)
      .eq('user_id', user.id)
      .select(`
        *,
        client_projects(project_name, client_name)
      `)
      .single()

    if (error) {
      console.error('Error updating task:', error)
      return NextResponse.json({ error: 'Failed to update task' }, { status: 500 })
    }

    return NextResponse.json({ 
      task,
      message: 'Task updated successfully' 
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// SMART TASK ASSIGNMENT - Core automation that eliminates founder bottlenecks
export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const body = await request.json()
    
    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    switch (action) {
      case 'bulk_assign':
        return await handleBulkTaskAssignment(body, user.id)
      
      case 'auto_assign':
        return await handleAutoAssignment(body, user.id)
      
      case 'rebalance_workload':
        return await handleWorkloadRebalancing(body, user.id)
      
      case 'escalate_task':
        return await handleTaskEscalation(body, user.id)
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Automated task assignment based on team capacity and skills
async function autoAssignTask(task: any) {
  try {
    // Get available team members with capacity
    const { data: teamCapacity, error } = await supabase
      .from('team_capacity')
      .select('*')
      .eq('user_id', task.user_id)
      .eq('availability_status', 'available')
      .order('current_weekly_hours', { ascending: true })

    if (error || !teamCapacity?.length) return null

    // Find best assignee using sophisticated algorithm
    const bestAssignee = findOptimalAssignee(task, teamCapacity)
    
    if (bestAssignee) {
      // Assign task
      await supabase
        .from('project_tasks')
        .update({
          assigned_to: bestAssignee.team_member_id,
          assigned_by: task.user_id,
          assignment_method: 'ai_optimized',
          assignment_date: new Date().toISOString()
        })
        .eq('id', task.id)

      // Update team member capacity
      await updateTeamMemberCapacity(bestAssignee.team_member_id, task.estimated_hours)

      // Create assignment notification
      await createTaskAssignmentNotification(task, bestAssignee.team_member_id)

      return bestAssignee.team_member_id
    }

    return null
  } catch (error) {
    console.error('Error in auto-assignment:', error)
    return null
  }
}

function findOptimalAssignee(task: any, teamCapacity: any[]) {
  // Sophisticated assignment algorithm considering multiple factors
  let bestAssignee = null
  let bestScore = 0

  for (const member of teamCapacity) {
    let score = 0

    // Factor 1: Skill match (40% weight)
    const skillMatch = calculateSkillMatch(task.skill_requirements, member.skill_specializations)
    score += skillMatch * 0.4

    // Factor 2: Capacity availability (30% weight)
    const capacityScore = calculateCapacityScore(member, task.estimated_hours)
    score += capacityScore * 0.3

    // Factor 3: Performance history (20% weight)
    const performanceScore = member.quality_score_average / 10 || 0.7
    score += performanceScore * 0.2

    // Factor 4: Workload balance (10% weight)
    const workloadScore = 1 - (member.utilization_percentage / 100)
    score += workloadScore * 0.1

    if (score > bestScore) {
      bestScore = score
      bestAssignee = member
    }
  }

  return bestScore > 0.5 ? bestAssignee : null // Minimum threshold for assignment
}

function calculateSkillMatch(requiredSkills: string[], memberSkills: string[]) {
  if (!requiredSkills?.length) return 0.8 // Neutral score if no specific skills required
  if (!memberSkills?.length) return 0.3 // Low score if member has no defined skills

  const matchCount = requiredSkills.filter(skill => memberSkills.includes(skill)).length
  return matchCount / requiredSkills.length
}

function calculateCapacityScore(member: any, taskHours: number) {
  const remainingCapacity = member.max_weekly_hours - member.current_weekly_hours
  if (remainingCapacity < taskHours) return 0 // No capacity
  
  const utilizationAfterTask = (member.current_weekly_hours + taskHours) / member.max_weekly_hours
  return Math.max(0, 1 - utilizationAfterTask) // Higher score for lower utilization
}

async function updateTeamMemberCapacity(memberId: string, additionalHours: number) {
  const { data: member } = await supabase
    .from('team_capacity')
    .select('current_weekly_hours, current_active_projects')
    .eq('team_member_id', memberId)
    .single()

  if (member) {
    const newHours = member.current_weekly_hours + additionalHours
    const newUtilization = (newHours / 40) * 100 // Assuming 40 hour work week

    await supabase
      .from('team_capacity')
      .update({
        current_weekly_hours: newHours,
        utilization_percentage: Math.min(100, newUtilization),
        last_capacity_update: new Date().toISOString(),
        availability_status: newUtilization > 90 ? 'busy' : newUtilization > 95 ? 'overloaded' : 'available'
      })
      .eq('team_member_id', memberId)
  }
}

async function createTaskAssignmentNotification(task: any, assigneeId: string) {
  // This would integrate with your notification system
  console.log(`📋 Task "${task.task_title}" auto-assigned to team member ${assigneeId}`)
  
  // Could send email, Slack message, or in-app notification here
  // Implementation depends on your notification preferences
}

async function handleTaskStatusChange(task: any, newStatus: string, userId: string) {
  // Automated actions based on status changes
  
  if (newStatus === 'completed') {
    // Update project progress
    await updateProjectProgress(task.project_id)
    
    // Check if this triggers next phase
    await checkPhaseCompletion(task.project_id, task.phase_name)
    
    // Update team member capacity (reduce hours)
    if (task.assigned_to) {
      await updateTeamMemberCapacity(task.assigned_to, -task.estimated_hours)
    }
    
    // Auto-assign dependent tasks
    await autoAssignDependentTasks(task.id)
  }
  
  if (newStatus === 'blocked' || (task.planned_end_date < new Date().toISOString().split('T')[0] && newStatus !== 'completed')) {
    // Create escalation for overdue or blocked tasks
    await createTaskEscalation(task, userId)
  }
}

async function updateProjectProgress(projectId: string) {
  // Calculate overall project completion percentage
  const { data: tasks } = await supabase
    .from('project_tasks')
    .select('task_status')
    .eq('project_id', projectId)

  if (tasks?.length) {
    const completedTasks = tasks.filter(t => t.task_status === 'completed').length
    const progressPercentage = Math.round((completedTasks / tasks.length) * 100)

    await supabase
      .from('client_projects')
      .update({ 
        progress_percentage: progressPercentage,
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId)
  }
}

async function checkPhaseCompletion(projectId: string, phaseName: string) {
  if (!phaseName) return

  // Check if all tasks in this phase are completed
  const { data: phaseTasks } = await supabase
    .from('project_tasks')
    .select('task_status')
    .eq('project_id', projectId)
    .eq('phase_name', phaseName)

  if (phaseTasks?.length) {
    const allCompleted = phaseTasks.every(t => t.task_status === 'completed')
    
    if (allCompleted) {
      // Phase completed - trigger next phase automation
      await triggerNextPhase(projectId, phaseName)
      
      // Send client update about phase completion
      await sendPhaseCompletionNotification(projectId, phaseName)
    }
  }
}

async function triggerNextPhase(projectId: string, completedPhase: string) {
  // Get project template to determine next phase
  const { data: project } = await supabase
    .from('client_projects')
    .select(`
      *,
      delivery_templates(phases_config)
    `)
    .eq('id', projectId)
    .single()

  if (project?.delivery_templates?.phases_config) {
    const phases = project.delivery_templates.phases_config
    const currentPhaseIndex = phases.findIndex((p: any) => p.phase_name === completedPhase)
    
    if (currentPhaseIndex !== -1 && currentPhaseIndex < phases.length - 1) {
      const nextPhase = phases[currentPhaseIndex + 1]
      
      // Update project current phase
      await supabase
        .from('client_projects')
        .update({ current_phase: nextPhase.phase_name })
        .eq('id', projectId)
      
      // Auto-start next phase tasks
      await activateNextPhaseTasks(projectId, nextPhase.phase_name)
    }
  }
}

async function activateNextPhaseTasks(projectId: string, phaseName: string) {
  // Set next phase tasks to 'not_started' and assign them
  const { data: nextPhaseTasks } = await supabase
    .from('project_tasks')
    .select('*')
    .eq('project_id', projectId)
    .eq('phase_name', phaseName)
    .eq('task_status', 'planned')

  for (const task of nextPhaseTasks || []) {
    await supabase
      .from('project_tasks')
      .update({ task_status: 'not_started' })
      .eq('id', task.id)
    
    // Auto-assign if not already assigned
    if (!task.assigned_to) {
      await autoAssignTask(task)
    }
  }
}

async function autoAssignDependentTasks(completedTaskId: string) {
  // Find tasks that depend on the completed task
  const { data: dependentTasks } = await supabase
    .from('project_tasks')
    .select('*')
    .contains('dependent_tasks', [completedTaskId])

  for (const task of dependentTasks || []) {
    // Check if all dependencies are completed
    const allDepsCompleted = await checkAllDependenciesCompleted(task.dependent_tasks)
    
    if (allDepsCompleted) {
      await supabase
        .from('project_tasks')
        .update({ task_status: 'not_started' })
        .eq('id', task.id)
      
      // Auto-assign the now-available task
      if (!task.assigned_to) {
        await autoAssignTask(task)
      }
    }
  }
}

async function checkAllDependenciesCompleted(dependentTaskIds: string[]) {
  if (!dependentTaskIds?.length) return true

  const { data: dependencyTasks } = await supabase
    .from('project_tasks')
    .select('task_status')
    .in('id', dependentTaskIds)

  return dependencyTasks?.every(t => t.task_status === 'completed') || false
}

async function createTaskEscalation(task: any, userId: string) {
  // Create escalation record for overdue/blocked tasks
  console.log(`⚠️ Escalating task: ${task.task_title} - Status: ${task.task_status}`)
  
  // This would create notifications, update project risk levels, etc.
  // Implementation depends on your escalation preferences
}

async function sendPhaseCompletionNotification(projectId: string, phaseName: string) {
  // Send automated client communication about phase completion
  const { data: project } = await supabase
    .from('client_projects')
    .select('client_name, client_email, project_name')
    .eq('id', projectId)
    .single()

  if (project) {
    const communicationData = {
      user_id: project.user_id,
      project_id: projectId,
      communication_type: 'email',
      subject_line: `${project.project_name} - ${phaseName} Phase Completed`,
      message_content: `Great news! We've successfully completed the ${phaseName} phase of your ${project.project_name} project. Moving on to the next phase...`,
      sent_to_emails: [project.client_email],
      is_automated: true,
      automation_trigger: 'phase_completion'
    }

    await supabase
      .from('client_communications')
      .insert(communicationData)
  }
}

// Bulk assignment operations
async function handleBulkTaskAssignment(body: any, userId: string) {
  const { task_ids, assigned_to } = body

  if (!task_ids?.length || !assigned_to) {
    return NextResponse.json({ error: 'Task IDs and assignee required' }, { status: 400 })
  }

  const { data: tasks, error } = await supabase
    .from('project_tasks')
    .update({ 
      assigned_to,
      assignment_method: 'manual_bulk',
      assignment_date: new Date().toISOString()
    })
    .in('id', task_ids)
    .eq('user_id', userId)
    .select()

  if (error) {
    return NextResponse.json({ error: 'Failed to assign tasks' }, { status: 500 })
  }

  return NextResponse.json({ 
    tasks,
    message: `${tasks.length} tasks assigned successfully` 
  })
}

// Auto-assignment for multiple tasks
async function handleAutoAssignment(body: any, userId: string) {
  const { project_id, task_type, skill_requirements } = body

  let query = supabase
    .from('project_tasks')
    .select('*')
    .eq('user_id', userId)
    .is('assigned_to', null)

  if (project_id) query = query.eq('project_id', project_id)
  if (task_type) query = query.eq('task_type', task_type)

  const { data: unassignedTasks } = await query

  const assignments = []
  for (const task of unassignedTasks || []) {
    const assigneeId = await autoAssignTask(task)
    if (assigneeId) {
      assignments.push({ task_id: task.id, assigned_to: assigneeId })
    }
  }

  return NextResponse.json({
    assignments,
    message: `${assignments.length} tasks auto-assigned successfully`
  })
}

// Workload rebalancing
async function handleWorkloadRebalancing(body: any, userId: string) {
  // Get current team utilization
  const { data: teamCapacity } = await supabase
    .from('team_capacity')
    .select('*')
    .eq('user_id', userId)
    .order('utilization_percentage', { ascending: false })

  if (!teamCapacity?.length) {
    return NextResponse.json({ error: 'No team capacity data found' }, { status: 404 })
  }

  // Identify overloaded and underutilized members
  const overloadedMembers = teamCapacity.filter(m => m.utilization_percentage > 90)
  const availableMembers = teamCapacity.filter(m => m.utilization_percentage < 70)

  const rebalancedTasks = []
  
  for (const overloadedMember of overloadedMembers) {
    // Get their non-critical tasks
    const { data: tasks } = await supabase
      .from('project_tasks')
      .select('*')
      .eq('assigned_to', overloadedMember.team_member_id)
      .eq('task_status', 'not_started')
      .neq('priority_level', 'critical')
      .order('priority_level', { ascending: true })

    // Reassign some tasks to available members
    for (const task of tasks?.slice(0, 2) || []) {
      const newAssignee = findOptimalAssignee(task, availableMembers)
      
      if (newAssignee) {
        await supabase
          .from('project_tasks')
          .update({ 
            assigned_to: newAssignee.team_member_id,
            assignment_method: 'rebalanced'
          })
          .eq('id', task.id)

        rebalancedTasks.push({
          task_id: task.id,
          from: overloadedMember.team_member_id,
          to: newAssignee.team_member_id
        })
      }
    }
  }

  return NextResponse.json({
    rebalanced_tasks: rebalancedTasks,
    message: `Rebalanced ${rebalancedTasks.length} tasks`
  })
}

// Task escalation handling
async function handleTaskEscalation(body: any, userId: string) {
  const { task_id, escalation_reason, escalate_to } = body

  const { data: task, error } = await supabase
    .from('project_tasks')
    .update({
      priority_level: 'critical',
      assigned_to: escalate_to || null,
      escalation_reason: escalation_reason
    })
    .eq('id', task_id)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to escalate task' }, { status: 500 })
  }

  return NextResponse.json({
    task,
    message: 'Task escalated successfully'
  })
}

function calculateDaysUntilDue(dueDate: string) {
  const due = new Date(dueDate)
  const today = new Date()
  const diffTime = due.getTime() - today.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

function calculateEstimatedCompletion(task: any) {
  // Simple estimation based on progress and remaining time
  const daysUntilDue = calculateDaysUntilDue(task.planned_end_date)
  const progressFactor = task.progress_percentage / 100 || 0
  
  if (progressFactor > 0) {
    return Math.ceil(daysUntilDue * (1 - progressFactor))
  }
  
  return daysUntilDue
}

function calculateTaskRiskLevel(task: any) {
  const daysUntilDue = calculateDaysUntilDue(task.planned_end_date)
  
  if (daysUntilDue < 0 && task.task_status !== 'completed') return 'critical'
  if (daysUntilDue <= 1 && task.task_status !== 'completed') return 'high'
  if (daysUntilDue <= 3) return 'medium'
  return 'low'
}

function calculateTaskComplexity(taskData: any) {
  let complexity = 5 // Base complexity

  // Adjust based on estimated hours
  if (taskData.estimated_hours > 20) complexity += 3
  else if (taskData.estimated_hours > 10) complexity += 2
  else if (taskData.estimated_hours > 5) complexity += 1

  // Adjust based on skill requirements
  if (taskData.skill_requirements?.length > 2) complexity += 2
  else if (taskData.skill_requirements?.length > 0) complexity += 1

  // Adjust based on dependencies
  if (taskData.dependent_tasks?.length > 2) complexity += 2
  else if (taskData.dependent_tasks?.length > 0) complexity += 1

  return Math.min(10, complexity)
}