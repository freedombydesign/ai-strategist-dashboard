import { supabase } from '@/lib/supabase'
import { hubspotIntegrationService } from './hubspotIntegrationService'

export interface QualificationCriteria {
  industry: string
  budgetThreshold: number
  timelineMaxDays: number
  companySize: string[]
  leadSourceWeight: Record<string, number>
  behaviorWeight: Record<string, number>
  demographicWeight: Record<string, number>
}

export interface LeadQualificationResult {
  leadId: string
  overallScore: number
  qualificationStatus: 'hot' | 'warm' | 'cold' | 'unqualified'
  recommendation: string
  nextActions: string[]
  scoreBreakdown: {
    demographic: number
    behavioral: number
    engagement: number
    firmographic: number
    intent: number
  }
  insights: string[]
  priority: 'urgent' | 'high' | 'medium' | 'low'
}

class LeadQualificationService {
  // Advanced lead qualification with ML-style scoring
  async qualifyLead(leadId: string, criteria?: QualificationCriteria): Promise<LeadQualificationResult> {
    try {
      // Get lead with all related data
      const { data: lead, error } = await supabase
        .from('convert_flow_leads')
        .select(`
          *,
          convert_flow_lead_activities!convert_flow_lead_activities_lead_id_fkey(*)
        `)
        .eq('id', leadId)
        .single()

      if (error || !lead) {
        throw new Error('Lead not found')
      }

      // Use industry-specific criteria if not provided
      const qualCriteria = criteria || await this.getIndustryCriteria(lead.industry || 'general')

      // Calculate multi-dimensional scores
      const demographic = this.calculateDemographicScore(lead, qualCriteria)
      const behavioral = this.calculateBehavioralScore(lead, lead.convert_flow_lead_activities, qualCriteria)
      const engagement = this.calculateEngagementScore(lead, lead.convert_flow_lead_activities)
      const firmographic = this.calculateFirmographicScore(lead, qualCriteria)
      const intent = this.calculateIntentScore(lead, lead.convert_flow_lead_activities)

      // Weighted overall score
      const overallScore = Math.round(
        (demographic * 0.20) +
        (behavioral * 0.25) + 
        (engagement * 0.20) +
        (firmographic * 0.25) +
        (intent * 0.10)
      )

      const qualificationStatus = this.determineQualificationStatus(overallScore, intent)
      const priority = this.determinePriority(overallScore, intent, demographic)
      
      // Generate intelligent insights
      const insights = this.generateInsights(lead, {
        demographic, behavioral, engagement, firmographic, intent
      })

      // Determine next actions based on score and status
      const nextActions = this.generateNextActions(qualificationStatus, insights, lead)
      const recommendation = this.generateRecommendation(qualificationStatus, overallScore, insights)

      // Update lead score in database
      await this.updateLeadQualification(leadId, overallScore, qualificationStatus, insights)

      return {
        leadId,
        overallScore,
        qualificationStatus,
        recommendation,
        nextActions,
        scoreBreakdown: {
          demographic,
          behavioral,
          engagement,
          firmographic,
          intent
        },
        insights,
        priority
      }

    } catch (error) {
      console.error('[LEAD-QUALIFICATION] Error qualifying lead:', error)
      throw error
    }
  }

  // Bulk qualify leads with advanced filtering
  async bulkQualifyLeads(filters?: {
    industry?: string
    minScore?: number
    maxAge?: number
    status?: string[]
  }): Promise<LeadQualificationResult[]> {
    try {
      let query = supabase
        .from('convert_flow_leads')
        .select(`
          *,
          convert_flow_lead_activities!convert_flow_lead_activities_lead_id_fkey(*)
        `)
        .order('created_at', { ascending: false })
        .limit(100)

      // Apply filters
      if (filters?.industry) {
        query = query.eq('industry', filters.industry)
      }
      
      if (filters?.minScore) {
        query = query.gte('lead_score', filters.minScore)
      }

      if (filters?.maxAge) {
        const cutoffDate = new Date(Date.now() - filters.maxAge * 24 * 60 * 60 * 1000).toISOString()
        query = query.gte('created_at', cutoffDate)
      }

      if (filters?.status?.length) {
        query = query.in('status', filters.status)
      }

      const { data: leads, error } = await query

      if (error) {
        throw new Error(`Failed to fetch leads: ${error.message}`)
      }

      // Qualify each lead
      const qualificationResults = []
      for (const lead of leads || []) {
        try {
          const result = await this.qualifyLead(lead.id)
          qualificationResults.push(result)
        } catch (error) {
          console.error(`Failed to qualify lead ${lead.id}:`, error)
        }
      }

      return qualificationResults.sort((a, b) => b.overallScore - a.overallScore)

    } catch (error) {
      console.error('[LEAD-QUALIFICATION] Error in bulk qualification:', error)
      throw error
    }
  }

