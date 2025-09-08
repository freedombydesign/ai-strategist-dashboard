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
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const includeVersions = searchParams.get('include_versions') === 'true'
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let query = supabase
      .from('project_deliverables')
      .select(`
        *,
        client_projects!inner(client_name, project_name),
        team_members!inner(first_name, last_name, email),
        ${includeVersions ? 'deliverable_versions(*)' : ''}
      `)
      .eq('user_id', user.id)
      .order('due_date', { ascending: true })

    if (projectId) {
      query = query.eq('project_id', projectId)
    }
    
    if (status) {
      query = query.eq('status', status)
    }

    if (type) {
      query = query.eq('deliverable_type', type)
    }

    const { data: deliverables, error } = await query

    if (error) {
      console.error('Error fetching deliverables:', error)
      return NextResponse.json({ error: 'Failed to fetch deliverables' }, { status: 500 })
    }

    return NextResponse.json({ deliverables })
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

    if (body.action === 'create_from_template') {
      return await createDeliverablesFromTemplate(body, user.id)
    }

    if (body.action === 'upload_version') {
      return await uploadDeliverableVersion(body, user.id)
    }

    if (body.action === 'approve_deliverable') {
      return await approveDeliverable(body, user.id)
    }

    if (body.action === 'bulk_update_status') {
      return await bulkUpdateStatus(body, user.id)
    }

    const requiredFields = ['project_id', 'deliverable_name', 'deliverable_type', 'due_date']
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 })
      }
    }

    const deliverableData = {
      user_id: user.id,
      project_id: body.project_id,
      deliverable_name: body.deliverable_name,
      deliverable_type: body.deliverable_type,
      description: body.description || '',
      due_date: body.due_date,
      assigned_to: body.assigned_to || null,
      client_facing: body.client_facing || false,
      approval_required: body.approval_required || false,
      status: 'not_started',
      priority_level: body.priority_level || 'medium',
      estimated_hours: body.estimated_hours || null,
      acceptance_criteria: body.acceptance_criteria || [],
      dependencies: body.dependencies || [],
      file_requirements: body.file_requirements || {},
      client_access_level: body.client_access_level || 'none',
      version_number: '1.0',
      metadata: {
        created_from: body.created_from || 'manual',
        template_used: body.template_used || null,
        custom_fields: body.custom_fields || {}
      }
    }

    const { data: deliverable, error } = await supabase
      .from('project_deliverables')
      .insert(deliverableData)
      .select()
      .single()

    if (error) {
      console.error('Error creating deliverable:', error)
      return NextResponse.json({ error: 'Failed to create deliverable' }, { status: 500 })
    }

    await createInitialVersion(deliverable.id)
    await notifyAssignedTeamMember(deliverable)

    return NextResponse.json({
      deliverable,
      message: 'Deliverable created successfully'
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function createDeliverablesFromTemplate(body: any, userId: string) {
  const { project_id, template_id, phase_name } = body

  const { data: template } = await supabase
    .from('delivery_templates')
    .select('deliverables_config, phases_config')
    .eq('id', template_id)
    .eq('user_id', userId)
    .single()

  if (!template) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 })
  }

  const { data: project } = await supabase
    .from('client_projects')
    .select('*')
    .eq('id', project_id)
    .single()

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  const phaseConfig = template.phases_config.find((p: any) => p.phase_name === phase_name)
  if (!phaseConfig) {
    return NextResponse.json({ error: 'Phase not found in template' }, { status: 404 })
  }

  const projectStartDate = new Date(project.start_date)
  let cumulativeDays = 0

  for (const phase of template.phases_config) {
    if (phase.phase_name === phase_name) break
    cumulativeDays += phase.duration_days || 0
  }

  const deliverablesToCreate = phaseConfig.deliverables.map((deliverable: any, index: number) => {
    const dueDate = new Date(projectStartDate)
    dueDate.setDate(dueDate.getDate() + cumulativeDays + ((phaseConfig.duration_days || 7) * (index + 1) / phaseConfig.deliverables.length))

    return {
      user_id: userId,
      project_id,
      deliverable_name: deliverable.name || deliverable,
      deliverable_type: deliverable.type || 'document',
      description: deliverable.description || `Deliverable for ${phase_name} phase`,
      due_date: dueDate.toISOString(),
      client_facing: deliverable.client_facing || true,
      approval_required: deliverable.approval_required || false,
      status: 'not_started',
      priority_level: deliverable.priority || 'medium',
      acceptance_criteria: deliverable.acceptance_criteria || [],
      file_requirements: deliverable.file_requirements || {},
      client_access_level: deliverable.client_access || 'view',
      version_number: '1.0',
      metadata: {
        created_from: 'template',
        template_used: template_id,
        phase: phase_name,
        template_deliverable_id: deliverable.id || index
      }
    }
  })

  const { data: deliverables, error } = await supabase
    .from('project_deliverables')
    .insert(deliverablesToCreate)
    .select()

  if (error) {
    console.error('Error creating template deliverables:', error)
    return NextResponse.json({ error: 'Failed to create deliverables from template' }, { status: 500 })
  }

  const versionPromises = deliverables.map(d => createInitialVersion(d.id))
  await Promise.all(versionPromises)

  await logDeliverableEvent('template_deliverables_created', project_id, {
    template_id,
    phase: phase_name,
    count: deliverables.length
  })

  return NextResponse.json({
    deliverables,
    message: `${deliverables.length} deliverables created from template`
  })
}

