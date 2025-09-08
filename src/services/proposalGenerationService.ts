import { supabase } from '@/lib/supabase'
import { hubspotIntegrationService } from './hubspotIntegrationService'
import { leadQualificationService } from './leadQualificationService'

export interface ProposalTemplate {
  id: string
  industry: string
  serviceType: string
  basePrice: number
  pricingModel: 'fixed' | 'hourly' | 'value_based' | 'retainer'
  services: ServiceComponent[]
  terms: ContractTerms
}

export interface ServiceComponent {
  name: string
  description: string
  deliverables: string[]
  timeline: string
  basePrice: number
  complexity_multiplier: number
  urgency_multiplier: number
  scope_options: ScopeOption[]
}

export interface ScopeOption {
  name: string
  description: string
  price_adjustment: number
  timeline_adjustment: number
}

export interface ContractTerms {
  payment_schedule: string
  deliverable_schedule: string[]
  revision_rounds: number
  cancellation_policy: string
  scope_change_policy: string
}

export interface DynamicPricingFactors {
  leadScore: number
  urgency: string
  companySize: string
  industry: string
  budgetRange: string
  competitiveScenario: boolean
  referralSource: string
  seasonality: number
}

export interface GeneratedProposal {
  leadId: string
  proposalNumber: string
  services: ServiceComponent[]
  pricing: ProposalPricing
  timeline: ProjectTimeline
  terms: ContractTerms
  personalizedContent: PersonalizedContent
  nextSteps: string[]
  validUntil: string
}

export interface ProposalPricing {
  subtotal: number
  discounts: PricingAdjustment[]
  addOns: PricingAdjustment[]
  total: number
  paymentSchedule: PaymentMilestone[]
}

export interface PaymentMilestone {
  name: string
  percentage: number
  amount: number
  dueDate: string
  deliverables: string[]
}

export interface ProjectTimeline {
  totalDuration: number
  phases: ProjectPhase[]
  keyMilestones: Milestone[]
}

export interface ProjectPhase {
  name: string
  duration: number
  deliverables: string[]
  dependencies: string[]
}

export interface PersonalizedContent {
  executiveSummary: string
  problemStatement: string
  recommendedSolution: string
  caseStudies: CaseStudy[]
  testimonials: Testimonial[]
  aboutSection: string
}

class ProposalGenerationService {
  // Generate comprehensive proposal from lead data and responses
  async generateProposal(leadId: string, customRequirements?: any): Promise<GeneratedProposal> {
    try {
      // Get lead with qualification data
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

      // Get industry-specific proposal template
      const template = await this.getProposalTemplate(lead.industry, lead.service_interest || 'general')

      // Calculate dynamic pricing based on lead profile
      const pricingFactors: DynamicPricingFactors = {
        leadScore: lead.lead_score || 50,
        urgency: lead.decision_timeline || 'no_timeline',
        companySize: lead.company_size || 'unknown',
        industry: lead.industry || 'general',
        budgetRange: lead.budget_range || 'unknown',
        competitiveScenario: this.detectCompetitiveScenario(lead),
        referralSource: lead.lead_source || 'unknown',
        seasonality: this.getSeasonalityFactor()
      }

      // Generate personalized content
      const personalizedContent = await this.generatePersonalizedContent(lead, template)

      // Calculate pricing with dynamic adjustments
      const pricing = this.calculateDynamicPricing(template, pricingFactors, customRequirements)

      // Generate project timeline
      const timeline = this.generateProjectTimeline(template, pricingFactors)

      // Create proposal number
      const proposalNumber = await this.generateProposalNumber()

      // Determine contract terms
      const terms = this.customizeContractTerms(template.terms, pricingFactors)

      const proposal: GeneratedProposal = {
        leadId,
        proposalNumber,
        services: this.customizeServices(template.services, lead, customRequirements),
        pricing,
        timeline,
        terms,
        personalizedContent,
        nextSteps: this.generateNextSteps(lead, pricing),
        validUntil: this.calculateValidUntil(pricingFactors.urgency)
      }

      // Save proposal to database
      await this.saveProposalToDatabase(proposal)

      // Create HubSpot deal if not exists
      await hubspotIntegrationService.syncProposalToHubSpot(leadId)

      // Log proposal generation activity
      await supabase
        .from('convert_flow_lead_activities')
        .insert({
          lead_id: leadId,
          activity_type: 'proposal_generated',
          activity_data: {
            proposal_number: proposalNumber,
            total_amount: pricing.total,
            services_count: proposal.services.length
          },
          score_change: 15, // Bonus for reaching proposal stage
          created_at: new Date().toISOString()
        })

      return proposal

    } catch (error) {
      console.error('[PROPOSAL-GENERATION] Error generating proposal:', error)
      throw error
    }
  }

