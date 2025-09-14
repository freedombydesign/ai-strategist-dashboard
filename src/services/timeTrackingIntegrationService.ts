// ProfitPulse - Time Tracking Integration Service
// Universal time tracking with Toggl, Harvest, RescueTime and manual entry

import { supabase } from '@/lib/supabase'

// Time tracking interfaces
interface TimeEntry {
  id: string
  externalId?: string
  projectId: string
  teamMemberId?: string
  date: string
  hours: number
  description: string
  billable: boolean
  billed: boolean
  hourlyRate: number
  revenue: number
  cost: number
  profit: number
  source: 'manual' | 'toggl' | 'harvest' | 'rescuetime' | 'clockwise'
  tags?: string[]
  approved: boolean
  createdAt: string
  updatedAt: string
}

interface TimeTrackingIntegration {
  id: string
  userId: string
  platform: 'toggl' | 'harvest' | 'rescuetime' | 'clockwise'
  apiKey: string
  workspaceId?: string
  lastSync: string
  syncStatus: 'active' | 'error' | 'disabled'
  errorMessage?: string
  settings: IntegrationSettings
}

interface IntegrationSettings {
  autoSync: boolean
  syncInterval: number // minutes
  defaultBillable: boolean
  projectMapping: Record<string, string> // external project ID -> internal project ID
  teamMemberMapping: Record<string, string> // external user ID -> internal team member ID
  rateOverrides: Record<string, number> // project ID -> hourly rate
  excludeTags: string[]
  includeOnlyTags: string[]
}

interface SyncResult {
  success: boolean
  entriesProcessed: number
  entriesAdded: number
  entriesUpdated: number
  entriesSkipped: number
  errors: SyncError[]
  lastSyncTime: string
}

interface SyncError {
  entryId: string
  error: string
  severity: 'warning' | 'error'
}

interface TogglTimeEntry {
  id: number
  description: string
  start: string
  stop: string
  duration: number
  project_id: number
  user_id: number
  billable: boolean
  tags: string[]
}

interface HarvestTimeEntry {
  id: number
  spent_date: string
  hours: number
  notes: string
  project: { id: number; name: string }
  user: { id: number; name: string }
  billable: boolean
  billable_rate: number
}

interface ProductivityMetrics {
  userId: string
  date: string
  totalHours: number
  productiveHours: number
  billableHours: number
  productivityScore: number // 0-100
  topCategories: ProductivityCategory[]
  distractionTime: number
  focusTime: number
  peakProductivityHours: string[]
}

interface ProductivityCategory {
  category: string
  hours: number
  percentage: number
  productivity: 'very_productive' | 'productive' | 'neutral' | 'distracting' | 'very_distracting'
}

export class TimeTrackingIntegrationService {
  
  // Setup integration with time tracking platform
  async setupIntegration(userId: string, integrationData: {
    platform: 'toggl' | 'harvest' | 'rescuetime' | 'clockwise'
    apiKey: string
    workspaceId?: string
    settings?: Partial<IntegrationSettings>
  }): Promise<TimeTrackingIntegration> {
    const { platform, apiKey, workspaceId, settings } = integrationData
    
    try {
      // Validate API key by testing connection
      const isValid = await this.validateAPIKey(platform, apiKey, workspaceId)
      if (!isValid) {
        throw new Error('Invalid API credentials')
      }
      
      const defaultSettings: IntegrationSettings = {
        autoSync: true,
        syncInterval: 30, // 30 minutes
        defaultBillable: true,
        projectMapping: {},
        teamMemberMapping: {},
        rateOverrides: {},
        excludeTags: ['personal', 'break', 'lunch'],
        includeOnlyTags: [],
        ...settings
      }
      
      // Store integration settings (encrypt API key)
      const { data, error } = await supabase
        .from('profit_integrations')
        .upsert({
          user_id: userId,
          integration_type: platform,
          integration_name: platform.charAt(0).toUpperCase() + platform.slice(1),
          api_credentials: { 
            apiKey: this.encryptApiKey(apiKey), 
            workspaceId 
          },
          settings: defaultSettings,
          sync_status: 'active',
          last_sync: new Date().toISOString(),
          cac_sync_enabled: false
        }, {
          onConflict: 'user_id,integration_type'
        })
        .select()
        .single()
      
      if (error) throw error
      
      // Perform initial sync
      await this.syncTimeEntries(userId, platform)
      
      return {
        id: data.id,
        userId,
        platform,
        apiKey: '***', // Don't return actual key
        workspaceId,
        lastSync: data.last_sync,
        syncStatus: 'active',
        settings: defaultSettings
      }
      
    } catch (error) {
      console.error('Error setting up integration:', error)
      throw error
    }
  }
  