async function uploadDeliverableVersion(body: any, userId: string) {
  const { deliverable_id, version_notes, file_info, is_final } = body

  const { data: deliverable } = await supabase
    .from('project_deliverables')
    .select('*, client_projects(*)')
    .eq('id', deliverable_id)
    .eq('user_id', userId)
    .single()

  if (!deliverable) {
    return NextResponse.json({ error: 'Deliverable not found' }, { status: 404 })
  }

  const { data: latestVersion } = await supabase
    .from('deliverable_versions')
    .select('version_number')
    .eq('deliverable_id', deliverable_id)
    .order('version_number', { ascending: false })
    .limit(1)
    .single()

  const currentVersion = latestVersion ? parseFloat(latestVersion.version_number) : 0
  const newVersionNumber = is_final ? 
    Math.floor(currentVersion) + 1 + '.0' : 
    (currentVersion + 0.1).toFixed(1)

  const versionData = {
    deliverable_id,
    version_number: newVersionNumber,
    file_path: file_info.path,
    file_name: file_info.name,
    file_size: file_info.size,
    file_type: file_info.type,
    uploaded_by: userId,
    version_notes: version_notes || '',
    is_final_version: is_final || false,
    review_status: 'pending_review',
    metadata: {
      upload_method: 'manual',
      client_accessible: deliverable.client_facing,
      requires_approval: deliverable.approval_required
    }
  }

  const { data: version, error } = await supabase
    .from('deliverable_versions')
    .insert(versionData)
    .select()
    .single()

  if (error) {
    console.error('Error creating version:', error)
    return NextResponse.json({ error: 'Failed to upload version' }, { status: 500 })
  }

  const statusUpdate = is_final ? 'completed' : 'in_progress'
  await supabase
    .from('project_deliverables')
    .update({ 
      status: statusUpdate,
      version_number: newVersionNumber,
      last_updated: new Date().toISOString()
    })
    .eq('id', deliverable_id)

  if (deliverable.approval_required && is_final) {
    await initiateApprovalProcess(deliverable_id, version.id)
  }

  if (deliverable.client_facing && is_final) {
    await notifyClientOfDeliverable(deliverable, version)
  }

  await logDeliverableEvent('version_uploaded', deliverable.project_id, {
    deliverable_id,
    version_number: newVersionNumber,
    is_final,
    file_name: file_info.name
  })

  return NextResponse.json({
    version,
    message: `Version ${newVersionNumber} uploaded successfully`
  })
}

async function approveDeliverable(body: any, userId: string) {
  const { deliverable_id, version_id, approval_decision, reviewer_notes, client_feedback } = body

  const { data: deliverable } = await supabase
    .from('project_deliverables')
    .select('*, client_projects(*)')
    .eq('id', deliverable_id)
    .eq('user_id', userId)
    .single()

  if (!deliverable) {
    return NextResponse.json({ error: 'Deliverable not found' }, { status: 404 })
  }

  const approvalData = {
    deliverable_id,
    version_id,
    reviewed_by: userId,
    approval_decision,
    reviewer_notes: reviewer_notes || '',
    client_feedback: client_feedback || '',
    review_date: new Date().toISOString(),
    metadata: {
      approval_type: client_feedback ? 'client_approval' : 'internal_approval',
      escalation_required: approval_decision === 'rejected'
    }
  }

  const { data: approval, error } = await supabase
    .from('deliverable_approvals')
    .insert(approvalData)
    .select()
    .single()

  if (error) {
    console.error('Error recording approval:', error)
    return NextResponse.json({ error: 'Failed to record approval' }, { status: 500 })
  }

  let newStatus = deliverable.status
  if (approval_decision === 'approved') {
    newStatus = 'approved'
    await updateProjectProgress(deliverable.project_id)
  } else if (approval_decision === 'rejected') {
    newStatus = 'needs_revision'
    await createRevisionTasks(deliverable_id, reviewer_notes)
  }

  await supabase
    .from('project_deliverables')
    .update({ 
      status: newStatus,
      last_updated: new Date().toISOString()
    })
    .eq('id', deliverable_id)

  await supabase
    .from('deliverable_versions')
    .update({ review_status: approval_decision })
    .eq('id', version_id)

  await logDeliverableEvent('deliverable_reviewed', deliverable.project_id, {
    deliverable_id,
    approval_decision,
    reviewer: userId
  })

  return NextResponse.json({
    approval,
    message: `Deliverable ${approval_decision} successfully`
  })
}

