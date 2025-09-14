import { NextRequest, NextResponse } from 'next/server'
import { hubspotIntegrationService } from '@/services/hubspotIntegrationService'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'status' or 'stats'

    if (type === 'stats') {
      // Get comprehensive sync statistics
      const stats = await hubspotIntegrationService.getSyncStats()
      
      // Get recent sync errors
      const { data: recentErrors } = await supabase
        .from('convert_flow_sync_status')
        .select(`
          *,
          convert_flow_leads!convert_flow_sync_status_entity_id_fkey(
            first_name,
            last_name,
            email,
            company
          )
        `)
        .eq('integration_type', 'hubspot')
        .eq('sync_status', 'error')
        .order('created_at', { ascending: false })
        .limit(10)

      return NextResponse.json({
        stats,
        recentErrors: recentErrors || []
      })
    }

    // Default: return sync status for all entities
    const { data: syncStatus, error } = await supabase
      .from('convert_flow_sync_status')
      .select(`
        *,
        convert_flow_leads!convert_flow_sync_status_entity_id_fkey(
          first_name,
          last_name,
          email,
          company
        )
      `)
      .eq('integration_type', 'hubspot')
      .order('last_synced_at', { ascending: false, nullsFirst: false })
      .limit(100)

    if (error) {
      console.error('[CONVERT-FLOW] Error fetching sync status:', error)
      return NextResponse.json({ error: 'Failed to fetch sync status' }, { status: 500 })
    }

    return NextResponse.json({
      syncStatus: syncStatus || []
    })

  } catch (error) {
    console.error('[CONVERT-FLOW] Unexpected error fetching sync data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, entity_id, entity_type } = await request.json()

    if (!action) {
      return NextResponse.json({ error: 'Missing required field: action' }, { status: 400 })
    }

    switch (action) {
      case 'sync_lead': {
        if (!entity_id) {
          return NextResponse.json({ error: 'Missing entity_id for lead sync' }, { status: 400 })
        }

        const result = await hubspotIntegrationService.syncLeadToHubSpot(entity_id)
        
        return NextResponse.json({
          success: result.success,
          message: result.success ? 'Lead synced successfully' : `Failed to sync lead: ${result.error}`,
          result
        })
      }

      case 'sync_proposal': {
        if (!entity_id) {
          return NextResponse.json({ error: 'Missing entity_id for proposal sync' }, { status: 400 })
        }

        const result = await hubspotIntegrationService.syncProposalToHubSpot(entity_id)
        
        return NextResponse.json({
          success: result.success,
          message: result.success ? 'Proposal synced successfully' : `Failed to sync proposal: ${result.error}`,
          result
        })
      }

      case 'bulk_sync_leads': {
        const result = await hubspotIntegrationService.bulkSyncLeads()
        
        return NextResponse.json({
          success: true,
          message: `Bulk sync completed: ${result.success} successful, ${result.errors} errors`,
          result
        })
      }

      case 'sync_from_hubspot': {
        const limit = parseInt(request.body?.limit) || 100
        const syncedCount = await hubspotIntegrationService.syncHubSpotContactsToDatabase(limit)
        
        return NextResponse.json({
          success: true,
          message: `Synced ${syncedCount} contacts from HubSpot`,
          syncedCount
        })
      }

      case 'retry_failed': {
        // Retry all failed syncs
        const { data: failedSyncs } = await supabase
          .from('convert_flow_sync_status')
          .select('entity_id, entity_type')
          .eq('integration_type', 'hubspot')
          .eq('sync_status', 'error')
          .lt('retry_count', 3) // Only retry if less than 3 attempts
          .limit(10) // Limit retries per request

        if (!failedSyncs?.length) {
          return NextResponse.json({
            success: true,
            message: 'No failed syncs to retry'
          })
        }

        let retrySuccessCount = 0
        let retryErrorCount = 0

        for (const sync of failedSyncs) {
          try {
            let result
            if (sync.entity_type === 'leads') {
              result = await hubspotIntegrationService.syncLeadToHubSpot(sync.entity_id)
            } else if (sync.entity_type === 'deals') {
              result = await hubspotIntegrationService.syncProposalToHubSpot(sync.entity_id)
            } else {
              continue
            }

            if (result.success) {
              retrySuccessCount++
            } else {
              retryErrorCount++
            }

            // Add delay between retries
            await new Promise(resolve => setTimeout(resolve, 200))
          } catch (error) {
            console.error(`[CONVERT-FLOW] Retry failed for ${sync.entity_type}:${sync.entity_id}:`, error)
            retryErrorCount++
          }
        }

        return NextResponse.json({
          success: true,
          message: `Retry completed: ${retrySuccessCount} successful, ${retryErrorCount} errors`,
          retrySuccessCount,
          retryErrorCount
        })
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error) {
    console.error('[CONVERT-FLOW] Unexpected error in sync operation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Delete sync status (for cleanup)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const entityId = searchParams.get('entity_id')
    const entityType = searchParams.get('entity_type')
    const status = searchParams.get('status')

    let query = supabase
      .from('convert_flow_sync_status')
      .delete()
      .eq('integration_type', 'hubspot')

    if (entityId) {
      query = query.eq('entity_id', entityId)
    }

    if (entityType) {
      query = query.eq('entity_type', entityType)
    }

    if (status) {
      query = query.eq('sync_status', status)
    }

    const { error } = await query

    if (error) {
      console.error('[CONVERT-FLOW] Error cleaning up sync status:', error)
      return NextResponse.json({ error: 'Failed to cleanup sync status' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Sync status cleaned up successfully' })

  } catch (error) {
    console.error('[CONVERT-FLOW] Unexpected error cleaning up sync status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}