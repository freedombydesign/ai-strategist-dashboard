import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'
import { conversationMemoryService } from '../../../services/conversationMemoryService'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface ConversationRequest {
  message: string
  user_id: string
  conversation_id?: string
  interaction_type?: 'general' | 'strategic_advice' | 'asset_generation' | 'troubleshooting' | 'sprint_guidance'
  asset_type?: string
}

export async function POST(request: Request) {
  try {
    console.log('[ENHANCED-AI] Starting enhanced AI conversation...')
    
    const body: ConversationRequest = await request.json()
    const { message, user_id, conversation_id, interaction_type = 'general', asset_type } = body

    if (!message || !user_id) {
      return NextResponse.json({ error: 'Message and user_id are required' }, { status: 400 })
    }

    // Generate conversation ID if not provided
    const currentConversationId = conversation_id || conversationMemoryService.generateConversationId()

    console.log('[ENHANCED-AI] Processing conversation:', {
      user_id,
      conversation_id: currentConversationId,
      interaction_type,
      message_length: message.length
    })

    // Step 1: Get conversation context and history
    console.log('[ENHANCED-AI] Retrieving conversation context...')
    const contextTags = conversationMemoryService.extractContextTags(message, '')
    const conversationContext = await conversationMemoryService.getConversationContext(user_id, contextTags, 15)

    console.log('[ENHANCED-AI] Retrieved conversation context:', {
      recent_conversations: conversationContext.recentConversations.length,
      related_insights: conversationContext.relatedInsights.length,
      referenced_decisions: conversationContext.referencedDecisions.length,
      business_stage: conversationContext.businessEvolution.stage
    })

    // Step 2: Get business context
    console.log('[ENHANCED-AI] Retrieving business context...')
    const { data: businessContext, error: businessError } = await supabase
      .from('business_context')
      .select('*')
      .eq('user_id', user_id)
      .single()

    if (businessError && businessError.code !== 'PGRST116') {
      console.error('[ENHANCED-AI] Error retrieving business context:', businessError)
    }

    // Step 3: Get website intelligence
    console.log('[ENHANCED-AI] Retrieving website intelligence...')
    const websiteIntelligence = await conversationMemoryService.getWebsiteIntelligence(user_id)

    console.log('[ENHANCED-AI] Retrieved website intelligence:', {
      has_website_data: !!websiteIntelligence,
      website_url: websiteIntelligence?.website_url
    })

    // Step 4: Get completed tasks (existing logic)
    let completedTasks: string[] = []
    try {
      const { data: userSprintsData } = await supabase
        .from('user_sprints')
        .select('sprint_id, completed_tasks')
        .eq('user_id', user_id)

      if (userSprintsData) {
        completedTasks = userSprintsData.flatMap(sprint => 
          (sprint.completed_tasks || []).map((taskId: string) => `${sprint.sprint_id}:${taskId}`)
        )
      }
    } catch (error) {
      console.error('[ENHANCED-AI] Error retrieving completed tasks:', error)
    }

    console.log('[ENHANCED-AI] Retrieved completed tasks:', completedTasks.length)

    // Step 5: Build enhanced context for AI
    const enhancedContext = await this.buildEnhancedContext({
      conversationContext,
      businessContext,
      websiteIntelligence,
      completedTasks,
      currentMessage: message,
      interactionType: interaction_type,
      assetType: asset_type
    })

    console.log('[ENHANCED-AI] Built enhanced context:', {
      context_sections: Object.keys(enhancedContext).length,
      total_context_length: JSON.stringify(enhancedContext).length
    })

    // Step 6: Generate AI response
    const aiResponse = await this.generateEnhancedAIResponse(message, enhancedContext, interaction_type)

    console.log('[ENHANCED-AI] Generated AI response length:', aiResponse.length)

    // Step 7: Store conversation in memory system
    const finalContextTags = conversationMemoryService.extractContextTags(message, aiResponse)
    const priorityScore = conversationMemoryService.calculatePriorityScore(message, aiResponse, finalContextTags)
    const detectedInteractionType = conversationMemoryService.determineInteractionType(message, aiResponse)

    console.log('[ENHANCED-AI] Storing conversation memory with:', {
      context_tags: finalContextTags,
      priority_score: priorityScore,
      interaction_type: detectedInteractionType
    })

    // Extract key insights from the conversation
    const keyInsights = await this.extractKeyInsights(message, aiResponse, businessContext)

    await conversationMemoryService.storeConversation({
      user_id,
      conversation_id: currentConversationId,
      message,
      response: aiResponse,
      context_tags: finalContextTags,
      interaction_type: detectedInteractionType,
      business_stage: businessContext?.growth_stage,
      key_insights: keyInsights,
      referenced_decisions: conversationContext.referencedDecisions,
      priority_score: priorityScore,
      metadata: {
        completed_tasks: completedTasks.length,
        has_business_context: !!businessContext,
        has_website_intelligence: !!websiteIntelligence,
        asset_type: asset_type
      }
    })

    // Step 8: Store in original ai_conversations table for backward compatibility
    const saveData = {
      user_id,
      message,
      response: aiResponse,
      conversation_id: currentConversationId
    }

    const { error: saveError } = await supabase
      .from('ai_conversations')
      .insert(saveData)

    if (saveError) {
      console.error('[ENHANCED-AI] Error saving to ai_conversations:', saveError)
    }

    console.log('[ENHANCED-AI] Enhanced AI conversation completed successfully')

    return NextResponse.json({
      response: aiResponse,
      conversation_id: currentConversationId,
      context_used: {
        conversation_history: conversationContext.recentConversations.length,
        business_context: !!businessContext,
        website_intelligence: !!websiteIntelligence,
        completed_tasks: completedTasks.length,
        context_tags: finalContextTags,
        priority_score: priorityScore
      }
    })

  } catch (error) {
    console.error('[ENHANCED-AI] Error in enhanced AI conversation:', error)
    return NextResponse.json({
      error: 'Failed to process enhanced AI conversation',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Build enhanced context for AI
async function buildEnhancedContext({
  conversationContext,
  businessContext,
  websiteIntelligence,
  completedTasks,
  currentMessage,
  interactionType,
  assetType
}: {
  conversationContext: any
  businessContext: any
  websiteIntelligence: any
  completedTasks: string[]
  currentMessage: string
  interactionType: string
  assetType?: string
}): Promise<any> {
  
  const context: any = {
    conversation_memory: null,
    business_profile: null,
    website_intelligence: null,
    task_progress: null,
    strategic_context: null
  }

  // Conversation Memory Context
  if (conversationContext.recentConversations.length > 0 || conversationContext.relatedInsights.length > 0) {
    const recentConversations = conversationContext.recentConversations.slice(0, 5).map(conv => ({
      message: conv.message.slice(0, 200),
      response: conv.response.slice(0, 300),
      context_tags: conv.context_tags,
      interaction_type: conv.interaction_type,
      created_at: conv.created_at
    }))

    const relatedInsights = conversationContext.relatedInsights.slice(0, 3).map(insight => ({
      key_insights: insight.key_insights,
      context_tags: insight.context_tags,
      created_at: insight.created_at
    }))

    context.conversation_memory = {
      recent_conversations: recentConversations,
      related_insights: relatedInsights,
      business_evolution: conversationContext.businessEvolution,
      referenced_decisions: conversationContext.referencedDecisions.slice(0, 5)
    }
  }

  // Business Profile Context
  if (businessContext) {
    context.business_profile = {
      company: businessContext.business_name,
      industry: businessContext.industry,
      business_model: businessContext.business_model,
      revenue_model: businessContext.revenue_model,
      growth_stage: businessContext.growth_stage,
      team_size: businessContext.team_size,
      primary_goal: businessContext.primary_goal,
      biggest_challenge: businessContext.biggest_challenge,
      top_bottlenecks: businessContext.top_bottlenecks,
      ideal_client: businessContext.ideal_client_profile
    }
  }

  // Website Intelligence Context
  if (websiteIntelligence) {
    context.website_intelligence = {
      website_url: websiteIntelligence.website_url,
      brand_voice: websiteIntelligence.brand_voice_analysis,
      messaging: {
        headlines: websiteIntelligence.extracted_messaging.headlines?.slice(0, 3),
        value_propositions: websiteIntelligence.extracted_messaging.valuePropositions?.slice(0, 2),
        calls_to_action: websiteIntelligence.extracted_messaging.callsToAction?.slice(0, 3)
      },
      target_audience: websiteIntelligence.target_audience_signals?.slice(0, 3),
      services: websiteIntelligence.service_offerings?.slice(0, 5),
      competitive_positioning: websiteIntelligence.competitive_positioning,
      content_themes: websiteIntelligence.content_themes?.slice(0, 5)
    }
  }

  // Task Progress Context
  if (completedTasks.length > 0) {
    const taskMapping: Record<string, string> = {
      'profit-1-1': 'Analyze Service Profitability',
      'profit-1-2': 'Identify High-Value Clients',
      'profit-2-1': 'Document Your Golden Service',
      'profit-2-2': 'Create Service Packages',
      'smooth-1-1': 'Map Customer Journey',
      'smooth-1-2': 'Identify Experience Gaps',
      'smooth-2-1': 'Design Smooth Onboarding',
      'smooth-2-2': 'Create Follow-up Sequences',
      'sell-1-1': 'Analyze Sales Bottlenecks',
      'sell-1-2': 'Design Sales Process',
      'sell-2-1': 'Create Sales Materials',
      'sell-2-2': 'Set Up Feedback Systems',
      'delivery-1-1': 'Map Your Delivery Process',
      'delivery-1-2': 'Identify Delivery Bottlenecks',
      'delivery-2-1': 'Streamline Operations',
      'delivery-2-2': 'Automate Repetitive Tasks',
      'improve-1-1': 'Set Up Feedback Systems',
      'improve-1-2': 'Create Improvement Metrics',
      'improve-2-1': 'Build Learning Culture',
      'improve-2-2': 'Implement Regular Reviews'
    }

    const completedTaskNames = completedTasks.map(taskId => {
      const parts = taskId.split(':')
      const taskKey = parts[1]
      return taskMapping[taskKey] || taskKey
    }).filter(Boolean)

    context.task_progress = {
      total_completed: completedTasks.length,
      recent_completions: completedTaskNames.slice(-5),
      current_focus_areas: this.determineFocusAreas(completedTasks)
    }
  }

  // Strategic Context based on interaction type
  if (interactionType === 'asset_generation' && assetType) {
    context.strategic_context = {
      asset_creation_mode: true,
      requested_asset_type: assetType,
      personalization_priority: 'high'
    }
  } else if (interactionType === 'strategic_advice') {
    context.strategic_context = {
      advisory_mode: true,
      focus_on_business_growth: true,
      reference_past_decisions: true
    }
  }

  return context
}

// Determine current focus areas based on completed tasks
function determineFocusAreas(completedTasks: string[]): string[] {
  const areas = {
    profit: 0,
    smooth: 0,
    sell: 0,
    delivery: 0,
    improve: 0
  }

  completedTasks.forEach(taskId => {
    const taskKey = taskId.split(':')[1]
    if (taskKey?.startsWith('profit')) areas.profit++
    else if (taskKey?.startsWith('smooth')) areas.smooth++
    else if (taskKey?.startsWith('sell')) areas.sell++
    else if (taskKey?.startsWith('delivery')) areas.delivery++
    else if (taskKey?.startsWith('improve')) areas.improve++
  })

  return Object.entries(areas)
    .filter(([_, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([area]) => area)
    .slice(0, 3)
}

// Generate enhanced AI response
async function generateEnhancedAIResponse(message: string, enhancedContext: any, interactionType: string): Promise<string> {
  const contextStr = this.buildContextPrompt(enhancedContext)
  
  const systemPrompt = `You are an expert AI business strategist with advanced memory and context awareness. You have access to:

${contextStr}

RESPONSE GUIDELINES:
1. ALWAYS reference relevant previous conversations when applicable
2. Use the user's business name and specific context naturally
3. Reference completed tasks to build on their progress
4. Match their website's brand voice and messaging style when known
5. Make recommendations that align with their business model and growth stage
6. Reference previous strategic decisions when relevant
7. If generating assets, use their specific business context and completed work
8. Be conversational but strategic - avoid generic advice

INTERACTION TYPE: ${interactionType.toUpperCase()}
${interactionType === 'asset_generation' ? 'Focus on creating personalized, business-specific content that reflects their brand voice and current progress.' : ''}
${interactionType === 'strategic_advice' ? 'Provide strategic guidance that builds on their previous conversations and current business challenges.' : ''}
${interactionType === 'sprint_guidance' ? 'Reference their completed tasks and provide specific next steps within their current sprint focus.' : ''}

Remember: This user has an established relationship with you. Reference past conversations, acknowledge their progress, and build on previous strategic discussions.`

  const userPrompt = `Based on our previous conversations and my business progress, here's my current question/request:

${message}`

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_tokens: 2000,
      temperature: 0.7,
    })

    return completion.choices[0]?.message?.content || "I apologize, but I couldn't generate a response. Please try again."
  } catch (error) {
    console.error('[ENHANCED-AI] OpenAI API error:', error)
    throw new Error(`OpenAI API error: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Build context prompt from enhanced context
function buildContextPrompt(enhancedContext: any): string {
  let contextPrompt = ""

  if (enhancedContext.conversation_memory) {
    contextPrompt += `
CONVERSATION HISTORY & INSIGHTS:
- Recent conversations: ${enhancedContext.conversation_memory.recent_conversations.length} discussions
- Business evolution: Currently in ${enhancedContext.conversation_memory.business_evolution.stage} stage
- Key insights from past conversations available
- Referenced strategic decisions: ${enhancedContext.conversation_memory.referenced_decisions.join(', ')}`

    if (enhancedContext.conversation_memory.recent_conversations.length > 0) {
      contextPrompt += `
- Recent discussion topics: ${enhancedContext.conversation_memory.recent_conversations.map(c => c.context_tags.join(', ')).join('; ')}`
    }
  }

  if (enhancedContext.business_profile) {
    const bp = enhancedContext.business_profile
    contextPrompt += `

BUSINESS PROFILE:
- Company: ${bp.company || 'their business'}
- Industry: ${bp.industry || 'Unknown'} | Model: ${bp.business_model || 'B2B'} ${bp.revenue_model || 'business'}
- Stage: ${bp.growth_stage || 'Growth'} stage with ${bp.team_size || 'small'} team
- Primary Goal: "${bp.primary_goal || 'Growth and optimization'}"
- Biggest Challenge: "${bp.biggest_challenge || 'Scaling operations'}"
- Top Bottlenecks: ${bp.top_bottlenecks?.join(', ') || 'Various operational challenges'}`

    if (bp.ideal_client) {
      contextPrompt += `
- Target Client: ${typeof bp.ideal_client === 'object' ? 
        `${bp.ideal_client.title || bp.ideal_client.niche || ''} | ${bp.ideal_client.company_size || bp.ideal_client.companySize || ''} | Pain: ${bp.ideal_client.pain_points || bp.ideal_client.painPoints || ''}`.trim() : 
        bp.ideal_client}`
    }
  }

  if (enhancedContext.website_intelligence) {
    const wi = enhancedContext.website_intelligence
    contextPrompt += `

BRAND & WEBSITE INTELLIGENCE:
- Website: ${wi.website_url}
- Brand Voice: ${wi.brand_voice?.tone || 'Professional'} tone, ${wi.brand_voice?.communicationStyle || 'balanced'} style
- Key Messages: ${wi.messaging?.headlines?.join(' | ') || 'Not available'}
- Value Props: ${wi.messaging?.value_propositions?.join(' | ') || 'Not available'}
- Target Audience: ${wi.target_audience?.join(', ') || 'Not specified'}
- Services: ${wi.services?.join(', ') || 'Various business services'}
- Competitive Positioning: ${wi.competitive_positioning || 'Not defined'}
- Content Themes: ${wi.content_themes?.join(', ') || 'Business growth'}`
  }

  if (enhancedContext.task_progress) {
    const tp = enhancedContext.task_progress
    contextPrompt += `

PROGRESS & ACHIEVEMENTS:
- Completed Tasks: ${tp.total_completed} tasks completed
- Recent Completions: ${tp.recent_completions.join(', ')}
- Current Focus Areas: ${tp.current_focus_areas.join(', ')}`
  }

  if (enhancedContext.strategic_context) {
    const sc = enhancedContext.strategic_context
    if (sc.asset_creation_mode) {
      contextPrompt += `

ASSET CREATION MODE: Generate ${sc.requested_asset_type} using business-specific context and brand voice`
    }
    if (sc.advisory_mode) {
      contextPrompt += `

STRATEGIC ADVISORY MODE: Provide strategic guidance building on past conversations and business context`
    }
  }

  return contextPrompt
}

// Extract key insights from conversation
async function extractKeyInsights(message: string, response: string, businessContext: any): Promise<any> {
  const insights: any = {}

  // Simple insight extraction based on keywords
  const combinedText = `${message} ${response}`.toLowerCase()

  if (combinedText.includes('decision') || combinedText.includes('choose') || combinedText.includes('recommend')) {
    insights.strategic_decision = 'Strategic decision discussed'
  }

  if (combinedText.includes('bottleneck') || combinedText.includes('challenge') || combinedText.includes('problem')) {
    insights.bottleneck_identified = 'Business bottleneck or challenge identified'
  }

  if (combinedText.includes('opportunity') || combinedText.includes('potential') || combinedText.includes('growth')) {
    insights.growth_opportunity = 'Growth opportunity discussed'
  }

  if (combinedText.includes('implement') || combinedText.includes('action') || combinedText.includes('next step')) {
    insights.action_plan = 'Action plan or implementation steps provided'
  }

  // Add business context relevance
  if (businessContext) {
    insights.business_stage = businessContext.growth_stage
    insights.relevant_to_goals = combinedText.includes(businessContext.primary_goal?.toLowerCase() || '')
  }

  return insights
}