  // Get industry-specific proposal template
  private async getProposalTemplate(industry: string, serviceType: string): Promise<ProposalTemplate> {
    const templates = this.getIndustryTemplates()
    const template = templates[industry]?.[serviceType] || templates['general']['consulting']

    return {
      ...template,
      id: `${industry}_${serviceType}`,
      industry,
      serviceType
    }
  }

  // Calculate dynamic pricing based on multiple factors
  private calculateDynamicPricing(
    template: ProposalTemplate, 
    factors: DynamicPricingFactors,
    customRequirements?: any
  ): ProposalPricing {
    let basePrice = template.basePrice
    const discounts: PricingAdjustment[] = []
    const addOns: PricingAdjustment[] = []

    // Lead score pricing adjustment
    if (factors.leadScore >= 85) {
      // Premium pricing for highly qualified leads
      basePrice *= 1.15
    } else if (factors.leadScore <= 40) {
      // Discount for lower quality leads to increase conversion
      const discount = basePrice * 0.10
      discounts.push({
        name: 'New Client Discount',
        description: 'Welcome discount for new partnership',
        amount: -discount,
        type: 'percentage'
      })
    }

    // Urgency pricing
    if (factors.urgency === 'immediate') {
      const urgencyFee = basePrice * 0.20
      addOns.push({
        name: 'Priority Delivery',
        description: 'Fast-track delivery for immediate timeline',
        amount: urgencyFee,
        type: 'percentage'
      })
    }

    // Company size adjustments
    const sizeMultipliers: Record<string, number> = {
      '1_10': 0.8,
      '11_50': 1.0,
      '51_200': 1.2,
      '201_500': 1.4,
      '500_plus': 1.6
    }
    basePrice *= sizeMultipliers[factors.companySize] || 1.0

    // Budget alignment
    if (factors.budgetRange) {
      const budgetAlignment = this.calculateBudgetAlignment(basePrice, factors.budgetRange)
      if (budgetAlignment.adjustment !== 0) {
        if (budgetAlignment.adjustment < 0) {
          discounts.push({
            name: 'Budget Optimization',
            description: 'Adjusted scope to fit budget parameters',
            amount: budgetAlignment.adjustment,
            type: 'fixed'
          })
        } else {
          addOns.push({
            name: 'Enhanced Scope',
            description: 'Additional value within budget range',
            amount: budgetAlignment.adjustment,
            type: 'fixed'
          })
        }
      }
    }

    // Competitive scenario pricing
    if (factors.competitiveScenario) {
      const competitiveDiscount = basePrice * 0.08
      discounts.push({
        name: 'Competitive Match',
        description: 'Price adjustment for competitive evaluation',
        amount: -competitiveDiscount,
        type: 'percentage'
      })
    }

    // Referral source bonus
    if (factors.referralSource === 'referral') {
      const referralDiscount = basePrice * 0.05
      discounts.push({
        name: 'Referral Appreciation',
        description: 'Thank you for the trusted referral',
        amount: -referralDiscount,
        type: 'percentage'
      })
    }

    // Seasonality adjustment
    if (factors.seasonality !== 1.0) {
      const seasonalAdjustment = basePrice * (factors.seasonality - 1.0)
      if (seasonalAdjustment > 0) {
        addOns.push({
          name: 'Peak Season Premium',
          description: 'High-demand period adjustment',
          amount: seasonalAdjustment,
          type: 'percentage'
        })
      } else {
        discounts.push({
          name: 'Off-Season Savings',
          description: 'Special pricing for off-peak period',
          amount: seasonalAdjustment,
          type: 'percentage'
        })
      }
    }

    // Calculate totals
    const discountTotal = discounts.reduce((sum, d) => sum + d.amount, 0)
    const addOnTotal = addOns.reduce((sum, a) => sum + a.amount, 0)
    const subtotal = basePrice
    const total = Math.round((subtotal + addOnTotal + discountTotal) * 100) / 100

    // Generate payment schedule
    const paymentSchedule = this.generatePaymentSchedule(total, template.pricingModel, factors.urgency)

    return {
      subtotal,
      discounts,
      addOns,
      total,
      paymentSchedule
    }
  }

