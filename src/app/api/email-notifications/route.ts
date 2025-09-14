import { NextRequest, NextResponse } from 'next/server'
import { emailService } from '@/services/emailService'

// Handle GET requests - DIRECT EMAIL TEST for debugging
export async function GET() {
  try {
    console.log('[EMAIL-API] DIRECT EMAIL TEST - Starting...')
    
    // Direct Resend test
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)
    
    const emailResult = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'coach@scalewithruth.com',
      to: 'ruthlarbie@gmail.com',
      subject: '🧪 URGENT EMAIL TEST - Launch Ready Check',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">🚨 EMAIL SYSTEM TEST</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px;">If you receive this, your email system is WORKING!</p>
          </div>
          <div style="padding: 20px; text-align: center;">
            <p style="font-size: 18px; color: #28a745; font-weight: bold;">✅ EMAIL SYSTEM IS READY FOR LAUNCH!</p>
            <p>Sent: ${new Date().toISOString()}</p>
          </div>
        </div>
      `
    })
    
    console.log('[EMAIL-API] ✅ DIRECT TEST EMAIL SENT:', emailResult)
    
    return NextResponse.json({ 
      success: true, 
      message: 'DIRECT EMAIL TEST SUCCESSFUL!',
      emailResult,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('[EMAIL-API] ❌ DIRECT EMAIL TEST FAILED:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// Handle POST requests - schedule specific email notifications
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, userId, data } = body

    if (!type || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: type, userId' },
        { status: 400 }
      )
    }

    console.log(`[EMAIL-API] Scheduling ${type} email for user ${userId}`)

    switch (type) {
      case 'diagnostic_results':
        await emailService.scheduleDiagnosticResultsEmail(userId, data || {})
        break
        
      case 'milestone_celebration':
        await emailService.scheduleMilestoneCelebrationEmail(userId, data || {})
        break
        
      default:
        return NextResponse.json(
          { error: `Unknown email type: ${type}` },
          { status: 400 }
        )
    }

    return NextResponse.json({ 
      success: true, 
      message: `${type} email scheduled successfully` 
    })
  } catch (error) {
    console.error('[EMAIL-API] Error scheduling email:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}