import { supabase } from '@/lib/supabase'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export interface EmailSequence {
  id: string
  name: string
  trigger: TriggerCondition
  emails: EmailTemplate[]
  status: 'active' | 'paused' | 'draft'
  industry: string
  conversionGoal: string
}

export interface TriggerCondition {
  event: string
  conditions: TriggerRule[]
  delay: number // in seconds
}

export interface TriggerRule {
  field: string
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'exists'
  value: any
}

export interface EmailTemplate {
  id: string
  subject: string
  content: string
  delay: number // seconds after previous email or trigger
  conditions?: TriggerRule[]
  personalizations: PersonalizationRule[]
  cta: CallToAction
  tracking: EmailTracking
}

export interface PersonalizationRule {
  placeholder: string
  source: 'lead_field' | 'company_data' | 'behavioral_data' | 'static'
  field?: string
  fallback: string
}

export interface CallToAction {
  text: string
  url: string
  trackingParams: Record<string, string>
}

export interface EmailTracking {
  openTracking: boolean
  clickTracking: boolean
  replyTracking: boolean
  customEvents: string[]
}

export interface BehavioralTrigger {
  leadId: string
  event: string
  data: Record<string, any>
  timestamp: string
}

export interface EmailSendResult {
  success: boolean
  messageId?: string
  error?: string
  leadId: string
  templateId: string
}

class EmailAutomationService {
  // Process behavioral trigger and execute relevant sequences
  async processBehavioralTrigger(trigger: BehavioralTrigger): Promise<void> {
    try {
      console.log(`[EMAIL-AUTOMATION] Processing trigger: ${trigger.event} for lead ${trigger.leadId}`)

      // Get all active sequences that match this trigger
      const { data: sequences, error } = await supabase
        .from('convert_flow_email_campaigns')
        .select('*')
        .eq('is_active', true)
        .contains('trigger_conditions', { event: trigger.event })

      if (error) {
        throw new Error(`Failed to fetch sequences: ${error.message}`)
      }

      // Process each matching sequence
      for (const sequence of sequences || []) {
        if (await this.shouldTriggerSequence(trigger, sequence)) {
          await this.startEmailSequence(trigger.leadId, sequence.id, trigger.data)
        }
      }

      // Log the trigger processing
      await supabase
        .from('convert_flow_lead_activities')
        .insert({
          lead_id: trigger.leadId,
          activity_type: 'email_trigger_processed',
          activity_data: {
            trigger_event: trigger.event,
            trigger_data: trigger.data,
            sequences_triggered: sequences?.length || 0
          },
          created_at: new Date().toISOString()
        })

    } catch (error) {
      console.error('[EMAIL-AUTOMATION] Error processing behavioral trigger:', error)
    }
  }

  // Start an email sequence for a lead
  async startEmailSequence(leadId: string, sequenceId: string, triggerData?: any): Promise<void> {
    try {
      // Get sequence configuration
      const { data: sequence, error } = await supabase
        .from('convert_flow_email_campaigns')
        .select('*')
        .eq('id', sequenceId)
        .single()

      if (error || !sequence) {
        throw new Error('Email sequence not found')
      }

      // Check if lead is already in this sequence
      const { data: existingEnrollment } = await supabase
        .from('convert_flow_email_interactions')
        .select('id')
        .eq('lead_id', leadId)
        .eq('campaign_id', sequenceId)
        .eq('interaction_type', 'sequence_started')
        .single()

      if (existingEnrollment) {
        console.log(`[EMAIL-AUTOMATION] Lead ${leadId} already enrolled in sequence ${sequenceId}`)
        return
      }

      // Enroll lead in sequence
      await supabase
        .from('convert_flow_email_interactions')
        .insert({
          campaign_id: sequenceId,
          lead_id: leadId,
          interaction_type: 'sequence_started',
          device_type: 'automation',
          created_at: new Date().toISOString()
        })

      // Schedule all emails in the sequence
      const emailSequence = sequence.email_sequence || []
      let cumulativeDelay = 0

      for (let i = 0; i < emailSequence.length; i++) {
        const email = emailSequence[i]
        cumulativeDelay += email.delay || 0

        await this.scheduleEmail(leadId, sequenceId, i, cumulativeDelay, triggerData)
      }

      console.log(`[EMAIL-AUTOMATION] Started sequence ${sequenceId} for lead ${leadId} with ${emailSequence.length} emails`)

    } catch (error) {
      console.error('[EMAIL-AUTOMATION] Error starting email sequence:', error)
    }
  }