async function bulkUpdateStatus(body: any, userId: string) {
  const { deliverable_ids, new_status, update_reason } = body

  const { data: deliverables } = await supabase
    .from('project_deliverables')
    .select('id, project_id, deliverable_name')
    .in('id', deliverable_ids)
    .eq('user_id', userId)

  if (!deliverables || deliverables.length === 0) {
    return NextResponse.json({ error: 'No valid deliverables found' }, { status: 404 })
  }

  const { error } = await supabase
    .from('project_deliverables')
    .update({ 
      status: new_status,
      last_updated: new Date().toISOString(),
      metadata: { 
        bulk_update: true,
        update_reason,
        updated_by: userId
      }
    })
    .in('id', deliverable_ids)

  if (error) {
    console.error('Error bulk updating deliverables:', error)
    return NextResponse.json({ error: 'Failed to bulk update deliverables' }, { status: 500 })
  }

  const logPromises = deliverables.map(d => 
    logDeliverableEvent('bulk_status_update', d.project_id, {
      deliverable_id: d.id,
      new_status,
      reason: update_reason
    })
  )
  await Promise.all(logPromises)

  return NextResponse.json({
    message: `${deliverables.length} deliverables updated to ${new_status}`,
    updated_count: deliverables.length
  })
}

async function createInitialVersion(deliverableId: string) {
  const versionData = {
    deliverable_id: deliverableId,
    version_number: '0.1',
    version_notes: 'Initial version created',
    is_final_version: false,
    review_status: 'draft',
    metadata: {
      auto_created: true,
      initial_version: true
    }
  }

  await supabase
    .from('deliverable_versions')
    .insert(versionData)
}

async function notifyAssignedTeamMember(deliverable: any) {
  if (!deliverable.assigned_to) return

  console.log(`Notification sent: New deliverable assigned - ${deliverable.deliverable_name}`)
}

async function initiateApprovalProcess(deliverableId: string, versionId: string) {
  console.log(`Approval process initiated for deliverable ${deliverableId}, version ${versionId}`)
}

async function notifyClientOfDeliverable(deliverable: any, version: any) {
  console.log(`Client notified of deliverable: ${deliverable.deliverable_name} v${version.version_number}`)
}

async function updateProjectProgress(projectId: string) {
  const { data: deliverables } = await supabase
    .from('project_deliverables')
    .select('status')
    .eq('project_id', projectId)

  if (!deliverables) return

  const totalDeliverables = deliverables.length
  const completedDeliverables = deliverables.filter(d => 
    ['approved', 'completed'].includes(d.status)
  ).length

  const completionPercentage = totalDeliverables > 0 ? 
    Math.round((completedDeliverables / totalDeliverables) * 100) : 0

  await supabase
    .from('client_projects')
    .update({ completion_percentage: completionPercentage })
    .eq('id', projectId)
}

async function createRevisionTasks(deliverableId: string, revisionNotes: string) {
  console.log(`Revision tasks created for deliverable ${deliverableId}: ${revisionNotes}`)
}

