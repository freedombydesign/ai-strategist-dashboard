import { NextRequest, NextResponse } from 'next/server'
import { emailService } from '@/services/emailService'

// Handle GET requests - process pending email notifications
export async function GET() {
  try {
    console.log('[EMAIL-API] Processing pending email notifications...')
    
    await emailService.processPendingEmails()
    
    return NextResponse.json({ 
      success: true, 
      message: 'Email processing completed' 
    })
  } catch (error) {
    console.error('[EMAIL-API] Error processing emails:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
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