  // Send immediate email (for high-priority triggers)
  async sendImmediateEmail(leadId: string, templateKey: string, data?: any): Promise<EmailSendResult> {
    try {
      // Get lead data
      const { data: lead, error } = await supabase
        .from('convert_flow_leads')
        .select('*')
        .eq('id', leadId)
        .single()

      if (error || !lead) {
        return { success: false, error: 'Lead not found', leadId, templateId: templateKey }
      }

      // Get email template
      const template = this.getEmailTemplate(templateKey, lead.industry)
      
      // Personalize content
      const personalizedSubject = this.personalizeContent(template.subject, lead, data)
      const personalizedContent = this.personalizeContent(template.content, lead, data)

      // Send via Resend
      const sendResult = await resend.emails.send({
        from: process.env.EMAIL_FROM_ADDRESS || 'noreply@yourapp.com',
        to: lead.email,
        subject: personalizedSubject,
        html: personalizedContent,
        tags: [
          { name: 'campaign', value: 'automation' },
          { name: 'template', value: templateKey },
          { name: 'lead_id', value: leadId }
        ]
      })

      if (sendResult.error) {
        throw new Error(sendResult.error.message)
      }

      // Log interaction
      await this.logEmailInteraction(leadId, 'sent', {
        template_key: templateKey,
        subject: personalizedSubject,
        message_id: sendResult.data?.id
      })

      return { 
        success: true, 
        messageId: sendResult.data?.id, 
        leadId, 
        templateId: templateKey 
      }

    } catch (error) {
      console.error('[EMAIL-AUTOMATION] Error sending immediate email:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error', 
        leadId, 
        templateId: templateKey 
      }
    }
  }

  // Process email opens, clicks, and replies
  async processEmailEvent(leadId: string, eventType: string, eventData: any): Promise<void> {
    try {
      // Log the interaction
      await this.logEmailInteraction(leadId, eventType, eventData)

      // Update lead engagement metrics
      await this.updateEngagementMetrics(leadId, eventType)

      // Process behavioral triggers based on email interaction
      if (eventType === 'clicked') {
        await this.processBehavioralTrigger({
          leadId,
          event: 'email_click',
          data: { link: eventData.url, campaign: eventData.campaign_id },
          timestamp: new Date().toISOString()
        })
      }

      if (eventType === 'opened') {
        await this.processBehavioralTrigger({
          leadId,
          event: 'email_open',
          data: { campaign: eventData.campaign_id },
          timestamp: new Date().toISOString()
        })
      }

    } catch (error) {
      console.error('[EMAIL-AUTOMATION] Error processing email event:', error)
    }
  }

  // Get industry-specific email templates
  private getEmailTemplate(templateKey: string, industry?: string): EmailTemplate {
    const templates = this.getEmailTemplates()
    
    // Try industry-specific first, then fallback to general
    const industryTemplate = templates[industry || 'general']?.[templateKey]
    const generalTemplate = templates['general']?.[templateKey]
    
    return industryTemplate || generalTemplate || templates['general']['welcome']
  }

