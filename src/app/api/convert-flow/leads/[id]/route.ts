import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { hubspotIntegrationService } from '@/services/hubspotIntegrationService'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const leadId = params.id

    // Get lead with related data
    const { data: lead, error } = await supabase
      .from('convert_flow_leads')
      .select(`
        *,
        convert_flow_proposals!convert_flow_proposals_lead_id_fkey(*),
        convert_flow_lead_activities!convert_flow_lead_activities_lead_id_fkey(
          *
        )
      `)
      .eq('id', leadId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
      }
      console.error('[CONVERT-FLOW] Error fetching lead:', error)
      return NextResponse.json({ error: 'Failed to fetch lead' }, { status: 500 })
    }

    // Get sync status
    const { data: syncStatus } = await supabase
      .from('convert_flow_sync_status')
      .select('*')
      .eq('entity_id', leadId)
      .eq('entity_type', 'leads')

    return NextResponse.json({
      lead,
      syncStatus: syncStatus || []
    })

  } catch (error) {
    console.error('[CONVERT-FLOW] Unexpected error fetching lead:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const leadId = params.id
    const updateData = await request.json()

    // Remove fields that shouldn't be updated directly
    const { id, created_at, hubspot_contact_id, ...safeUpdateData } = updateData

    // Add updated timestamp
    safeUpdateData.updated_at = new Date().toISOString()

    // Update lead in database
    const { data: updatedLead, error } = await supabase
      .from('convert_flow_leads')
      .update(safeUpdateData)
      .eq('id', leadId)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
      }
      console.error('[CONVERT-FLOW] Error updating lead:', error)
      return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 })
    }

    // Log activity
    await supabase
      .from('convert_flow_lead_activities')
      .insert({
        lead_id: leadId,
        activity_type: 'lead_updated',
        activity_data: { 
          updated_fields: Object.keys(safeUpdateData),
          previous_stage: updateData.previous_stage || null
        },
        created_at: new Date().toISOString()
      })

    // Sync to HubSpot in background
    hubspotIntegrationService.syncLeadToHubSpot(leadId).catch(error => {
      console.error('[CONVERT-FLOW] Failed to sync updated lead to HubSpot:', error)
    })

    return NextResponse.json({
      lead: updatedLead,
      message: 'Lead updated successfully'
    })

  } catch (error) {
    console.error('[CONVERT-FLOW] Unexpected error updating lead:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const leadId = params.id

    // Get lead before deletion for cleanup
    const { data: lead } = await supabase
      .from('convert_flow_leads')
      .select('hubspot_contact_id, email')
      .eq('id', leadId)
      .single()

    // Delete lead (cascade will handle related records)
    const { error } = await supabase
      .from('convert_flow_leads')
      .delete()
      .eq('id', leadId)

    if (error) {
      console.error('[CONVERT-FLOW] Error deleting lead:', error)
      return NextResponse.json({ error: 'Failed to delete lead' }, { status: 500 })
    }

    // Note: In a production system, you might want to archive rather than delete
    // to maintain audit trail and regulatory compliance

    return NextResponse.json({ message: 'Lead deleted successfully' })

  } catch (error) {
    console.error('[CONVERT-FLOW] Unexpected error deleting lead:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}