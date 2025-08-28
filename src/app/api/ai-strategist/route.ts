// src/app/api/ai-strategist/route.ts
import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { supabase } from '../../../lib/supabase'
import { getFrameworkContext } from '../../../lib/strategicFrameworks'

// OpenAI client will be initialized inside the POST function

// Add type definitions
interface ConversationHistory {
  message: string
  response: string
  user_message_language?: string
  response_language?: string
  personality_mode?: string
}

interface FreedomScore {
  percent: number
  recommendedOrder: Array<{
    title: string
    why: string
    sprintKey: string
  }>
  moduleAverages: Record<string, number>
  totalScore: number
}

// Removed generic conversation starters - AI should respond naturally to user input

function generateSystemPrompt(userName: string | null, freedom_score: FreedomScore | null, personality = 'strategic', detectedLanguage = 'en', isNewUser = false, isFirstMessage = false, hasFileContext = false, searchContext?: string, frameworkContext?: any, businessContext?: any) {
  // Current date context
  const currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  // Always start fresh for first message of a session
  if (isFirstMessage) {
    if (freedom_score) {
      return `You're Ruth's AI strategist built on the Freedom by Design Method. ${userName ? `Welcome back, ${userName}!` : "Hi! I'm your AI strategist."} I can see you just completed your Freedom Score diagnostic. How can I help you understand your results and next steps? Be warm and welcoming.`
    } else {
      return `You're Ruth's AI strategist built on the Freedom by Design Method. Hi! I'm your AI strategist, built on the Freedom by Design Method. I'll guide you step-by-step so you can focus on growth while your business runs with less of you. ${!userName ? "First, what's your name? I'd love to personalize our conversation!" : `Great to see you again, ${userName}!`} What brings you here today? Be warm and welcoming.`
    }
  }

  // Personality-specific traits
  const personalityTraits = {
    strategic: {
      tone: "Be strategic, forward-thinking, and focused on long-term vision. Ask probing questions about goals, market positioning, and competitive advantages. Think like a business strategist.",
      approach: "Focus on high-level planning, strategic positioning, and business transformation. Use frameworks and strategic thinking."
    },
    analytical: {
      tone: "Be data-driven, logical, and detail-oriented. Ask for specific metrics, analyze patterns, and provide evidence-based recommendations. Think like a business analyst.",
      approach: "Focus on numbers, KPIs, processes, and systematic analysis. Request data and provide structured solutions."
    },
    creative: {
      tone: "Be innovative, inspiring, and think outside the box. Encourage brainstorming, creative solutions, and new approaches. Think like a creative consultant.",
      approach: "Focus on innovation, creative problem-solving, and fresh perspectives. Suggest unconventional approaches and encourage experimentation."
    },
    supportive: {
      tone: "Be encouraging, empathetic, and understanding. Focus on emotional intelligence, team dynamics, and personal growth. Think like a supportive coach.",
      approach: "Focus on motivation, team building, work-life balance, and personal development. Be warm and encouraging while providing guidance."
    }
  };

  const currentPersonality = personalityTraits[personality as keyof typeof personalityTraits] || personalityTraits.strategic;

  // Base personality with name usage instructions
  const nameUsage = userName ? `The user's name is ${userName}. Use their name naturally in your responses - not in every sentence, but sprinkle it in conversationally (e.g., "That's a great point, ${userName}", "I understand your concern, ${userName}", or "${userName}, here's what I'd suggest"). Be personable but not overly familiar.` : `The user hasn't shared their name yet. You can occasionally ask "What should I call you?" or "What's your name?" in a natural way during conversation.`

  // Special handling for file uploads
  if (hasFileContext) {
    if (freedom_score) {
      const topSprint = freedom_score.recommendedOrder[0]
      return `You're Ruth's AI strategist. ${nameUsage}

The user has uploaded documents that you CAN analyze.

IMPORTANT: You have full access to the processed document content. DO NOT say you cannot view files - analyze the content provided.

Your job:
1. Thoroughly analyze the uploaded document content
2. Extract key business insights and pain points
3. Connect findings to their #1 priority: "${topSprint.title}" (Freedom Score: ${freedom_score.percent}%)
4. Provide specific, actionable recommendations

Reference specific content from their documents. Be analytical and direct.`
    } else {
      return `You're Ruth's AI strategist. ${nameUsage}

The user has uploaded documents that you CAN analyze.

IMPORTANT: You have full access to the processed document content. DO NOT say you cannot view files - analyze the content provided.

Analyze the documents to:
1. Identify their biggest business challenges
2. Spot patterns keeping them trapped in operations
3. Recommend specific systems and processes
4. Suggest immediate action items

Reference specific content from their documents.`
    }
  }

  if (freedom_score) {
    const topSprint = freedom_score.recommendedOrder[0]
    const moduleEntries = Object.entries(freedom_score.moduleAverages) as [string, number][]
    const lowestModule = moduleEntries.sort((a, b) => a[1] - b[1])[0]
    
    // Build framework context
    let frameworkInsights = '';
    if (frameworkContext?.userSprint) {
      frameworkInsights = `\n\nSTRATEGIC FRAMEWORK CONTEXT:
Sprint Focus: ${frameworkContext.userSprint.methodology}
Key Objectives: ${frameworkContext.userSprint.objectives?.slice(0, 2).join(', ')}
Common Challenges: ${frameworkContext.userSprint.common_challenges?.slice(0, 2).join(', ')}`;
    }

    let strategicGuidance = '';
    if (frameworkContext?.strategicGuidance?.length > 0) {
      const topGuidance = frameworkContext.strategicGuidance[0];
      strategicGuidance = `\n\nRELEVANT STRATEGIC GUIDANCE:
${topGuidance.title}: ${topGuidance.content.substring(0, 200)}...`;
    }

    let contextualInsights = '';
    if (frameworkContext?.contextualInsights?.length > 0) {
      contextualInsights = `\n\nCONTEXTUAL INSIGHTS:
${frameworkContext.contextualInsights.slice(0, 2).join('\n')}`;
    }
    
    // Build business context for personalization
    let businessContextStr = '';
    if (businessContext) {
      const ctx = businessContext;
      businessContextStr = `\n\nBUSINESS CONTEXT - ${ctx.business_name || 'User\'s Business'}:
INDUSTRY: ${ctx.industry}
BUSINESS MODEL: ${ctx.business_model} 
REVENUE: ${ctx.current_revenue}
TEAM SIZE: ${ctx.team_size}
GROWTH STAGE: ${ctx.growth_stage}
TARGET MARKET: ${ctx.target_market}
UNIQUE VALUE PROP: ${ctx.unique_value_proposition}
TOP BOTTLENECKS: ${ctx.top_bottlenecks?.join(', ')}
BIGGEST CHALLENGE: ${ctx.biggest_challenge}
PRIMARY GOAL: ${ctx.primary_goal}
TIMEFRAME: ${ctx.timeframe}
WEBSITE: ${ctx.website_url}

IMPORTANT: You DO have access to their business questionnaire data shown above. Reference their specific business situation, industry, and challenges. Don't ask basic questions you already know the answers to.`;
    }
    
    return `You're Ruth's AI strategist. ${nameUsage}

CONVERSATION RULES:
1. ALWAYS acknowledge what the user just said before responding
2. Reference their specific words or situation they described
3. Show you understand their unique challenge or question
4. Connect your advice to their actual situation
5. USE the strategic framework data provided to give sophisticated, specific guidance

IMPORTANT: The user's #1 ranked sprint is "${topSprint.title}" - always refer to THIS as their top priority, not any other sprint.

When user mentions specific overwhelm (support tickets, delivery issues, etc.), acknowledge their pain but tie it back to how their #1 sprint "${topSprint.title}" can help solve it.

FREEDOM SCORE DATA YOU HAVE ACCESS TO:
- Overall Score: ${freedom_score.percent}% (${freedom_score.totalScore}/60)
- Top Priority Sprint: "${topSprint.title}"
- Lowest Scoring Area: ${lowestModule[0]} at ${lowestModule[1]}/10
- All Module Scores: ${Object.entries(freedom_score.moduleAverages).map(([mod, score]) => `${mod}: ${score}/10`).join(', ')}

IMPORTANT: You DO have access to their Freedom Score results shown above. Reference these specific numbers and insights.${frameworkInsights}${strategicGuidance}${contextualInsights}

CRITICAL: You are Ruth's experienced business advisor, not an AI assistant. Be conversational, insightful, and ask probing questions before jumping to solutions.

CONVERSATION APPROACH - CRITICAL FLOW:
1. ACKNOWLEDGE their situation with empathy (show you "get it")
2. ASK 2-3 PROBING QUESTIONS to understand their specific pain points and context
3. DIG DEEPER into their challenges before jumping to solutions
4. ONLY AFTER getting deeper context, then provide specific advice
5. Connect everything back to their #1 priority sprint when relevant

MANDATORY: You must ask follow-up questions and explore their situation thoroughly before providing solutions or offering to generate documents. Be curious and consultative, not solution-heavy in first responses.

RESPONSE STYLE:
- Talk like a seasoned consultant who's seen this before
- Use short, punchy paragraphs (2-3 sentences max)
- Balance questions with concrete solutions
- Give specific advice tailored to THEIR situation
- Be direct but supportive

PERSONALITY MODE - ${personality.toUpperCase()}:
${currentPersonality.tone}
${currentPersonality.approach}

LANGUAGE: The user is communicating in ${detectedLanguage === 'en' ? 'English' : detectedLanguage === 'es' ? 'Spanish' : detectedLanguage === 'fr' ? 'French' : detectedLanguage === 'pt' ? 'Portuguese' : 'English'}. ${detectedLanguage !== 'en' ? `Respond in ${detectedLanguage === 'es' ? 'Spanish' : detectedLanguage === 'fr' ? 'French' : detectedLanguage === 'pt' ? 'Portuguese' : 'English'} and adapt your business advice to be culturally relevant.` : 'Respond in English.'}

TRANSLATION MEMORY: You have access to conversation history. If you see language tags like "[I responded in es-ES]" or "[User spoke in fr-FR]", use this to remember what language you used previously. When asked to translate something back to English or another language, look at your conversation history to see what you said before and translate that specific content.

CRITICAL BALANCE: If the user has shared enough context about their problem, GIVE THEM SOLUTIONS. Only ask additional questions if you truly need more information to provide the best advice. When they say "can we come up with a plan now" or express frustration, shift immediately to solution mode.

${businessContextStr}
${strategicGuidance}
${contextualInsights}`
  }

  // For returning users without fresh start - let conversation flow naturally
  
  // Build framework context for users without Freedom Scores
  let strategicGuidance = '';
  if (frameworkContext?.strategicGuidance?.length > 0) {
    const topGuidance = frameworkContext.strategicGuidance[0];
    strategicGuidance = `\n\nRELEVANT STRATEGIC GUIDANCE:
${topGuidance.title}: ${topGuidance.content.substring(0, 200)}...`;
  }

  let contextualInsights = '';
  if (frameworkContext?.contextualInsights?.length > 0) {
    contextualInsights = `\n\nCONTEXTUAL INSIGHTS:
${frameworkContext.contextualInsights.slice(0, 2).join('\n')}`;
  }

  // Build business context for personalization
  let businessContextStr = '';
  if (businessContext) {
    const ctx = businessContext;
    businessContextStr = `\n\nBUSINESS CONTEXT - ${ctx.business_name || 'User\'s Business'}:
INDUSTRY: ${ctx.industry}
BUSINESS MODEL: ${ctx.business_model} 
REVENUE: ${ctx.current_revenue}
TEAM SIZE: ${ctx.team_size}
GROWTH STAGE: ${ctx.growth_stage}
TARGET MARKET: ${ctx.target_market}
UNIQUE VALUE PROP: ${ctx.unique_value_proposition}
TOP BOTTLENECKS: ${ctx.top_bottlenecks?.join(', ')}
BIGGEST CHALLENGE: ${ctx.biggest_challenge}
PRIMARY GOAL: ${ctx.primary_goal}
TIMEFRAME: ${ctx.timeframe}
WEBSITE: ${ctx.website_url}

IMPORTANT: You DO have access to their business questionnaire data shown above. Reference their specific business situation, industry, and challenges. Don't ask basic questions you already know the answers to.`;
  }
  
  return `You're Ruth's AI strategist. ${nameUsage}

CONVERSATION RULES:
1. ALWAYS acknowledge what the user just said before responding
2. Reference their specific words or situation they described  
3. Show you understand their unique challenge or question
4. Connect your advice to their actual situation
5. USE the strategic framework data provided to give sophisticated, specific guidance

${strategicGuidance}${contextualInsights}

CONVERSATION APPROACH:
1. ACKNOWLEDGE their situation with empathy  
2. Ask 1-2 clarifying questions if needed to understand context
3. PROVIDE SPECIFIC, ACTIONABLE SOLUTIONS based on what they've shared
4. Be conversational like an experienced consultant

RESPONSE STYLE:
- Talk like Ruth's seasoned business advisor 
- Use short, punchy paragraphs (2-3 sentences max)
- Balance questions with concrete solutions
- Give specific advice tailored to their situation
- Be direct but supportive

PERSONALITY MODE - ${personality.toUpperCase()}:
${currentPersonality.tone}
${currentPersonality.approach}

LANGUAGE: The user is communicating in ${detectedLanguage === 'en' ? 'English' : detectedLanguage === 'es' ? 'Spanish' : detectedLanguage === 'fr' ? 'French' : detectedLanguage === 'pt' ? 'Portuguese' : 'English'}. ${detectedLanguage !== 'en' ? `Respond in ${detectedLanguage === 'es' ? 'Spanish' : detectedLanguage === 'fr' ? 'French' : detectedLanguage === 'pt' ? 'Portuguese' : 'English'} and adapt your business advice to be culturally relevant.` : 'Respond in English.'}

TRANSLATION MEMORY: You have access to conversation history. If you see language tags like "[I responded in es-ES]" or "[User spoke in fr-FR]", use this to remember what language you used previously. When asked to translate something back to English or another language, look at your conversation history to see what you said before and translate that specific content.

IMPORTANT CONTEXT: Today's date is ${currentDate}. When discussing current events, trends, or dates, use this as your reference point.

${userName ? `IMPORTANT: The user's name is ${userName}. You already know their name, so don't ask for it again.` : ''}

CRITICAL: Respond naturally to what the user just said. Don't use generic conversation starters. If they've shared enough context about their problem, GIVE THEM SOLUTIONS. When they ask for a plan or express frustration, shift immediately to solution mode with specific, actionable advice.`
}

