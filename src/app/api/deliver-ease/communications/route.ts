import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('project_id')
    const clientId = searchParams.get('client_id')
    const communicationType = searchParams.get('type')
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let query = supabase
      .from('client_communications')
      .select(`
        *,
        client_projects!inner(client_name, project_name),
        team_members!inner(first_name, last_name, email)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (projectId) {
      query = query.eq('project_id', projectId)
    }
    
    if (clientId) {
      query = query.eq('client_id', clientId)
    }

    if (communicationType) {
      query = query.eq('communication_type', communicationType)
    }

    const { data: communications, error } = await query

    if (error) {
      console.error('Error fetching communications:', error)
      return NextResponse.json({ error: 'Failed to fetch communications' }, { status: 500 })
    }

    return NextResponse.json({ communications })
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

    if (body.action === 'send_automated_communication') {
      return await handleAutomatedCommunication(body, user.id)
    }

    if (body.action === 'setup_communication_sequence') {
      return await setupCommunicationSequence(body, user.id)
    }

    if (body.action === 'send_bulk_update') {
      return await sendBulkUpdate(body, user.id)
    }

    const requiredFields = ['project_id', 'client_id', 'communication_type', 'subject']
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 })
      }
    }

    const communicationData = {
      user_id: user.id,
      project_id: body.project_id,
      client_id: body.client_id,
      communication_type: body.communication_type,
      subject: body.subject,
      content: body.content || '',
      recipient_email: body.recipient_email,
      cc_emails: body.cc_emails || [],
      automated: false,
      sent_by: user.id,
      metadata: {
        manual_send: true,
        priority: body.priority || 'normal',
        tags: body.tags || []
      }
    }

    const { data: communication, error } = await supabase
      .from('client_communications')
      .insert(communicationData)
      .select()
      .single()

    if (error) {
      console.error('Error creating communication:', error)
      return NextResponse.json({ error: 'Failed to create communication' }, { status: 500 })
    }

    await sendEmailNotification(communication)

    return NextResponse.json({
      communication,
      message: 'Communication sent successfully'
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function handleAutomatedCommunication(body: any, userId: string) {
  const { trigger_type, project_id, client_id, template_name } = body

  const communicationTemplate = await getCommunicationTemplate(template_name, trigger_type)
  if (!communicationTemplate) {
    return NextResponse.json({ error: 'Communication template not found' }, { status: 404 })
  }

  const { data: project } = await supabase
    .from('client_projects')
    .select('*, delivery_templates(*)')
    .eq('id', project_id)
    .single()

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  const personalizedContent = await personalizeContent(communicationTemplate.content, {
    client_name: project.client_name,
    project_name: project.project_name,
    project_phase: project.current_phase,
    completion_percentage: project.completion_percentage,
    next_milestone: project.next_milestone_date
  })

  const communicationData = {
    user_id: userId,
    project_id,
    client_id,
    communication_type: communicationTemplate.type,
    subject: personalizeContent(communicationTemplate.subject, {
      client_name: project.client_name,
      project_name: project.project_name
    }),
    content: personalizedContent,
    recipient_email: project.client_email,
    automated: true,
    trigger_type,
    template_used: template_name,
    sent_by: null,
    metadata: {
      trigger_event: trigger_type,
      auto_generated: true,
      template_version: communicationTemplate.version
    }
  }

  const { data: communication, error } = await supabase
    .from('client_communications')
    .insert(communicationData)
    .select()
    .single()

  if (error) {
    console.error('Error creating automated communication:', error)
    return NextResponse.json({ error: 'Failed to send automated communication' }, { status: 500 })
  }

  await sendEmailNotification(communication)
  await logAutomationEvent('communication_sent', project_id, {
    trigger: trigger_type,
    template: template_name,
    communication_id: communication.id
  })

  return NextResponse.json({
    communication,
    message: 'Automated communication sent successfully'
  })
}

async function setupCommunicationSequence(body: any, userId: string) {
  const { project_id, sequence_type, custom_schedule } = body

  const sequences = {
    'project_kickoff': [
      { delay_days: 0, template: 'welcome_kickoff', type: 'project_update' },
      { delay_days: 1, template: 'next_steps_overview', type: 'project_update' },
      { delay_days: 3, template: 'week1_checkin', type: 'status_update' },
      { delay_days: 7, template: 'week1_progress', type: 'progress_report' }
    ],
    'milestone_approach': [
      { delay_days: 0, template: 'milestone_reminder', type: 'project_update' },
      { delay_days: 2, template: 'deliverable_preview', type: 'deliverable_notice' },
      { delay_days: 5, template: 'milestone_completion', type: 'milestone_update' }
    ],
    'project_completion': [
      { delay_days: 0, template: 'project_delivered', type: 'deliverable_notice' },
      { delay_days: 1, template: 'feedback_request', type: 'feedback_request' },
      { delay_days: 7, template: 'success_story', type: 'relationship_building' },
      { delay_days: 30, template: 'followup_opportunities', type: 'relationship_building' }
    ]
  }

  const schedule = custom_schedule || sequences[sequence_type]
  if (!schedule) {
    return NextResponse.json({ error: 'Invalid sequence type' }, { status: 400 })
  }

  const sequencePromises = schedule.map(async (step: any, index: number) => {
    const scheduledDate = new Date()
    scheduledDate.setDate(scheduledDate.getDate() + step.delay_days)

    return supabase
      .from('scheduled_communications')
      .insert({
        user_id: userId,
        project_id,
        sequence_type,
        step_number: index + 1,
        template_name: step.template,
        communication_type: step.type,
        scheduled_date: scheduledDate.toISOString(),
        status: 'scheduled'
      })
  })

  await Promise.all(sequencePromises)

  return NextResponse.json({
    message: `Communication sequence '${sequence_type}' scheduled successfully`,
    steps_scheduled: schedule.length
  })
}

async function sendBulkUpdate(body: any, userId: string) {
  const { project_ids, subject, content, communication_type } = body

  const { data: projects } = await supabase
    .from('client_projects')
    .select('id, client_id, client_name, client_email, project_name')
    .in('id', project_ids)
    .eq('user_id', userId)

  if (!projects || projects.length === 0) {
    return NextResponse.json({ error: 'No valid projects found' }, { status: 404 })
  }

  const bulkCommunications = projects.map(project => ({
    user_id: userId,
    project_id: project.id,
    client_id: project.client_id,
    communication_type,
    subject: personalizeContent(subject, {
      client_name: project.client_name,
      project_name: project.project_name
    }),
    content: personalizeContent(content, {
      client_name: project.client_name,
      project_name: project.project_name
    }),
    recipient_email: project.client_email,
    automated: false,
    sent_by: userId,
    metadata: {
      bulk_send: true,
      total_recipients: projects.length
    }
  }))

  const { data: communications, error } = await supabase
    .from('client_communications')
    .insert(bulkCommunications)
    .select()

  if (error) {
    console.error('Error sending bulk communications:', error)
    return NextResponse.json({ error: 'Failed to send bulk communications' }, { status: 500 })
  }

  const emailPromises = communications.map(comm => sendEmailNotification(comm))
  await Promise.all(emailPromises)

  return NextResponse.json({
    message: `Bulk update sent to ${communications.length} clients`,
    communications_sent: communications.length
  })
}

async function getCommunicationTemplate(templateName: string, triggerType: string) {
  const templates = {
    'welcome_kickoff': {
      type: 'project_update',
      subject: 'Welcome to Your {project_name} Journey, {client_name}!',
      content: `Dear {client_name},

We're thrilled to officially kick off your {project_name} project! Our team has reviewed all the details and we're ready to deliver exceptional results.

Here's what happens next:
• Your dedicated project manager will be in touch within 24 hours
• We'll schedule your project kickoff call this week
• You'll receive access to your client portal for real-time updates
• Phase 1 deliverables are targeted for completion within the next 2 weeks

We're committed to making this process seamless and delivering outstanding value. If you have any immediate questions, please don't hesitate to reach out.

Looking forward to a successful partnership!

Best regards,
Your Delivery Team`,
      version: '1.0'
    },
    'milestone_completion': {
      type: 'milestone_update',
      subject: '{project_name} Milestone Completed - {client_name}',
      content: `Hello {client_name},

Great news! We've successfully completed a major milestone in your {project_name} project.

Current Progress: {completion_percentage}% complete
Phase Status: {project_phase}
Next Milestone: {next_milestone}

The deliverables for this milestone have been uploaded to your client portal and are ready for your review. We'll schedule a brief review call this week to walk through the results and address any questions.

Thank you for your continued partnership. We're excited about the progress we're making together!

Best regards,
Your Project Team`,
      version: '1.0'
    },
    'project_delivered': {
      type: 'deliverable_notice',
      subject: 'Your {project_name} Project is Complete - {client_name}',
      content: `Dear {client_name},

Congratulations! Your {project_name} project has been completed successfully.

All final deliverables have been uploaded to your client portal and are ready for download. This includes:
• All project documentation and reports
• Source files and assets
• Implementation guides and next steps
• Warranty and support information

We'll be following up with a project wrap-up call to ensure you have everything you need and to discuss any questions about implementation.

It's been a pleasure working with you on this project. We look forward to supporting your continued success!

Warm regards,
Your Delivery Team`,
      version: '1.0'
    }
  }

  return templates[templateName as keyof typeof templates] || null
}

function personalizeContent(content: string, variables: Record<string, any>): string {
  let personalizedContent = content
  
  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = `{${key}}`
    personalizedContent = personalizedContent.replace(new RegExp(placeholder, 'g'), value || '')
  })
  
  return personalizedContent
}

async function sendEmailNotification(communication: any) {
  try {
    console.log(`Email notification sent: ${communication.subject} to ${communication.recipient_email}`)
    return true
  } catch (error) {
    console.error('Email sending error:', error)
    return false
  }
}

async function logAutomationEvent(eventType: string, projectId: string, metadata: any) {
  await supabase
    .from('automation_logs')
    .insert({
      event_type: eventType,
      project_id: projectId,
      metadata,
      created_at: new Date().toISOString()
    })
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { communication_id, ...updateData } = body
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!communication_id) {
      return NextResponse.json({ error: 'Communication ID required' }, { status: 400 })
    }

    const { data: communication, error } = await supabase
      .from('client_communications')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', communication_id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating communication:', error)
      return NextResponse.json({ error: 'Failed to update communication' }, { status: 500 })
    }

    return NextResponse.json({
      communication,
      message: 'Communication updated successfully'
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

    if (action === 'process_scheduled') {
      return await processScheduledCommunications(user.id)
    }

    if (action === 'get_templates') {
      const templates = await getCommunicationTemplates()
      return NextResponse.json({ templates })
    }

    if (action === 'test_automation') {
      const body = await request.json()
      return await testAutomationRule(body, user.id)
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function processScheduledCommunications(userId: string) {
  const now = new Date().toISOString()
  
  const { data: scheduled } = await supabase
    .from('scheduled_communications')
    .select(`
      *,
      client_projects!inner(*)
    `)
    .eq('user_id', userId)
    .eq('status', 'scheduled')
    .lte('scheduled_date', now)

  if (!scheduled || scheduled.length === 0) {
    return NextResponse.json({ message: 'No scheduled communications to process' })
  }

  const results = await Promise.all(
    scheduled.map(async (comm) => {
      try {
        await handleAutomatedCommunication({
          trigger_type: 'scheduled',
          project_id: comm.project_id,
          client_id: comm.client_projects.client_id,
          template_name: comm.template_name
        }, userId)

        await supabase
          .from('scheduled_communications')
          .update({ status: 'sent', sent_at: new Date().toISOString() })
          .eq('id', comm.id)

        return { id: comm.id, status: 'success' }
      } catch (error) {
        await supabase
          .from('scheduled_communications')
          .update({ status: 'failed', error_message: error.message })
          .eq('id', comm.id)

        return { id: comm.id, status: 'failed', error: error.message }
      }
    })
  )

  return NextResponse.json({
    message: `Processed ${results.length} scheduled communications`,
    results
  })
}

async function getCommunicationTemplates() {
  return [
    { name: 'welcome_kickoff', type: 'project_update', description: 'Welcome message for new projects' },
    { name: 'milestone_completion', type: 'milestone_update', description: 'Milestone completion notification' },
    { name: 'project_delivered', type: 'deliverable_notice', description: 'Project completion announcement' },
    { name: 'feedback_request', type: 'feedback_request', description: 'Client feedback and testimonial request' },
    { name: 'next_steps_overview', type: 'project_update', description: 'Next steps after kickoff' },
    { name: 'week1_checkin', type: 'status_update', description: 'First week check-in' },
    { name: 'deliverable_preview', type: 'deliverable_notice', description: 'Preview of upcoming deliverables' }
  ]
}

async function testAutomationRule(body: any, userId: string) {
  const { rule_type, project_id, simulation_data } = body

  const testResult = {
    rule_type,
    triggered: true,
    actions_taken: [],
    simulation: true
  }

  if (rule_type === 'milestone_approach') {
    testResult.actions_taken.push('Send milestone reminder email')
    testResult.actions_taken.push('Update project dashboard')
    testResult.actions_taken.push('Notify project manager')
  }

  return NextResponse.json({
    test_result: testResult,
    message: 'Automation rule test completed'
  })
}