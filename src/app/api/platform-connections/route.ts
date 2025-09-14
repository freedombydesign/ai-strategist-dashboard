import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const platform = searchParams.get('platform')

    let query = supabase
      .from('platform_connections')
      .select('*')
      .eq('is_active', true)
      .order('connected_at', { ascending: false })

    if (platform) {
      query = query.eq('platform', platform)
    }

    const { data: connections, error } = await query

    if (error) {
      console.error('[PLATFORM-CONNECTIONS] Database error:', error)
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch platform connections',
        details: error.message
      }, { status: 500 })
    }

    // Don't expose sensitive token data in the response
    const sanitizedConnections = connections.map(conn => ({
      id: conn.id,
      platform: conn.platform,
      platform_username: conn.platform_username,
      platform_workspace_name: conn.platform_workspace_name,
      connected_at: conn.connected_at,
      last_used_at: conn.last_used_at,
      is_active: conn.is_active,
      hasValidToken: !!conn.access_token,
      tokenExpires: conn.expires_at,
      scope: conn.scope
    }))

    return NextResponse.json({
      success: true,
      connections: sanitizedConnections,
      total: connections.length
    })

  } catch (error) {
    console.error('[PLATFORM-CONNECTIONS] Unexpected error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch platform connections',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const connectionId = searchParams.get('id')
    const platform = searchParams.get('platform')

    if (!connectionId && !platform) {
      return NextResponse.json({
        success: false,
        error: 'Either connection ID or platform is required'
      }, { status: 400 })
    }

    let query = supabase.from('platform_connections')

    if (connectionId) {
      query = query.delete().eq('id', connectionId)
    } else if (platform) {
      query = query.delete().eq('platform', platform)
    }

    const { error } = await query

    if (error) {
      console.error('[PLATFORM-CONNECTIONS] Delete error:', error)
      return NextResponse.json({
        success: false,
        error: 'Failed to disconnect platform',
        details: error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: connectionId ? 'Connection removed' : `All ${platform} connections removed`
    })

  } catch (error) {
    console.error('[PLATFORM-CONNECTIONS] Delete unexpected error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to disconnect platform',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { connectionId, isActive } = body

    if (!connectionId) {
      return NextResponse.json({
        success: false,
        error: 'Connection ID is required'
      }, { status: 400 })
    }

    const { error } = await supabase
      .from('platform_connections')
      .update({
        is_active: isActive,
        updated_at: new Date().toISOString()
      })
      .eq('id', connectionId)

    if (error) {
      console.error('[PLATFORM-CONNECTIONS] Update error:', error)
      return NextResponse.json({
        success: false,
        error: 'Failed to update platform connection',
        details: error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Connection ${isActive ? 'activated' : 'deactivated'}`
    })

  } catch (error) {
    console.error('[PLATFORM-CONNECTIONS] Update unexpected error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to update platform connection',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}