  // Comprehensive email templates for service businesses
  private getEmailTemplates(): Record<string, Record<string, EmailTemplate>> {
    return {
      'consulting': {
        'welcome': {
          id: 'consulting_welcome',
          subject: 'Welcome, {{firstName}}! Your business growth blueprint is here',
          content: `
            <h2>Hi {{firstName}},</h2>
            
            <p>Thank you for downloading our {{resourceName}}. You're about to discover the exact strategies we use to help {{industry}} businesses scale from 6 to 7 figures.</p>
            
            <p><strong>Here's what you'll find inside:</strong></p>
            <ul>
              <li>The #1 mistake keeping {{industry}} businesses stuck at 6-figures</li>
              <li>Our 5-step framework used by 200+ successful firms</li>
              <li>Real case studies with actual revenue numbers</li>
            </ul>
            
            <p>I recommend starting with the framework on page 3 - that's where most of our clients see immediate results.</p>
            
            <p>Questions? Just reply to this email. I read every response personally.</p>
            
            <p>To your success,<br>
            {{senderName}}</p>
            
            <p><a href="{{ctaUrl}}" style="background: #4299e1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 20px 0;">Book Your Strategy Call</a></p>
          `,
          delay: 0,
          personalizations: [
            { placeholder: '{{firstName}}', source: 'lead_field', field: 'first_name', fallback: 'there' },
            { placeholder: '{{industry}}', source: 'lead_field', field: 'industry', fallback: 'business' },
            { placeholder: '{{resourceName}}', source: 'static', fallback: 'Growth Blueprint' },
            { placeholder: '{{senderName}}', source: 'static', fallback: 'Your Growth Team' }
          ],
          cta: {
            text: 'Book Your Strategy Call',
            url: '/book-consultation',
            trackingParams: { source: 'welcome_email', campaign: 'consulting_nurture' }
          },
          tracking: {
            openTracking: true,
            clickTracking: true,
            replyTracking: true,
            customEvents: ['resource_download', 'cta_click']
          }
        },
        'follow_up_day_3': {
          id: 'consulting_follow_up_3',
          subject: 'Quick question about {{companyName}}\'s growth...',
          content: `
            <h2>Hi {{firstName}},</h2>
            
            <p>I wanted to follow up on the {{resourceName}} you downloaded a few days ago.</p>
            
            <p><strong>Quick question:</strong> What's the biggest bottleneck preventing {{companyName}} from scaling right now?</p>
            
            <p>I ask because I just worked with a {{industry}} company that had the exact same challenge. Here's what happened...</p>
            
            <p><em>[They were stuck at $2M revenue for 18 months because their sales process was completely manual. Every deal required the founder's involvement.]</em></p>
            
            <p><em>Within 90 days of implementing our systematic approach, they closed $800K in new business without the founder touching a single sales call.</em></p>
            
            <p>If you're facing a similar challenge, I'd love to show you exactly how we did it.</p>
            
            <p><a href="{{ctaUrl}}" style="background: #4299e1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 20px 0;">See The Case Study</a></p>
            
            <p>Worth a look?</p>
            
            <p>Best,<br>{{senderName}}</p>
          `,
          delay: 259200, // 3 days
          personalizations: [
            { placeholder: '{{firstName}}', source: 'lead_field', field: 'first_name', fallback: 'there' },
            { placeholder: '{{companyName}}', source: 'lead_field', field: 'company', fallback: 'your business' },
            { placeholder: '{{industry}}', source: 'lead_field', field: 'industry', fallback: 'business' }
          ],
          cta: {
            text: 'See The Case Study',
            url: '/case-study',
            trackingParams: { source: 'follow_up_3', campaign: 'consulting_nurture' }
          },
          tracking: {
            openTracking: true,
            clickTracking: true,
            replyTracking: true,
            customEvents: ['case_study_interest']
          }
        },
        'proposal_follow_up': {
          id: 'consulting_proposal_follow_up',
          subject: 'Thoughts on the proposal for {{companyName}}?',
          content: `
            <h2>Hi {{firstName}},</h2>
            
            <p>I wanted to follow up on the proposal I sent for {{companyName}} last week.</p>
            
            <p>I know these decisions aren't made overnight, especially when there's {{proposalAmount}} on the table.</p>
            
            <p><strong>A few quick questions:</strong></p>
            <ul>
              <li>Did you have a chance to review the proposal?</li>
              <li>Any questions about our approach or timeline?</li>
              <li>Is there anything holding you back from moving forward?</li>
            </ul>
            
            <p>If budget is a concern, I'm happy to discuss breaking this into phases so you can see results before the full investment.</p>
            
            <p>Either way, I'd love to hear your thoughts. Even if it's not the right time, I appreciate the feedback.</p>
            
            <p><a href="{{ctaUrl}}" style="background: #4299e1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 20px 0;">Schedule a Quick Call</a></p>
            
            <p>Best,<br>{{senderName}}</p>
          `,
          delay: 0,
          personalizations: [
            { placeholder: '{{firstName}}', source: 'lead_field', field: 'first_name', fallback: 'there' },
            { placeholder: '{{companyName}}', source: 'lead_field', field: 'company', fallback: 'your business' },
            { placeholder: '{{proposalAmount}}', source: 'behavioral_data', field: 'proposal_amount', fallback: 'a significant investment' }
          ],
          cta: {
            text: 'Schedule a Quick Call',
            url: '/book-call',
            trackingParams: { source: 'proposal_follow_up', campaign: 'proposal_nurture' }
          },
          tracking: {
            openTracking: true,
            clickTracking: true,
            replyTracking: true,
            customEvents: ['proposal_discussion_interest']
          }
        }
      },
      'legal': {
        'welcome': {
          id: 'legal_welcome',
          subject: 'Your business protection checklist is here, {{firstName}}',
          content: `
            <h2>Hi {{firstName}},</h2>
            
            <p>Thank you for downloading our Business Protection Checklist. You're taking an important step toward safeguarding {{companyName}}.</p>
            
            <p><strong>Inside this checklist, you'll discover:</strong></p>
            <ul>
              <li>The 7 legal documents every business MUST have</li>
              <li>How to structure your business to minimize liability</li>
              <li>Contract clauses that prevent 95% of disputes</li>
            </ul>
            
            <p>I recommend starting with the liability assessment on page 2. Most business owners are shocked by what they find.</p>
            
            <p>If you discover any red flags, don't panic. These issues are fixable, and we're here to help.</p>
            
            <p>Legal protection shouldn't keep you up at night.</p>
            
            <p>{{senderName}}<br>Senior Business Attorney</p>
          `,
          delay: 0,
          personalizations: [
            { placeholder: '{{firstName}}', source: 'lead_field', field: 'first_name', fallback: 'there' },
            { placeholder: '{{companyName}}', source: 'lead_field', field: 'company', fallback: 'your business' }
          ],
          cta: {
            text: 'Get Your Risk Assessment',
            url: '/legal-assessment',
            trackingParams: { source: 'welcome_email', campaign: 'legal_nurture' }
          },
          tracking: {
            openTracking: true,
            clickTracking: true,
            replyTracking: true,
            customEvents: ['checklist_download', 'assessment_interest']
          }
        }
      },
      'marketing_agency': {
        'welcome': {
          id: 'agency_welcome',
          subject: 'Your ROI Calculator Results + Next Steps',
          content: `
            <h2>Hi {{firstName}},</h2>
            
            <p>Based on your inputs, {{companyName}} could be leaving <strong>{{potentialRevenue}}</strong> on the table each month.</p>
            
            <p>That's {{annualOpportunity}} per year in missed revenue opportunities.</p>
            
            <p><strong>Here's what's likely happening:</strong></p>
            <ul>
              <li>Your current funnel is leaking qualified prospects</li>
              <li>You're not optimizing for the highest-value customers</li>
              <li>Your messaging isn't resonating with your ideal client</li>
            </ul>
            
            <p>The good news? These are fixable problems.</p>
            
            <p>I'd like to show you exactly how we helped a similar {{industry}} company increase their revenue by 340% in 90 days.</p>
            
            <p><a href="{{ctaUrl}}" style="background: #4299e1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 20px 0;">See The Complete Case Study</a></p>
            
            <p>Worth a look?</p>
            
            <p>{{senderName}}<br>Growth Strategist</p>
          `,
          delay: 0,
          personalizations: [
            { placeholder: '{{firstName}}', source: 'lead_field', field: 'first_name', fallback: 'there' },
            { placeholder: '{{companyName}}', source: 'lead_field', field: 'company', fallback: 'your business' },
            { placeholder: '{{industry}}', source: 'lead_field', field: 'industry', fallback: 'business' },
            { placeholder: '{{potentialRevenue}}', source: 'behavioral_data', field: 'calculator_result', fallback: '$25,000' },
            { placeholder: '{{annualOpportunity}}', source: 'behavioral_data', field: 'annual_opportunity', fallback: '$300,000' }
          ],
          cta: {
            text: 'See The Complete Case Study',
            url: '/case-study',
            trackingParams: { source: 'welcome_email', campaign: 'agency_nurture' }
          },
          tracking: {
            openTracking: true,
            clickTracking: true,
            replyTracking: true,
            customEvents: ['calculator_results', 'case_study_interest']
          }
        }
      },
      'general': {
        'welcome': {
          id: 'general_welcome',
          subject: 'Welcome {{firstName}}! Here\'s what happens next...',
          content: `
            <h2>Hi {{firstName}},</h2>
            
            <p>Thank you for your interest in working with us.</p>
            
            <p>I wanted to personally welcome you and let you know what to expect next.</p>
            
            <p>Over the next few days, I'll be sharing some valuable insights about {{industry}} businesses and how to overcome the most common growth challenges.</p>
            
            <p>If you have any questions or want to fast-track our conversation, feel free to book a call with me directly.</p>
            
            <p>Looking forward to helping {{companyName}} achieve its growth goals.</p>
            
            <p>Best regards,<br>{{senderName}}</p>
          `,
          delay: 0,
          personalizations: [
            { placeholder: '{{firstName}}', source: 'lead_field', field: 'first_name', fallback: 'there' },
            { placeholder: '{{companyName}}', source: 'lead_field', field: 'company', fallback: 'your business' },
            { placeholder: '{{industry}}', source: 'lead_field', field: 'industry', fallback: 'business' }
          ],
          cta: {
            text: 'Book a Call',
            url: '/book-call',
            trackingParams: { source: 'welcome_email', campaign: 'general_nurture' }
          },
          tracking: {
            openTracking: true,
            clickTracking: true,
            replyTracking: true,
            customEvents: ['welcome_received']
          }
        },
        'abandoned_funnel': {
          id: 'abandoned_funnel',
          subject: '{{firstName}}, did something go wrong?',
          content: `
            <h2>Hi {{firstName}},</h2>
            
            <p>I noticed you started our qualification process but didn't finish.</p>
            
            <p>No worries if now isn't the right time - but I wanted to make sure it wasn't a technical issue.</p>
            
            <p>If you got stuck or had questions, I'm happy to help. You can:</p>
            
            <ul>
              <li><a href="{{continueUrl}}">Continue where you left off</a> (takes 2 minutes)</li>
              <li>Reply to this email with any questions</li>
              <li>Book a quick call if you prefer to discuss directly</li>
            </ul>
            
            <p>Either way, no pressure. I know these decisions take time.</p>
            
            <p>{{senderName}}</p>
          `,
          delay: 3600, // 1 hour
          personalizations: [
            { placeholder: '{{firstName}}', source: 'lead_field', field: 'first_name', fallback: 'there' },
            { placeholder: '{{continueUrl}}', source: 'behavioral_data', field: 'funnel_url', fallback: '/continue' }
          ],
          cta: {
            text: 'Continue Application',
            url: '{{continueUrl}}',
            trackingParams: { source: 'abandoned_funnel', campaign: 'recovery' }
          },
          tracking: {
            openTracking: true,
            clickTracking: true,
            replyTracking: true,
            customEvents: ['funnel_recovery_attempt']
          }
        }
      }
    }
  }

