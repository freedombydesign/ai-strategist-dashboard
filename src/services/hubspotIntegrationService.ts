import { Client } from '@hubspot/api-client'
import { supabase } from '@/lib/supabase'

interface HubSpotConfig {
  accessToken: string
  portalId?: string
}

interface LeadSyncResult {
  success: boolean
  hubspotContactId?: string
  error?: string
  leadId: string
}

interface DealSyncResult {
  success: boolean
  hubspotDealId?: string
  error?: string
  proposalId: string
}

class HubSpotIntegrationService {
  private hubspotClient: Client | null = null
  private isInitialized = false

  constructor() {
    this.initializeClient()
  }

  private async initializeClient(): Promise<void> {
    try {
      const accessToken = process.env.HUBSPOT_ACCESS_TOKEN
      
      if (!accessToken) {
        console.warn('[HUBSPOT] Access token not found in environment variables')
        return
      }

      this.hubspotClient = new Client({ accessToken })
      this.isInitialized = true
      
      console.log('[HUBSPOT] Client initialized successfully')
    } catch (error) {
      console.error('[HUBSPOT] Failed to initialize client:', error)
      this.isInitialized = false
    }
  }

  private ensureInitialized(): boolean {
    if (!this.isInitialized || !this.hubspotClient) {
      console.warn('[HUBSPOT] Client not initialized')
      return false
    }
    return true
  }