  // Generate personalized content based on lead responses
  private async generatePersonalizedContent(lead: any, template: ProposalTemplate): Promise<PersonalizedContent> {
    const painPoints = lead.pain_points || ['general business challenges']
    const industry = lead.industry || 'business'
    const companyName = lead.company || `${lead.first_name}'s business`

    const executiveSummary = this.generateExecutiveSummary(lead, template)
    const problemStatement = this.generateProblemStatement(lead, painPoints)
    const recommendedSolution = this.generateSolutionRecommendation(lead, template)
    
    // Select relevant case studies and testimonials
    const caseStudies = await this.selectRelevantCaseStudies(lead.industry, lead.company_size)
    const testimonials = await this.selectRelevantTestimonials(lead.industry)

    return {
      executiveSummary,
      problemStatement,
      recommendedSolution,
      caseStudies,
      testimonials,
      aboutSection: this.generateAboutSection(lead.industry)
    }
  }

  // Generate executive summary
  private generateExecutiveSummary(lead: any, template: ProposalTemplate): string {
    const companyName = lead.company || `${lead.first_name}'s business`
    const industry = lead.industry || 'business'
    
    return `Thank you for the opportunity to present our ${template.serviceType} solution for ${companyName}. 

Based on our discussion about your ${lead.pain_points?.[0] || 'business challenges'}, we've developed a comprehensive approach that addresses your specific needs in the ${industry} industry.

This proposal outlines a strategic partnership that will help ${companyName} achieve ${this.generateBusinessOutcome(lead)} while ensuring a seamless implementation process that minimizes disruption to your current operations.

Our recommended approach combines industry best practices with innovative strategies tailored specifically for ${industry} businesses of your size and scope.`
  }

  // Generate problem statement
  private generateProblemStatement(lead: any, painPoints: string[]): string {
    const companyName = lead.company || 'your business'
    
    return `Based on our consultation, ${companyName} is currently facing several key challenges:

${painPoints.map((point, index) => `${index + 1}. ${this.expandPainPoint(point)}`).join('\n')}

These challenges are common in the ${lead.industry || 'business'} industry, and without strategic intervention, they typically result in:
• Reduced operational efficiency and increased costs
• Missed growth opportunities and competitive disadvantage  
• Increased stress on leadership and key team members
• Potential revenue loss and market share erosion

The good news is that these challenges are entirely addressable with the right strategic approach and expert implementation.`
  }

