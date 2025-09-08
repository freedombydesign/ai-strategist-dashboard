// ProfitPulse API - Time Tracking Endpoints
// Manage time tracking integrations and entries

import { NextRequest, NextResponse } from 'next/server'
import { timeTrackingIntegrationService } from '@/services/timeTrackingIntegrationService'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const action = searchParams.get('action')
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    switch (action) {
      case 'integrations':
        const integrations = await timeTrackingIntegrationService.getIntegrationStatus(userId)
        return NextResponse.json({
          success: true,
          data: {
            integrations,
            totalIntegrations: integrations.length,
            activeIntegrations: integrations.filter(i => i.syncStatus === 'active').length
          },
          timestamp: new Date().toISOString()
        })

      case 'entries':
        const projectId = searchParams.get('projectId')
        const teamMemberId = searchParams.get('teamMemberId')
        const startDate = searchParams.get('startDate')
        const endDate = searchParams.get('endDate')
        const billable = searchParams.get('billable')
        const source = searchParams.get('source')
        const limit = parseInt(searchParams.get('limit') || '50')
        const offset = parseInt(searchParams.get('offset') || '0')

        const { entries, total } = await timeTrackingIntegrationService.getTimeEntries(userId, {
          projectId: projectId || undefined,
          teamMemberId: teamMemberId || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          billable: billable ? billable === 'true' : undefined,
          source: source || undefined,
          limit,
          offset
        })

        return NextResponse.json({
          success: true,
          data: {
            entries,
            pagination: {
              total,
              limit,
              offset,
              hasMore: offset + entries.length < total
            }
          },
          timestamp: new Date().toISOString()
        })

      case 'productivity':
        const date = searchParams.get('date')
        if (!date) {
          return NextResponse.json({ error: 'Date is required for productivity metrics' }, { status: 400 })
        }
        
        const productivityMetrics = await timeTrackingIntegrationService
          .getProductivityMetrics(userId, date)

        return NextResponse.json({
          success: true,
          data: productivityMetrics,
          timestamp: new Date().toISOString()
        })

      default:
        return NextResponse.json({ error: 'Invalid action parameter' }, { status: 400 })
    }

  } catch (error) {
    console.error('Time Tracking API error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch time tracking data',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, userId } = body
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    switch (action) {
      case 'setup_integration':
        const { platform, apiKey, workspaceId, settings } = body
        const integration = await timeTrackingIntegrationService.setupIntegration(userId, {
          platform,
          apiKey,
          workspaceId,
          settings
        })

        return NextResponse.json({
          success: true,
          data: integration,
          message: `${platform} integration setup successfully`,
          timestamp: new Date().toISOString()
        })

      case 'sync_entries':
        const { platform: syncPlatform } = body
        const syncResults = await timeTrackingIntegrationService
          .syncTimeEntries(userId, syncPlatform)

        const totalProcessed = syncResults.reduce((sum, result) => sum + result.entriesProcessed, 0)
        const totalAdded = syncResults.reduce((sum, result) => sum + result.entriesAdded, 0)
        const totalErrors = syncResults.reduce((sum, result) => sum + result.errors.length, 0)

        return NextResponse.json({
          success: true,
          data: {
            syncResults,
            summary: {
              totalProcessed,
              totalAdded,
              totalErrors,
              successRate: totalProcessed > 0 ? ((totalProcessed - totalErrors) / totalProcessed) * 100 : 0
            }
          },
          timestamp: new Date().toISOString()
        })

      case 'create_manual_entry':
        const { projectId, teamMemberId, date, hours, description, billable, hourlyRate, tags } = body
        const timeEntry = await timeTrackingIntegrationService.createManualTimeEntry(userId, {
          projectId,
          teamMemberId,
          date,
          hours,
          description,
          billable,
          hourlyRate,
          tags
        })

        return NextResponse.json({
          success: true,
          data: timeEntry,
          message: 'Manual time entry created successfully',
          timestamp: new Date().toISOString()
        })

      case 'update_integration_settings':
        const { platform: settingsPlatform, settings: newSettings } = body
        await timeTrackingIntegrationService
          .updateIntegrationSettings(userId, settingsPlatform, newSettings)

        return NextResponse.json({
          success: true,
          message: 'Integration settings updated successfully',
          timestamp: new Date().toISOString()
        })

      default:
        return NextResponse.json({ error: 'Invalid action parameter' }, { status: 400 })
    }

  } catch (error) {
    console.error('Time Tracking POST API error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to process time tracking request',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const platform = searchParams.get('platform')
    
    if (!userId || !platform) {
      return NextResponse.json({ 
        error: 'User ID and platform are required' 
      }, { status: 400 })
    }

    await timeTrackingIntegrationService.deleteIntegration(userId, platform)

    return NextResponse.json({
      success: true,
      message: `${platform} integration deleted successfully`,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Delete time tracking integration error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to delete integration',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}