import { NextRequest, NextResponse } from 'next/server'
import { emailService } from '@/services/emailService'
import { supabase } from '@/lib/supabase'

// Trigger email notifications for Freedom Suite events
export async function POST(request: NextRequest) {
  try {
    const { triggerType, userId, data } = await request.json()

    if (!triggerType || !userId) {
      return NextResponse.json({ 
        error: 'Missing required fields: triggerType, userId' 
      }, { status: 400 })
    }

    console.log(`[EMAIL-TRIGGERS] Processing ${triggerType} for user ${userId}`)

    switch (triggerType) {
      case 'executive_briefing':
        await emailService.scheduleExecutiveBriefing(userId, data)
        break

      case 'critical_alert':
        await emailService.scheduleCriticalAlert(userId, data)
        break

      case 'cash_flow_warning':
        await emailService.scheduleCashFlowWarning(userId, data)
        break

      case 'daily_briefings':
        // Trigger daily briefings for all users
        await emailService.scheduleDailyBriefingsForAllUsers()
        break

      default:
        return NextResponse.json({ 
          error: `Unknown trigger type: ${triggerType}` 
        }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: `${triggerType} email scheduled successfully`
    })

  } catch (error) {
    console.error('[EMAIL-TRIGGERS] Error:', error)
    return NextResponse.json({
      error: 'Failed to trigger email notification',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Get email trigger status and analytics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    // Get recent email notifications for this user
    const { data: notifications, error } = await supabase
      .from('email_notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('[EMAIL-TRIGGERS] Database error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Calculate email analytics
    const totalEmails = notifications?.length || 0
    const sentEmails = notifications?.filter(n => n.status === 'sent').length || 0
    const pendingEmails = notifications?.filter(n => n.status === 'pending').length || 0
    const failedEmails = notifications?.filter(n => n.status === 'failed').length || 0

    // Group by notification type
    const emailsByType = notifications?.reduce((acc: any, email) => {
      const type = email.notification_type
      if (!acc[type]) {
        acc[type] = { total: 0, sent: 0, pending: 0, failed: 0 }
      }
      acc[type].total++
      acc[type][email.status]++
      return acc
    }, {}) || {}

    return NextResponse.json({
      notifications: notifications || [],
      analytics: {
        total_emails: totalEmails,
        sent_emails: sentEmails,
        pending_emails: pendingEmails,
        failed_emails: failedEmails,
        success_rate: totalEmails > 0 ? Math.round((sentEmails / totalEmails) * 100) : 0,
        emails_by_type: emailsByType
      }
    })

  } catch (error) {
    console.error('[EMAIL-TRIGGERS] Error fetching analytics:', error)
    return NextResponse.json({
      error: 'Failed to fetch email analytics',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}