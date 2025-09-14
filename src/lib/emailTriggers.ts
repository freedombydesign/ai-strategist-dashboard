// Freedom Suite Email Notification Triggers
// Call these functions from any system to trigger email notifications

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000')

interface EmailTriggerData {
  triggerType: string
  userId: string
  data: any
}

/**
 * Generic function to trigger email notifications
 */
async function triggerEmail({ triggerType, userId, data }: EmailTriggerData): Promise<boolean> {
  try {
    const response = await fetch(`${BASE_URL}/api/freedom-suite/email-triggers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ triggerType, userId, data })
    })

    if (response.ok) {
      console.log(`[EMAIL-TRIGGER] ${triggerType} scheduled successfully for user ${userId}`)
      return true
    } else {
      console.error(`[EMAIL-TRIGGER] Failed to schedule ${triggerType}:`, await response.text())
      return false
    }
  } catch (error) {
    console.error(`[EMAIL-TRIGGER] Error scheduling ${triggerType}:`, error)
    return false
  }
}

// ============================================================================
// SYSTEM-SPECIFIC EMAIL TRIGGERS
// ============================================================================

/**
 * Executive Intelligence - Send daily briefing
 */
export async function triggerExecutiveBriefing(userId: string, briefingData: {
  topPriority?: string
  keyWin?: string
  mainConcern?: string
  healthScore?: number
  healthTrend?: 'improving' | 'stable' | 'declining'
  immediateActions?: string[]
}): Promise<boolean> {
  return triggerEmail({
    triggerType: 'executive_briefing',
    userId,
    data: briefingData
  })
}

/**
 * Predictive Alerts - Send critical business alert
 */
export async function triggerCriticalAlert(userId: string, alertData: {
  alertTitle: string
  alertMessage: string
  detailedExplanation?: string
  timeToImpact?: string
  affectedRevenue?: number
  recommendedActions?: string[]
}): Promise<boolean> {
  return triggerEmail({
    triggerType: 'critical_alert',
    userId,
    data: alertData
  })
}

/**
 * Cash Flow Command - Send cash flow warning
 */
export async function triggerCashFlowWarning(userId: string, warningData: {
  warningType: string
  message: string
  overdueAmount?: number
  projectedInflow?: number
  urgency?: 'low' | 'medium' | 'high' | 'critical'
}): Promise<boolean> {
  return triggerEmail({
    triggerType: 'cash_flow_warning',
    userId,
    data: warningData
  })
}

/**
 * Client Journey - Send journey milestone update
 */
export async function triggerClientJourneyUpdate(userId: string, journeyData: {
  clientName: string
  currentStage: string
  progressPercentage: number
  completedAction: string
  nextAction: string
  nextActionDue: string
}): Promise<boolean> {
  return triggerEmail({
    triggerType: 'client_journey_update',
    userId,
    data: journeyData
  })
}

/**
 * Project Delivery - Send project status update
 */
export async function triggerProjectUpdate(userId: string, projectData: {
  projectName: string
  clientName: string
  status: string
  completionPercentage: number
  upcomingDeadlines: string[]
  issuesToAddress: string[]
}): Promise<boolean> {
  return triggerEmail({
    triggerType: 'project_update',
    userId,
    data: projectData
  })
}

/**
 * Sales Pipeline - Send conversion opportunity alert
 */
export async function triggerSalesOpportunity(userId: string, opportunityData: {
  leadName: string
  company: string
  dealValue: number
  stage: string
  nextAction: string
  probability: number
}): Promise<boolean> {
  return triggerEmail({
    triggerType: 'sales_opportunity',
    userId,
    data: opportunityData
  })
}

/**
 * Business Insights - Send weekly summary
 */
export async function triggerWeeklySummary(userId: string, summaryData: {
  weeklyHighlight: string
  keyMetrics: any[]
  topInsights: string[]
  recommendedFocus: string[]
  experimentsToTry: string[]
}): Promise<boolean> {
  return triggerEmail({
    triggerType: 'weekly_summary',
    userId,
    data: summaryData
  })
}

// ============================================================================
// BATCH EMAIL TRIGGERS
// ============================================================================

/**
 * Trigger daily briefings for all premium users
 */
export async function triggerDailyBriefingsForAll(): Promise<boolean> {
  return triggerEmail({
    triggerType: 'daily_briefings',
    userId: 'system',
    data: {}
  })
}

/**
 * Check and trigger overdue payment reminders
 */
export async function triggerOverduePaymentReminders(userId: string): Promise<boolean> {
  return triggerEmail({
    triggerType: 'overdue_payment_check',
    userId,
    data: {}
  })
}

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/*
// Example 1: Trigger executive briefing after generating daily briefing
const briefingResult = await generateDailyBriefing(userId)
await triggerExecutiveBriefing(userId, {
  topPriority: "Client portfolio risk assessment needed",
  keyWin: "Revenue exceeded target by 12%",
  mainConcern: "Sales conversion rate declined",
  healthScore: 8.4,
  healthTrend: 'improving'
})

// Example 2: Trigger critical alert from predictive analysis
await triggerCriticalAlert(userId, {
  alertTitle: "Client Churn Risk Detected",
  alertMessage: "TechCorp showing early churn signals",
  detailedExplanation: "Multiple indicators suggest TechCorp may be considering alternatives...",
  timeToImpact: "within 4-6 weeks",
  affectedRevenue: 85000
})

// Example 3: Trigger cash flow warning from payment analysis
await triggerCashFlowWarning(userId, {
  warningType: "Overdue Payments Alert",
  message: "3 invoices totaling $45k are overdue",
  overdueAmount: 45000,
  projectedInflow: 125000,
  urgency: 'high'
})
*/