async function logDeliverableEvent(eventType: string, projectId: string, metadata: any) {
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
    const { deliverable_id, ...updateData } = body
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!deliverable_id) {
      return NextResponse.json({ error: 'Deliverable ID required' }, { status: 400 })
    }

    const { data: deliverable, error } = await supabase
      .from('project_deliverables')
      .update({
        ...updateData,
        last_updated: new Date().toISOString()
      })
      .eq('id', deliverable_id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating deliverable:', error)
      return NextResponse.json({ error: 'Failed to update deliverable' }, { status: 500 })
    }

    return NextResponse.json({
      deliverable,
      message: 'Deliverable updated successfully'
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const deliverableId = searchParams.get('deliverable_id')
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!deliverableId) {
      return NextResponse.json({ error: 'Deliverable ID required' }, { status: 400 })
    }

    await supabase
      .from('deliverable_versions')
      .delete()
      .eq('deliverable_id', deliverableId)

    await supabase
      .from('deliverable_approvals')
      .delete()
      .eq('deliverable_id', deliverableId)

    const { error } = await supabase
      .from('project_deliverables')
      .delete()
      .eq('id', deliverableId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting deliverable:', error)
      return NextResponse.json({ error: 'Failed to delete deliverable' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Deliverable deleted successfully' })
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

    if (action === 'sync_project_deliverables') {
      const body = await request.json()
      return await syncProjectDeliverables(body.project_id, user.id)
    }

    if (action === 'get_deliverable_analytics') {
      const projectId = searchParams.get('project_id')
      return await getDeliverableAnalytics(projectId, user.id)
    }

    if (action === 'archive_completed') {
      const projectId = searchParams.get('project_id')
      return await archiveCompletedDeliverables(projectId, user.id)
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function syncProjectDeliverables(projectId: string, userId: string) {
  const { data: project } = await supabase
    .from('client_projects')
    .select('*, delivery_templates(*)')
    .eq('id', projectId)
    .single()

  if (!project || !project.delivery_templates) {
    return NextResponse.json({ error: 'Project or template not found' }, { status: 404 })
  }

  const { data: existingDeliverables } = await supabase
    .from('project_deliverables')
    .select('*')
    .eq('project_id', projectId)

  const templateDeliverables = project.delivery_templates.deliverables_config || []
  const syncResults = {
    added: 0,
    updated: 0,
    unchanged: 0
  }

  for (const templateDeliverable of templateDeliverables) {
    const existing = existingDeliverables?.find(d => 
      d.metadata?.template_deliverable_id === templateDeliverable.id
    )

    if (!existing) {
      const dueDate = new Date(project.start_date)
      dueDate.setDate(dueDate.getDate() + (templateDeliverable.days_offset || 30))

      await supabase
        .from('project_deliverables')
        .insert({
          user_id: userId,
          project_id: projectId,
          deliverable_name: templateDeliverable.name,
          deliverable_type: templateDeliverable.type,
          description: templateDeliverable.description,
          due_date: dueDate.toISOString(),
          client_facing: templateDeliverable.client_facing,
          approval_required: templateDeliverable.approval_required,
          status: 'not_started',
          version_number: '1.0',
          metadata: {
            created_from: 'template_sync',
            template_deliverable_id: templateDeliverable.id
          }
        })

      syncResults.added++
    } else {
      syncResults.unchanged++
    }
  }

  return NextResponse.json({
    message: 'Project deliverables synchronized',
    sync_results: syncResults
  })
}

async function getDeliverableAnalytics(projectId: string | null, userId: string) {
  let query = supabase
    .from('project_deliverables')
    .select('status, deliverable_type, due_date, client_facing')
    .eq('user_id', userId)

  if (projectId) {
    query = query.eq('project_id', projectId)
  }

  const { data: deliverables } = await query

  if (!deliverables) {
    return NextResponse.json({ analytics: null })
  }

  const analytics = {
    total_deliverables: deliverables.length,
    by_status: {},
    by_type: {},
    overdue_count: 0,
    client_facing_count: deliverables.filter(d => d.client_facing).length,
    upcoming_due: 0
  }

  const now = new Date()
  const nextWeek = new Date()
  nextWeek.setDate(nextWeek.getDate() + 7)

  deliverables.forEach(deliverable => {
    analytics.by_status[deliverable.status] = (analytics.by_status[deliverable.status] || 0) + 1
    analytics.by_type[deliverable.deliverable_type] = (analytics.by_type[deliverable.deliverable_type] || 0) + 1

    const dueDate = new Date(deliverable.due_date)
    if (dueDate < now && !['completed', 'approved'].includes(deliverable.status)) {
      analytics.overdue_count++
    }
    if (dueDate <= nextWeek && dueDate >= now) {
      analytics.upcoming_due++
    }
  })

  return NextResponse.json({ analytics })
}

async function archiveCompletedDeliverables(projectId: string | null, userId: string) {
  let query = supabase
    .from('project_deliverables')
    .update({ 
      status: 'archived',
      archived_at: new Date().toISOString()
    })
    .eq('user_id', userId)
    .in('status', ['completed', 'approved'])

  if (projectId) {
    query = query.eq('project_id', projectId)
  }

  const { error, count } = await query

  if (error) {
    console.error('Error archiving deliverables:', error)
    return NextResponse.json({ error: 'Failed to archive deliverables' }, { status: 500 })
  }

  return NextResponse.json({
    message: `${count} deliverables archived successfully`,
    archived_count: count
  })
}