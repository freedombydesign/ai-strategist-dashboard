import { NextRequest, NextResponse } from 'next/server'
import { triggerExecutiveBriefing, triggerCriticalAlert, triggerCashFlowWarning } from '@/lib/emailTriggers'

// Test the Freedom Suite email system
export async function POST(request: NextRequest) {
  try {
    const { emailType, userId } = await request.json()

    if (!emailType || !userId) {
      return NextResponse.json({ 
        error: 'Missing required fields: emailType, userId' 
      }, { status: 400 })
    }

    let result = false
    
    switch (emailType) {
      case 'executive_briefing':
        result = await triggerExecutiveBriefing(userId, {
          topPriority: "Client portfolio risk assessment needed - Top 3 clients represent 47% of revenue",
          keyWin: "December revenue exceeded target by 12% ($485k vs $433k target)",
          mainConcern: "Sales conversion rate declined to 24% from 31% last month - pipeline quality issue",
          healthScore: 8.4,
          healthTrend: 'improving',
          immediateActions: [
            'Schedule client portfolio diversification strategy session',
            'Investigate sales process bottlenecks causing conversion drop',
            'Review top 3 client contract renewal timelines'
          ]
        })
        break

      case 'critical_alert':
        result = await triggerCriticalAlert(userId, {
          alertTitle: "Client Churn Risk Detected",
          alertMessage: "TechCorp Solutions showing early churn signals: 36% increase in support tickets, 2-day response time delay",
          detailedExplanation: "Multiple indicators suggest TechCorp may be considering alternatives: increased complaint frequency, delayed payment (now 18 days vs 5-day average), reduced engagement in project meetings (3 cancellations this month). Historical analysis shows similar patterns preceded 2 other client departures.",
          timeToImpact: "within 4-6 weeks",
          affectedRevenue: 85000,
          recommendedActions: [
            'Schedule immediate client health check call with decision maker',
            'Review recent project deliverables for quality issues',
            'Prepare client retention strategy with value-add propositions'
          ]
        })
        break

      case 'cash_flow_warning':
        result = await triggerCashFlowWarning(userId, {
          warningType: "Overdue Payments Alert",
          message: "3 major invoices totaling $127k are approaching 30-day overdue mark",
          overdueAmount: 127000,
          projectedInflow: 245000,
          urgency: 'high'
        })
        break

      default:
        return NextResponse.json({ 
          error: `Unknown email type: ${emailType}. Use: executive_briefing, critical_alert, or cash_flow_warning` 
        }, { status: 400 })
    }

    return NextResponse.json({
      success: result,
      message: result 
        ? `Test ${emailType} email scheduled successfully!` 
        : `Failed to schedule ${emailType} email`,
      emailType,
      userId
    })

  } catch (error) {
    console.error('[TEST-EMAIL] Error:', error)
    return NextResponse.json({
      error: 'Failed to test email system',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Get instructions for testing
export async function GET() {
  return NextResponse.json({
    message: "Freedom Suite Email Testing Endpoint",
    instructions: {
      endpoint: "/api/freedom-suite/test-email",
      method: "POST",
      body: {
        emailType: "executive_briefing | critical_alert | cash_flow_warning",
        userId: "your-user-id-here"
      }
    },
    examples: [
      {
        description: "Test executive briefing email",
        curl: `curl -X POST ${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/freedom-suite/test-email -H "Content-Type: application/json" -d '{"emailType": "executive_briefing", "userId": "your-user-id"}'`
      },
      {
        description: "Test critical alert email", 
        curl: `curl -X POST ${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/freedom-suite/test-email -H "Content-Type: application/json" -d '{"emailType": "critical_alert", "userId": "your-user-id"}'`
      },
      {
        description: "Test cash flow warning email",
        curl: `curl -X POST ${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/freedom-suite/test-email -H "Content-Type: application/json" -d '{"emailType": "cash_flow_warning", "userId": "your-user-id"}'`
      }
    ],
    notes: [
      "Make sure you have RESEND_API_KEY in your environment variables",
      "Update your email preferences in the database to receive emails",
      "Check your spam folder if emails don't arrive in inbox"
    ]
  })
}