  // Calculate demographic score (20% weight)
  private calculateDemographicScore(lead: any, criteria: QualificationCriteria): number {
    let score = 50 // Base score

    // Title/Role scoring
    if (lead.title) {
      const titleScore = this.scoreTitleSeniority(lead.title)
      score += titleScore
    }

    // Industry match
    if (lead.industry === criteria.industry) {
      score += 15
    } else if (lead.industry) {
      score += 5 // Some industry better than none
    }

    // Location scoring (if applicable)
    if (lead.location && this.isTargetLocation(lead.location)) {
      score += 10
    }

    // Contact completeness
    const completeness = this.calculateProfileCompleteness(lead)
    score += completeness * 0.2 // Up to 20 points for complete profile

    return Math.min(Math.max(score, 0), 100)
  }

  // Calculate behavioral score (25% weight)
  private calculateBehavioralScore(lead: any, activities: any[], criteria: QualificationCriteria): number {
    if (!activities?.length) return 30 // Low but not zero

    let score = 40 // Base score

    // Activity frequency and recency
    const recentActivities = activities.filter(a => 
      new Date(a.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    )
    
    score += Math.min(recentActivities.length * 3, 30) // Up to 30 points for recent activity

    // High-value activities
    const highValueActivities = activities.filter(a => 
      ['demo_requested', 'pricing_page_visit', 'proposal_viewed', 'call_scheduled'].includes(a.activity_type)
    )
    score += highValueActivities.length * 15 // 15 points per high-value activity

    // Engagement patterns
    const emailEngagement = activities.filter(a => a.activity_type.includes('email')).length
    const websiteEngagement = activities.filter(a => a.activity_type.includes('page_visit')).length
    
    if (emailEngagement > 5 && websiteEngagement > 10) {
      score += 20 // Multi-channel engagement bonus
    }

    // Negative behaviors
    const negativeActivities = activities.filter(a => 
      ['unsubscribe', 'bounced_email', 'complaint'].includes(a.activity_type)
    )
    score -= negativeActivities.length * 20

    return Math.min(Math.max(score, 0), 100)
  }

  // Calculate engagement score (20% weight)
  private calculateEngagementScore(lead: any, activities: any[]): number {
    let score = 30 // Base score

    // Email engagement rates
    if (lead.email_opens > 0) {
      const openRate = lead.email_opens / Math.max(lead.emails_sent || 1, 1)
      score += Math.min(openRate * 100, 25) // Up to 25 points for open rate
    }

    if (lead.email_clicks > 0) {
      const clickRate = lead.email_clicks / Math.max(lead.email_opens || 1, 1)
      score += Math.min(clickRate * 150, 25) // Up to 25 points for click rate
    }

    // Website engagement
    if (lead.page_views > 0) {
      score += Math.min(lead.page_views, 20) // Up to 20 points for page views
    }

    // Content downloads
    const contentDownloads = activities?.filter(a => a.activity_type === 'content_download').length || 0
    score += Math.min(contentDownloads * 10, 30) // Up to 30 points for downloads

    return Math.min(Math.max(score, 0), 100)
  }

  // Calculate firmographic score (25% weight)
  private calculateFirmographicScore(lead: any, criteria: QualificationCriteria): number {
    let score = 40 // Base score

    // Company size
    if (lead.company_size && criteria.companySize?.includes(lead.company_size)) {
      score += 25
    }

    // Annual revenue
    if (lead.annual_revenue) {
      const revenueScore = this.scoreAnnualRevenue(lead.annual_revenue)
      score += revenueScore
    }

    // Budget alignment
    if (lead.budget_range) {
      const budgetScore = this.scoreBudgetRange(lead.budget_range, criteria.budgetThreshold)
      score += budgetScore
    }

    // Company presence (website, LinkedIn, etc.)
    if (lead.company && lead.company !== 'N/A') {
      score += 10
    }

    return Math.min(Math.max(score, 0), 100)
  }

  // Calculate intent score (10% weight)
  private calculateIntentScore(lead: any, activities: any[]): number {
    let score = 20 // Base score

    // Timeline urgency
    if (lead.decision_timeline) {
      const timelineScore = this.scoreTimeline(lead.decision_timeline)
      score += timelineScore
    }

    // Pain point severity
    if (lead.pain_points?.length > 0) {
      score += Math.min(lead.pain_points.length * 10, 30)
    }

    // Recent high-intent activities
    const highIntentActivities = activities?.filter(a => 
      ['demo_requested', 'pricing_page_visit', 'call_scheduled', 'proposal_viewed'].includes(a.activity_type) &&
      new Date(a.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ) || []

    score += highIntentActivities.length * 15 // 15 points per recent high-intent activity

    // Competitive research indicators
    const competitorResearch = activities?.filter(a => 
      a.activity_data?.page_url?.includes('competitors') ||
      a.activity_data?.search_terms?.includes('vs') ||
      a.activity_data?.search_terms?.includes('alternative')
    ) || []

    if (competitorResearch.length > 0) {
      score += 25 // Strong intent signal
    }

    return Math.min(Math.max(score, 0), 100)
  }

  // Helper methods
  private scoreTitleSeniority(title: string): number {
    const seniorTitles = ['ceo', 'cto', 'cfo', 'president', 'founder', 'owner', 'director', 'vp', 'head of']
    const midTitles = ['manager', 'lead', 'senior', 'principal']
    
    const lowerTitle = title.toLowerCase()
    
    if (seniorTitles.some(t => lowerTitle.includes(t))) return 25
    if (midTitles.some(t => lowerTitle.includes(t))) return 15
    return 5
  }

  private scoreAnnualRevenue(revenue: string): number {
    const revenueMap: Record<string, number> = {
      'under_1m': 5,
      '1m_5m': 15,
      '5m_20m': 25,
      '20m_100m': 20, // Might be too enterprise
      'over_100m': 10  // Likely too enterprise
    }
    return revenueMap[revenue] || 0
  }

  private scoreBudgetRange(budget: string, threshold: number): number {
    const budgetValues: Record<string, number> = {
      'under_10k': 5000,
      '10k_25k': 17500,
      '25k_50k': 37500,
      '50k_100k': 75000,
      'over_100k': 150000
    }
    
    const budgetValue = budgetValues[budget] || 0
    if (budgetValue >= threshold) return 25
    if (budgetValue >= threshold * 0.5) return 15
    if (budgetValue >= threshold * 0.25) return 5
    return 0
  }

  private scoreTimeline(timeline: string): number {
    const timelineMap: Record<string, number> = {
      'immediate': 30,
      '1_month': 25,
      '3_months': 15,
      '6_months': 10,
      'no_timeline': 0
    }
    return timelineMap[timeline] || 5
  }

  private calculateProfileCompleteness(lead: any): number {
    const fields = ['first_name', 'last_name', 'email', 'phone', 'company', 'title', 'industry']
    const completedFields = fields.filter(field => lead[field] && lead[field] !== '').length
    return (completedFields / fields.length) * 100
  }

  private isTargetLocation(location: string): boolean {
    // Implement location-based scoring logic
    const targetRegions = ['US', 'Canada', 'UK', 'Australia', 'Germany']
    return targetRegions.some(region => location.includes(region))
  }

  // Determination methods
  private determineQualificationStatus(overallScore: number, intentScore: number): 'hot' | 'warm' | 'cold' | 'unqualified' {
    if (overallScore >= 80 || (overallScore >= 70 && intentScore >= 80)) return 'hot'
    if (overallScore >= 60 || (overallScore >= 50 && intentScore >= 60)) return 'warm'
    if (overallScore >= 40) return 'cold'
    return 'unqualified'
  }

  private determinePriority(overallScore: number, intentScore: number, demographicScore: number): 'urgent' | 'high' | 'medium' | 'low' {
    if (overallScore >= 85 || intentScore >= 90) return 'urgent'
    if (overallScore >= 70 || (intentScore >= 70 && demographicScore >= 70)) return 'high'
    if (overallScore >= 50) return 'medium'
    return 'low'
  }

  // AI-style insight generation
  private generateInsights(lead: any, scores: any): string[] {
    const insights = []

    // Demographic insights
    if (scores.demographic >= 80) {
      insights.push('Perfect demographic fit - senior decision maker with complete profile')
    } else if (scores.demographic <= 40) {
      insights.push('Incomplete profile information - need more qualification data')
    }

    // Behavioral insights
    if (scores.behavioral >= 80) {
      insights.push('Highly engaged with multiple touchpoints and premium content')
    } else if (scores.behavioral <= 30) {
      insights.push('Low engagement levels - may need different communication approach')
    }

    // Intent insights
    if (scores.intent >= 80) {
      insights.push('Strong buying intent - actively researching solutions')
    } else if (scores.intent <= 30) {
      insights.push('Early stage buyer - focus on education and nurturing')
    }

    // Firmographic insights
    if (scores.firmographic >= 80) {
      insights.push('Company profile matches ideal customer criteria')
    } else if (scores.firmographic <= 40) {
      insights.push('Company may be outside target market parameters')
    }

    // Timeline insights
    if (lead.decision_timeline === 'immediate') {
      insights.push('URGENT: Immediate buying timeline - prioritize for immediate contact')
    }

    return insights
  }

  private generateNextActions(status: string, insights: string[], lead: any): string[] {
    const actions = []

    switch (status) {
      case 'hot':
        actions.push('Schedule immediate discovery call')
        actions.push('Send personalized proposal within 24 hours')
        actions.push('Assign to senior sales representative')
        if (lead.phone) actions.push('Make direct phone call today')
        break

      case 'warm':
        actions.push('Schedule qualification call within 3 days')
        actions.push('Send relevant case study')
        actions.push('Add to high-priority nurture sequence')
        break

      case 'cold':
        actions.push('Add to educational nurture sequence')
        actions.push('Send valuable industry content')
        actions.push('Schedule follow-up in 2 weeks')
        break

      case 'unqualified':
        actions.push('Verify contact information')
        actions.push('Send basic qualification survey')
        actions.push('Consider removing from active pipeline')
        break
    }

    // Add specific actions based on insights
    if (insights.some(i => i.includes('incomplete profile'))) {
      actions.push('Send profile completion campaign')
    }

    if (insights.some(i => i.includes('low engagement'))) {
      actions.push('Try different communication channels')
    }

    return actions
  }

  private generateRecommendation(status: string, score: number, insights: string[]): string {
    const recommendations: Record<string, string> = {
      'hot': `PRIORITY LEAD (Score: ${score}/100) - This lead shows strong buying intent and fits your ideal customer profile. Immediate personal outreach recommended.`,
      'warm': `QUALIFIED LEAD (Score: ${score}/100) - Good potential with some qualification needed. Schedule a discovery call to move forward.`,
      'cold': `NURTURE REQUIRED (Score: ${score}/100) - Early stage prospect that needs education and relationship building before sales approach.`,
      'unqualified': `NOT QUALIFIED (Score: ${score}/100) - Does not meet minimum criteria or lacks sufficient information for qualification.`
    }

    return recommendations[status] || 'Unable to determine recommendation'
  }

  // Update lead qualification in database
  private async updateLeadQualification(
    leadId: string, 
    score: number, 
    status: string, 
    insights: string[]
  ): Promise<void> {
    try {
      await supabase
        .from('convert_flow_leads')
        .update({
          lead_score: score,
          qualification_status: status,
          updated_at: new Date().toISOString()
        })
        .eq('id', leadId)

      // Log qualification activity
      await supabase
        .from('convert_flow_lead_activities')
        .insert({
          lead_id: leadId,
          activity_type: 'lead_qualified',
          activity_data: {
            previous_score: null,
            new_score: score,
            qualification_status: status,
            insights: insights.slice(0, 3) // Store top 3 insights
          },
          created_at: new Date().toISOString()
        })

    } catch (error) {
      console.error('[LEAD-QUALIFICATION] Failed to update lead qualification:', error)
    }
  }

  // Get industry-specific qualification criteria
  private async getIndustryCriteria(industry: string): Promise<QualificationCriteria> {
    // In production, this would come from database or configuration
    const defaultCriteria: QualificationCriteria = {
      industry,
      budgetThreshold: 25000,
      timelineMaxDays: 180,
      companySize: ['11_50', '51_200', '201_500'],
      leadSourceWeight: {
        'referral': 1.5,
        'direct': 1.2,
        'organic_search': 1.1,
        'paid_search': 1.0,
        'social_media': 0.8,
        'unknown': 0.5
      },
      behaviorWeight: {
        'demo_requested': 25,
        'pricing_page_visit': 20,
        'case_study_download': 15,
        'webinar_attended': 18,
        'email_click': 5
      },
      demographicWeight: {
        'senior_title': 25,
        'target_industry': 20,
        'complete_profile': 15
      }
    }

    // Industry-specific adjustments
    const industryAdjustments: Record<string, Partial<QualificationCriteria>> = {
      'consulting': {
        budgetThreshold: 50000,
        companySize: ['51_200', '201_500', '500_plus']
      },
      'legal': {
        budgetThreshold: 15000,
        timelineMaxDays: 90
      },
      'financial_advisor': {
        budgetThreshold: 100000,
        companySize: ['1_10', '11_50']
      },
      'real_estate': {
        budgetThreshold: 10000,
        timelineMaxDays: 60
      }
    }

    return { ...defaultCriteria, ...industryAdjustments[industry] }
  }
}

export const leadQualificationService = new LeadQualificationService()