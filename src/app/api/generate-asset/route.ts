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

interface AssetGenerationRequest {
  asset_type: string
  asset_title: string
  user_requirements: string
  user_id: string
  conversation_id?: string
}

const ASSET_TEMPLATES = {
  email_sequence: {
    name: 'Email Marketing Sequence',
    prompt: `Create a personalized email marketing sequence that reflects the business's brand voice and addresses their specific challenges. The sequence should:
    1. Match their established brand voice and messaging style
    2. Address their target audience's pain points
    3. Reference their specific services and value propositions
    4. Build on their completed business optimization work
    5. Include specific calls-to-action that align with their business model`
  },
  landing_page: {
    name: 'Landing Page Copy',
    prompt: `Create compelling landing page copy that converts visitors by:
    1. Using their established brand voice and key messaging
    2. Highlighting their unique competitive positioning
    3. Addressing their ideal client's specific pain points
    4. Showcasing their service offerings and expertise
    5. Including social proof elements that match their business stage
    6. Creating urgency that aligns with their business goals`
  },
  sales_script: {
    name: 'Sales Script/Pitch',
    prompt: `Develop a personalized sales script that:
    1. Opens with their unique value proposition
    2. Addresses the specific bottlenecks they help solve
    3. References their completed strategic work and improvements
    4. Uses their natural communication style and brand voice
    5. Handles objections common to their industry/business model
    6. Closes with next steps that match their sales process`
  },
  content_strategy: {
    name: 'Content Marketing Strategy',
    prompt: `Create a comprehensive content strategy that:
    1. Aligns with their brand voice and messaging themes
    2. Addresses their target audience's journey and pain points
    3. Leverages their completed business optimization insights
    4. Builds on their competitive positioning and unique expertise
    5. Includes content formats that match their business model
    6. Provides actionable next steps for implementation`
  },
  social_media_plan: {
    name: 'Social Media Plan',
    prompt: `Develop a social media strategy that:
    1. Reflects their brand personality and communication style
    2. Targets their specific ideal client profile
    3. Showcases their expertise and completed strategic work
    4. Uses platform-specific best practices for their industry
    5. Includes content themes that support their business goals
    6. Provides a realistic posting schedule for their team size`
  },
  case_study: {
    name: 'Case Study Template',
    prompt: `Create a compelling case study template that:
    1. Highlights their unique approach and methodology
    2. Demonstrates the specific problems they solve
    3. Uses their brand voice to tell the story
    4. Includes metrics and results that matter to their audience
    5. Positions them as the expert solution provider
    6. Ends with a clear call-to-action for similar prospects`
  }
}