// Function to detect if user is asking for current information
function needsWebSearch(message: string): string | null {
  const searchTriggers = [
    /latest.{0,20}(trends?|news|updates?|information|data)/i,
    /current.{0,20}(market|industry|statistics?|data|pricing|costs?|trends?)/i,
    /recent.{0,20}(developments?|changes?|updates?|research)/i,
    /what.{0,10}(is|are).{0,10}happening.{0,20}(now|today|currently)/i,
    /search.{0,10}(for|about)/i,
    /(2024|2025).{0,20}(trends?|data|statistics?|market|pricing)/i,
    /up.{0,5}to.{0,5}date/i,
    /what.{0,10}(are|is).{0,20}(prices?|costs?|rates?)/i,
    /(current|today's?|this\s+year's?).{0,20}(prices?|market|statistics?)/i,
    /tell\s+me\s+about.{0,20}(current|latest|recent)/i,
    /research.{0,20}(current|latest)/i,
    // More business-specific triggers
    /what.{0,10}(companies|businesses).{0,10}are.{0,10}doing/i,
    /industry.{0,20}(analysis|report|insights?)/i,
    /market.{0,20}(research|analysis|data)/i,
    /competitor.{0,20}(analysis|research)/i,
    /business.{0,20}(trends?|news)/i,
    // AI and technology trends (flexible for typos)
    /what.{0,10}are.{0,10}the.{0,10}current.{0,10}(AI|artificial intelligence|tech|technology).{0,10}tre[an]ds?/i,
    /current.{0,10}(AI|artificial intelligence|tech|technology).{0,10}tre[an]ds?/i,
    /(AI|artificial intelligence|tech|technology).{0,10}tre[an]ds?.{0,10}(for|in).{0,10}(2024|2025)/i,
    /tre[an]ds?.{0,10}(for|in).{0,10}(2024|2025)/i,
    // Also catch just "AI" with years
    /(AI|artificial intelligence).{0,30}(2024|2025)/i,
    // Current political/government information
    /(current|who\s+is\s+the).{0,20}(president|prime minister|leader)/i,
    /who.{0,10}(won|is).{0,10}(president|election)/i
  ];
  
  console.log(`[SEARCH-CHECK] Testing message: "${message}"`);
  
  for (const trigger of searchTriggers) {
    if (trigger.test(message)) {
      console.log(`[SEARCH-TRIGGER] Matched pattern: ${trigger}`);
      return message; // Return the message as search query
    }
  }
  console.log(`[SEARCH-CHECK] No search triggers matched`);
  return null;
}

