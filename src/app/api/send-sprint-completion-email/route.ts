import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

export async function POST(request: NextRequest) {
  try {
    const { userEmail, sprintData, userProgress } = await request.json()
    
    if (!userEmail || !sprintData) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    console.log('[SPRINT-EMAIL-API] 🎉 Sending sprint completion email to:', userEmail)
    console.log('[SPRINT-EMAIL-API] Sprint:', sprintData.name)
    
    const resend = new Resend(process.env.RESEND_API_KEY)
    
    const emailResult = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'coach@scalewithruth.com',
      to: userEmail,
      subject: `🎉 Sprint Completed: ${sprintData.client_facing_title}!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
            <h1 style="margin: 0; font-size: 28px;">🎉 Sprint Completed!</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px;">Congratulations on finishing your sprint!</p>
          </div>
          
          <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="margin: 0 0 15px 0; color: #065f46;">✅ Sprint: ${sprintData.client_facing_title}</h3>
            <p style="color: #047857; margin: 0 0 15px 0; font-size: 16px;">${sprintData.description}</p>
            <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #10b981;">
              <p style="margin: 0; color: #065f46; font-weight: bold;">🎯 Goal Achieved:</p>
              <p style="margin: 5px 0 0 0; color: #047857;">${sprintData.goal}</p>
            </div>
          </div>
          
          ${userProgress ? `
          <div style="background: #fffbeb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="margin: 0 0 15px 0; color: #92400e;">📊 Your Progress Impact</h3>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
              <div style="background: white; padding: 15px; border-radius: 6px; text-align: center;">
                <div style="font-size: 24px; font-weight: bold; color: #dc2626;">${userProgress.totalStepsCompleted || 0}</div>
                <div style="font-size: 12px; color: #92400e;">Steps Completed</div>
              </div>
              <div style="background: white; padding: 15px; border-radius: 6px; text-align: center;">
                <div style="font-size: 24px; font-weight: bold; color: #dc2626;">${sprintData.time_saved_hours || 0}h</div>
                <div style="font-size: 12px; color: #92400e;">Time Saved/Week</div>
              </div>
            </div>
          </div>
          ` : ''}
          
          <div style="text-align: center; margin-bottom: 20px;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://scalewithruth.com'}/dashboard" 
               style="display: inline-block; background: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; margin: 0 10px 10px 0;">
              View Dashboard →
            </a>
            <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://scalewithruth.com'}/ai-strategist" 
               style="display: inline-block; background: #3b82f6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
              Plan Next Sprint →
            </a>
          </div>
          
          <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 8px;">
            <p style="margin: 0 0 10px 0; font-weight: bold; color: #92400e;">🚀 Keep the Momentum Going!</p>
            <ul style="color: #92400e; margin: 0; padding-left: 20px;">
              <li>Check in daily to track your progress</li>
              <li>Start your next highest-impact sprint</li>
              <li>Share this win with your AI Strategist</li>
              <li>Celebrate - you're building real freedom!</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 12px; margin: 0;">
              You're one step closer to business freedom! 🌟
            </p>
          </div>
        </div>
      `
    })
    
    console.log('[SPRINT-EMAIL-API] ✅ Sprint completion email sent successfully:', emailResult)
    
    return NextResponse.json({
      success: true,
      emailId: emailResult.data?.id
    })
    
  } catch (error) {
    console.error('[SPRINT-EMAIL-API] Error sending sprint completion email:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}