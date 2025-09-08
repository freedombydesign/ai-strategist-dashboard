import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const clientId = searchParams.get('clientId')
    
    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let query = supabase
      .from('client_projects')
      .select(`
        *,
        delivery_templates(template_name, service_type, estimated_duration_days)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('project_status', status)
    }
    
    if (clientId) {
      query = query.eq('client_id', clientId)
    }

    const { data: projects, error } = await query

    if (error) {
      console.error('Error fetching projects:', error)
      return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 })
    }

    // Calculate project health scores for all projects
    const projectsWithHealth = await Promise.all(
      projects.map(async (project) => {
        const healthScore = await calculateProjectHealthScore(project.id)
        return { ...project, health_score: healthScore }
      })
    )

    return NextResponse.json({ projects: projectsWithHealth })
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

    // Validate required fields for project creation
    const requiredFields = ['project_name', 'client_name', 'client_email', 'project_value', 'template_id']
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 })
      }
    }

    // Get template details for project setup
    const { data: template, error: templateError } = await supabase
      .from('delivery_templates')
      .select('*')
      .eq('id', body.template_id)
      .eq('user_id', user.id)
      .single()

    if (templateError || !template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    // Generate unique project code
    const projectCode = `${template.service_type.toUpperCase()}-${Date.now().toString().slice(-6)}`

    // Calculate project timeline based on template
    const plannedStartDate = new Date(body.planned_start_date || new Date())
    const plannedEndDate = new Date(plannedStartDate)
    plannedEndDate.setDate(plannedEndDate.getDate() + template.estimated_duration_days)

    // Create client project with automated onboarding
    const projectData = {
      user_id: user.id,
      template_id: body.template_id,
      project_code: projectCode,
      project_name: body.project_name,
      client_id: body.client_id || null,
      client_name: body.client_name,
      client_email: body.client_email,
      client_company: body.client_company || null,
      client_industry: body.client_industry || null,
      project_description: body.project_description || null,
      project_value: body.project_value,
      currency: body.currency || 'USD',
      pricing_model: body.pricing_model || template.pricing_model,
      planned_start_date: plannedStartDate.toISOString().split('T')[0],
      planned_end_date: plannedEndDate.toISOString().split('T')[0],
      current_phase: template.phases_config?.[0]?.phase_name || 'Planning',
      project_status: 'planning',
      health_score: 85, // Initial health score
      risk_level: 'low',
      project_manager_id: body.project_manager_id || null,
      account_manager_id: body.account_manager_id || null,
      team_lead_id: body.team_lead_id || null,
      assigned_team_ids: body.assigned_team_ids || [],
      client_priority: body.client_priority || 'standard',
      communication_frequency: body.communication_frequency || 'weekly',
      budget_allocated: body.budget_allocated || body.project_value,
      budget_spent: 0,
      revenue_recognized: 0,
      on_time_delivery_probability: 85,
      scope_creep_risk: 30,
      client_engagement_score: 75,
      external_project_urls: body.external_project_urls || {},
      slack_channel_id: body.slack_channel_id || null,
      google_drive_folder_id: body.google_drive_folder_id || null
    }

    const { data: project, error } = await supabase
      .from('client_projects')
      .insert(projectData)
      .select(`
        *,
        delivery_templates(template_name, service_type, phases_config, tasks_template, communication_templates)
      `)
      .single()

    if (error) {
      console.error('Error creating project:', error)
      return NextResponse.json({ error: 'Failed to create project' }, { status: 500 })
    }

    // AUTOMATED ONBOARDING SEQUENCE
    await executeAutomatedOnboarding(project)

    return NextResponse.json({ 
      project,
      message: 'Project created successfully with automated onboarding initiated' 
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Automated onboarding sequence - eliminates founder involvement
async function executeAutomatedOnboarding(project: any) {
  try {
    console.log(`🚀 Initiating automated onboarding for project: ${project.project_name}`)

    // 1. AUTO-GENERATE PROJECT TASKS from template
    await createProjectTasksFromTemplate(project)

    // 2. AUTO-ASSIGN TASKS based on team capacity and skills
    await autoAssignProjectTasks(project)

    // 3. SEND AUTOMATED WELCOME EMAIL to client
    await sendClientWelcomeSequence(project)

    // 4. CREATE CLIENT PORTAL ACCESS
    await createClientPortalAccess(project)

    // 5. SETUP PROJECT COMMUNICATION CHANNELS
    await setupProjectCommunications(project)

    // 6. SCHEDULE AUTOMATED CHECK-INS
    await scheduleAutomatedCheckIns(project)

    // 7. CREATE INITIAL QUALITY CHECKPOINTS
    await createInitialQualityCheckpoints(project)

    console.log(`✅ Automated onboarding completed for project: ${project.project_name}`)
  } catch (error) {
    console.error('Error in automated onboarding:', error)
    // Continue even if some automation fails - system remains functional
  }
}

async function createProjectTasksFromTemplate(project: any) {
  const template = project.delivery_templates
  const phases = template.phases_config || []
  const taskTemplates = template.tasks_template || []

  const projectTasks = []
  let currentDate = new Date(project.planned_start_date)

  for (const [phaseIndex, phase] of phases.entries()) {
    // Create tasks for this phase based on template
    for (const taskTemplate of taskTemplates) {
      const taskEndDate = new Date(currentDate)
      taskEndDate.setDate(taskEndDate.getDate() + (taskTemplate.estimated_hours / 8)) // Convert hours to days

      const taskData = {
        user_id: project.user_id,
        project_id: project.id,
        task_title: `${phase.phase_name}: ${taskTemplate.task_type}`,
        task_description: phase.description,
        task_type: taskTemplate.task_type,
        planned_start_date: currentDate.toISOString().split('T')[0],
        planned_end_date: taskEndDate.toISOString().split('T')[0],
        estimated_hours: taskTemplate.estimated_hours,
        task_status: phaseIndex === 0 ? 'not_started' : 'not_started',
        priority_level: phaseIndex === 0 ? 'high' : 'medium',
        phase_name: phase.phase_name,
        milestone_marker: phase.key_activities?.includes('milestone') || false,
        billable: true,
        auto_generated: true,
        skill_requirements: taskTemplate.skill_requirements || [],
        visible_to_client: false,
        client_approval_required: phase.deliverables?.length > 0 || false
      }

      projectTasks.push(taskData)
      currentDate = new Date(taskEndDate)
    }
  }

  // Insert all tasks
  if (projectTasks.length > 0) {
    const { error } = await supabase
      .from('project_tasks')
      .insert(projectTasks)

    if (error) {
      console.error('Error creating project tasks:', error)
    } else {
      console.log(`✅ Created ${projectTasks.length} tasks for project ${project.project_name}`)
    }
  }
}

async function autoAssignProjectTasks(project: any) {
  // Get all unassigned tasks for this project
  const { data: tasks, error: tasksError } = await supabase
    .from('project_tasks')
    .select('*')
    .eq('project_id', project.id)
    .is('assigned_to', null)

  if (tasksError || !tasks) return

  // Get team capacity information
  const { data: teamCapacity, error: capacityError } = await supabase
    .from('team_capacity')
    .select('*')
    .eq('user_id', project.user_id)
    .eq('availability_status', 'available')
    .order('current_weekly_hours', { ascending: true })

  if (capacityError || !teamCapacity) return

  // Smart task assignment algorithm
  for (const task of tasks) {
    const bestAssignee = findBestAssignee(task, teamCapacity)
    
    if (bestAssignee) {
      // Assign task
      await supabase
        .from('project_tasks')
        .update({
          assigned_to: bestAssignee.team_member_id,
          assignment_method: 'ai_optimized',
          assignment_date: new Date().toISOString()
        })
        .eq('id', task.id)

      // Update team capacity
      await supabase
        .from('team_capacity')
        .update({
          current_weekly_hours: bestAssignee.current_weekly_hours + (task.estimated_hours || 8),
          current_active_projects: bestAssignee.current_active_projects + (bestAssignee.current_active_projects === 0 ? 1 : 0)
        })
        .eq('team_member_id', bestAssignee.team_member_id)

      console.log(`✅ Auto-assigned task "${task.task_title}" to team member ${bestAssignee.team_member_id}`)
    }
  }
}

function findBestAssignee(task: any, teamCapacity: any[]) {
  // Find team member with:
  // 1. Required skills (if specified)
  // 2. Available capacity
  // 3. Lowest current workload

  for (const member of teamCapacity) {
    // Check if member has required skills
    const hasRequiredSkills = !task.skill_requirements?.length || 
      task.skill_requirements.some((skill: string) => 
        member.skill_specializations?.includes(skill)
      )

    // Check capacity
    const hasCapacity = (member.current_weekly_hours + (task.estimated_hours || 8)) <= member.max_weekly_hours

    if (hasRequiredSkills && hasCapacity) {
      return member
    }
  }

  return null
}

async function sendClientWelcomeSequence(project: any) {
  const template = project.delivery_templates
  const welcomeTemplate = template.communication_templates?.welcome || null

  if (welcomeTemplate) {
    // Create communication record
    const communicationData = {
      user_id: project.user_id,
      project_id: project.id,
      communication_type: 'email',
      subject_line: `Welcome to ${project.project_name} - Your Project is Starting!`,
      message_content: generateWelcomeMessage(project, welcomeTemplate),
      sent_to_emails: [project.client_email],
      is_automated: true,
      automation_trigger: 'project_created',
      response_required: false,
      tone: 'professional',
      urgency_level: 'normal',
      client_satisfaction_impact: 2
    }

    await supabase
      .from('client_communications')
      .insert(communicationData)

    console.log(`✅ Scheduled welcome email for ${project.client_name}`)
  }
}

function generateWelcomeMessage(project: any, template: any) {
  return `
Dear ${project.client_name},

Welcome to ${project.project_name}! We're excited to begin this journey with you.

📋 Project Overview:
• Service Type: ${project.delivery_templates?.service_type || 'Consulting'}
• Expected Duration: ${project.delivery_templates?.estimated_duration_days || 60} days
• Project Value: ${new Intl.NumberFormat('en-US', { style: 'currency', currency: project.currency }).format(project.project_value)}
• Estimated Completion: ${new Date(project.planned_end_date).toLocaleDateString()}

🎯 What's Next:
1. Your dedicated project team has been assigned
2. Initial project tasks are being scheduled
3. You'll receive your secure client portal access within 24 hours
4. Regular progress updates will be sent ${project.communication_frequency}

Your Project Manager will reach out within the next business day to schedule your project kickoff call.

We're committed to delivering exceptional results on time and within budget.

Best regards,
The ${project.delivery_templates?.template_name || 'Project'} Team

---
This is an automated message. For immediate assistance, please reply to this email.
  `
}

async function createClientPortalAccess(project: any) {
  // Generate secure access token
  const accessToken = generateSecureToken()
  
  const portalAccessData = {
    user_id: project.user_id,
    project_id: project.id,
    client_email: project.client_email,
    access_token: accessToken,
    access_level: 'standard',
    allowed_features: ['view_progress', 'download_files', 'submit_feedback'],
    portal_branding: {},
    dashboard_layout: 'standard',
    is_active: true
  }

  const { error } = await supabase
    .from('client_portal_access')
    .insert(portalAccessData)

  if (!error) {
    console.log(`✅ Created client portal access for ${project.client_name}`)
  }
}

async function setupProjectCommunications(project: any) {
  // Set up automated communication schedule based on project timeline
  const communicationSchedule = generateCommunicationSchedule(project)
  
  for (const comm of communicationSchedule) {
    await supabase
      .from('client_communications')
      .insert({
        ...comm,
        user_id: project.user_id,
        project_id: project.id
      })
  }
  
  console.log(`✅ Scheduled ${communicationSchedule.length} automated communications`)
}

function generateCommunicationSchedule(project: any) {
  const schedule = []
  const startDate = new Date(project.planned_start_date)
  const frequency = project.communication_frequency === 'weekly' ? 7 : 14

  // Generate progress update schedule
  for (let i = frequency; i < project.delivery_templates?.estimated_duration_days; i += frequency) {
    const scheduledDate = new Date(startDate)
    scheduledDate.setDate(scheduledDate.getDate() + i)

    schedule.push({
      communication_type: 'email',
      subject_line: `${project.project_name} - Progress Update`,
      scheduled_send_time: scheduledDate.toISOString(),
      is_automated: true,
      automation_trigger: 'scheduled_update',
      tone: 'professional',
      urgency_level: 'normal'
    })
  }

  return schedule
}

async function scheduleAutomatedCheckIns(project: any) {
  // Create automated quality and progress checkpoints
  const template = project.delivery_templates
  const phases = template.phases_config || []

  for (const phase of phases) {
    const checkpointData = {
      user_id: project.user_id,
      project_id: project.id,
      checkpoint_name: `${phase.phase_name} - Quality Gate`,
      checkpoint_type: 'phase_gate',
      phase_name: phase.phase_name,
      review_criteria: phase.deliverables || [],
      quality_standards: { minimum_score: 8, client_approval_required: true },
      review_deadline: calculatePhaseEndDate(project, phase),
      checkpoint_status: 'pending'
    }

    await supabase
      .from('quality_checkpoints')
      .insert(checkpointData)
  }

  console.log(`✅ Created ${phases.length} automated quality checkpoints`)
}

async function createInitialQualityCheckpoints(project: any) {
  const template = project.delivery_templates
  const qualityGates = template.quality_gates || []

  for (const gate of qualityGates) {
    await supabase
      .from('quality_checkpoints')
      .insert({
        user_id: project.user_id,
        project_id: project.id,
        checkpoint_name: gate.gate_name,
        checkpoint_type: 'quality_audit',
        phase_name: gate.phase,
        review_criteria: gate.criteria,
        checkpoint_status: 'pending'
      })
  }
}

function calculatePhaseEndDate(project: any, phase: any) {
  const startDate = new Date(project.planned_start_date)
  startDate.setDate(startDate.getDate() + (phase.duration_days || 14))
  return startDate.toISOString().split('T')[0]
}

function generateSecureToken() {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('')
}

async function calculateProjectHealthScore(projectId: string) {
  // Basic health score calculation - can be enhanced with more sophisticated metrics
  try {
    const { data: tasks } = await supabase
      .from('project_tasks')
      .select('task_status, planned_end_date')
      .eq('project_id', projectId)

    if (!tasks || tasks.length === 0) return 85

    const completedTasks = tasks.filter(t => t.task_status === 'completed').length
    const overdueTasks = tasks.filter(t => 
      t.task_status !== 'completed' && new Date(t.planned_end_date) < new Date()
    ).length

    let healthScore = 85
    healthScore += (completedTasks / tasks.length) * 10
    healthScore -= (overdueTasks / tasks.length) * 20

    return Math.max(0, Math.min(100, Math.round(healthScore)))
  } catch (error) {
    return 85 // Default score if calculation fails
  }
}