import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { userEmail } = await request.json()
    
    if (!userEmail) {
      return NextResponse.json({ error: 'Missing userEmail' }, { status: 400 })
    }

    console.log('[TEST-REMINDER] 📧 Testing reminder email for:', userEmail)
    
    // Send a test reminder email (simulating 2 days missed)
    const userName = userEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    
    const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'https://scalewithruth.com'}/api/send-checkin-reminder-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userEmail,
        userName,
        daysMissed: 2,
        currentStreak: 3,
        lastCheckinDate: '2025-09-13'
      })
    })
    
    const emailResult = await emailResponse.json()
    
    return NextResponse.json({
      success: true,
      reminderSent: true,
      daysMissed: 2,
      emailSent: emailResult.success,
      emailId: emailResult.emailId || null,
      error: emailResult.error || null
    })
    
  } catch (error) {
    console.error('[TEST-REMINDER] Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}