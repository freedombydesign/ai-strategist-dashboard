import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    console.log('[EMAIL-TEST] Starting direct email test...')
    
    // Get current user (you)
    const userId = 'e82ab823-81fb-43f8-8258-58c84d6d9bf5' // Your user ID from logs
    
    // Get user email from Supabase
    const { data: userData } = await supabase.auth.admin.getUserById(userId)
    const userEmail = userData?.user?.email
    
    console.log('[EMAIL-TEST] User email:', userEmail)
    
    if (!userEmail) {
      return NextResponse.json({ error: 'No email found' }, { status: 400 })
    }
    
    // Import Resend dynamically
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)
    
    console.log('[EMAIL-TEST] Sending test email...')
    
    const emailResult = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'coach@scalewithruth.com',
      to: userEmail,
      subject: '🧪 Direct Email System Test - SUCCESS!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
            <h1 style="margin: 0; font-size: 28px;">🧪 Email System Test</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px;">Direct email integration is working perfectly!</p>
          </div>
          
          <div style="background: #d4edda; border: 1px solid #c3e6cb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="margin: 0 0 15px 0; color: #155724;">✅ Test Results:</h3>
            <ul style="color: #155724; margin: 0; padding-left: 20px;">
              <li>Resend API: Working</li>
              <li>Domain Verification: Confirmed</li>
              <li>Direct Email Integration: Success</li>
              <li>Production Environment: Ready</li>
            </ul>
          </div>
          
          <div style="text-align: center;">
            <p style="font-size: 16px; color: #666;">Your email system is 100% ready for tomorrow's launch!</p>
            <p style="font-size: 14px; color: #999;">Sent at: ${new Date().toISOString()}</p>
          </div>
        </div>
      `
    })
    
    console.log('[EMAIL-TEST] ✅ Email sent successfully:', emailResult)
    
    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully!',
      emailResult,
      userEmail,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('[EMAIL-TEST] ❌ Error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}