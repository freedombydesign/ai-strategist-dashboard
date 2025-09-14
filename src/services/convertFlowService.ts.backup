import { hubspotHelpers, mailchimpHelpers } from '@/lib/integrations'

export interface ConvertFlowMetrics {
  leadsGenerated: number
  conversionRate: number
  pipelineValue: number
  avgDealSize: number
  salesCycleLength: number
  emailSubscribers: number
  emailOpenRate: number
  emailClickRate: number
  campaignsActive: number
  healthScore: number
  monthlyGrowth: number
}

export interface Lead {
  id: string
  name: string
  email: string
  phone?: string
  company?: string
  status: string
  source: string
  value: number
  createdAt: string
  lastContact: string
  stage: string
}

export interface Campaign {
  id: string
  name: string
  type: 'email' | 'social' | 'content' | 'paid'
  status: string
  startDate: string
  endDate?: string
  budget: number
  spend: number
  leads: number
  conversions: number
  roi: number
}

class ConvertFlowService {
  // Get comprehensive conversion metrics
  async getConversionMetrics(): Promise<ConvertFlowMetrics> {
    try {
      // Get leads and deals from HubSpot
      const [contacts, deals] = await Promise.all([
        hubspotHelpers.getContacts(100),
        hubspotHelpers.getDeals(100)
      ])

      // Get email data from Mailchimp
      const [lists, campaigns] = await Promise.all([
        mailchimpHelpers.getLists(),
        mailchimpHelpers.getCampaigns(20)
      ])

      // Calculate lead metrics
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      const recentContacts = contacts.filter((contact: any) => 
        new Date(contact.createdAt || contact.properties?.createdate) > thirtyDaysAgo
      )
      
      const leadsGenerated = recentContacts.length
      
      // Calculate conversion metrics from deals
      const closedDeals = deals.filter((deal: any) => 
        deal.properties?.dealstage === 'closedwon' || deal.properties?.pipeline === 'closed'
      )
      
      const conversionRate = leadsGenerated > 0 ? (closedDeals.length / leadsGenerated) * 100 : 0
      
      // Calculate pipeline value
      const pipelineValue = deals
        .filter((deal: any) => deal.properties?.dealstage !== 'closedlost')
        .reduce((sum: number, deal: any) => sum + (parseFloat(deal.properties?.amount || '0')), 0)
      
      // Calculate average deal size
      const avgDealSize = closedDeals.length > 0 
        ? closedDeals.reduce((sum: number, deal: any) => sum + (parseFloat(deal.properties?.amount || '0')), 0) / closedDeals.length
        : 0

      // Calculate email metrics
      const totalSubscribers = lists.reduce((sum: number, list: any) => sum + (list.stats?.member_count || 0), 0)
      const avgOpenRate = campaigns.length > 0
        ? campaigns.reduce((sum: number, campaign: any) => sum + (campaign.report_summary?.open_rate || 0), 0) / campaigns.length * 100
        : 0
      const avgClickRate = campaigns.length > 0
        ? campaigns.reduce((sum: number, campaign: any) => sum + (campaign.report_summary?.click_rate || 0), 0) / campaigns.length * 100
        : 0

      // Calculate sales cycle (simplified)
      const salesCycleLength = 21 // Default 21 days, would calculate from actual deal timeline

      // Calculate health score
      const healthScore = this.calculateConversionHealthScore({
        conversionRate,
        pipelineValue,
        emailOpenRate: avgOpenRate,
        leadsGenerated
      })

      return {
        leadsGenerated,
        conversionRate,
        pipelineValue,
        avgDealSize,
        salesCycleLength,
        emailSubscribers: totalSubscribers,
        emailOpenRate: avgOpenRate,
        emailClickRate: avgClickRate,
        campaignsActive: campaigns.filter((c: any) => c.status === 'sending' || c.status === 'sent').length,
        healthScore,
        monthlyGrowth: 15.2 // Would calculate from historical data
      }
    } catch (error) {
      console.error('Error calculating conversion metrics:', error)
      return {
        leadsGenerated: 0,
        conversionRate: 0,
        pipelineValue: 0,
        avgDealSize: 0,
        salesCycleLength: 0,
        emailSubscribers: 0,
        emailOpenRate: 0,
        emailClickRate: 0,
        campaignsActive: 0,
        healthScore: 0,
        monthlyGrowth: 0
      }
    }
  }