  // Personalize email content
  private personalizeContent(content: string, lead: any, additionalData?: any): string {
    let personalized = content

    // Basic lead field replacements
    const replacements: Record<string, string> = {
      '{{firstName}}': lead.first_name || 'there',
      '{{lastName}}': lead.last_name || '',
      '{{companyName}}': lead.company || 'your business',
      '{{industry}}': lead.industry || 'business',
      '{{email}}': lead.email || '',
      '{{phone}}': lead.phone || ''
    }

    // Add behavioral data if available
    if (additionalData) {
      Object.keys(additionalData).forEach(key => {
        replacements[`{{${key}}}`] = String(additionalData[key])
      })
    }

    // Apply replacements
    Object.entries(replacements).forEach(([placeholder, value]) => {
      personalized = personalized.replace(new RegExp(placeholder, 'g'), value)
    })

    return personalized
  }

  // Check if sequence should be triggered based on conditions
  private async shouldTriggerSequence(trigger: BehavioralTrigger, sequence: any): Promise<boolean> {
    const triggerConditions = sequence.trigger_conditions
    
    if (!triggerConditions || triggerConditions.event !== trigger.event) {
      return false
    }

    // Check additional conditions if specified
    if (triggerConditions.conditions) {
      for (const condition of triggerConditions.conditions) {
        if (!this.evaluateCondition(trigger, condition)) {
          return false
        }
      }
    }

    return true
  }