  // Industry-specific proposal templates
  private getIndustryTemplates(): Record<string, Record<string, ProposalTemplate>> {
    return {
      'consulting': {
        'strategy': {
          basePrice: 75000,
          pricingModel: 'fixed',
          services: [
            {
              name: 'Strategic Assessment & Analysis',
              description: 'Comprehensive analysis of current operations, market position, and growth opportunities',
              deliverables: [
                'Current state assessment report',
                'Competitive landscape analysis',
                'SWOT analysis and strategic recommendations',
                'Market opportunity assessment'
              ],
              timeline: '4-6 weeks',
              basePrice: 25000,
              complexity_multiplier: 1.2,
              urgency_multiplier: 1.3,
              scope_options: [
                {
                  name: 'Enhanced Market Research',
                  description: 'Deep-dive market research and customer analysis',
                  price_adjustment: 15000,
                  timeline_adjustment: 2
                },
                {
                  name: 'Competitor Intelligence',
                  description: 'Detailed competitive analysis with positioning strategy',
                  price_adjustment: 10000,
                  timeline_adjustment: 1
                }
              ]
            },
            {
              name: 'Strategic Planning & Roadmap',
              description: 'Development of comprehensive 12-month strategic plan with quarterly milestones',
              deliverables: [
                '12-month strategic roadmap',
                'Quarterly milestone planning',
                'Resource allocation framework',
                'KPI dashboard and tracking system'
              ],
              timeline: '3-4 weeks',
              basePrice: 30000,
              complexity_multiplier: 1.1,
              urgency_multiplier: 1.2,
              scope_options: [
                {
                  name: '3-Year Strategic Vision',
                  description: 'Extended planning horizon with long-term vision',
                  price_adjustment: 20000,
                  timeline_adjustment: 2
                }
              ]
            },
            {
              name: 'Implementation Support',
              description: 'Hands-on support for strategy execution and change management',
              deliverables: [
                'Implementation project management',
                'Change management support',
                'Monthly progress reviews',
                'Executive coaching sessions'
              ],
              timeline: '6-8 weeks',
              basePrice: 20000,
              complexity_multiplier: 1.0,
              urgency_multiplier: 1.1,
              scope_options: []
            }
          ],
          terms: {
            payment_schedule: '50% upfront, 25% at midpoint, 25% at completion',
            deliverable_schedule: ['Week 2: Initial assessment', 'Week 6: Strategic plan', 'Week 12: Implementation complete'],
            revision_rounds: 2,
            cancellation_policy: '30-day notice required, work completed to date billable',
            scope_change_policy: 'Additional scope requires written approval and separate pricing'
          }
        }
      },
      'legal': {
        'business_protection': {
          basePrice: 35000,
          pricingModel: 'fixed',
          services: [
            {
              name: 'Business Structure Optimization',
              description: 'Review and optimize corporate structure for liability protection and tax efficiency',
              deliverables: [
                'Entity structure analysis',
                'Liability protection audit',
                'Tax optimization recommendations',
                'Corporate governance documentation'
              ],
              timeline: '2-3 weeks',
              basePrice: 15000,
              complexity_multiplier: 1.3,
              urgency_multiplier: 1.4,
              scope_options: []
            },
            {
              name: 'Contract Portfolio Review',
              description: 'Comprehensive review of all business contracts and agreements',
              deliverables: [
                'Contract risk assessment',
                'Terms improvement recommendations',
                'Template standardization',
                'Negotiation strategy guidance'
              ],
              timeline: '3-4 weeks',
              basePrice: 20000,
              complexity_multiplier: 1.2,
              urgency_multiplier: 1.3,
              scope_options: []
            }
          ],
          terms: {
            payment_schedule: '60% upfront, 40% at completion',
            deliverable_schedule: ['Week 1: Structure analysis', 'Week 4: Contract review', 'Week 6: Final recommendations'],
            revision_rounds: 1,
            cancellation_policy: '15-day notice required',
            scope_change_policy: 'Hourly billing at $850/hour for additional work'
          }
        }
      },
      'marketing_agency': {
        'growth_strategy': {
          basePrice: 45000,
          pricingModel: 'fixed',
          services: [
            {
              name: 'Marketing Audit & Strategy',
              description: 'Comprehensive analysis of current marketing efforts and growth strategy development',
              deliverables: [
                'Current marketing performance analysis',
                'Customer acquisition cost optimization',
                'Channel performance assessment',
                'Growth strategy roadmap'
              ],
              timeline: '4-5 weeks',
              basePrice: 25000,
              complexity_multiplier: 1.1,
              urgency_multiplier: 1.2,
              scope_options: []
            },
            {
              name: 'Campaign Implementation',
              description: 'Setup and launch of optimized marketing campaigns across selected channels',
              deliverables: [
                'Campaign setup and configuration',
                'Creative asset development',
                'Landing page optimization',
                'Tracking and analytics implementation'
              ],
              timeline: '2-3 weeks',
              basePrice: 20000,
              complexity_multiplier: 1.0,
              urgency_multiplier: 1.1,
              scope_options: []
            }
          ],
          terms: {
            payment_schedule: '50% upfront, 50% at campaign launch',
            deliverable_schedule: ['Week 2: Audit complete', 'Week 5: Strategy delivery', 'Week 7: Campaign launch'],
            revision_rounds: 2,
            cancellation_policy: '30-day notice required',
            scope_change_policy: 'Additional campaigns priced separately'
          }
        }
      },
      'general': {
        'consulting': {
          basePrice: 50000,
          pricingModel: 'fixed',
          services: [
            {
              name: 'Business Analysis & Recommendations',
              description: 'Comprehensive business analysis with strategic recommendations',
              deliverables: [
                'Business assessment report',
                'Strategic recommendations',
                'Implementation roadmap',
                'Success metrics framework'
              ],
              timeline: '6-8 weeks',
              basePrice: 50000,
              complexity_multiplier: 1.0,
              urgency_multiplier: 1.2,
              scope_options: []
            }
          ],
          terms: {
            payment_schedule: '50% upfront, 50% at completion',
            deliverable_schedule: ['Week 4: Initial analysis', 'Week 8: Final recommendations'],
            revision_rounds: 1,
            cancellation_policy: '30-day notice required',
            scope_change_policy: 'Additional work billed separately'
          }
        }
      }
    }
  }