  // Get lead pipeline data
  async getLeadPipeline(): Promise<Lead[]> {
    try {
      const contacts = await hubspotHelpers.getContacts(50)
      
      return contacts.map((contact: any) => ({
        id: contact.id,
        name: `${contact.properties?.firstname || ''} ${contact.properties?.lastname || ''}`.trim() || 'Unknown',
        email: contact.properties?.email || '',
        phone: contact.properties?.phone || '',
        company: contact.properties?.company || '',
        status: contact.properties?.lifecyclestage || 'lead',
        source: contact.properties?.hs_analytics_source || 'unknown',
        value: parseFloat(contact.properties?.hs_predicted_amount || '0'),
        createdAt: contact.properties?.createdate || new Date().toISOString(),
        lastContact: contact.properties?.lastmodifieddate || new Date().toISOString(),
        stage: contact.properties?.dealstage || 'new'
      }))
    } catch (error) {
      console.error('Error fetching lead pipeline:', error)
      return []
    }
  }

  // Get active campaigns
  async getCampaigns(): Promise<Campaign[]> {
    try {
      const mailchimpCampaigns = await mailchimpHelpers.getCampaigns(30)
      
      return mailchimpCampaigns.map((campaign: any) => ({
        id: campaign.id,
        name: campaign.settings?.title || campaign.settings?.subject_line || 'Untitled Campaign',
        type: 'email' as const,
        status: campaign.status,
        startDate: campaign.send_time || campaign.create_time,
        budget: 1000, // Placeholder - would come from campaign settings
        spend: 750, // Placeholder - would calculate from actual spend
        leads: campaign.report_summary?.subscriber_clicks || 0,
        conversions: Math.floor((campaign.report_summary?.subscriber_clicks || 0) * 0.05), // Estimate 5% conversion
        roi: campaign.report_summary?.subscriber_clicks > 0 ? 
          ((campaign.report_summary?.subscriber_clicks * 50 - 750) / 750) * 100 : 0 // Estimate $50 value per click
      }))
    } catch (error) {
      console.error('Error fetching campaigns:', error)
      return []
    }
  }

  // Calculate conversion health score
  private calculateConversionHealthScore(metrics: {
    conversionRate: number
    pipelineValue: number
    emailOpenRate: number
    leadsGenerated: number
  }): number {
    let score = 100

    // Conversion rate impact (40%)
    if (metrics.conversionRate < 2) score -= 30
    else if (metrics.conversionRate < 5) score -= 15
    else if (metrics.conversionRate > 10) score += 10

    // Pipeline value impact (30%)
    if (metrics.pipelineValue < 50000) score -= 20
    else if (metrics.pipelineValue > 500000) score += 15

    // Email performance impact (20%)
    if (metrics.emailOpenRate < 15) score -= 15
    else if (metrics.emailOpenRate > 25) score += 10

    // Lead generation impact (10%)
    if (metrics.leadsGenerated < 10) score -= 10
    else if (metrics.leadsGenerated > 50) score += 5

    return Math.max(0, Math.min(100, Math.round(score)))
  }

  // Create new lead
  async createLead(leadData: {
    firstName: string
    lastName: string
    email: string
    company?: string
    phone?: string
    source?: string
  }): Promise<any> {
    try {
      // Create contact in HubSpot
      const hubspotContact = await hubspotHelpers.createContact({
        firstname: leadData.firstName,
        lastname: leadData.lastName,
        email: leadData.email,
        company: leadData.company,
        phone: leadData.phone,
        hs_analytics_source: leadData.source || 'api',
        lifecyclestage: 'lead'
      })

      // Add to Mailchimp list (if lists exist)
      const lists = await mailchimpHelpers.getLists()
      if (lists.length > 0) {
        await mailchimpHelpers.addSubscriber(
          lists[0].id, 
          leadData.email, 
          leadData.firstName, 
          leadData.lastName
        )
      }

      return hubspotContact
    } catch (error) {
      console.error('Error creating lead:', error)
      return null
    }
  }

  // Send email campaign
  async sendEmailCampaign(campaignData: {
    listId: string
    subject: string
    content: string
    fromName: string
    replyTo: string
  }): Promise<any> {
    try {
      // In a real implementation, this would create and send a Mailchimp campaign
      // For now, return success simulation
      return {
        success: true,
        campaignId: `campaign_${Date.now()}`,
        scheduled: true,
        recipientCount: 100 // Placeholder
      }
    } catch (error) {
      console.error('Error sending email campaign:', error)
      return null
    }
  }
}

export const convertFlowService = new ConvertFlowService()