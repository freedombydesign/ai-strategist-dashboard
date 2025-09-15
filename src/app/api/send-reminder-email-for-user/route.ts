import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()
    
    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    console.log('[REMINDER-EMAIL] 🔍 Checking reminder need for user:', userId)
    
    // Get current user info
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user || user.id !== userId) {
      return NextResponse.json({ error: 'User not found or unauthorized' }, { status: 403 })
    }

    // Check last check-in date  
    const { data: checkins, error: checkinError } = await supabase
      .from('daily_checkins')
      .select('checkin_date, energy_level')
      .eq('user_id', userId)
      .order('checkin_date', { ascending: false })
      .limit(10)
    
    if (checkinError) {
      console.error('[REMINDER-EMAIL] Error fetching checkins:', checkinError)
      return NextResponse.json({ error: 'Failed to fetch checkins' }, { status: 500 })
    }
    
    const today = new Date()
    let daysSinceLastCheckin = 0
    let lastCheckinDate = null
    let currentStreak = 0
    
    if (checkins && checkins.length > 0) {
      const lastCheckin = new Date(checkins[0].checkin_date)
      lastCheckinDate = checkins[0].checkin_date
      const timeDiff = today.getTime() - lastCheckin.getTime()
      daysSinceLastCheckin = Math.floor(timeDiff / (1000 * 3600 * 24))
      
      // Calculate current streak
      const sortedCheckins = checkins.sort((a, b) => new Date(b.checkin_date).getTime() - new Date(a.checkin_date).getTime())
      let streakDate = new Date(today)
      streakDate.setDate(streakDate.getDate() - 1) // Start checking from yesterday
      
      for (const checkin of sortedCheckins) {
        const checkinDate = new Date(checkin.checkin_date)
        const expectedDate = streakDate.toISOString().split('T')[0]
        const actualDate = checkinDate.toISOString().split('T')[0]
        
        if (expectedDate === actualDate) {
          currentStreak++
          streakDate.setDate(streakDate.getDate() - 1)
        } else {
          break
        }
      }
    } else {
      daysSinceLastCheckin = 7 // Treat as week-long absence
    }
    
    // Send reminder if needed (1+ days since last check-in)
    const shouldSendReminder = daysSinceLastCheckin >= 1
    
    if (shouldSendReminder && user.email) {
      console.log('[REMINDER-EMAIL] 📧 Sending reminder email (${daysSinceLastCheckin} days since last check-in)')
      
      const userName = user.user_metadata?.name || user.email?.split('@')[0] || 'there'
      
      const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'https://scalewithruth.com'}/api/send-checkin-reminder-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userEmail: user.email,
          userName,
          daysMissed: daysSinceLastCheckin,
          currentStreak,
          lastCheckinDate
        })
      })
      
      const emailResult = await emailResponse.json()
      
      return NextResponse.json({
        success: true,
        reminderSent: true,
        daysMissed: daysSinceLastCheckin,
        emailSent: emailResult.success,
        emailId: emailResult.emailId || null,
        error: emailResult.error || null
      })
    } else {
      return NextResponse.json({
        success: true,
        reminderSent: false,
        daysMissed: daysSinceLastCheckin,
        reason: daysSinceLastCheckin === 0 ? 'checked_in_today' : 'no_email'
      })
    }
    
  } catch (error) {
    console.error('[REMINDER-EMAIL] Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}