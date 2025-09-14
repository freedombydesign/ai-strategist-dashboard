import { NextRequest, NextResponse } from 'next/server'
import { emailService } from '@/services/emailService'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json({ error: 'Email address is required' }, { status: 400 })
    }

    // Sample executive briefing data - in production this would come from your analytics
    const briefingData = {
      date: new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
      topPriority: "Client portfolio risk assessment needed - Top 3 clients represent 47% of revenue",
      keyWin: "December revenue exceeded target by 12% ($485k vs $433k target)",
      mainConcern: "Sales conversion rate declined to 24% from 31% last month - pipeline quality issue",
      healthScore: 8.4,
      healthTrend: 'improving',
      confidence: 87.5,
      alerts: [
        {
          severity: 'high',
          title: 'Client Churn Risk Detected',
          message: 'TechCorp Solutions showing early churn signals: 36% increase in support tickets',
          timeToImpact: 'within 4-6 weeks',
          affectedRevenue: 85000,
          confidence: 78.5
        },
        {
          severity: 'medium',
          title: 'Cash Flow Dip Predicted',
          message: 'Invoice collection slowdown detected - projected 15% cash flow reduction',
          timeToImpact: 'next 6 weeks',
          confidence: 83.2
        }
      ]
    }

    // Send the executive briefing email
    await emailService.sendEmail(
      email,
      'executive_briefing',
      briefingData,
      `🧠 Executive Briefing - ${briefingData.date}`
    )

    return NextResponse.json({ 
      success: true, 
      message: 'Executive briefing sent successfully!' 
    })
  } catch (error) {
    console.error('Error sending executive briefing:', error)
    return NextResponse.json(
      { error: 'Failed to send executive briefing' },
      { status: 500 }
    )
  }
}