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
    const status = searchParams.get('status')
    const reviewerId = searchParams.get('reviewerId')
    
    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let query = supabase
      .from('quality_checkpoints')
      .select(`
        *,
        client_projects(project_name, client_name, project_status),
        project_deliverables(deliverable_name, deliverable_type, deliverable_status)
      `)
      .eq('user_id', user.id)
      .order('review_deadline', { ascending: true })

    if (projectId) query = query.eq('project_id', projectId)
    if (status) query = query.eq('checkpoint_status', status)
    if (reviewerId) query = query.eq('assigned_reviewer', reviewerId)

    const { data: checkpoints, error } = await query

    if (error) {
      console.error('Error fetching quality checkpoints:', error)
      return NextResponse.json({ error: 'Failed to fetch checkpoints' }, { status: 500 })
    }

    // Enrich checkpoints with risk assessment
    const enrichedCheckpoints = checkpoints.map(checkpoint => ({
      ...checkpoint,
      risk_level: calculateCheckpointRisk(checkpoint),
      days_until_deadline: calculateDaysUntilDeadline(checkpoint.review_deadline),
      completion_urgency: calculateCompletionUrgency(checkpoint)
    }))

    return NextResponse.json({ checkpoints: enrichedCheckpoints })
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
    const requiredFields = ['project_id', 'checkpoint_name', 'checkpoint_type', 'review_deadline']
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 })
      }
    }

    const checkpointData = {
      user_id: user.id,
      project_id: body.project_id,
      deliverable_id: body.deliverable_id || null,
      checkpoint_name: body.checkpoint_name,
      checkpoint_type: body.checkpoint_type,
      phase_name: body.phase_name || null,
      review_criteria: body.review_criteria || [],
      quality_standards: body.quality_standards || {
        minimum_score: 8,
        client_approval_required: false,
        compliance_requirements: [],
        brand_standards: true
      },
      assigned_reviewer: body.assigned_reviewer || null,
      backup_reviewer: body.backup_reviewer || null,
      review_deadline: body.review_deadline,
      checkpoint_status: 'pending',
      overall_score: 0,
      individual_scores: {}
    }

    const { data: checkpoint, error } = await supabase
      .from('quality_checkpoints')
      .insert(checkpointData)
      .select(`
        *,
        client_projects(project_name, client_name)
      `)
      .single()

    if (error) {
      console.error('Error creating checkpoint:', error)
      return NextResponse.json({ error: 'Failed to create checkpoint' }, { status: 500 })
    }

    // Auto-assign reviewer if not specified
    if (!body.assigned_reviewer) {
      await autoAssignQualityReviewer(checkpoint)
    }

    // Schedule automated reminders
    await scheduleQualityReminders(checkpoint)

    return NextResponse.json({ 
      checkpoint,
      message: 'Quality checkpoint created successfully' 
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { checkpoint_id, ...updateData } = body
    
    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!checkpoint_id) {
      return NextResponse.json({ error: 'Checkpoint ID required' }, { status: 400 })
    }

    // Get current checkpoint
    const { data: currentCheckpoint, error: fetchError } = await supabase
      .from('quality_checkpoints')
      .select('*')
      .eq('id', checkpoint_id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !currentCheckpoint) {
      return NextResponse.json({ error: 'Checkpoint not found' }, { status: 404 })
    }

    // Handle status change automation
    if (updateData.checkpoint_status && updateData.checkpoint_status !== currentCheckpoint.checkpoint_status) {
      await handleQualityStatusChange(currentCheckpoint, updateData.checkpoint_status, updateData)
    }

    // Update checkpoint
    const { data: checkpoint, error } = await supabase
      .from('quality_checkpoints')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
        ...(updateData.checkpoint_status === 'passed' && {
          approved: true,
          approved_by: user.id,
          approved_at: new Date().toISOString()
        }),
        ...(updateData.checkpoint_status === 'in_progress' && !currentCheckpoint.review_started_at && {
          review_started_at: new Date().toISOString()
        }),
        ...(updateData.checkpoint_status === 'passed' || updateData.checkpoint_status === 'failed' && {
          review_completed_at: new Date().toISOString()
        })
      })
      .eq('id', checkpoint_id)
      .eq('user_id', user.id)
      .select(`
        *,
        client_projects(project_name, client_name, client_email)
      `)
      .single()

    if (error) {
      console.error('Error updating checkpoint:', error)
      return NextResponse.json({ error: 'Failed to update checkpoint' }, { status: 500 })
    }

    return NextResponse.json({ 
      checkpoint,
      message: 'Quality checkpoint updated successfully' 
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Quality Review Actions - Automated quality assurance workflow
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
      case 'bulk_review':
        return await handleBulkQualityReview(body, user.id)
      
      case 'auto_assign_reviewers':
        return await handleAutoAssignReviewers(body, user.id)
      
      case 'escalate_failed':
        return await handleFailedCheckpointEscalation(body, user.id)
      
      case 'generate_report':
        return await handleQualityReportGeneration(body, user.id)
        
      case 'batch_approve':
        return await handleBatchApproval(body, user.id)
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// AUTO-ASSIGN QUALITY REVIEWERS - Eliminates founder involvement in review assignment
async function autoAssignQualityReviewer(checkpoint: any) {
  try {
    // Get available reviewers based on workload and expertise
    const { data: teamCapacity, error } = await supabase
      .from('team_capacity')
      .select('*')
      .eq('user_id', checkpoint.user_id)
      .lte('utilization_percentage', 85) // Only assign to non-overloaded team members
      .order('current_weekly_hours', { ascending: true })

    if (error || !teamCapacity?.length) return

    // Find best reviewer based on specializations and availability
    const bestReviewer = findOptimalReviewer(checkpoint, teamCapacity)
    
    if (bestReviewer) {
      await supabase
        .from('quality_checkpoints')
        .update({
          assigned_reviewer: bestReviewer.team_member_id,
          backup_reviewer: findBackupReviewer(checkpoint, teamCapacity, bestReviewer.team_member_id)
        })
        .eq('id', checkpoint.id)

      // Create review notification
      await createReviewNotification(checkpoint, bestReviewer.team_member_id)
      
      console.log(`✅ Auto-assigned quality reviewer for checkpoint: ${checkpoint.checkpoint_name}`)
    }
  } catch (error) {
    console.error('Error in auto-assignment:', error)
  }
}

function findOptimalReviewer(checkpoint: any, teamCapacity: any[]) {
  // Prioritize reviewers based on:
  // 1. Relevant specializations (quality, the checkpoint type)
  // 2. Current workload (prefer less busy members)
  // 3. Quality score history (prefer high performers)
  
  let bestReviewer = null
  let bestScore = 0

  for (const member of teamCapacity) {
    let score = 0

    // Factor 1: Specialization match (50% weight)
    const hasQualitySkills = member.skill_specializations?.includes('quality_assurance') || 
                            member.skill_specializations?.includes('review')
    if (hasQualitySkills) score += 0.5

    // Factor 2: Checkpoint type expertise (30% weight)
    const hasTypeExpertise = checkpoint.checkpoint_type === 'deliverable_review' && 
                            member.skill_specializations?.includes(checkpoint.deliverable_type)
    if (hasTypeExpertise) score += 0.3

    // Factor 3: Availability (20% weight)
    const availabilityScore = (100 - member.utilization_percentage) / 100
    score += availabilityScore * 0.2

    if (score > bestScore && score > 0.6) { // Minimum threshold
      bestScore = score
      bestReviewer = member
    }
  }

  return bestReviewer
}

function findBackupReviewer(checkpoint: any, teamCapacity: any[], primaryReviewerId: string) {
  const availableBackups = teamCapacity.filter(m => 
    m.team_member_id !== primaryReviewerId && 
    m.utilization_percentage < 90
  )
  
  return availableBackups.length > 0 ? availableBackups[0].team_member_id : null
}

async function createReviewNotification(checkpoint: any, reviewerId: string) {
  // This would integrate with your notification system (email, Slack, etc.)
  console.log(`📋 Quality review assigned: "${checkpoint.checkpoint_name}" to reviewer ${reviewerId}`)
  
  // Could send email/Slack notification here
  // Implementation depends on your notification preferences
}

async function scheduleQualityReminders(checkpoint: any) {
  // Schedule automated reminders before deadline
  const deadline = new Date(checkpoint.review_deadline)
  const reminderDates = [
    new Date(deadline.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days before
    new Date(deadline.getTime() - 1 * 24 * 60 * 60 * 1000)  // 1 day before
  ]

  for (const reminderDate of reminderDates) {
    if (reminderDate > new Date()) {
      // Schedule reminder - in a real system, you'd use a job queue or cron job
      console.log(`📅 Reminder scheduled for ${reminderDate.toISOString()}: ${checkpoint.checkpoint_name}`)
    }
  }
}

// AUTOMATED QUALITY STATUS CHANGES - Maintains quality without founder oversight
async function handleQualityStatusChange(checkpoint: any, newStatus: string, updateData: any) {
  switch (newStatus) {
    case 'passed':
      await handleCheckpointPassed(checkpoint, updateData)
      break
    
    case 'failed':
      await handleCheckpointFailed(checkpoint, updateData)
      break
    
    case 'conditional_pass':
      await handleConditionalPass(checkpoint, updateData)
      break
  }
}

async function handleCheckpointPassed(checkpoint: any, updateData: any) {
  // Update project progress
  await updateProjectQualityScore(checkpoint.project_id, updateData.overall_score || 8)
  
  // If this was a phase gate, trigger next phase
  if (checkpoint.checkpoint_type === 'phase_gate') {
    await triggerNextPhaseFromQuality(checkpoint.project_id, checkpoint.phase_name)
  }
  
  // Send client notification if major milestone
  if (checkpoint.checkpoint_type === 'client_approval' || checkpoint.milestone_marker) {
    await sendQualityPassNotification(checkpoint)
  }
  
  // Auto-approve deliverable if applicable
  if (checkpoint.deliverable_id) {
    await supabase
      .from('project_deliverables')
      .update({ 
        internal_approved: true,
        internal_approved_by: checkpoint.assigned_reviewer,
        internal_approved_at: new Date().toISOString(),
        quality_checked: true,
        quality_score: updateData.overall_score || 8
      })
      .eq('id', checkpoint.deliverable_id)
  }
}

async function handleCheckpointFailed(checkpoint: any, updateData: any) {
  // Create corrective action tasks
  await createCorrectiveActionTasks(checkpoint, updateData.issues_found || [])
  
  // Update project risk level
  await updateProjectRiskLevel(checkpoint.project_id, 'high')
  
  // Escalate to project manager or founder if critical
  if (checkpoint.checkpoint_type === 'phase_gate' || checkpoint.critical) {
    await escalateFailedCheckpoint(checkpoint, updateData)
  }
  
  // Block deliverable progression if applicable
  if (checkpoint.deliverable_id) {
    await supabase
      .from('project_deliverables')
      .update({ 
        deliverable_status: 'revision_requested',
        quality_checked: true,
        quality_score: updateData.overall_score || 3
      })
      .eq('id', checkpoint.deliverable_id)
  }
}

async function handleConditionalPass(checkpoint: any, updateData: any) {
  // Create minor improvement tasks
  await createImprovementTasks(checkpoint, updateData.recommendations || [])
  
  // Allow progression but flag for monitoring
  await flagForMonitoring(checkpoint.project_id, `Conditional pass: ${checkpoint.checkpoint_name}`)
  
  // Send improvement notification
  await sendImprovementNotification(checkpoint, updateData.recommendations)
}

async function createCorrectiveActionTasks(checkpoint: any, issues: string[]) {
  const tasks = issues.map(issue => ({
    user_id: checkpoint.user_id,
    project_id: checkpoint.project_id,
    task_title: `Quality Issue: ${issue}`,
    task_description: `Address quality issue identified in ${checkpoint.checkpoint_name}`,
    task_type: 'quality_correction',
    priority_level: 'high',
    planned_end_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 days
    estimated_hours: 4,
    task_status: 'not_started',
    auto_generated: true,
    quality_related: true
  }))

  if (tasks.length > 0) {
    await supabase
      .from('project_tasks')
      .insert(tasks)
    
    console.log(`⚠️ Created ${tasks.length} corrective action tasks for failed checkpoint`)
  }
}

async function createImprovementTasks(checkpoint: any, recommendations: string[]) {
  const tasks = recommendations.map(recommendation => ({
    user_id: checkpoint.user_id,
    project_id: checkpoint.project_id,
    task_title: `Quality Improvement: ${recommendation}`,
    task_description: `Implement improvement suggested in ${checkpoint.checkpoint_name}`,
    task_type: 'quality_improvement',
    priority_level: 'medium',
    planned_end_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 5 days
    estimated_hours: 2,
    task_status: 'not_started',
    auto_generated: true,
    quality_related: true
  }))

  if (tasks.length > 0) {
    await supabase
      .from('project_tasks')
      .insert(tasks)
  }
}

async function updateProjectQualityScore(projectId: string, checkpointScore: number) {
  // Get all quality checkpoints for this project
  const { data: checkpoints } = await supabase
    .from('quality_checkpoints')
    .select('overall_score')
    .eq('project_id', projectId)
    .eq('checkpoint_status', 'passed')

  if (checkpoints?.length) {
    const averageQuality = checkpoints.reduce((sum, cp) => sum + cp.overall_score, checkpointScore) / (checkpoints.length + 1)
    
    await supabase
      .from('client_projects')
      .update({ 
        quality_score: Math.round(averageQuality * 10) / 10, // Round to 1 decimal
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId)
  }
}

async function updateProjectRiskLevel(projectId: string, riskLevel: string) {
  await supabase
    .from('client_projects')
    .update({ 
      risk_level: riskLevel,
      updated_at: new Date().toISOString()
    })
    .eq('id', projectId)
}

async function escalateFailedCheckpoint(checkpoint: any, updateData: any) {
  console.log(`🚨 ESCALATION: Failed checkpoint "${checkpoint.checkpoint_name}" - Issues: ${updateData.issues_found?.join(', ')}`)
  
  // This would trigger notifications to project managers/founders
  // Implementation depends on your escalation preferences
}

async function sendQualityPassNotification(checkpoint: any) {
  // Get project details for client communication
  const { data: project } = await supabase
    .from('client_projects')
    .select('client_name, client_email, project_name')
    .eq('id', checkpoint.project_id)
    .single()

  if (project && checkpoint.checkpoint_type === 'client_approval') {
    const communicationData = {
      user_id: checkpoint.user_id,
      project_id: checkpoint.project_id,
      communication_type: 'email',
      subject_line: `${project.project_name} - Quality Milestone Completed`,
      message_content: `Great news! We've successfully completed the quality review for ${checkpoint.checkpoint_name}. Your project continues to meet our high standards.`,
      sent_to_emails: [project.client_email],
      is_automated: true,
      automation_trigger: 'quality_passed',
      client_satisfaction_impact: 1
    }

    await supabase
      .from('client_communications')
      .insert(communicationData)
  }
}

async function triggerNextPhaseFromQuality(projectId: string, currentPhase: string) {
  // Check if this was the last quality gate for the phase
  const { data: remainingGates } = await supabase
    .from('quality_checkpoints')
    .select('id')
    .eq('project_id', projectId)
    .eq('phase_name', currentPhase)
    .neq('checkpoint_status', 'passed')

  if (!remainingGates?.length) {
    // All quality gates passed - trigger next phase
    console.log(`✅ All quality gates passed for phase: ${currentPhase}`)
    // This would integrate with your phase management system
  }
}

// Bulk operations for quality management
async function handleBulkQualityReview(body: any, userId: string) {
  const { checkpoint_ids, action, review_data } = body

  if (!checkpoint_ids?.length) {
    return NextResponse.json({ error: 'Checkpoint IDs required' }, { status: 400 })
  }

  let updateData = {}
  switch (action) {
    case 'approve_all':
      updateData = {
        checkpoint_status: 'passed',
        overall_score: review_data.default_score || 8,
        approved: true,
        approved_by: userId,
        approved_at: new Date().toISOString()
      }
      break
    
    case 'assign_reviewer':
      updateData = {
        assigned_reviewer: review_data.reviewer_id
      }
      break
  }

  const { data: checkpoints, error } = await supabase
    .from('quality_checkpoints')
    .update(updateData)
    .in('id', checkpoint_ids)
    .eq('user_id', userId)
    .select()

  if (error) {
    return NextResponse.json({ error: 'Failed to update checkpoints' }, { status: 500 })
  }

  return NextResponse.json({
    checkpoints,
    message: `${checkpoints.length} checkpoints updated successfully`
  })
}

async function handleAutoAssignReviewers(body: any, userId: string) {
  const { project_id, checkpoint_type } = body

  let query = supabase
    .from('quality_checkpoints')
    .select('*')
    .eq('user_id', userId)
    .is('assigned_reviewer', null)

  if (project_id) query = query.eq('project_id', project_id)
  if (checkpoint_type) query = query.eq('checkpoint_type', checkpoint_type)

  const { data: unassignedCheckpoints } = await query
  const assignments = []

  for (const checkpoint of unassignedCheckpoints || []) {
    await autoAssignQualityReviewer(checkpoint)
    assignments.push(checkpoint.id)
  }

  return NextResponse.json({
    assigned_checkpoints: assignments,
    message: `${assignments.length} checkpoints auto-assigned`
  })
}

function calculateCheckpointRisk(checkpoint: any) {
  const daysUntilDeadline = calculateDaysUntilDeadline(checkpoint.review_deadline)
  
  if (daysUntilDeadline < 0 && checkpoint.checkpoint_status !== 'passed') return 'critical'
  if (daysUntilDeadline <= 1 && checkpoint.checkpoint_status === 'pending') return 'high'
  if (daysUntilDeadline <= 3) return 'medium'
  return 'low'
}

function calculateDaysUntilDeadline(deadline: string) {
  const due = new Date(deadline)
  const today = new Date()
  const diffTime = due.getTime() - today.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

function calculateCompletionUrgency(checkpoint: any) {
  const daysUntil = calculateDaysUntilDeadline(checkpoint.review_deadline)
  
  if (daysUntil < 0) return 'overdue'
  if (daysUntil <= 1) return 'urgent'
  if (daysUntil <= 3) return 'high'
  if (daysUntil <= 7) return 'medium'
  return 'low'
}

async function handleFailedCheckpointEscalation(body: any, userId: string) {
  const { checkpoint_id } = body
  
  const { data: checkpoint } = await supabase
    .from('quality_checkpoints')
    .select('*, client_projects(project_name, client_name)')
    .eq('id', checkpoint_id)
    .single()
    
  if (checkpoint) {
    console.log(`🚨 Escalating failed checkpoint: ${checkpoint.checkpoint_name}`)
    // Implementation for escalation notifications
  }
  
  return NextResponse.json({ message: 'Checkpoint escalated' })
}

async function handleQualityReportGeneration(body: any, userId: string) {
  const { project_id, date_range } = body
  
  // Generate quality report data
  const reportData = {
    project_id,
    generated_at: new Date().toISOString(),
    quality_score: 'Generated report data would go here'
  }
  
  return NextResponse.json({ 
    report: reportData,
    message: 'Quality report generated' 
  })
}

async function handleBatchApproval(body: any, userId: string) {
  const { checkpoint_ids } = body
  
  const { data: checkpoints } = await supabase
    .from('quality_checkpoints')
    .update({
      checkpoint_status: 'passed',
      approved: true,
      approved_by: userId,
      approved_at: new Date().toISOString()
    })
    .in('id', checkpoint_ids)
    .select()
  
  return NextResponse.json({
    checkpoints,
    message: `${checkpoints?.length || 0} checkpoints approved`
  })
}