export async function POST(request: NextRequest) {
  try {
    console.log('[AI-STRATEGIST] ===== INCOMING REQUEST =====');
    const { user_id, message, freedom_score, is_fresh_start, file_context, user_name, personality = 'strategic' } = await request.json()
    
    // Import comprehensive language detection
    const { LanguageDetector } = await import('../../../lib/languageDetection');
    
    // Detect language of the message using comprehensive detector
    console.log(`[AI-STRATEGIST] Detecting language for message: "${message.substring(0, 50)}..."`);
    const detectionResult = LanguageDetector.detect(message);
    const detectedLanguage = detectionResult.language;
    console.log(`[AI-STRATEGIST] Language detection result:`, detectionResult);
    console.log('[AI-STRATEGIST] Parsed request body:', { 
      user_id, 
      message: `"${message}"`, 
      freedom_score: !!freedom_score,
      freedom_score_details: freedom_score ? {
        percent: freedom_score.percent,
        totalScore: freedom_score.totalScore,
        hasRecommendedOrder: !!freedom_score.recommendedOrder
      } : null,
      personality,
      detectedLanguage,
      is_fresh_start: is_fresh_start, 
      file_context: !!file_context,
      user_name: user_name || 'none'
    });

    console.log('[AI-STRATEGIST] Request data:', {
      user_id,
      message: message?.substring(0, 50) + '...',
      has_freedom_score: !!freedom_score,
      is_fresh_start,
      has_file_context: !!file_context
    });

    if (!user_id || !message) {
      console.error('[AI-STRATEGIST] Missing required fields:', { user_id: !!user_id, message: !!message });
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!process.env.OPENAI_API_KEY) {
      console.error('[AI-STRATEGIST] OpenAI API key not found')
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 })
    }

    // Initialize OpenAI client after confirming API key exists
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })

    // Explicitly type the history array
    let history: ConversationHistory[] = []
    
    // Only get conversation history if this isn't a fresh start
    if (!is_fresh_start) {
      // Try both tables - first the current ai_conversations, then fall back to memory table
      console.log('[AI-STRATEGIST] Checking ai_conversations table first...')
      const { data: historyData, error: historyError } = await supabase
        .from('ai_conversations')
        .select('message, response')
        .eq('user_id', user_id)
        .order('created_at', { ascending: true })
        .limit(20)

      if (historyError) {
        console.error('[AI-STRATEGIST] ai_conversations table error:', historyError)
      } else {
        history = (historyData as ConversationHistory[]) || []
        console.log(`[AI-STRATEGIST] Found ${history.length} entries in ai_conversations table`)
        console.log('[AI-STRATEGIST] Raw history data sample:', historyData?.slice(0, 2))
      }

      // If no history found in ai_conversations, try the memory table
      if (history.length === 0) {
        console.log('[AI-STRATEGIST] Checking memory table for conversation history...')
        try {
          const { data: memoryData, error: memoryError } = await supabase
            .from('memory')
            .select('content, context')
            .eq('user_id', user_id)
            .order('created_at', { ascending: true })
            .limit(10)

          if (memoryError) {
            console.error('[AI-STRATEGIST] Memory table error:', memoryError)
          } else if (memoryData && memoryData.length > 0) {
            console.log(`[AI-STRATEGIST] Found ${memoryData.length} entries in memory table`)
            // Convert memory entries to conversation format
            history = memoryData.map(mem => ({
              message: mem.context || 'Previous conversation',
              response: mem.content || ''
            }))
          }
        } catch (memoryErr) {
          console.error('[AI-STRATEGIST] Error accessing memory table:', memoryErr)
        }
      }

      console.log(`[AI-STRATEGIST] Final conversation history: ${history.length} entries`)
      if (history.length > 0) {
        console.log('[AI-STRATEGIST] Latest conversation entry:', {
          message: history[history.length - 1]?.message?.substring(0, 50),
          response: history[history.length - 1]?.response?.substring(0, 50)
        })
      }
    }

    const isNewUser = history.length === 0
    const isFirstMessage = message.toLowerCase().includes('hello') || 
                          message.toLowerCase().includes('started a conversation') ||
                          is_fresh_start
    const hasFileContext = !!file_context
    
    // Check if we need to perform a web search
    let searchContext = '';
    console.log('[AI-STRATEGIST] Checking if message needs web search...', { message, isFirstMessage });
    const searchQuery = needsWebSearch(message);
    console.log('[AI-STRATEGIST] Search query result:', searchQuery);
    
    if (searchQuery && !isFirstMessage) {
      console.log('[AI-STRATEGIST] TRIGGERING WEB SEARCH for query:', searchQuery);
      try {
        const searchResponse = await fetch(`${request.nextUrl.origin}/api/search`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: searchQuery,
            context: freedom_score ? `User has Freedom Score of ${freedom_score.percent}%` : 'Business strategy inquiry'
          })
        });
        
        if (searchResponse.ok) {
          const searchData = await searchResponse.json();
          if (searchData.success) {
            searchContext = `CURRENT WEB SEARCH RESULTS for "${searchQuery}":\n${searchData.searchResults?.map((r: any) => 
              `• ${r.title}: ${r.description} (Source: ${r.url})`
            ).join('\n') || 'No specific results found'}\n\nAI Analysis: ${searchData.aiResponse}\n\n`;
          }
        }
      } catch (searchError) {
        console.log('Search failed, continuing without current data:', searchError);
      }
    }
    
    // Get strategic framework context based on user message and Freedom Score
    let frameworkContext;
    try {
      frameworkContext = await getFrameworkContext(message, freedom_score);
      console.log('[AI-STRATEGIST] Framework context loaded:', {
        hasUserSprint: !!frameworkContext.userSprint,
        guidanceCount: frameworkContext.strategicGuidance.length,
        insightsCount: frameworkContext.contextualInsights.length
      });
    } catch (frameworkError) {
      console.error('[AI-STRATEGIST] Framework context error (continuing without):', frameworkError);
      frameworkContext = {
        relevantModules: [],
        strategicGuidance: [],
        contextualInsights: []
      };
    }
    
    // Extract user name - prioritize frontend-provided name, then detect from message/history
    let userName: string | null = user_name || null // Use frontend's known name first
    
    console.log('[AI-STRATEGIST] Looking for user name, frontend provided:', user_name);
    
    // If no frontend name, check current message for name introduction
    if (!userName) {
      const currentNameMatch = message.match(/(?:i'm|i am|my name is|call me|name's)\s+([a-zA-Z]+)/i)
      if (currentNameMatch) {
        userName = currentNameMatch[1]
        console.log('[AI-STRATEGIST] Found name in current message:', userName);
        // Note: userName is now stored in database via frontend
      }
    }
    
    // If no name in current message, check history
    if (!userName && history.length > 0) {
      console.log('[AI-STRATEGIST] Checking history for name, history length:', history.length);
      for (const conv of history) {
        const nameMatch = conv.message.match(/(?:i'm|i am|my name is|call me|name's)\s+([a-zA-Z]+)/i)
        if (nameMatch) {
          userName = nameMatch[1]
          console.log('[AI-STRATEGIST] Found name in history:', userName);
          break
        }
      }
    }
    
    // If still no name, try to get from localStorage (for server-side, this won't work, but helps in client)
    if (!userName) {
      try {
        // This will work when called from client-side
        if (typeof window !== 'undefined') {
          userName = localStorage?.getItem(`user_name_${user_id}`)
        }
      } catch (e) {
        // localStorage not available
      }
    }

    // Fetch business context for personalization
    let businessContext = null;
    try {
      console.log('[AI-STRATEGIST] Fetching business context...');
      const { data: contextData, error: contextError } = await supabase
        .from('business_context')
        .select('*')
        .eq('user_id', user_id)
        .single();

      if (contextError && contextError.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('[AI-STRATEGIST] Error fetching business context:', contextError);
      } else if (contextData) {
        businessContext = contextData;
        console.log('[AI-STRATEGIST] Business context loaded:', {
          business_name: contextData.business_name,
          industry: contextData.industry,
          revenue: contextData.current_revenue,
          has_goals: !!contextData.primary_goal
        });
      } else {
        console.log('[AI-STRATEGIST] No business context found for user');
      }
    } catch (error) {
      console.error('[AI-STRATEGIST] Business context fetch error:', error);
    }

    // Generate system prompt with enhanced context
    console.log('[AI-STRATEGIST] Final userName before system prompt:', userName);
    console.log('[AI-STRATEGIST] Generating system prompt...');
    let systemPrompt;
    try {
      systemPrompt = generateSystemPrompt(
        userName, 
        freedom_score as FreedomScore | null,
        personality,
        detectedLanguage,
        isNewUser, 
        isFirstMessage || is_fresh_start,
        hasFileContext,
        searchContext,
        frameworkContext,
        businessContext
      );
      console.log('[AI-STRATEGIST] System prompt generated successfully');
    } catch (promptError) {
      console.error('[AI-STRATEGIST] System prompt generation error:', promptError);
      // Fallback to basic prompt
      systemPrompt = `You're Ruth's AI strategist. Be helpful, acknowledge what the user said, and provide business guidance.`;
    }

    // Build messages array properly
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: "system", content: systemPrompt }
    ]

    // Add file context to system message if provided
    if (file_context) {
      messages.push({
        role: "system",
        content: `DOCUMENT CONTEXT: The user has provided the following documents for analysis:\n\n${file_context}\n\nAnalyze this content in relation to their business challenges and Freedom Score results.`
      })
    }
    
    // Add search context to system message if provided
    if (searchContext) {
      messages.push({
        role: "system",
        content: searchContext + "Use this current information to provide up-to-date, accurate responses. Always cite sources when referencing search data."
      })
    }

    // Add conversation history only if not a fresh start
    if (!is_fresh_start && history && history.length > 0) {
      console.log(`[AI-STRATEGIST] Adding ${history.length} conversation history entries to context`)
      for (const conv of history) {
        // Extract language metadata from embedded format
        const extractMetadata = (text: string) => {
          const langMatch = text.match(/^\[Lang:([^\]]+)\]/);
          const personalityMatch = text.match(/Personality:([^\]]+)/);
          const cleanText = text.replace(/^\[Lang:[^\]]+\]\s*/, '').replace(/\[Lang:[^,]+,Personality:[^\]]+\]\s*/, '');
          
          return {
            language: langMatch ? langMatch[1] : 'en',
            personality: personalityMatch ? personalityMatch[1] : null,
            text: cleanText
          };
        };

        const userMeta = extractMetadata(conv.message);
        const assistantMeta = extractMetadata(conv.response);
        
        const userMsg = userMeta.language !== 'en' 
          ? `[User spoke in ${userMeta.language}] ${userMeta.text}`
          : userMeta.text;
        const assistantMsg = assistantMeta.language !== 'en'
          ? `[I responded in ${assistantMeta.language}] ${assistantMeta.text}`
          : assistantMeta.text;
          
        messages.push({ role: "user", content: userMsg })
        messages.push({ role: "assistant", content: assistantMsg })
      }
      console.log(`[AI-STRATEGIST] Total messages in context: ${messages.length} (including ${history.length * 2} history messages)`)
    } else {
      console.log('[AI-STRATEGIST] No conversation history to add:', {
        is_fresh_start,
        history_length: history.length
      })
    }

    // Add current message
    messages.push({ role: "user", content: message })

    console.log('[AI-STRATEGIST] Preparing OpenAI request with', messages.length, 'messages', is_fresh_start ? '(FRESH START)' : '', hasFileContext ? '(WITH FILES)' : '');

    // Dynamic context adaptation
    const isComplexQuery = message.length > 200 || message.includes('?') || searchContext;
    const isUrgentQuery = message.toLowerCase().includes('urgent') || message.toLowerCase().includes('asap') || message.toLowerCase().includes('help');
    const conversationDepth = history.length;
    
    // Adaptive AI parameters based on context
    let adaptedTemperature = 0.6;
    let adaptedMaxTokens = 300;
    let adaptedPresence = 0.3;
    
    if (hasFileContext) {
      adaptedTemperature = 0.2;
      adaptedMaxTokens = 600;
      adaptedPresence = 0.1;
    } else if (searchContext) {
      adaptedTemperature = 0.4;
      adaptedMaxTokens = 450;
      adaptedPresence = 0.2;
    } else if (isComplexQuery) {
      adaptedTemperature = 0.4 + (Math.random() * 0.2);
      adaptedMaxTokens = 400;
      adaptedPresence = 0.2;
    } else if (isUrgentQuery) {
      adaptedTemperature = 0.3;
      adaptedMaxTokens = 350;
      adaptedPresence = 0.4;
    } else if (conversationDepth > 10) {
      adaptedTemperature = 0.5 + (Math.random() * 0.4);
      adaptedMaxTokens = 320;
      adaptedPresence = 0.3;
    }

    console.log(`[AI-STRATEGIST] OpenAI parameters - Complex: ${isComplexQuery}, Urgent: ${isUrgentQuery}, Depth: ${conversationDepth}, Temp: ${adaptedTemperature.toFixed(2)}, Tokens: ${adaptedMaxTokens}`);

    // Query OpenAI with comprehensive error handling
    let completion;
    try {
      console.log('[AI-STRATEGIST] Calling OpenAI API...');
      completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages,
        temperature: adaptedTemperature,
        max_tokens: adaptedMaxTokens,
        presence_penalty: adaptedPresence,
        frequency_penalty: 0.3
      });
      console.log('[AI-STRATEGIST] OpenAI API call successful');
    } catch (openaiError) {
      console.error('[AI-STRATEGIST] OpenAI API error:', openaiError);
      return NextResponse.json({ 
        error: 'AI service temporarily unavailable',
        details: openaiError instanceof Error ? openaiError.message : 'OpenAI API error'
      }, { status: 503 });
    }

    const rawBotReply = completion.choices[0].message.content || "I'm here to help! What's your biggest business challenge right now?"
    
    // Clean the response by removing any embedded metadata tags before sending to user
    const botReply = rawBotReply
      .replace(/^\[Lang:[^\]]+,Personality:[^\]]+\]\s*/, '') // Remove language/personality metadata
      .replace(/^\[Lang:[^\]]+\]\s*/, '') // Remove language-only metadata
      .replace(/^\[I responded in [^\]]+\]\s*/, '') // Remove translation memory tags
      .trim();
    
    console.log('[AI-STRATEGIST] Raw bot reply:', rawBotReply?.substring(0, 100) + '...');
    console.log('[AI-STRATEGIST] Cleaned bot reply:', botReply?.substring(0, 100) + '...');

    // Save conversation to Supabase (create new conversation thread for fresh starts)
    // Save with existing schema - add language info in JSON format or as text
    const saveData = {
      user_id: is_fresh_start ? `${user_id}-${Date.now()}` : user_id,
      message: `[Lang:${detectedLanguage}] ${message}`, // Embed language in message
      response: `[Lang:${detectedLanguage},Personality:${personality}] ${botReply}`, // Embed metadata in response
      freedom_score: freedom_score
    }

    const { error: saveError } = await supabase
      .from('ai_conversations')
      .insert(saveData)

    if (saveError) {
      console.error('Error saving conversation:', saveError)
      // Don't fail the request if save fails
    }

    return NextResponse.json({ reply: botReply })

  } catch (error) {
    console.error('AI Strategist error:', error)
    return NextResponse.json({ 
      error: 'Failed to get AI response',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}