  // Sync lead to HubSpot and update local database
  async syncLeadToHubSpot(leadId: string): Promise<LeadSyncResult> {
    if (!this.ensureInitialized()) {
      return { success: false, error: 'HubSpot client not initialized', leadId }
    }

    try {
      // Get lead from our database
      const { data: lead, error: leadError } = await supabase
        .from('convert_flow_leads')
        .select('*')
        .eq('id', leadId)
        .single()

      if (leadError || !lead) {
        return { success: false, error: 'Lead not found in database', leadId }
      }

      // Check if already synced
      if (lead.hubspot_contact_id) {
        return await this.updateHubSpotContact(lead.hubspot_contact_id, lead, leadId)
      }

      // Create new contact in HubSpot
      const contactData = this.buildHubSpotContactData(lead)
      
      const response = await this.hubspotClient!.crm.contacts.basicApi.create({
        properties: contactData,
        associations: []
      })

      // Update our database with HubSpot contact ID
      const { error: updateError } = await supabase
        .from('convert_flow_leads')
        .update({ 
          hubspot_contact_id: response.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', leadId)

      if (updateError) {
        console.error('[HUBSPOT] Failed to update local lead with HubSpot ID:', updateError)
      }

      // Update sync status
      await this.updateSyncStatus(leadId, 'leads', 'synced', response.id)

      return { 
        success: true, 
        hubspotContactId: response.id, 
        leadId 
      }

    } catch (error: any) {
      console.error('[HUBSPOT] Failed to sync lead:', error)
      
      // Update sync status with error
      await this.updateSyncStatus(leadId, 'leads', 'error', undefined, error.message)
      
      return { 
        success: false, 
        error: error.message || 'Unknown error', 
        leadId 
      }
    }
  }

  // Update existing HubSpot contact
  private async updateHubSpotContact(hubspotContactId: string, lead: any, leadId: string): Promise<LeadSyncResult> {
    try {
      const contactData = this.buildHubSpotContactData(lead)
      
      await this.hubspotClient!.crm.contacts.basicApi.update(hubspotContactId, {
        properties: contactData
      })

      await this.updateSyncStatus(leadId, 'leads', 'synced', hubspotContactId)

      return { 
        success: true, 
        hubspotContactId, 
        leadId 
      }

    } catch (error: any) {
      console.error('[HUBSPOT] Failed to update contact:', error)
      await this.updateSyncStatus(leadId, 'leads', 'error', hubspotContactId, error.message)
      
      return { 
        success: false, 
        error: error.message || 'Unknown error', 
        leadId 
      }
    }
  }

  // Build HubSpot contact properties from our lead data
  private buildHubSpotContactData(lead: any): Record<string, string> {
    const properties: Record<string, string> = {
      firstname: lead.first_name || '',
      lastname: lead.last_name || '',
      email: lead.email || '',
      lifecyclestage: this.mapLifecycleStage(lead.stage),
      hs_lead_status: this.mapLeadStatus(lead.status),
      lead_score: lead.lead_score?.toString() || '0'
    }

    // Optional fields
    if (lead.phone) properties.phone = lead.phone
    if (lead.company) properties.company = lead.company
    if (lead.title) properties.jobtitle = lead.title
    if (lead.industry) properties.industry = lead.industry
    if (lead.lead_source) properties.hs_analytics_source = lead.lead_source
    if (lead.utm_campaign) properties.hs_analytics_source_data_1 = lead.utm_campaign
    if (lead.utm_medium) properties.hs_analytics_source_data_2 = lead.utm_medium
    if (lead.budget_range) properties.budget = lead.budget_range
    if (lead.annual_revenue) properties.annualrevenue = lead.annual_revenue
    if (lead.company_size) properties.numberofemployees = lead.company_size

    // Custom properties for lead intelligence
    if (lead.pain_points?.length > 0) {
      properties.pain_points = lead.pain_points.join(', ')
    }
    if (lead.decision_timeline) {
      properties.decision_timeline = lead.decision_timeline
    }
    if (lead.qualification_status) {
      properties.qualification_status = lead.qualification_status
    }

    return properties
  }

  // Map our internal stage to HubSpot lifecycle stage
  private mapLifecycleStage(stage: string): string {
    const stageMap: Record<string, string> = {
      'new': 'lead',
      'contacted': 'lead',
      'qualified': 'marketingqualifiedlead',
      'opportunity': 'salesqualifiedlead',
      'proposal': 'opportunity',
      'negotiation': 'opportunity',
      'closed_won': 'customer',
      'closed_lost': 'other'
    }
    return stageMap[stage] || 'lead'
  }

  // Map our internal status to HubSpot lead status
  private mapLeadStatus(status: string): string {
    const statusMap: Record<string, string> = {
      'active': 'OPEN',
      'nurturing': 'IN_PROGRESS',
      'unqualified': 'UNQUALIFIED',
      'closed': 'CONNECTED',
      'lost': 'BAD_TIMING'
    }
    return statusMap[status] || 'OPEN'
  }

  // Sync proposal/deal to HubSpot
  async syncProposalToHubSpot(proposalId: string): Promise<DealSyncResult> {
    if (!this.ensureInitialized()) {
      return { success: false, error: 'HubSpot client not initialized', proposalId }
    }

    try {
      // Get proposal and associated lead
      const { data: proposal, error: proposalError } = await supabase
        .from('convert_flow_proposals')
        .select(`
          *,
          convert_flow_leads!inner(*)
        `)
        .eq('id', proposalId)
        .single()

      if (proposalError || !proposal) {
        return { success: false, error: 'Proposal not found', proposalId }
      }

      // Ensure lead is synced to HubSpot first
      const lead = proposal.convert_flow_leads
      if (!lead.hubspot_contact_id) {
        const leadSyncResult = await this.syncLeadToHubSpot(lead.id)
        if (!leadSyncResult.success) {
          return { success: false, error: 'Failed to sync associated lead', proposalId }
        }
      }

      // Create deal in HubSpot
      const dealData = this.buildHubSpotDealData(proposal, lead)
      
      const response = await this.hubspotClient!.crm.deals.basicApi.create({
        properties: dealData,
        associations: [
          {
            to: { id: lead.hubspot_contact_id },
            types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 3 }] // Contact to Deal
          }
        ]
      })

      // Update proposal with HubSpot deal ID
      await supabase
        .from('convert_flow_proposals')
        .update({ 
          hubspot_deal_id: response.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', proposalId)

      await this.updateSyncStatus(proposalId, 'deals', 'synced', response.id)

      return { 
        success: true, 
        hubspotDealId: response.id, 
        proposalId 
      }

    } catch (error: any) {
      console.error('[HUBSPOT] Failed to sync proposal:', error)
      await this.updateSyncStatus(proposalId, 'deals', 'error', undefined, error.message)
      
      return { 
        success: false, 
        error: error.message || 'Unknown error', 
        proposalId 
      }
    }
  }

  // Build HubSpot deal properties from proposal data
  private buildHubSpotDealData(proposal: any, lead: any): Record<string, string> {
    return {
      dealname: proposal.title || `Proposal for ${lead.company || lead.first_name + ' ' + lead.last_name}`,
      dealstage: this.mapDealStage(proposal.status),
      pipeline: 'default',
      amount: proposal.total_amount?.toString() || '0',
      closedate: proposal.valid_until ? new Date(proposal.valid_until).getTime().toString() : '',
      dealtype: 'existingbusiness',
      description: proposal.description || '',
      hs_priority: this.calculateDealPriority(proposal, lead).toString()
    }
  }

  // Map proposal status to HubSpot deal stage
  private mapDealStage(status: string): string {
    const stageMap: Record<string, string> = {
      'draft': 'appointmentscheduled',
      'sent': 'qualifiedtobuy',
      'viewed': 'presentationscheduled',
      'accepted': 'decisionmakerboughtin',
      'rejected': 'closedlost',
      'expired': 'closedlost'
    }
    return stageMap[status] || 'appointmentscheduled'
  }

  // Calculate deal priority based on lead score and proposal value
  private calculateDealPriority(proposal: any, lead: any): number {
    let priority = 1 // Low

    const amount = parseFloat(proposal.total_amount || '0')
    const leadScore = parseInt(lead.lead_score || '0')

    // High value deals get higher priority
    if (amount > 100000) priority = 3 // High
    else if (amount > 50000) priority = 2 // Medium

    // High scoring leads get priority boost
    if (leadScore > 80) priority = Math.max(priority, 3)
    else if (leadScore > 60) priority = Math.max(priority, 2)

    return priority
  }

  // Fetch and sync HubSpot contacts to our database
  async syncHubSpotContactsToDatabase(limit: number = 100): Promise<number> {
    if (!this.ensureInitialized()) {
      console.warn('[HUBSPOT] Cannot sync - client not initialized')
      return 0
    }

    try {
      const contacts = await this.hubspotClient!.crm.contacts.basicApi.getPage(
        limit,
        undefined,
        [
          'firstname', 'lastname', 'email', 'phone', 'company', 'jobtitle',
          'lifecyclestage', 'hs_lead_status', 'lead_score', 'createdate',
          'lastmodifieddate', 'hs_analytics_source'
        ]
      )

      let syncedCount = 0

      for (const contact of contacts.results) {
        try {
          await this.syncHubSpotContactToDatabase(contact)
          syncedCount++
        } catch (error) {
          console.error('[HUBSPOT] Failed to sync individual contact:', contact.id, error)
        }
      }

      console.log(`[HUBSPOT] Successfully synced ${syncedCount} contacts from HubSpot`)
      return syncedCount

    } catch (error) {
      console.error('[HUBSPOT] Failed to sync contacts from HubSpot:', error)
      return 0
    }
  }

  // Sync individual HubSpot contact to our database
  private async syncHubSpotContactToDatabase(contact: any): Promise<void> {
    const leadData = {
      hubspot_contact_id: contact.id,
      first_name: contact.properties.firstname || '',
      last_name: contact.properties.lastname || '',
      email: contact.properties.email || '',
      phone: contact.properties.phone || '',
      company: contact.properties.company || '',
      title: contact.properties.jobtitle || '',
      lead_source: contact.properties.hs_analytics_source || 'hubspot',
      stage: this.mapHubSpotLifecycleStage(contact.properties.lifecyclestage),
      status: this.mapHubSpotLeadStatus(contact.properties.hs_lead_status),
      lead_score: parseInt(contact.properties.lead_score || '0'),
      created_at: contact.properties.createdate ? new Date(contact.properties.createdate).toISOString() : new Date().toISOString(),
      updated_at: contact.properties.lastmodifieddate ? new Date(contact.properties.lastmodifieddate).toISOString() : new Date().toISOString()
    }

    // Check if lead already exists
    const { data: existingLead } = await supabase
      .from('convert_flow_leads')
      .select('id')
      .eq('hubspot_contact_id', contact.id)
      .single()

    if (existingLead) {
      // Update existing lead
      await supabase
        .from('convert_flow_leads')
        .update(leadData)
        .eq('id', existingLead.id)
    } else {
      // Create new lead
      const { data: newLead } = await supabase
        .from('convert_flow_leads')
        .insert(leadData)
        .select('id')
        .single()

      if (newLead) {
        await this.updateSyncStatus(newLead.id, 'leads', 'synced', contact.id)
      }
    }
  }

  // Map HubSpot lifecycle stage to our internal stage
  private mapHubSpotLifecycleStage(lifecyclestage: string): string {
    const stageMap: Record<string, string> = {
      'lead': 'new',
      'marketingqualifiedlead': 'qualified',
      'salesqualifiedlead': 'opportunity',
      'opportunity': 'proposal',
      'customer': 'closed_won',
      'other': 'closed_lost'
    }
    return stageMap[lifecyclestage] || 'new'
  }

  // Map HubSpot lead status to our internal status
  private mapHubSpotLeadStatus(leadStatus: string): string {
    const statusMap: Record<string, string> = {
      'OPEN': 'active',
      'IN_PROGRESS': 'nurturing',
      'UNQUALIFIED': 'unqualified',
      'CONNECTED': 'closed',
      'BAD_TIMING': 'nurturing'
    }
    return statusMap[leadStatus] || 'active'
  }

  // Update sync status in database
  private async updateSyncStatus(
    entityId: string, 
    entityType: string, 
    status: string, 
    externalId?: string, 
    error?: string
  ): Promise<void> {
    try {
      await supabase
        .from('convert_flow_sync_status')
        .upsert({
          integration_type: 'hubspot',
          entity_type: entityType,
          entity_id: entityId,
          external_id: externalId,
          sync_status: status,
          last_synced_at: new Date().toISOString(),
          sync_error: error,
          retry_count: status === 'error' ? 1 : 0
        })
    } catch (error) {
      console.error('[HUBSPOT] Failed to update sync status:', error)
    }
  }

  // Get sync statistics
  async getSyncStats(): Promise<any> {
    try {
      const { data: syncStats } = await supabase
        .from('convert_flow_sync_status')
        .select('sync_status, entity_type')
        .eq('integration_type', 'hubspot')

      const stats = {
        total: syncStats?.length || 0,
        synced: syncStats?.filter(s => s.sync_status === 'synced').length || 0,
        pending: syncStats?.filter(s => s.sync_status === 'pending').length || 0,
        errors: syncStats?.filter(s => s.sync_status === 'error').length || 0,
        byEntity: {} as Record<string, any>
      }

      // Group by entity type
      for (const stat of syncStats || []) {
        if (!stats.byEntity[stat.entity_type]) {
          stats.byEntity[stat.entity_type] = { total: 0, synced: 0, pending: 0, errors: 0 }
        }
        stats.byEntity[stat.entity_type].total++
        stats.byEntity[stat.entity_type][stat.sync_status]++
      }

      return stats
    } catch (error) {
      console.error('[HUBSPOT] Failed to get sync stats:', error)
      return { total: 0, synced: 0, pending: 0, errors: 0, byEntity: {} }
    }
  }

  // Bulk sync all pending leads
  async bulkSyncLeads(): Promise<{ success: number; errors: number }> {
    try {
      const { data: pendingLeads } = await supabase
        .from('convert_flow_leads')
        .select('id')
        .is('hubspot_contact_id', null)
        .limit(50) // Process in batches

      let success = 0
      let errors = 0

      for (const lead of pendingLeads || []) {
        const result = await this.syncLeadToHubSpot(lead.id)
        if (result.success) {
          success++
        } else {
          errors++
        }

        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      return { success, errors }
    } catch (error) {
      console.error('[HUBSPOT] Failed bulk sync:', error)
      return { success: 0, errors: 1 }
    }
  }
}

export const hubspotIntegrationService = new HubSpotIntegrationService()