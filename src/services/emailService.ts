import { Resend } from 'resend'
import { supabase } from '../lib/supabase'

// Initialize Resend only on server side or when API key is available
const resend = typeof window === 'undefined' && process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY)
  : null

export interface EmailNotification {
  id?: string
  user_id: string
  notification_type: string
  status?: string
  scheduled_for?: string
  email_data?: any
  resend_message_id?: string
}

export interface EmailTemplate {
  template_name: string
  subject_template: string
  html_template?: string
  text_template?: string
  template_variables?: string[]
}

class EmailService {
  private readonly FROM_EMAIL = process.env.EMAIL_FROM || 'AI Coach <coach@yourdomain.com>'
  private readonly BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

  /**
   * Send an email using Resend API
   */
  async sendEmail(to: string, subject: string, html: string, text?: string): Promise<string | null> {
    try {
      console.log('[EMAIL-SERVICE] Sending email to:', to, 'Subject:', subject)
      
      if (!resend) {
        console.warn('[EMAIL-SERVICE] Resend not available (client-side or missing API key)')
        return null
      }

      const result = await resend.emails.send({
        from: this.FROM_EMAIL,
        to: [to],
        subject,
        html,
        text: text || this.stripHtml(html)
      })

      console.log('[EMAIL-SERVICE] Email sent successfully:', result.data?.id)
      return result.data?.id || null
    } catch (error) {
      console.error('[EMAIL-SERVICE] Error sending email:', error)
      throw error
    }
  }

  /**
   * Process pending email notifications from the queue
   */
  async processPendingEmails(): Promise<void> {
    try {
      console.log('[EMAIL-SERVICE] Processing pending emails...')

      // Get pending email notifications that are ready to send
      const { data: pendingEmails, error } = await supabase
        .from('email_notifications')
        .select(`
          id,
          user_id,
          notification_type,
          email_data,
          auth.users!inner(email, raw_user_meta_data)
        `)
        .eq('status', 'pending')
        .lte('scheduled_for', new Date().toISOString())
        .limit(50) // Process in batches

      if (error) {
        console.error('[EMAIL-SERVICE] Error fetching pending emails:', error)
        return
      }

      console.log(`[EMAIL-SERVICE] Found ${pendingEmails?.length || 0} pending emails`)

      if (!pendingEmails || pendingEmails.length === 0) {
        return
      }

      // Process each email
      for (const notification of pendingEmails) {
        try {
          await this.sendNotificationEmail(notification)
        } catch (error) {
          console.error(`[EMAIL-SERVICE] Error processing email ${notification.id}:`, error)
          
          // Mark as failed
          await supabase
            .from('email_notifications')
            .update({
              status: 'failed',
              failed_at: new Date().toISOString(),
              failure_reason: error instanceof Error ? error.message : 'Unknown error',
              updated_at: new Date().toISOString()
            })
            .eq('id', notification.id)
        }
      }
    } catch (error) {
      console.error('[EMAIL-SERVICE] Error in processPendingEmails:', error)
    }
  }