  // Validate API key for specific platform
  private async validateAPIKey(platform: string, apiKey: string, workspaceId?: string): Promise<boolean> {
    try {
      switch (platform) {
        case 'toggl':
          return await this.validateTogglAPI(apiKey, workspaceId)
        case 'harvest':
          return await this.validateHarvestAPI(apiKey)
        case 'rescuetime':
          return await this.validateRescueTimeAPI(apiKey)
        default:
          return false
      }
    } catch (error) {
      return false
    }
  }
  
  // Validate Toggl API
  private async validateTogglAPI(apiKey: string, workspaceId?: string): Promise<boolean> {
    try {
      const response = await fetch('https://api.track.toggl.com/api/v9/me', {
        headers: {
          'Authorization': `Basic ${Buffer.from(apiKey + ':api_token').toString('base64')}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) return false
      
      const user = await response.json()
      return !!user.id
      
    } catch (error) {
      return false
    }
  }
  
  // Validate Harvest API
  private async validateHarvestAPI(apiKey: string): Promise<boolean> {
    try {
      // Harvest API validation would go here
      // For demo, assuming valid
      return true
    } catch (error) {
      return false
    }
  }
  
  // Validate RescueTime API
  private async validateRescueTimeAPI(apiKey: string): Promise<boolean> {
    try {
      const response = await fetch(`https://www.rescuetime.com/anapi/data?key=${apiKey}&format=json&restrict_begin=2024-01-01&restrict_end=2024-01-02`)
      return response.ok
    } catch (error) {
      return false
    }
  }
  
  // Encrypt API key for storage
  private encryptApiKey(apiKey: string): string {
    // In production, use proper encryption
    return Buffer.from(apiKey).toString('base64')
  }
  
  // Decrypt API key
  private decryptApiKey(encryptedKey: string): string {
    // In production, use proper decryption
    return Buffer.from(encryptedKey, 'base64').toString()
  }
  
  // Sync time entries from all connected platforms
  async syncTimeEntries(userId: string, platform?: string): Promise<SyncResult[]> {
    try {
      // Get all active integrations for user
      let query = supabase
        .from('profit_integrations')
        .select('*')
        .eq('user_id', userId)
        .eq('sync_status', 'active')
        .in('integration_type', ['toggl', 'harvest', 'rescuetime', 'clockwise'])
      
      if (platform) {
        query = query.eq('integration_type', platform)
      }
      
      const { data: integrations, error } = await query
      if (error) throw error
      
      const results: SyncResult[] = []
      
      for (const integration of integrations || []) {
        const result = await this.syncPlatformEntries(userId, integration)
        results.push(result)
      }
      
      return results
      
    } catch (error) {
      console.error('Error syncing time entries:', error)
      throw error
    }
  }
  
  // Sync entries from specific platform
  private async syncPlatformEntries(userId: string, integration: any): Promise<SyncResult> {
    const result: SyncResult = {
      success: false,
      entriesProcessed: 0,
      entriesAdded: 0,
      entriesUpdated: 0,
      entriesSkipped: 0,
      errors: [],
      lastSyncTime: new Date().toISOString()
    }
    
    try {
      const apiKey = this.decryptApiKey(integration.api_credentials.apiKey)
      const lastSync = new Date(integration.last_sync)
      
      let entries: any[] = []
      
      switch (integration.integration_type) {
        case 'toggl':
          entries = await this.fetchTogglEntries(apiKey, integration.api_credentials.workspaceId, lastSync)
          break
        case 'harvest':
          entries = await this.fetchHarvestEntries(apiKey, lastSync)
          break
        case 'rescuetime':
          entries = await this.fetchRescueTimeEntries(apiKey, lastSync)
          break
      }
      
      result.entriesProcessed = entries.length
      
      for (const entry of entries) {
        try {
          const processed = await this.processTimeEntry(userId, integration, entry)
          
          if (processed.action === 'added') result.entriesAdded++
          else if (processed.action === 'updated') result.entriesUpdated++
          else result.entriesSkipped++
          
        } catch (error) {
          result.errors.push({
            entryId: entry.id?.toString() || 'unknown',
            error: error instanceof Error ? error.message : 'Unknown error',
            severity: 'error'
          })
        }
      }
      
      // Update last sync time
      await supabase
        .from('profit_integrations')
        .update({ 
          last_sync: result.lastSyncTime,
          records_synced: (integration.records_synced || 0) + result.entriesAdded + result.entriesUpdated
        })
        .eq('id', integration.id)
      
      result.success = result.errors.length === 0
      
    } catch (error) {
      result.errors.push({
        entryId: 'sync',
        error: error instanceof Error ? error.message : 'Sync failed',
        severity: 'error'
      })
    }
    
    return result
  }
  
  // Fetch entries from Toggl
  private async fetchTogglEntries(apiKey: string, workspaceId: string, since: Date): Promise<TogglTimeEntry[]> {
    const sinceISO = since.toISOString()
    const response = await fetch(
      `https://api.track.toggl.com/api/v9/workspaces/${workspaceId}/time_entries?since=${sinceISO}`,
      {
        headers: {
          'Authorization': `Basic ${Buffer.from(apiKey + ':api_token').toString('base64')}`,
          'Content-Type': 'application/json'
        }
      }
    )
    
    if (!response.ok) throw new Error('Failed to fetch Toggl entries')
    
    return await response.json()
  }
  
  // Fetch entries from Harvest
  private async fetchHarvestEntries(apiKey: string, since: Date): Promise<HarvestTimeEntry[]> {
    // Harvest API implementation would go here
    // For demo, returning empty array
    return []
  }
  
  // Fetch entries from RescueTime
  private async fetchRescueTimeEntries(apiKey: string, since: Date): Promise<any[]> {
    const sinceDate = since.toISOString().split('T')[0]
    const response = await fetch(
      `https://www.rescuetime.com/anapi/data?key=${apiKey}&format=json&restrict_begin=${sinceDate}&perspective=interval&restrict_kind=activity`
    )
    
    if (!response.ok) throw new Error('Failed to fetch RescueTime data')
    
    const data = await response.json()
    return data.rows || []
  }
  
  // Process individual time entry
  private async processTimeEntry(userId: string, integration: any, entry: any): Promise<{ action: 'added' | 'updated' | 'skipped' }> {
    const settings = integration.settings as IntegrationSettings
    
    // Transform entry based on platform
    let transformedEntry: Partial<TimeEntry>
    
    switch (integration.integration_type) {
      case 'toggl':
        transformedEntry = await this.transformTogglEntry(userId, entry, settings)
        break
      case 'harvest':
        transformedEntry = await this.transformHarvestEntry(userId, entry, settings)
        break
      case 'rescuetime':
        transformedEntry = await this.transformRescueTimeEntry(userId, entry, settings)
        break
      default:
        return { action: 'skipped' }
    }
    
    if (!transformedEntry.projectId) {
      return { action: 'skipped' }
    }
    
    // Check if entry already exists
    const { data: existing } = await supabase
      .from('time_entries')
      .select('id')
      .eq('user_id', userId)
      .eq('external_id', transformedEntry.externalId)
      .eq('integration_source', integration.integration_type)
      .single()
    
    if (existing) {
      // Update existing entry
      const { error } = await supabase
        .from('time_entries')
        .update({
          hours: transformedEntry.hours,
          description: transformedEntry.description,
          billable: transformedEntry.billable,
          hourly_rate: transformedEntry.hourlyRate,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
      
      if (error) throw error
      return { action: 'updated' }
    } else {
      // Add new entry
      const { error } = await supabase
        .from('time_entries')
        .insert({
          user_id: userId,
          project_id: transformedEntry.projectId,
          team_member_id: transformedEntry.teamMemberId,
          external_id: transformedEntry.externalId,
          integration_source: integration.integration_type,
          date: transformedEntry.date,
          hours: transformedEntry.hours,
          description: transformedEntry.description,
          billable: transformedEntry.billable,
          billed: false,
          hourly_rate: transformedEntry.hourlyRate
        })
      
      if (error) throw error
      return { action: 'added' }
    }
  }
  
  // Transform Toggl entry
  private async transformTogglEntry(userId: string, entry: TogglTimeEntry, settings: IntegrationSettings): Promise<Partial<TimeEntry>> {
    // Map external project to internal project
    const projectId = settings.projectMapping[entry.project_id?.toString()] || null
    const teamMemberId = settings.teamMemberMapping[entry.user_id?.toString()] || null
    
    // Calculate hours from duration (Toggl returns seconds)
    const hours = Math.abs(entry.duration) / 3600
    
    // Skip if excluded tags
    if (settings.excludeTags.some(tag => entry.tags?.includes(tag))) {
      return {}
    }
    
    // Skip if include tags specified and none match
    if (settings.includeOnlyTags.length > 0 && !settings.includeOnlyTags.some(tag => entry.tags?.includes(tag))) {
      return {}
    }
    
    // Get rate override or use default
    const hourlyRate = projectId ? (settings.rateOverrides[projectId] || 0) : 0
    
    return {
      externalId: entry.id.toString(),
      projectId,
      teamMemberId,
      date: entry.start.split('T')[0],
      hours,
      description: entry.description || 'Time entry',
      billable: entry.billable ?? settings.defaultBillable,
      hourlyRate,
      revenue: hours * hourlyRate,
      source: 'toggl'
    }
  }
  
  // Transform Harvest entry
  private async transformHarvestEntry(userId: string, entry: HarvestTimeEntry, settings: IntegrationSettings): Promise<Partial<TimeEntry>> {
    const projectId = settings.projectMapping[entry.project.id?.toString()] || null
    const teamMemberId = settings.teamMemberMapping[entry.user.id?.toString()] || null
    
    const hourlyRate = entry.billable_rate || (projectId ? settings.rateOverrides[projectId] : 0) || 0
    
    return {
      externalId: entry.id.toString(),
      projectId,
      teamMemberId,
      date: entry.spent_date,
      hours: entry.hours,
      description: entry.notes || 'Time entry',
      billable: entry.billable ?? settings.defaultBillable,
      hourlyRate,
      revenue: entry.hours * hourlyRate,
      source: 'harvest'
    }
  }
  
  // Transform RescueTime entry
  private async transformRescueTimeEntry(userId: string, entry: any[], settings: IntegrationSettings): Promise<Partial<TimeEntry>> {
    // RescueTime returns arrays: [date, time_spent, number_of_people, activity, category, productivity]
    const [date, timeSpent, , activity, category, productivity] = entry
    
    const hours = timeSpent / 3600 // Convert seconds to hours
    
    // Only include productive activities for billing
    const isProductive = productivity >= 1 // 1 = productive, 2 = very productive
    
    return {
      externalId: `rt_${date}_${activity}`,
      projectId: null, // RescueTime doesn't have projects, would need manual mapping
      date,
      hours,
      description: `${activity} (${category})`,
      billable: isProductive && settings.defaultBillable,
      hourlyRate: 0, // Would need project mapping
      revenue: 0,
      source: 'rescuetime'
    }
  }
  
  // Manual time entry creation
  async createManualTimeEntry(userId: string, entryData: {
    projectId: string
    teamMemberId?: string
    date: string
    hours: number
    description: string
    billable?: boolean
    hourlyRate?: number
    tags?: string[]
  }): Promise<TimeEntry> {
    try {
      const { projectId, teamMemberId, date, hours, description, billable = true, hourlyRate = 0, tags } = entryData
      
      // Get project details for rate calculation
      const { data: project, error: projectError } = await supabase
        .from('profit_projects')
        .select('hourly_rate, profit_clients!inner(hourly_rate)')
        .eq('id', projectId)
        .eq('user_id', userId)
        .single()
      
      if (projectError) throw projectError
      
      const finalHourlyRate = hourlyRate || project.hourly_rate || project.profit_clients.hourly_rate || 0
      const revenue = hours * finalHourlyRate
      
      const { data, error } = await supabase
        .from('time_entries')
        .insert({
          user_id: userId,
          project_id: projectId,
          team_member_id: teamMemberId,
          integration_source: 'manual',
          date,
          hours,
          description,
          billable,
          billed: false,
          hourly_rate: finalHourlyRate
        })
        .select()
        .single()
      
      if (error) throw error
      
      return {
        id: data.id,
        externalId: data.external_id,
        projectId: data.project_id,
        teamMemberId: data.team_member_id,
        date: data.date,
        hours: data.hours,
        description: data.description,
        billable: data.billable,
        billed: data.billed,
        hourlyRate: data.hourly_rate,
        revenue: data.revenue,
        cost: data.cost,
        profit: data.profit,
        source: 'manual',
        tags: tags || [],
        approved: false,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      }
      
    } catch (error) {
      console.error('Error creating manual time entry:', error)
      throw error
    }
  }
  
  // Get productivity metrics from RescueTime
  async getProductivityMetrics(userId: string, date: string): Promise<ProductivityMetrics | null> {
    try {
      // Get RescueTime integration
      const { data: integration, error } = await supabase
        .from('profit_integrations')
        .select('api_credentials')
        .eq('user_id', userId)
        .eq('integration_type', 'rescuetime')
        .eq('sync_status', 'active')
        .single()
      
      if (error || !integration) return null
      
      const apiKey = this.decryptApiKey(integration.api_credentials.apiKey)
      
      // Fetch productivity data for the date
      const response = await fetch(
        `https://www.rescuetime.com/anapi/data?key=${apiKey}&format=json&restrict_begin=${date}&restrict_end=${date}&perspective=interval&restrict_kind=category`
      )
      
      if (!response.ok) return null
      
      const data = await response.json()
      const rows = data.rows || []
      
      // Process productivity data
      let totalHours = 0
      let productiveHours = 0
      let distractionTime = 0
      const categories: ProductivityCategory[] = []
      
      for (const row of rows) {
        const [, timeSpent, , activity, category, productivity] = row
        const hours = timeSpent / 3600
        
        totalHours += hours
        
        if (productivity >= 1) productiveHours += hours
        if (productivity <= -1) distractionTime += hours
        
        categories.push({
          category,
          hours,
          percentage: 0, // Will calculate after processing all
          productivity: this.mapProductivityScore(productivity)
        })
      }
      
      // Calculate percentages
      categories.forEach(cat => {
        cat.percentage = totalHours > 0 ? (cat.hours / totalHours) * 100 : 0
      })
      
      // Sort by time spent and take top categories
      const topCategories = categories
        .sort((a, b) => b.hours - a.hours)
        .slice(0, 10)
      
      const productivityScore = totalHours > 0 ? (productiveHours / totalHours) * 100 : 0
      const focusTime = productiveHours - distractionTime
      
      return {
        userId,
        date,
        totalHours,
        productiveHours,
        billableHours: 0, // Would need to cross-reference with billable entries
        productivityScore,
        topCategories,
        distractionTime,
        focusTime: Math.max(0, focusTime),
        peakProductivityHours: [] // Would need hour-by-hour analysis
      }
      
    } catch (error) {
      console.error('Error getting productivity metrics:', error)
      return null
    }
  }
  
  // Map productivity score to category
  private mapProductivityScore(score: number): ProductivityCategory['productivity'] {
    if (score >= 2) return 'very_productive'
    if (score >= 1) return 'productive'
    if (score >= -1) return 'neutral'
    if (score >= -2) return 'distracting'
    return 'very_distracting'
  }
  
  // Get time entries with filtering and pagination
  async getTimeEntries(userId: string, options?: {
    projectId?: string
    teamMemberId?: string
    startDate?: string
    endDate?: string
    billable?: boolean
    source?: string
    limit?: number
    offset?: number
  }): Promise<{ entries: TimeEntry[]; total: number }> {
    try {
      let query = supabase
        .from('time_entries')
        .select(`
          *,
          profit_projects!inner (
            name,
            profit_clients!inner (name)
          ),
          team_members (name)
        `, { count: 'exact' })
        .eq('user_id', userId)
        .order('date', { ascending: false })
      
      if (options?.projectId) query = query.eq('project_id', options.projectId)
      if (options?.teamMemberId) query = query.eq('team_member_id', options.teamMemberId)
      if (options?.startDate) query = query.gte('date', options.startDate)
      if (options?.endDate) query = query.lte('date', options.endDate)
      if (options?.billable !== undefined) query = query.eq('billable', options.billable)
      if (options?.source) query = query.eq('integration_source', options.source)
      
      if (options?.limit) query = query.limit(options.limit)
      if (options?.offset) query = query.range(options.offset, (options.offset + (options.limit || 50)) - 1)
      
      const { data, error, count } = await query
      if (error) throw error
      
      const entries: TimeEntry[] = (data || []).map(entry => ({
        id: entry.id,
        externalId: entry.external_id,
        projectId: entry.project_id,
        teamMemberId: entry.team_member_id,
        date: entry.date,
        hours: entry.hours,
        description: entry.description,
        billable: entry.billable,
        billed: entry.billed,
        hourlyRate: entry.hourly_rate,
        revenue: entry.revenue,
        cost: entry.cost,
        profit: entry.profit,
        source: entry.integration_source,
        tags: [],
        approved: entry.approved || false,
        createdAt: entry.created_at,
        updatedAt: entry.updated_at
      }))
      
      return { entries, total: count || 0 }
      
    } catch (error) {
      console.error('Error getting time entries:', error)
      throw error
    }
  }
  
  // Update integration settings
  async updateIntegrationSettings(userId: string, platform: string, settings: Partial<IntegrationSettings>): Promise<void> {
    try {
      const { data: integration, error: getError } = await supabase
        .from('profit_integrations')
        .select('settings')
        .eq('user_id', userId)
        .eq('integration_type', platform)
        .single()
      
      if (getError) throw getError
      
      const updatedSettings = { ...integration.settings, ...settings }
      
      const { error } = await supabase
        .from('profit_integrations')
        .update({ settings: updatedSettings })
        .eq('user_id', userId)
        .eq('integration_type', platform)
      
      if (error) throw error
      
    } catch (error) {
      console.error('Error updating integration settings:', error)
      throw error
    }
  }
  
  // Delete integration
  async deleteIntegration(userId: string, platform: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('profit_integrations')
        .delete()
        .eq('user_id', userId)
        .eq('integration_type', platform)
      
      if (error) throw error
      
    } catch (error) {
      console.error('Error deleting integration:', error)
      throw error
    }
  }
  
  // Get integration status
  async getIntegrationStatus(userId: string): Promise<TimeTrackingIntegration[]> {
    try {
      const { data, error } = await supabase
        .from('profit_integrations')
        .select('*')
        .eq('user_id', userId)
        .in('integration_type', ['toggl', 'harvest', 'rescuetime', 'clockwise'])
      
      if (error) throw error
      
      return (data || []).map(integration => ({
        id: integration.id,
        userId: integration.user_id,
        platform: integration.integration_type as any,
        apiKey: '***',
        workspaceId: integration.api_credentials?.workspaceId,
        lastSync: integration.last_sync,
        syncStatus: integration.sync_status as any,
        errorMessage: integration.error_message,
        settings: integration.settings
      }))
      
    } catch (error) {
      console.error('Error getting integration status:', error)
      throw error
    }
  }
}

export const timeTrackingIntegrationService = new TimeTrackingIntegrationService()