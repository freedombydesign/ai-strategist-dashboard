import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('[CHECK-REMINDER-API] 🔍 Checking for users who need check-in reminders...')
    
    // Get all users who might need reminders
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers()
    
    if (usersError) {
      console.error('[CHECK-REMINDER-API] Error fetching users:', usersError)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }
    
    const results = []
    const today = new Date()
    
    for (const user of users.users) {
      try {
        // Check last check-in date
        const { data: checkins, error: checkinError } = await supabase
          .from('daily_checkins')
          .select('checkin_date, energy_level')
          .eq('user_id', user.id)
          .order('checkin_date', { ascending: false })
          .limit(10) // Get recent checkins for streak calculation
        
        if (checkinError) {
          console.error(`[CHECK-REMINDER-API] Error fetching checkins for ${user.email}:`, checkinError)
          continue
        }
        
        // Calculate days since last check-in
        let daysSinceLastCheckin = 0
        let lastCheckinDate = null
        let currentStreak = 0
        
        if (checkins && checkins.length > 0) {
          const lastCheckin = new Date(checkins[0].checkin_date)
          lastCheckinDate = checkins[0].checkin_date
          const timeDiff = today.getTime() - lastCheckin.getTime()
          daysSinceLastCheckin = Math.floor(timeDiff / (1000 * 3600 * 24))
          
          // Calculate current streak (consecutive days)
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
          // No check-ins ever - they need a gentle nudge
          daysSinceLastCheckin = 7 // Treat as week-long absence
        }
        
        // Send reminders for 1, 2-3, or 4+ days
        const shouldSendReminder = daysSinceLastCheckin >= 1
        
        if (shouldSendReminder && user.email) {
          console.log(`[CHECK-REMINDER-API] 📧 Sending reminder to ${user.email} (${daysSinceLastCheckin} days since last check-in)`)
          
          // Get user's name from their email (before @)
          const userName = user.user_metadata?.name || user.email?.split('@')[0] || 'there'
          
          // Send the reminder email
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
          
          results.push({
            userId: user.id,
            email: user.email,
            daysMissed: daysSinceLastCheckin,
            currentStreak,
            emailSent: emailResult.success,
            emailId: emailResult.emailId || null,
            error: emailResult.error || null
          })
          
        } else {
          // User is up to date, no reminder needed
          results.push({
            userId: user.id,
            email: user.email,
            daysMissed: daysSinceLastCheckin,
            currentStreak,
            emailSent: false,
            reason: daysSinceLastCheckin === 0 ? 'checked_in_today' : 'no_email'
          })
        }
        
      } catch (userError) {
        console.error(`[CHECK-REMINDER-API] Error processing user ${user.email}:`, userError)
        results.push({
          userId: user.id,
          email: user.email,
          emailSent: false,
          error: userError instanceof Error ? userError.message : 'Unknown error'
        })
      }
    }
    
    const sentCount = results.filter(r => r.emailSent).length
    console.log(`[CHECK-REMINDER-API] ✅ Processed ${results.length} users, sent ${sentCount} reminder emails`)
    
    return NextResponse.json({
      success: true,
      processed: results.length,
      remindersSent: sentCount,
      results
    })
    
  } catch (error) {
    console.error('[CHECK-REMINDER-API] Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}