  // Helper methods
  private detectCompetitiveScenario(lead: any): boolean {
    const activities = lead.convert_flow_lead_activities || []
    return activities.some((activity: any) => 
      activity.activity_data?.search_terms?.includes('vs') ||
      activity.activity_data?.page_url?.includes('comparison') ||
      activity.activity_data?.referrer?.includes('competitor')
    )
  }

  private getSeasonalityFactor(): number {
    const month = new Date().getMonth()
    // Q4 premium pricing, Q1 discount pricing
    if (month >= 9) return 1.1 // Oct-Dec
    if (month <= 2) return 0.95 // Jan-Mar
    return 1.0
  }

  private calculateBudgetAlignment(proposedPrice: number, budgetRange: string): { adjustment: number, reason: string } {
    const budgetRanges: Record<string, { min: number, max: number }> = {
      'under_10k': { min: 0, max: 10000 },
      '10k_25k': { min: 10000, max: 25000 },
      '25k_50k': { min: 25000, max: 50000 },
      '50k_100k': { min: 50000, max: 100000 },
      'over_100k': { min: 100000, max: 500000 }
    }

    const budget = budgetRanges[budgetRange]
    if (!budget) return { adjustment: 0, reason: 'Unknown budget range' }

    if (proposedPrice < budget.min) {
      // Can add value
      const addition = Math.min(budget.max - proposedPrice, proposedPrice * 0.3)
      return { adjustment: addition, reason: 'Enhanced scope within budget' }
    } else if (proposedPrice > budget.max) {
      // Need to reduce scope/price
      const reduction = proposedPrice - budget.max
      return { adjustment: -reduction, reason: 'Adjusted to fit budget constraints' }
    }

    return { adjustment: 0, reason: 'Price aligns with budget' }
  }