  /**
   * Send a specific notification email
   */
  private async sendNotificationEmail(notification: any): Promise<void> {
    const user = notification.auth?.users
    if (!user?.email) {
      throw new Error('User email not found')
    }

    // Get email template
    const template = await this.getEmailTemplate(notification.notification_type)
    if (!template) {
      throw new Error(`Email template not found: ${notification.notification_type}`)
    }

    // Prepare email data with defaults
    const emailData = {
      firstName: user.raw_user_meta_data?.firstName || user.email.split('@')[0],
      dashboardUrl: `${this.BASE_URL}/dashboard`,
      unsubscribeUrl: `${this.BASE_URL}/unsubscribe/${notification.user_id}/${notification.notification_type}`,
      ...notification.email_data
    }

    // Generate email content
    const subject = this.replaceTemplateVariables(template.subject_template, emailData)
    const html = await this.generateEmailHtml(notification.notification_type, emailData)
    const text = this.generateEmailText(notification.notification_type, emailData)

    // Send email
    const messageId = await this.sendEmail(user.email, subject, html, text)

    // Update notification status
    await supabase
      .from('email_notifications')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        resend_message_id: messageId,
        updated_at: new Date().toISOString()
      })
      .eq('id', notification.id)

    console.log(`[EMAIL-SERVICE] Successfully sent ${notification.notification_type} email to ${user.email}`)
  }

  /**
   * Get email template from database
   */
  private async getEmailTemplate(templateName: string): Promise<EmailTemplate | null> {
    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .eq('template_name', templateName)
      .eq('is_active', true)
      .single()

    if (error) {
      console.error('[EMAIL-SERVICE] Error fetching email template:', error)
      return null
    }

    return data
  }

  /**
   * Generate HTML email content based on template type
   */
  private async generateEmailHtml(templateType: string, data: any): Promise<string> {
    const baseStyles = `
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #3B82F6, #8B5CF6); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: white; padding: 30px; border: 1px solid #E5E7EB; }
        .footer { background: #F9FAFB; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 14px; color: #6B7280; }
        .button { display: inline-block; background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
        .stats { background: #F3F4F6; padding: 20px; border-radius: 6px; margin: 20px 0; }
        .milestone { background: linear-gradient(135deg, #10B981, #059669); color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
      </style>
    `

    switch (templateType) {
      case 'diagnostic_results':
        return `
          <!DOCTYPE html>
          <html>${baseStyles}
          <body>
            <div class="container">
              <div class="header">
                <h1>🎯 Your Freedom Diagnostic Results</h1>
                <p>Your business transformation roadmap is ready!</p>
              </div>
              <div class="content">
                <p>Hi ${data.firstName},</p>
                <p>Congratulations! You've completed your Freedom Diagnostic assessment, and we've analyzed your business to create a personalized transformation plan.</p>
                
                <div class="stats">
                  <h3>📊 Your Business Health Score</h3>
                  <div style="font-size: 48px; font-weight: bold; color: #3B82F6; text-align: center;">
                    ${data.businessHealthScore || 'N/A'}/100
                  </div>
                  ${data.topBottleneck ? `<p><strong>Top Priority:</strong> ${data.topBottleneck}</p>` : ''}
                  ${data.recommendedAction ? `<p><strong>Recommended Action:</strong> ${data.recommendedAction}</p>` : ''}
                </div>

                <p>Your complete sprint plan, prioritized action steps, and AI-powered coaching are waiting for you in your dashboard.</p>
                
                <div style="text-align: center;">
                  <a href="${data.dashboardUrl}" class="button">View Your Complete Sprint Plan →</a>
                </div>
                
                <p><strong>What's Next?</strong></p>
                <ul>
                  <li>Review your personalized sprint sequence</li>
                  <li>Start with your highest-impact sprint</li>
                  <li>Use daily check-ins to track progress</li>
                  <li>Get AI coaching support when needed</li>
                </ul>
              </div>
              <div class="footer">
                <p>Your AI Implementation Coach is ready to support your journey.</p>
                <p><a href="${data.unsubscribeUrl}">Unsubscribe</a></p>
              </div>
            </div>
          </body>
          </html>
        `

      case 'missed_checkin_day2':
        return `
          <!DOCTYPE html>
          <html>${baseStyles}
          <body>
            <div class="container">
              <div class="header">
                <h1>🎯 Quick Check-in?</h1>
                <p>Your progress matters, ${data.firstName}</p>
              </div>
              <div class="content">
                <p>Hi ${data.firstName},</p>
                <p>I noticed you haven't checked in for a couple of days. No worries – life happens!</p>
                
                <p>Small consistent actions create big results. Even a 2-minute check-in can help maintain your momentum and keep your business transformation on track.</p>
                
                <div style="text-align: center;">
                  <a href="${data.dashboardUrl}/checkin" class="button">Complete Quick Check-in (2 min) →</a>
                </div>
                
                <p>Remember, every successful entrepreneur has faced obstacles. The difference is they kept showing up, even when it was hard.</p>
                
                <p>Your future self will thank you for this small action today.</p>
              </div>
              <div class="footer">
                <p>Rooting for your success!</p>
                <p><a href="${data.unsubscribeUrl}">Unsubscribe from check-in reminders</a></p>
              </div>
            </div>
          </body>
          </html>
        `

      case 'milestone_celebration':
        return `
          <!DOCTYPE html>
          <html>${baseStyles}
          <body>
            <div class="container">
              <div class="milestone">
                <h1>🎉 MILESTONE ACHIEVED!</h1>
                <h2>${data.milestoneName}</h2>
                <p>You're ${data.progressPercentage}% complete!</p>
              </div>
              <div class="content">
                <p>Hi ${data.firstName},</p>
                <p><strong>Congratulations!</strong> You just hit a major milestone in your business transformation journey!</p>
                
                ${data.businessImpact ? `
                <div class="stats">
                  <h3>📈 Business Impact</h3>
                  <p>${data.businessImpact}</p>
                </div>
                ` : ''}
                
                <p>This achievement represents real progress toward your business goals. You're proving that consistent implementation creates extraordinary results.</p>
                
                <div style="text-align: center;">
                  <a href="${data.dashboardUrl}" class="button">See Your Full Progress →</a>
                </div>
                
                <p><strong>Keep the momentum going!</strong> Your next milestone is waiting, and you're building unstoppable business growth habits.</p>
              </div>
              <div class="footer">
                <p>Celebrating your success!</p>
                <p><a href="${data.unsubscribeUrl}">Unsubscribe</a></p>
              </div>
            </div>
          </body>
          </html>
        `

      // ============================================================================ 
      // FREEDOM SUITE EMAIL TEMPLATES - AI-Powered Business Intelligence
      // ============================================================================
      case 'executive_briefing':
        return `
          <!DOCTYPE html>
          <html>${baseStyles}
          <body>
            <div class="container">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                <h1>🧠 Daily Executive Briefing</h1>
                <p>${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
              <div class="content">
                <div style="margin-bottom: 24px;">
                  <h2 style="color: #1f2937; font-size: 18px; margin: 0 0 8px 0;">🎯 Top Priority</h2>
                  <p style="color: #4b5563; margin: 0;">${data.topPriority || 'Review system performance metrics'}</p>
                </div>
                
                <div style="margin-bottom: 24px;">
                  <h2 style="color: #1f2937; font-size: 18px; margin: 0 0 8px 0;">🏆 Key Win</h2>
                  <p style="color: #10b981; margin: 0; font-weight: 500;">${data.keyWin || 'Business systems operating smoothly'}</p>
                </div>
                
                <div style="margin-bottom: 24px;">
                  <h2 style="color: #1f2937; font-size: 18px; margin: 0 0 8px 0;">⚠️ Main Concern</h2>
                  <p style="color: #ef4444; margin: 0;">${data.mainConcern || 'No critical issues detected'}</p>
                </div>
                
                <div class="stats">
                  <h3>📊 Business Health Score</h3>
                  <div style="text-align: center;">
                    <div style="font-size: 32px; font-weight: bold; color: ${(data.healthScore || 8) >= 8 ? '#10b981' : (data.healthScore || 8) >= 6 ? '#f59e0b' : '#ef4444'}">${data.healthScore || 8.5}/10</div>
                    <div style="color: #6b7280; margin-top: 8px;">${data.healthTrend === 'improving' ? '↗️ Improving' : data.healthTrend === 'declining' ? '↘️ Declining' : '→ Stable'}</div>
                  </div>
                </div>
                
                <div style="text-align: center; margin-top: 24px;">
                  <a href="${data.dashboardUrl || 'https://ai.scalewithruth.com'}" class="button">View Full Intelligence →</a>
                </div>
              </div>
              <div class="footer">
                <p>Generated by Freedom Suite Executive Intelligence</p>
                <p><a href="${data.unsubscribeUrl}">Unsubscribe</a></p>
              </div>
            </div>
          </body>
          </html>
        `

      case 'critical_alert':
        return `
          <!DOCTYPE html>
          <html>${baseStyles}
          <body>
            <div class="container">
              <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0;">
                <h1>🚨 Critical Business Alert</h1>
                <p>Immediate attention required</p>
              </div>
              <div class="content">
                <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                  <h2 style="color: #dc2626; font-size: 18px; margin: 0 0 8px 0;">${data.alertTitle || 'Business Alert'}</h2>
                  <p style="color: #7f1d1d; margin: 0; font-weight: 500;">${data.alertMessage || 'Critical issue detected in your business systems'}</p>
                </div>
                
                <p style="line-height: 1.6; margin-bottom: 24px;">${data.detailedExplanation || 'Our AI analysis has identified an issue requiring your immediate attention.'}</p>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 24px 0;">
                  <div style="background: #f9fafb; padding: 16px; border-radius: 8px; text-align: center;">
                    <h4 style="color: #1f2937; font-size: 14px; margin: 0 0 4px 0;">⏰ Time to Impact</h4>
                    <p style="color: #dc2626; font-weight: 600; margin: 0;">${data.timeToImpact || 'This week'}</p>
                  </div>
                  <div style="background: #f9fafb; padding: 16px; border-radius: 8px; text-align: center;">
                    <h4 style="color: #1f2937; font-size: 14px; margin: 0 0 4px 0;">💰 Potential Impact</h4>
                    <p style="color: #dc2626; font-weight: 600; margin: 0;">$${(data.affectedRevenue || 0).toLocaleString()}</p>
                  </div>
                </div>
                
                <div style="text-align: center;">
                  <a href="${data.dashboardUrl || 'https://ai.scalewithruth.com'}" class="button" style="background: #dc2626;">Take Action Now →</a>
                </div>
              </div>
              <div class="footer">
                <p>Freedom Suite Predictive Intelligence</p>
                <p><a href="${data.unsubscribeUrl}">Unsubscribe</a></p>
              </div>
            </div>
          </body>
          </html>
        `

      case 'cash_flow_warning':
        return `
          <!DOCTYPE html>
          <html>${baseStyles}
          <body>
            <div class="container">
              <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0;">
                <h1>💰 Cash Flow Alert</h1>
                <p>Payment attention needed</p>
              </div>
              <div class="content">
                <div style="background: #fffbeb; border: 1px solid #fed7aa; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                  <h2 style="color: #d97706; font-size: 18px; margin: 0 0 8px 0;">⚠️ ${data.warningType || 'Payment Alert'}</h2>
                  <p style="color: #92400e; margin: 0;">${data.message || 'Your cash flow requires attention'}</p>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 24px 0;">
                  <div style="text-align: center; padding: 20px; background: #f9fafb; border-radius: 8px;">
                    <div style="font-size: 24px; font-weight: bold; color: #dc2626;">$${(data.overdueAmount || 0).toLocaleString()}</div>
                    <div style="color: #6b7280; font-size: 14px;">Overdue Amount</div>
                  </div>
                  <div style="text-align: center; padding: 20px; background: #f9fafb; border-radius: 8px;">
                    <div style="font-size: 24px; font-weight: bold; color: #059669;">$${(data.projectedInflow || 0).toLocaleString()}</div>
                    <div style="color: #6b7280; font-size: 14px;">Expected Next 30 Days</div>
                  </div>
                </div>
                
                <div style="text-align: center;">
                  <a href="${data.dashboardUrl || 'https://suite.scalewithruth.com/cash-flow-command'}" class="button" style="background: #d97706;">Review Cash Flow →</a>
                </div>
              </div>
              <div class="footer">
                <p>Freedom Suite Cash Flow Intelligence</p>
                <p><a href="${data.unsubscribeUrl}">Unsubscribe</a></p>
              </div>
            </div>
          </body>
          </html>
        `

      default:
        return `
          <!DOCTYPE html>
          <html>${baseStyles}
          <body>
            <div class="container">
              <div class="content">
                <p>Hi ${data.firstName},</p>
                <p>This is a notification from your AI Implementation Coach.</p>
                <div style="text-align: center;">
                  <a href="${data.dashboardUrl}" class="button">Visit Dashboard →</a>
                </div>
              </div>
              <div class="footer">
                <p><a href="${data.unsubscribeUrl}">Unsubscribe</a></p>
              </div>
            </div>
          </body>
          </html>
        `
    }
  }

  /**
   * Generate plain text email content
   */
  private generateEmailText(templateType: string, data: any): string {
    switch (templateType) {
      case 'diagnostic_results':
        return `
Hi ${data.firstName},

Your Freedom Diagnostic Results - ${data.businessHealthScore || 'N/A'}/100

Congratulations! You've completed your Freedom Diagnostic assessment. Your complete sprint plan and AI coaching are ready.

${data.topBottleneck ? `Top Priority: ${data.topBottleneck}` : ''}
${data.recommendedAction ? `Recommended Action: ${data.recommendedAction}` : ''}

View Your Complete Sprint Plan: ${data.dashboardUrl}

Your AI Implementation Coach is ready to support your journey.

Unsubscribe: ${data.unsubscribeUrl}
        `

      case 'missed_checkin_day2':
        return `
Hi ${data.firstName},

Quick Check-in? Your progress matters.

I noticed you haven't checked in for a couple of days. Small consistent actions create big results.

Complete Quick Check-in: ${data.dashboardUrl}/checkin

Every successful entrepreneur has faced obstacles. The difference is they kept showing up.

Unsubscribe: ${data.unsubscribeUrl}
        `

      case 'milestone_celebration':
        return `
Hi ${data.firstName},

🎉 MILESTONE ACHIEVED: ${data.milestoneName}!

You're ${data.progressPercentage}% complete!

This achievement represents real progress toward your business goals.

${data.businessImpact ? `Business Impact: ${data.businessImpact}` : ''}

See Your Full Progress: ${data.dashboardUrl}

Keep the momentum going!

Unsubscribe: ${data.unsubscribeUrl}
        `

      // FREEDOM SUITE TEXT TEMPLATES
      case 'executive_briefing':
        return `
Hi ${data.firstName},

🧠 Daily Executive Briefing - ${new Date().toLocaleDateString()}

🎯 Top Priority: ${data.topPriority || 'Review system performance metrics'}

🏆 Key Win: ${data.keyWin || 'Business systems operating smoothly'}

⚠️ Main Concern: ${data.mainConcern || 'No critical issues detected'}

📊 Business Health Score: ${data.healthScore || 8.5}/10 (${data.healthTrend === 'improving' ? 'Improving' : data.healthTrend === 'declining' ? 'Declining' : 'Stable'})

View Full Intelligence: ${data.dashboardUrl || 'https://ai.scalewithruth.com'}

Generated by Freedom Suite Executive Intelligence
Unsubscribe: ${data.unsubscribeUrl}
        `

      case 'critical_alert':
        return `
Hi ${data.firstName},

🚨 CRITICAL BUSINESS ALERT: ${data.alertTitle || 'Business Alert'}

${data.alertMessage || 'Critical issue detected in your business systems'}

${data.detailedExplanation || 'Our AI analysis has identified an issue requiring your immediate attention.'}

⏰ Time to Impact: ${data.timeToImpact || 'This week'}
💰 Potential Impact: $${(data.affectedRevenue || 0).toLocaleString()}

Take Action Now: ${data.dashboardUrl || 'https://ai.scalewithruth.com'}

Freedom Suite Predictive Intelligence
Unsubscribe: ${data.unsubscribeUrl}
        `

      case 'cash_flow_warning':
        return `
Hi ${data.firstName},

💰 Cash Flow Alert: ${data.warningType || 'Payment Alert'}

${data.message || 'Your cash flow requires attention'}

Overdue Amount: $${(data.overdueAmount || 0).toLocaleString()}
Expected Next 30 Days: $${(data.projectedInflow || 0).toLocaleString()}

Review Cash Flow: ${data.dashboardUrl || 'https://suite.scalewithruth.com/cash-flow-command'}

Freedom Suite Cash Flow Intelligence
Unsubscribe: ${data.unsubscribeUrl}
        `

      default:
        return `
Hi ${data.firstName},

This is a notification from your AI Implementation Coach.

Visit Dashboard: ${data.dashboardUrl}

Unsubscribe: ${data.unsubscribeUrl}
        `
    }
  }

  /**
   * Replace template variables in text
   */
  private replaceTemplateVariables(template: string, data: any): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] || match
    })
  }

  /**
   * Strip HTML tags for plain text version
   */
  private stripHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .trim()
  }

  /**
   * Schedule a diagnostic results email
   */
  async scheduleDiagnosticResultsEmail(userId: string, diagnosticData: any): Promise<void> {
    try {
      const emailData = {
        businessHealthScore: diagnosticData.percent || diagnosticData.totalScore || 'N/A',
        topBottleneck: diagnosticData.topBottleneck || diagnosticData.highestScoringModule,
        recommendedAction: diagnosticData.recommendedAction || 'Start with your personalized sprint plan'
      }

      const { error } = await supabase
        .from('email_notifications')
        .insert({
          user_id: userId,
          notification_type: 'diagnostic_results',
          scheduled_for: new Date().toISOString(),
          email_data: emailData
        })

      if (error) {
        console.error('[EMAIL-SERVICE] Error scheduling diagnostic email:', error)
        throw error
      }

      console.log(`[EMAIL-SERVICE] Scheduled diagnostic results email for user ${userId}`)
    } catch (error) {
      console.error('[EMAIL-SERVICE] Error in scheduleDiagnosticResultsEmail:', error)
      throw error
    }
  }

  /**
   * Schedule a milestone celebration email
   */
  async scheduleMilestoneCelebrationEmail(userId: string, milestoneData: any): Promise<void> {
    try {
      const emailData = {
        milestoneName: milestoneData.name || milestoneData.title || 'Sprint Milestone',
        progressPercentage: milestoneData.progress || milestoneData.percentage || '0',
        businessImpact: milestoneData.impact || milestoneData.description
      }

      const { error } = await supabase
        .from('email_notifications')
        .insert({
          user_id: userId,
          notification_type: 'milestone_celebration',
          scheduled_for: new Date().toISOString(),
          email_data: emailData
        })

      if (error) {
        console.error('[EMAIL-SERVICE] Error scheduling milestone email:', error)
        throw error
      }

      console.log(`[EMAIL-SERVICE] Scheduled milestone celebration email for user ${userId}`)
    } catch (error) {
      console.error('[EMAIL-SERVICE] Error in scheduleMilestoneCelebrationEmail:', error)
      throw error
    }
  }

  /**
   * Get user's email preferences
   */
  async getUserEmailPreferences(userId: string): Promise<any> {
    const { data, error } = await supabase
      .from('email_preferences')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') { // Not found error
      console.error('[EMAIL-SERVICE] Error fetching email preferences:', error)
      return null
    }

    return data || {
      diagnostic_results: true,
      missed_checkins: true,
      milestone_celebrations: true,
      weekly_summaries: true,
      ai_insights: true
    }
  }

  /**
   * Update user's email preferences
   */
  async updateEmailPreferences(userId: string, preferences: any): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('email_preferences')
        .upsert({
          user_id: userId,
          ...preferences,
          updated_at: new Date().toISOString()
        })

      if (error) {
        console.error('[EMAIL-SERVICE] Error updating email preferences:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('[EMAIL-SERVICE] Error in updateEmailPreferences:', error)
      return false
    }
  }

  // ============================================================================
  // FREEDOM SUITE EMAIL SCHEDULING FUNCTIONS
  // ============================================================================

  /**
   * Schedule an executive briefing email (daily)
   */
  async scheduleExecutiveBriefing(userId: string, briefingData: any): Promise<void> {
    try {
      const emailData = {
        topPriority: briefingData.topPriority || briefingData.top_priority_item,
        keyWin: briefingData.keyWin || briefingData.key_win,
        mainConcern: briefingData.mainConcern || briefingData.main_concern,
        healthScore: briefingData.healthScore || briefingData.business_health_score,
        healthTrend: briefingData.healthTrend || briefingData.health_trend
      }

      const { error } = await supabase
        .from('email_notifications')
        .insert({
          user_id: userId,
          notification_type: 'executive_briefing',
          scheduled_for: new Date().toISOString(),
          email_data: emailData
        })

      if (error) {
        console.error('[EMAIL-SERVICE] Error scheduling executive briefing:', error)
        throw error
      }

      console.log(`[EMAIL-SERVICE] Scheduled executive briefing for user ${userId}`)
    } catch (error) {
      console.error('[EMAIL-SERVICE] Error in scheduleExecutiveBriefing:', error)
      throw error
    }
  }

  /**
   * Schedule a critical alert email (immediate)
   */
  async scheduleCriticalAlert(userId: string, alertData: any): Promise<void> {
    try {
      const emailData = {
        alertTitle: alertData.alertTitle || alertData.alert_title,
        alertMessage: alertData.alertMessage || alertData.alert_message,
        detailedExplanation: alertData.detailedExplanation || alertData.detailed_explanation,
        timeToImpact: alertData.timeToImpact || alertData.time_to_impact,
        affectedRevenue: alertData.affectedRevenue || alertData.affected_revenue || 0
      }

      const { error } = await supabase
        .from('email_notifications')
        .insert({
          user_id: userId,
          notification_type: 'critical_alert',
          scheduled_for: new Date().toISOString(),
          email_data: emailData
        })

      if (error) {
        console.error('[EMAIL-SERVICE] Error scheduling critical alert:', error)
        throw error
      }

      console.log(`[EMAIL-SERVICE] Scheduled critical alert for user ${userId}`)
    } catch (error) {
      console.error('[EMAIL-SERVICE] Error in scheduleCriticalAlert:', error)
      throw error
    }
  }

  /**
   * Schedule a cash flow warning email
   */
  async scheduleCashFlowWarning(userId: string, warningData: any): Promise<void> {
    try {
      const emailData = {
        warningType: warningData.warningType || warningData.warning_type || 'Payment Alert',
        message: warningData.message || 'Your cash flow requires attention',
        overdueAmount: warningData.overdueAmount || warningData.overdue_amount || 0,
        projectedInflow: warningData.projectedInflow || warningData.projected_inflow || 0
      }

      const { error } = await supabase
        .from('email_notifications')
        .insert({
          user_id: userId,
          notification_type: 'cash_flow_warning',
          scheduled_for: new Date().toISOString(),
          email_data: emailData
        })

      if (error) {
        console.error('[EMAIL-SERVICE] Error scheduling cash flow warning:', error)
        throw error
      }

      console.log(`[EMAIL-SERVICE] Scheduled cash flow warning for user ${userId}`)
    } catch (error) {
      console.error('[EMAIL-SERVICE] Error in scheduleCashFlowWarning:', error)
      throw error
    }
  }

  /**
   * Schedule daily executive briefings for all premium users
   */
  async scheduleDailyBriefingsForAllUsers(): Promise<void> {
    try {
      console.log('[EMAIL-SERVICE] Scheduling daily briefings for all premium users...')

      // Get all users who have executive briefings enabled
      const { data: users, error } = await supabase
        .from('email_preferences')
        .select('user_id')
        .eq('executive_briefings', true)

      if (error) {
        console.error('[EMAIL-SERVICE] Error fetching users for daily briefings:', error)
        return
      }

      if (!users || users.length === 0) {
        console.log('[EMAIL-SERVICE] No users found for daily briefings')
        return
      }

      // For each user, generate and schedule their briefing
      for (const user of users) {
        try {
          // Get the latest briefing data from executive_briefings table
          const { data: briefing } = await supabase
            .from('executive_briefings')
            .select('*')
            .eq('user_id', user.user_id)
            .eq('briefing_date', new Date().toISOString().split('T')[0])
            .single()

          if (briefing) {
            await this.scheduleExecutiveBriefing(user.user_id, briefing)
          }
        } catch (error) {
          console.error(`[EMAIL-SERVICE] Error scheduling briefing for user ${user.user_id}:`, error)
          continue
        }
      }

      console.log(`[EMAIL-SERVICE] Scheduled daily briefings for ${users.length} users`)
    } catch (error) {
      console.error('[EMAIL-SERVICE] Error in scheduleDailyBriefingsForAllUsers:', error)
    }
  }
}

export const emailService = new EmailService()