export async function POST(request: Request) {
  try {
    console.log('[GENERATE-ASSET] Starting asset generation...')
    
    const body: AssetGenerationRequest = await request.json()
    const { asset_type, asset_title, user_requirements, user_id, conversation_id } = body

    if (!asset_type || !asset_title || !user_requirements || !user_id) {
      return NextResponse.json({ 
        error: 'Asset type, title, requirements, and user ID are required' 
      }, { status: 400 })
    }

    if (!ASSET_TEMPLATES[asset_type as keyof typeof ASSET_TEMPLATES]) {
      return NextResponse.json({ 
        error: 'Invalid asset type. Supported types: ' + Object.keys(ASSET_TEMPLATES).join(', ')
      }, { status: 400 })
    }

    console.log('[GENERATE-ASSET] Generating asset:', {
      asset_type,
      asset_title,
      user_id,
      requirements_length: user_requirements.length
    })

    // Step 1: Get comprehensive business context
    const businessContext = await this.getBusinessContext(user_id)
    console.log('[GENERATE-ASSET] Retrieved business context:', !!businessContext)

    // Step 2: Get website intelligence for brand voice
    const websiteIntelligence = await conversationMemoryService.getWebsiteIntelligence(user_id)
    console.log('[GENERATE-ASSET] Retrieved website intelligence:', !!websiteIntelligence)

    // Step 3: Get conversation history for strategic context
    const conversationContext = await conversationMemoryService.getConversationContext(
      user_id, 
      ['asset_creation', 'strategic_planning', asset_type], 
      10
    )
    console.log('[GENERATE-ASSET] Retrieved conversation context:', {
      recent_conversations: conversationContext.recentConversations.length,
      related_insights: conversationContext.relatedInsights.length
    })

    // Step 4: Get completed tasks for progress context
    const completedTasks = await this.getCompletedTasks(user_id)
    console.log('[GENERATE-ASSET] Retrieved completed tasks:', completedTasks.length)

    // Step 5: Build personalized asset generation context
    const assetContext = await this.buildAssetContext({
      businessContext,
      websiteIntelligence,
      conversationContext,
      completedTasks,
      assetType: asset_type,
      userRequirements: user_requirements
    })

    console.log('[GENERATE-ASSET] Built asset context:', {
      sections: Object.keys(assetContext).length,
      has_brand_voice: !!assetContext.brand_voice,
      has_business_profile: !!assetContext.business_profile,
      has_strategic_context: !!assetContext.strategic_context
    })

    // Step 6: Generate the asset using AI
    const assetContent = await this.generateAssetContent(asset_type, asset_title, user_requirements, assetContext)
    
    console.log('[GENERATE-ASSET] Generated asset content length:', assetContent.length)

    // Step 7: Store the generated asset
    const conversationMemoryId = conversation_id ? 
      (await this.getConversationMemoryId(conversation_id)) : 
      null

    const storedAsset = await conversationMemoryService.storeGeneratedAsset({
      user_id,
      conversation_memory_id: conversationMemoryId,
      asset_type,
      asset_title,
      asset_content: assetContent,
      personalization_factors: {
        used_brand_voice: !!websiteIntelligence,
        used_business_context: !!businessContext,
        used_conversation_history: conversationContext.recentConversations.length > 0,
        used_completed_tasks: completedTasks.length > 0,
        asset_type,
        requirements_addressed: user_requirements.length
      },
      business_context_snapshot: businessContext,
      website_context_snapshot: websiteIntelligence ? {
        brand_voice: websiteIntelligence.brand_voice_analysis,
        messaging: websiteIntelligence.extracted_messaging,
        target_audience: websiteIntelligence.target_audience_signals
      } : null,
      referenced_conversations: conversationContext.recentConversations
        .filter(conv => conv.context_tags.some(tag => 
          ['strategic_planning', 'asset_creation', asset_type].includes(tag)))
        .map(conv => conv.conversation_id || '')
        .slice(0, 5),
      version: 1,
      status: 'active'
    })

    if (!storedAsset) {
      console.warn('[GENERATE-ASSET] Failed to store asset, but content was generated')
    }

    console.log('[GENERATE-ASSET] Asset generation completed successfully')

    return NextResponse.json({
      success: true,
      asset: {
        id: storedAsset?.id,
        asset_type,
        asset_title,
        asset_content: assetContent,
        personalization_summary: {
          brand_voice_applied: !!websiteIntelligence,
          business_context_used: !!businessContext,
          conversation_history_referenced: conversationContext.recentConversations.length > 0,
          completed_tasks_referenced: completedTasks.length > 0,
          total_context_elements: Object.keys(assetContext).length
        }
      },
      message: 'Asset generated successfully with personalized business context'
    })

  } catch (error) {
    console.error('[GENERATE-ASSET] Error generating asset:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to generate asset',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Get business context for user
async function getBusinessContext(userId: string): Promise<any> {
  try {
    const { data, error } = await supabase
      .from('business_context')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('[GENERATE-ASSET] Error getting business context:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('[GENERATE-ASSET] Error getting business context:', error)
    return null
  }
}

// Get completed tasks for context
async function getCompletedTasks(userId: string): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('user_sprints')
      .select('sprint_id, completed_tasks')
      .eq('user_id', userId)

    if (error || !data) {
      return []
    }

    return data.flatMap(sprint => 
      (sprint.completed_tasks || []).map((taskId: string) => `${sprint.sprint_id}:${taskId}`)
    )
  } catch (error) {
    console.error('[GENERATE-ASSET] Error getting completed tasks:', error)
    return []
  }
}

// Get conversation memory ID
async function getConversationMemoryId(conversationId: string): Promise<number | null> {
  try {
    const { data, error } = await supabase
      .from('conversation_memory')
      .select('id')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error || !data) {
      return null
    }

    return data.id
  } catch (error) {
    console.error('[GENERATE-ASSET] Error getting conversation memory ID:', error)
    return null
  }
}

// Build comprehensive asset generation context
async function buildAssetContext({
  businessContext,
  websiteIntelligence,
  conversationContext,
  completedTasks,
  assetType,
  userRequirements
}: {
  businessContext: any
  websiteIntelligence: any
  conversationContext: any
  completedTasks: string[]
  assetType: string
  userRequirements: string
}): Promise<any> {

  const context: any = {}

  // Business Profile
  if (businessContext) {
    context.business_profile = {
      company_name: businessContext.business_name,
      industry: businessContext.industry,
      business_model: businessContext.business_model,
      revenue_model: businessContext.revenue_model,
      growth_stage: businessContext.growth_stage,
      team_size: businessContext.team_size,
      primary_goal: businessContext.primary_goal,
      biggest_challenge: businessContext.biggest_challenge,
      top_bottlenecks: businessContext.top_bottlenecks,
      ideal_client_profile: businessContext.ideal_client_profile
    }
  }

  // Brand Voice & Messaging
  if (websiteIntelligence) {
    context.brand_voice = {
      tone: websiteIntelligence.brand_voice_analysis.tone,
      personality: websiteIntelligence.brand_voice_analysis.personality,
      communication_style: websiteIntelligence.brand_voice_analysis.communicationStyle,
      key_phrases: websiteIntelligence.brand_voice_analysis.keyPhrases,
      headlines: websiteIntelligence.extracted_messaging.headlines,
      value_propositions: websiteIntelligence.extracted_messaging.valuePropositions,
      calls_to_action: websiteIntelligence.extracted_messaging.callsToAction
    }

    context.market_positioning = {
      competitive_positioning: websiteIntelligence.competitive_positioning,
      target_audience_signals: websiteIntelligence.target_audience_signals,
      service_offerings: websiteIntelligence.service_offerings,
      content_themes: websiteIntelligence.content_themes
    }
  }

  // Strategic Progress Context
  if (completedTasks.length > 0) {
    const taskMapping: Record<string, string> = {
      'profit-1-1': 'Analyzed Service Profitability',
      'profit-1-2': 'Identified High-Value Clients',
      'profit-2-1': 'Documented Golden Service',
      'smooth-1-1': 'Mapped Customer Journey',
      'smooth-2-1': 'Designed Smooth Onboarding',
      'sell-1-1': 'Analyzed Sales Bottlenecks',
      'delivery-1-1': 'Mapped Delivery Process',
      'improve-1-1': 'Set Up Feedback Systems'
    }

    const completedTaskNames = completedTasks.map(taskId => {
      const taskKey = taskId.split(':')[1]
      return taskMapping[taskKey] || taskKey
    }).filter(Boolean)

    context.strategic_progress = {
      total_tasks_completed: completedTasks.length,
      recent_achievements: completedTaskNames.slice(-5),
      focus_areas_completed: this.getCompletedFocusAreas(completedTasks)
    }
  }

  // Conversation Insights
  if (conversationContext.recentConversations.length > 0 || conversationContext.relatedInsights.length > 0) {
    const recentTopics = conversationContext.recentConversations
      .flatMap(conv => conv.context_tags)
      .filter((tag, index, array) => array.indexOf(tag) === index)
      .slice(0, 5)

    context.strategic_context = {
      recent_discussion_topics: recentTopics,
      business_evolution_stage: conversationContext.businessEvolution.stage,
      key_decisions_referenced: conversationContext.referencedDecisions.slice(0, 3),
      previous_strategic_insights: conversationContext.relatedInsights
        .map(insight => insight.key_insights)
        .filter(insights => insights && Object.keys(insights).length > 0)
        .slice(0, 3)
    }
  }

  // Asset-specific context
  context.asset_requirements = {
    type: assetType,
    user_specifications: userRequirements,
    template_focus: ASSET_TEMPLATES[assetType as keyof typeof ASSET_TEMPLATES]?.name
  }

  return context
}

// Get completed focus areas
function getCompletedFocusAreas(completedTasks: string[]): string[] {
  const areas = {
    'Profitability Optimization': 0,
    'Customer Experience': 0,
    'Sales Process': 0,
    'Delivery Streamlining': 0,
    'Continuous Improvement': 0
  }

  completedTasks.forEach(taskId => {
    const taskKey = taskId.split(':')[1]
    if (taskKey?.startsWith('profit')) areas['Profitability Optimization']++
    else if (taskKey?.startsWith('smooth')) areas['Customer Experience']++
    else if (taskKey?.startsWith('sell')) areas['Sales Process']++
    else if (taskKey?.startsWith('delivery')) areas['Delivery Streamlining']++
    else if (taskKey?.startsWith('improve')) areas['Continuous Improvement']++
  })

  return Object.entries(areas)
    .filter(([_, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([area]) => area)
}

// Generate asset content using AI
async function generateAssetContent(
  assetType: string, 
  assetTitle: string, 
  userRequirements: string, 
  context: any
): Promise<string> {
  
  const template = ASSET_TEMPLATES[assetType as keyof typeof ASSET_TEMPLATES]
  const contextPrompt = this.buildAssetContextPrompt(context)

  const systemPrompt = `You are an expert business asset creator with deep personalization capabilities. You have access to comprehensive business intelligence about this user:

${contextPrompt}

ASSET TYPE: ${template.name}
OBJECTIVE: ${template.prompt}

PERSONALIZATION REQUIREMENTS:
1. Use their exact business name, industry, and context naturally throughout
2. Match their established brand voice, tone, and communication style
3. Reference their specific completed strategic work and achievements
4. Address their documented challenges and bottlenecks specifically
5. Target their ideal client profile with precision
6. Incorporate their unique value propositions and messaging
7. Build on their previous strategic conversations and decisions
8. Align with their business model, revenue model, and growth stage

OUTPUT REQUIREMENTS:
- Create content that feels personally written for their specific business
- Avoid generic language - use their specific terminology and context
- Reference their actual progress and strategic work
- Make it actionable for their current business situation
- Ensure it aligns with their brand voice and messaging style

Remember: This isn't generic template content. This is a personalized asset created specifically for their business based on their actual context, progress, and strategic work.`

  const userPrompt = `Create a ${template.name.toLowerCase()} titled "${assetTitle}" based on these specific requirements:

${userRequirements}

Please generate content that incorporates all the business context you have about me, references my completed strategic work, uses my brand voice, and addresses my specific business situation.`

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_tokens: 3000,
      temperature: 0.7,
    })

    return completion.choices[0]?.message?.content || "I apologize, but I couldn't generate the asset content. Please try again."
  } catch (error) {
    console.error('[GENERATE-ASSET] OpenAI API error:', error)
    throw new Error(`OpenAI API error: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Build asset context prompt
function buildAssetContextPrompt(context: any): string {
  let prompt = ""

  if (context.business_profile) {
    const bp = context.business_profile
    prompt += `BUSINESS PROFILE:
- Company: "${bp.company_name || 'their business'}"
- Industry: ${bp.industry} | Business Model: ${bp.business_model} | Revenue Model: ${bp.revenue_model}
- Growth Stage: ${bp.growth_stage} with ${bp.team_size} team
- Primary Goal: "${bp.primary_goal}"
- Biggest Challenge: "${bp.biggest_challenge}"
- Key Bottlenecks: ${bp.top_bottlenecks?.join(', ')}`

    if (bp.ideal_client_profile) {
      prompt += `
- Target Client: ${typeof bp.ideal_client_profile === 'object' ? 
          JSON.stringify(bp.ideal_client_profile) : bp.ideal_client_profile}`
    }
  }

  if (context.brand_voice) {
    const bv = context.brand_voice
    prompt += `

BRAND VOICE & MESSAGING:
- Brand Tone: ${bv.tone} 
- Personality: ${bv.personality?.join(', ')}
- Communication Style: ${bv.communication_style}
- Key Brand Phrases: ${bv.key_phrases?.slice(0, 5).join(', ')}
- Proven Headlines: ${bv.headlines?.slice(0, 3).join(' | ')}
- Core Value Props: ${bv.value_propositions?.slice(0, 2).join(' | ')}
- Effective CTAs: ${bv.calls_to_action?.slice(0, 3).join(', ')}`
  }

  if (context.market_positioning) {
    const mp = context.market_positioning
    prompt += `

MARKET POSITIONING:
- Competitive Edge: ${mp.competitive_positioning}
- Target Audience: ${mp.target_audience_signals?.join(', ')}
- Service Offerings: ${mp.service_offerings?.join(', ')}
- Content Themes: ${mp.content_themes?.join(', ')}`
  }

  if (context.strategic_progress) {
    const sp = context.strategic_progress
    prompt += `

STRATEGIC PROGRESS & ACHIEVEMENTS:
- Total Tasks Completed: ${sp.total_tasks_completed}
- Recent Achievements: ${sp.recent_achievements?.join(', ')}
- Completed Focus Areas: ${sp.focus_areas_completed?.join(', ')}
- This demonstrates they have done significant strategic work on their business`
  }

  if (context.strategic_context) {
    const sc = context.strategic_context
    prompt += `

STRATEGIC CONVERSATION CONTEXT:
- Recent Discussion Topics: ${sc.recent_discussion_topics?.join(', ')}
- Business Evolution: ${sc.business_evolution_stage}
- Previous Strategic Decisions: ${sc.key_decisions_referenced?.join(', ')}`
  }

  return prompt
}

// Get all generated assets for a user
export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const userId = url.searchParams.get('user_id')
    const assetType = url.searchParams.get('asset_type')

    if (!userId) {
      return NextResponse.json({ 
        error: 'User ID is required' 
      }, { status: 400 })
    }

    console.log('[GENERATE-ASSET] Getting generated assets for user:', userId, 'type:', assetType)

    const assets = await conversationMemoryService.getGeneratedAssets(userId, assetType || undefined)

    return NextResponse.json({
      success: true,
      assets: assets.map(asset => ({
        id: asset.id,
        asset_type: asset.asset_type,
        asset_title: asset.asset_title,
        created_at: asset.created_at,
        version: asset.version,
        status: asset.status,
        personalization_factors: asset.personalization_factors
      })),
      total: assets.length
    })

  } catch (error) {
    console.error('[GENERATE-ASSET] Error getting generated assets:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to get generated assets',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}