import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

export async function POST(request: NextRequest) {
  try {
    const { userEmail, scoreResult } = await request.json()
    
    if (!userEmail || !scoreResult) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    console.log('[ASSESSMENT-EMAIL-API] 📧 Sending assessment email to:', userEmail)
    
    const resend = new Resend(process.env.RESEND_API_KEY)
    
    const emailResult = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'coach@scalewithruth.com',
      to: userEmail,
      subject: '🎯 Your Freedom Diagnostic Results Are Ready!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
            <h1 style="margin: 0; font-size: 28px;">🎯 Your Freedom Diagnostic Results</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px;">Your business transformation roadmap is ready!</p>
          </div>
          
          <div style="background: #f8f9ff; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="margin: 0 0 15px 0; color: #333;">📊 Your Business Health Score</h3>
            <div style="font-size: 48px; font-weight: bold; color: #3B82F6; text-align: center; margin-bottom: 15px;">
              ${scoreResult.percent}%
            </div>
            <p style="text-align: center; color: #666; margin: 0;">Total: ${scoreResult.totalScore}/60</p>
          </div>
          
          <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="margin: 0 0 15px 0; color: #333;">📈 Module Breakdown</h3>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
              ${Object.entries(scoreResult.moduleAverages || {}).map(([module, score]) => `
                <div style="background: white; padding: 10px; border-radius: 6px; text-align: center; border: 1px solid #e5e7eb;">
                  <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">${getModuleName(module)}</div>
                  <div style="font-size: 18px; font-weight: bold; color: #1f2937;">${score}/10</div>
                </div>
              `).join('')}
            </div>
          </div>
          
          <div style="text-align: center; margin-bottom: 20px;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://scalewithruth.com'}/dashboard" 
               style="display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
              View Your Complete Sprint Plan →
            </a>
          </div>
          
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px;">
            <p style="margin: 0 0 10px 0; font-weight: bold; color: #856404;">🚀 What's Next?</p>
            <ul style="color: #856404; margin: 0; padding-left: 20px;">
              <li>Review your personalized sprint sequence</li>
              <li>Start with your highest-impact sprint</li>
              <li>Use daily check-ins to track progress</li>
              <li>Get AI coaching support when needed</li>
            </ul>
          </div>
        </div>
      `
    })
    
    console.log('[ASSESSMENT-EMAIL-API] ✅ Email sent successfully:', emailResult)
    
    return NextResponse.json({
      success: true,
      emailId: emailResult.data?.id
    })
    
  } catch (error) {
    console.error('[ASSESSMENT-EMAIL-API] Error sending email:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

function getModuleName(module: string): string {
  const names = {
    'M1': 'Position for Profit',
    'M2': 'Engineer Buyer Journey', 
    'M3': 'Set Up Systems',
    'M4': 'Build Sales System',
    'M5': 'Deliver Without Doing All',
    'M6': 'Refine, Release, Repeat'
  }
  return names[module as keyof typeof names] || module
}