  private evaluateCondition(trigger: BehavioralTrigger, condition: TriggerRule): boolean {
    // Implementation depends on condition type
    // This would evaluate various conditions against trigger data
    return true // Simplified for now
  }

  // Schedule email for future delivery
  private async scheduleEmail(
    leadId: string, 
    sequenceId: string, 
    emailIndex: number, 
    delay: number,
    triggerData?: any
  ): Promise<void> {
    // In a production system, this would use a job queue like Bull or Agenda
    // For now, we'll simulate with a simple setTimeout
    
    setTimeout(async () => {
      try {
        await this.sendSequenceEmail(leadId, sequenceId, emailIndex, triggerData)
      } catch (error) {
        console.error(`[EMAIL-AUTOMATION] Failed to send scheduled email:`, error)
      }
    }, delay * 1000)
  }

  // Send specific email from sequence
  private async sendSequenceEmail(
    leadId: string, 
    sequenceId: string, 
    emailIndex: number,
    triggerData?: any
  ): Promise<void> {
    try {
      // Get sequence and email template
      const { data: sequence, error } = await supabase
        .from('convert_flow_email_campaigns')
        .select('*')
        .eq('id', sequenceId)
        .single()

      if (error || !sequence) {
        throw new Error('Sequence not found')
      }

      const emailTemplate = sequence.email_sequence[emailIndex]
      if (!emailTemplate) {
        throw new Error('Email template not found')
      }

      // Send the email
      await this.sendImmediateEmail(leadId, emailTemplate.template, triggerData)

    } catch (error) {
      console.error('[EMAIL-AUTOMATION] Error sending sequence email:', error)
    }
  }

