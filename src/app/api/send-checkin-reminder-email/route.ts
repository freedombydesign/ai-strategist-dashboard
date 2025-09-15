import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

export async function POST(request: NextRequest) {
  try {
    const { userEmail, userName, daysMissed, currentStreak, lastCheckinDate } = await request.json()
    
    if (!userEmail) {
      return NextResponse.json({ error: 'Missing user email' }, { status: 400 })
    }

    console.log('[CHECKIN-EMAIL-API] 📅 Sending check-in reminder to:', userEmail)
    console.log('[CHECKIN-EMAIL-API] Days missed:', daysMissed)
    
    const resend = new Resend(process.env.RESEND_API_KEY)
    
    // Customize message based on how long they've been away
    const getMotivationalMessage = (days: number) => {
      if (days === 1) return {
        title: "Missing you already! 👋",
        message: "Your daily check-in keeps your momentum strong. Just 2 minutes to stay on track!",
        urgency: "low"
      }
      if (days <= 3) return {
        title: "Let's get back on track! 🎯",
        message: "You've missed a few days, but it's never too late to restart. Your goals are waiting!",
        urgency: "medium"
      }
      return {
        title: "Your business freedom awaits! 🚀",
        message: "It's been a while, but your transformation is still possible. One check-in can restart everything!",
        urgency: "high"
      }
    }

    const motivationalContent = getMotivationalMessage(daysMissed || 1)
    const bgColor = motivationalContent.urgency === 'high' ? '#dc2626' : 
                   motivationalContent.urgency === 'medium' ? '#ea580c' : '#3b82f6'
    
    const emailResult = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'coach@scalewithruth.com',
      to: userEmail,
      subject: `${motivationalContent.title} Time for your daily check-in`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, ${bgColor} 0%, ${bgColor}dd 100%); color: white; padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
            <h1 style="margin: 0; font-size: 28px;">${motivationalContent.title}</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px;">Time for your daily momentum check!</p>
          </div>
          
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="margin: 0 0 15px 0; color: #1e293b;">👋 Hey ${userName || 'there'}!</h3>
            <p style="color: #475569; margin: 0 0 15px 0; font-size: 16px;">${motivationalContent.message}</p>
            
            ${currentStreak ? `
            <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #10b981; margin-bottom: 15px;">
              <p style="margin: 0; color: #065f46; font-weight: bold;">🔥 Your Previous Streak: ${currentStreak} days</p>
              <p style="margin: 5px 0 0 0; color: #047857; font-size: 14px;">Let's build on this momentum!</p>
            </div>
            ` : ''}
            
            ${lastCheckinDate ? `
            <div style="background: #fef3c7; padding: 15px; border-radius: 6px; border-left: 4px solid #f59e0b;">
              <p style="margin: 0; color: #92400e; font-weight: bold;">📅 Last Check-in: ${new Date(lastCheckinDate).toLocaleDateString()}</p>
              <p style="margin: 5px 0 0 0; color: #92400e; font-size: 14px;">${daysMissed === 1 ? "Yesterday was great - let's keep it going!" : `It's been ${daysMissed} days. Ready to restart?`}</p>
            </div>
            ` : ''}
          </div>
          
          <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="margin: 0 0 15px 0; color: #065f46;">✨ Your 2-Minute Check-in Includes:</h3>
            <ul style="color: #047857; margin: 0; padding-left: 20px; line-height: 1.6;">
              <li><strong>Energy Level</strong> - How are you feeling today?</li>
              <li><strong>Top 3 Priorities</strong> - What will move the needle?</li>
              <li><strong>Yesterday's Wins</strong> - Celebrate your progress!</li>
              <li><strong>Today's Focus</strong> - One key action for freedom</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin-bottom: 20px;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://scalewithruth.com'}/checkin" 
               style="display: inline-block; background: ${bgColor}; color: white; padding: 18px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 18px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              Complete Today's Check-in →
            </a>
          </div>
          
          <div style="background: #f1f5f9; border: 1px solid #cbd5e1; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
            <p style="margin: 0 0 10px 0; font-weight: bold; color: #334155;">💡 Daily Check-ins Help You:</p>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-top: 10px;">
              <div style="color: #475569; font-size: 14px;">✓ Stay focused on priorities</div>
              <div style="color: #475569; font-size: 14px;">✓ Build consistent momentum</div>
              <div style="color: #475569; font-size: 14px;">✓ Track real progress</div>
              <div style="color: #475569; font-size: 14px;">✓ Unlock achievements</div>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 12px; margin: 0;">
              Building business freedom, one day at a time 🌟<br>
              <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://scalewithruth.com'}/dashboard" style="color: #3b82f6; text-decoration: none;">Visit Dashboard</a> • 
              <a href="#" style="color: #6b7280; text-decoration: none; font-size: 10px;">Unsubscribe</a>
            </p>
          </div>
        </div>
      `
    })
    
    console.log('[CHECKIN-EMAIL-API] ✅ Check-in reminder email sent successfully:', emailResult)
    
    return NextResponse.json({
      success: true,
      emailId: emailResult.data?.id
    })
    
  } catch (error) {
    console.error('[CHECKIN-EMAIL-API] Error sending check-in reminder:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}