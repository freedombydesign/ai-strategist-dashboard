import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Track email opens via pixel tracking
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const emailId = searchParams.get('email_id')
  const userId = searchParams.get('user_id')

  if (!emailId || !userId) {
    return new NextResponse('Missing parameters', { status: 400 })
  }

  try {
    // Update email analytics
    await supabase
      .from('email_analytics')
      .upsert({
        email_id: emailId,
        user_id: userId,
        opened: true,
        opened_at: new Date().toISOString(),
        user_agent: request.headers.get('user-agent') || '',
        ip_address: request.ip || request.headers.get('x-forwarded-for') || ''
      }, {
        onConflict: 'email_id'
      })

    // Return a 1x1 transparent pixel
    const pixel = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
      'base64'
    )

    return new Response(pixel, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (error) {
    console.error('[EMAIL-ANALYTICS] Error tracking open:', error)
    return new NextResponse('Error', { status: 500 })
  }
}

// Track email clicks
export async function POST(request: NextRequest) {
  try {
    const { emailId, userId, clickedUrl } = await request.json()

    if (!emailId || !userId || !clickedUrl) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
    }

    // Update click tracking
    await supabase
      .from('email_analytics')
      .upsert({
        email_id: emailId,
        user_id: userId,
        clicked: true,
        clicked_at: new Date().toISOString(),
        clicked_url: clickedUrl
      }, {
        onConflict: 'email_id'
      })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[EMAIL-ANALYTICS] Error tracking click:', error)
    return NextResponse.json({ error: 'Failed to track click' }, { status: 500 })
  }
}

// Get email analytics for dashboard
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')

    if (!userId) {
      return NextResponse.json({ error: 'Missing user_id' }, { status: 400 })
    }

    // Get email performance data
    const { data: analytics, error } = await supabase
      .from('email_analytics')
      .select(`
        *,
        email_notifications!inner(
          notification_type,
          status,
          sent_at
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Calculate summary statistics
    const totalSent = analytics.length
    const totalOpened = analytics.filter(a => a.opened).length
    const totalClicked = analytics.filter(a => a.clicked).length
    
    const openRate = totalSent > 0 ? (totalOpened / totalSent * 100).toFixed(1) : '0'
    const clickRate = totalSent > 0 ? (totalClicked / totalSent * 100).toFixed(1) : '0'

    // Group by email type
    const byType = analytics.reduce((acc: any, item) => {
      const type = item.email_notifications.notification_type
      if (!acc[type]) {
        acc[type] = { sent: 0, opened: 0, clicked: 0 }
      }
      acc[type].sent++
      if (item.opened) acc[type].opened++
      if (item.clicked) acc[type].clicked++
      return acc
    }, {})

    return NextResponse.json({
      summary: {
        totalSent,
        totalOpened,
        totalClicked,
        openRate: parseFloat(openRate),
        clickRate: parseFloat(clickRate)
      },
      byType,
      recentActivity: analytics.slice(0, 20)
    })
  } catch (error) {
    console.error('[EMAIL-ANALYTICS] Error fetching analytics:', error)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}