  private generatePaymentSchedule(total: number, pricingModel: string, urgency: string): PaymentMilestone[] {
    const milestones: PaymentMilestone[] = []
    
    if (urgency === 'immediate') {
      // Faster payment schedule for urgent projects
      milestones.push(
        {
          name: 'Project Initiation',
          percentage: 60,
          amount: Math.round(total * 0.6),
          dueDate: 'Upon contract signature',
          deliverables: ['Project kickoff', 'Initial analysis']
        },
        {
          name: 'Project Completion',
          percentage: 40,
          amount: Math.round(total * 0.4),
          dueDate: 'Upon final delivery',
          deliverables: ['Final recommendations', 'Implementation support']
        }
      )
    } else {
      // Standard payment schedule
      milestones.push(
        {
          name: 'Project Initiation',
          percentage: 50,
          amount: Math.round(total * 0.5),
          dueDate: 'Upon contract signature',
          deliverables: ['Project kickoff', 'Discovery phase']
        },
        {
          name: 'Midpoint Review',
          percentage: 25,
          amount: Math.round(total * 0.25),
          dueDate: 'At 50% completion',
          deliverables: ['Initial findings', 'Strategic framework']
        },
        {
          name: 'Project Completion',
          percentage: 25,
          amount: Math.round(total * 0.25),
          dueDate: 'Upon final delivery',
          deliverables: ['Final deliverables', 'Implementation support']
        }
      )
    }

    return milestones
  }

  // Additional helper methods would go here...
  private generateProjectTimeline(template: ProposalTemplate, factors: DynamicPricingFactors): ProjectTimeline {
    // Implementation details...
    return {
      totalDuration: 8,
      phases: [],
      keyMilestones: []
    }
  }

  private customizeServices(services: ServiceComponent[], lead: any, requirements?: any): ServiceComponent[] {
    // Implementation details...
    return services
  }

  private generateNextSteps(lead: any, pricing: ProposalPricing): string[] {
    return [
      'Review this proposal and let us know if you have any questions',
      'Schedule a brief call to discuss any modifications needed',
      'Upon approval, we\'ll send the contract for signature',
      'Project kickoff within 5 business days of signed contract'
    ]
  }

  private calculateValidUntil(urgency: string): string {
    const days = urgency === 'immediate' ? 7 : 30
    const validUntil = new Date()
    validUntil.setDate(validUntil.getDate() + days)
    return validUntil.toISOString().split('T')[0]
  }

  private async saveProposalToDatabase(proposal: GeneratedProposal): Promise<void> {
    // Implementation details...
  }

  private async generateProposalNumber(): Promise<string> {
    const year = new Date().getFullYear()
    const month = String(new Date().getMonth() + 1).padStart(2, '0')
    
    const { count } = await supabase
      .from('convert_flow_proposals')
      .select('id', { count: 'exact' })
      .gte('created_at', `${year}-${month}-01`)
      .lte('created_at', `${year}-${month}-31`)

    const sequence = String((count || 0) + 1).padStart(3, '0')
    return `PROP-${year}${month}-${sequence}`
  }

  // Placeholder methods for content generation
  private generateBusinessOutcome(lead: any): string {
    return `${lead.desired_outcome || 'significant business growth'}`
  }

  private expandPainPoint(point: string): string {
    return `${point} - limiting growth potential and operational efficiency`
  }

  private async selectRelevantCaseStudies(industry?: string, companySize?: string): Promise<CaseStudy[]> {
    return []
  }

  private async selectRelevantTestimonials(industry?: string): Promise<Testimonial[]> {
    return []
  }

  private generateAboutSection(industry?: string): string {
    return `Our team brings extensive experience in the ${industry} industry, with a proven track record of delivering exceptional results for businesses of all sizes.`
  }

  private generateSolutionRecommendation(lead: any, template: ProposalTemplate): string {
    return `Based on your specific needs and challenges, we recommend our comprehensive ${template.serviceType} solution.`
  }

  private customizeContractTerms(baseTerms: ContractTerms, factors: DynamicPricingFactors): ContractTerms {
    return baseTerms
  }
}

// Supporting interfaces
interface PricingAdjustment {
  name: string
  description: string
  amount: number
  type: 'fixed' | 'percentage'
}

interface CaseStudy {
  title: string
  industry: string
  challenge: string
  solution: string
  results: string
}

interface Testimonial {
  name: string
  title: string
  company: string
  content: string
  result: string
}

interface Milestone {
  name: string
  date: string
  deliverables: string[]
}

export const proposalGenerationService = new ProposalGenerationService()