  // Log email interactions
  private async logEmailInteraction(leadId: string, type: string, data: any): Promise<void> {
    try {
      await supabase
        .from('convert_flow_email_interactions')
        .insert({
          lead_id: leadId,
          interaction_type: type,
          email_subject: data.subject,
          link_clicked: data.url,
          device_type: data.device || 'unknown',
          created_at: new Date().toISOString()
        })
    } catch (error) {
      console.error('[EMAIL-AUTOMATION] Error logging email interaction:', error)
    }
  }

  // Update lead engagement metrics
  private async updateEngagementMetrics(leadId: string, eventType: string): Promise<void> {
    try {
      const updates: Record<string, any> = {
        updated_at: new Date().toISOString(),
        last_activity_at: new Date().toISOString()
      }

      if (eventType === 'opened') {
        updates.email_opens = supabase.rpc('increment', { field: 'email_opens' })
      } else if (eventType === 'clicked') {
        updates.email_clicks = supabase.rpc('increment', { field: 'email_clicks' })
      }

      await supabase
        .from('convert_flow_leads')
        .update(updates)
        .eq('id', leadId)

    } catch (error) {
      console.error('[EMAIL-AUTOMATION] Error updating engagement metrics:', error)
    }
  }
}

export const emailAutomationService = new EmailAutomationService()