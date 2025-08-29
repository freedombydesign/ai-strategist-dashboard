import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'

// Lazy initialization to avoid import-time errors
let supabase: any = null
const getSupabase = () => {
  if (!supabase) {
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return supabase
}

interface ConversationMemoryEntry {
  id?: number
  user_id: string
  conversation_id: string
  message: string
  response: string
  context_tags: string[]
  interaction_type: 'general' | 'strategic_advice' | 'asset_generation' | 'troubleshooting' | 'sprint_guidance'
  business_stage?: string
  key_insights?: Record<string, any>
  referenced_decisions?: string[]
  generated_assets?: string[]
  priority_score: 1 | 2 | 3 | 4 | 5
  expires_at?: string
  metadata?: Record<string, any>
}

interface ConversationContext {
  recentConversations: ConversationMemoryEntry[]
  relatedInsights: ConversationMemoryEntry[]
  referencedDecisions: string[]
  businessEvolution: {
    stage: string
    keyChanges: string[]
  }
}

interface WebsiteIntelligence {
  id?: number
  user_id: string
  website_url: string
  page_content: string
  extracted_messaging: Record<string, any>
  brand_voice_analysis: Record<string, any>
  competitive_positioning?: string
  target_audience_signals: string[]
  service_offerings: string[]
  pricing_signals: Record<string, any>
  social_proof_elements: string[]
  content_themes: string[]
  seo_keywords: string[]
}

interface GeneratedAsset {
  id?: number
  user_id: string
  conversation_memory_id?: number
  asset_type: string
  asset_title: string
  asset_content: string
  personalization_factors: Record<string, any>
  business_context_snapshot: Record<string, any>
  website_context_snapshot: Record<string, any>
  referenced_conversations: string[]
  performance_metrics?: Record<string, any>
  version: number
  status: 'active' | 'archived' | 'superseded'
}

export class ConversationMemoryService {
  
  // Store a new conversation with enhanced context
  async storeConversation(entry: ConversationMemoryEntry): Promise<ConversationMemoryEntry | null> {
    try {
      console.log('[CONV-MEMORY] Storing conversation with context:', {
        conversation_id: entry.conversation_id,
        context_tags: entry.context_tags,
        interaction_type: entry.interaction_type,
        priority_score: entry.priority_score
      })

      const { data, error } = await getSupabase()
        .from('conversation_memory')
        .insert(entry)
        .select()
        .single()

      if (error) {
        console.error('[CONV-MEMORY] Error storing conversation:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('[CONV-MEMORY] Error storing conversation:', error)
      return null
    }
  }

  // Get conversation context for AI responses
  async getConversationContext(userId: string, currentTags: string[] = [], limit: number = 10): Promise<ConversationContext> {
    try {
      console.log('[CONV-MEMORY] Getting conversation context for user:', userId)

      // Get recent conversations (last 30 days)
      const { data: recentData, error: recentError } = await supabase
        .from('conversation_memory')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(limit)

      if (recentError) {
        console.error('[CONV-MEMORY] Error getting recent conversations:', recentError)
      }

      // Get related insights based on current context tags
      let relatedData = []
      if (currentTags.length > 0) {
        const { data: related, error: relatedError } = await getSupabase()
          .from('conversation_memory')
          .select('*')
          .eq('user_id', userId)
          .contains('context_tags', currentTags)
          .order('priority_score', { ascending: false })
          .limit(5)

        if (relatedError) {
          console.error('[CONV-MEMORY] Error getting related conversations:', relatedError)
        } else {
          relatedData = related || []
        }
      }

      // Analyze business evolution
      const businessEvolution = await this.analyzeBusinessEvolution(userId)

      // Extract referenced decisions
      const allConversations = [...(recentData || []), ...relatedData]
      const referencedDecisions = Array.from(new Set(
        allConversations.flatMap(conv => conv.referenced_decisions || [])
      ))

      return {
        recentConversations: recentData || [],
        relatedInsights: relatedData,
        referencedDecisions,
        businessEvolution
      }
    } catch (error) {
      console.error('[CONV-MEMORY] Error getting conversation context:', error)
      return {
        recentConversations: [],
        relatedInsights: [],
        referencedDecisions: [],
        businessEvolution: { stage: 'unknown', keyChanges: [] }
      }
    }
  }

  // Analyze how the business has evolved over time
  private async analyzeBusinessEvolution(userId: string): Promise<{ stage: string, keyChanges: string[] }> {
    try {
      const { data, error } = await getSupabase()
        .from('conversation_memory')
        .select('business_stage, key_insights, created_at')
        .eq('user_id', userId)
        .not('business_stage', 'is', null)
        .order('created_at', { ascending: true })
        .limit(20)

      if (error || !data || data.length === 0) {
        return { stage: 'unknown', keyChanges: [] }
      }

      // Get the most recent stage
      const currentStage = data[data.length - 1].business_stage
      
      // Track key changes over time
      const keyChanges = data
        .filter(item => item.key_insights && Object.keys(item.key_insights).length > 0)
        .map(item => Object.values(item.key_insights).join(', '))
        .slice(-5) // Last 5 key insights

      return {
        stage: currentStage || 'unknown',
        keyChanges: keyChanges as string[]
      }
    } catch (error) {
      console.error('[CONV-MEMORY] Error analyzing business evolution:', error)
      return { stage: 'unknown', keyChanges: [] }
    }
  }

  // Store website intelligence
  async storeWebsiteIntelligence(intelligence: WebsiteIntelligence): Promise<WebsiteIntelligence | null> {
    try {
      console.log('[CONV-MEMORY] Storing website intelligence for:', intelligence.website_url)

      const { data, error } = await getSupabase()
        .from('website_intelligence')
        .upsert(intelligence, { 
          onConflict: 'user_id,website_url',
          ignoreDuplicates: false 
        })
        .select()
        .single()

      if (error) {
        console.error('[CONV-MEMORY] Error storing website intelligence:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('[CONV-MEMORY] Error storing website intelligence:', error)
      return null
    }
  }

  // Get website intelligence for a user
  async getWebsiteIntelligence(userId: string): Promise<WebsiteIntelligence | null> {
    try {
      const { data, error } = await getSupabase()
        .from('website_intelligence')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('last_analyzed', { ascending: false })
        .limit(1)
        .single()

      if (error) {
        console.error('[CONV-MEMORY] Error getting website intelligence:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('[CONV-MEMORY] Error getting website intelligence:', error)
      return null
    }
  }

  // Store generated asset
  async storeGeneratedAsset(asset: GeneratedAsset): Promise<GeneratedAsset | null> {
    try {
      console.log('[CONV-MEMORY] Storing generated asset:', asset.asset_type, asset.asset_title)

      const { data, error } = await getSupabase()
        .from('generated_assets')
        .insert(asset)
        .select()
        .single()

      if (error) {
        console.error('[CONV-MEMORY] Error storing generated asset:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('[CONV-MEMORY] Error storing generated asset:', error)
      return null
    }
  }

  // Get generated assets for a user
  async getGeneratedAssets(userId: string, assetType?: string): Promise<GeneratedAsset[]> {
    try {
      let query = getSupabase()
        .from('generated_assets')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      if (assetType) {
        query = query.eq('asset_type', assetType)
      }

      const { data, error } = await query

      if (error) {
        console.error('[CONV-MEMORY] Error getting generated assets:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('[CONV-MEMORY] Error getting generated assets:', error)
      return []
    }
  }

  // Get conversation tags
  async getConversationTags(): Promise<any[]> {
    try {
      const { data, error } = await getSupabase()
        .from('conversation_tags')
        .select('*')
        .order('tag_category', { ascending: true })

      if (error) {
        console.error('[CONV-MEMORY] Error getting conversation tags:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('[CONV-MEMORY] Error getting conversation tags:', error)
      return []
    }
  }

  // Generate a new conversation ID
  generateConversationId(): string {
    return `conv_${Date.now()}_${uuidv4().slice(0, 8)}`
  }

  // Extract context tags from message content using AI
  extractContextTags(message: string, response: string): string[] {
    const tags = []
    
    // Simple keyword-based tagging (can be enhanced with AI later)
    const content = `${message} ${response}`.toLowerCase()
    
    if (content.includes('strategy') || content.includes('strategic') || content.includes('plan')) {
      tags.push('strategic_planning')
    }
    if (content.includes('bottleneck') || content.includes('problem') || content.includes('challenge')) {
      tags.push('bottleneck_analysis')
    }
    if (content.includes('create') || content.includes('write') || content.includes('generate')) {
      tags.push('asset_creation')
    }
    if (content.includes('sprint') || content.includes('task') || content.includes('step')) {
      tags.push('sprint_guidance')
    }
    if (content.includes('business model') || content.includes('revenue') || content.includes('pricing')) {
      tags.push('business_model')
    }
    if (content.includes('email') || content.includes('sequence')) {
      tags.push('email_sequence')
    }
    if (content.includes('landing') || content.includes('page') || content.includes('website')) {
      tags.push('landing_page')
    }
    if (content.includes('sales') || content.includes('pitch') || content.includes('script')) {
      tags.push('sales_script')
    }

    return tags.length > 0 ? tags : ['general']
  }

  // Determine interaction type from content
  determineInteractionType(message: string, response: string): ConversationMemoryEntry['interaction_type'] {
    const content = `${message} ${response}`.toLowerCase()
    
    if (content.includes('create') || content.includes('write') || content.includes('generate')) {
      return 'asset_generation'
    }
    if (content.includes('strategy') || content.includes('advice') || content.includes('recommend')) {
      return 'strategic_advice'
    }
    if (content.includes('sprint') || content.includes('task') || content.includes('step')) {
      return 'sprint_guidance'
    }
    if (content.includes('error') || content.includes('problem') || content.includes('fix') || content.includes('issue')) {
      return 'troubleshooting'
    }
    
    return 'general'
  }

  // Calculate priority score based on content and context
  calculatePriorityScore(message: string, response: string, contextTags: string[]): 1 | 2 | 3 | 4 | 5 {
    const content = `${message} ${response}`.toLowerCase()
    let score = 1
    
    // High priority indicators
    if (content.includes('strategic') || content.includes('important') || content.includes('critical')) {
      score += 2
    }
    if (content.includes('decision') || content.includes('choose') || content.includes('recommend')) {
      score += 1
    }
    if (contextTags.includes('strategic_planning') || contextTags.includes('bottleneck_analysis')) {
      score += 1
    }
    if (content.length > 1000) { // Long, detailed conversations
      score += 1
    }
    
    return Math.min(score, 5) as 1 | 2 | 3 | 4 | 5
  }
}

export const conversationMemoryService = new ConversationMemoryService()