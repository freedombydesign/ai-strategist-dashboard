import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// SMART CONTENT DETECTION - IDENTIFY CONTENT TYPE
function detectContentType(message: string): { type: string; confidence: number; context: any } {
  const content = message.toLowerCase()
  const wordCount = content.split(/\s+/).length
  
  // Check for minimal content that needs more context
  const needsContext = wordCount < 15 && (
    content.includes('subject:') ||
    content.includes('headline:') || 
    content.includes('hi ') ||
    content.includes('script') ||
    content.match(/limited.*time|get.*off|call.*about/)
  )
  
  // Email detection patterns
  if (content.includes('subject:') || content.includes('from:') || content.includes('dear ') || 
      content.includes('hi ') || content.includes('hello ') || content.match(/email sequence|email series|newsletter/)) {
    return { 
      type: 'email', 
      confidence: 0.9, 
      context: { 
        hasSubject: content.includes('subject:'),
        needsContext,
        wordCount
      } 
    }
  }
  
  // Ad copy detection patterns  
  if (content.match(/headline:|ad copy|facebook ad|google ad|instagram ad/) || 
      content.match(/\$\d+.*off|save \$|discount|limited time|act now/) ||
      content.match(/get \d+%|save up to|\d+% off/)) {
    return { 
      type: 'ad', 
      confidence: 0.85, 
      context: { 
        platform: content.includes('facebook') ? 'facebook' : content.includes('google') ? 'google' : 'unknown',
        needsContext,
        wordCount
      } 
    }
  }
  
  // Sales script detection
  if (content.match(/script|call script|sales call|phone|objection/) ||
      content.match(/prospect:|client:|caller:|script:/) ||
      content.includes('cold call') || content.includes('sales pitch')) {
    return { 
      type: 'script', 
      confidence: 0.8, 
      context: { 
        scriptType: content.includes('cold') ? 'cold_call' : 'sales_call',
        needsContext,
        wordCount
      } 
    }
  }
  
  // Landing page detection
  if (content.match(/landing page|sales page|squeeze page/) ||
      content.length > 500 && content.match(/headline.*cta|call to action|sign up|get started/)) {
    return { 
      type: 'landing_page', 
      confidence: 0.75, 
      context: { 
        length: content.length,
        needsContext: content.length < 200,
        wordCount
      } 
    }
  }
  
  // Website URL detection (existing)
  if (content.match(/https?:\/\/|www\.|\.com|\.net|\.org/)) {
    return { type: 'website', confidence: 0.95, context: { url: content.match(/https?:\/\/[^\s]+|www\.[^\s]+/)?.[0] } }
  }
  
  // Default to general copy analysis
  return { type: 'copy', confidence: 0.5, context: { length: content.length, wordCount } }
}

// NUCLEAR SIMPLE POST-PROCESSING - NO COMPLEX LOGIC
function removeFormattingAndAddSolutions(text: string): string {
  console.log('[POST-PROCESS] Original text length:', text.length)
  
  // Remove asterisks and formatting
  let cleaned = text.replace(/\*+/g, '')
  cleaned = cleaned.replace(/^\s*\d+[\.\)\-]\s*/gm, '')
  cleaned = cleaned.replace(/^\s*[\-\u2022]\s*/gm, '')
  
  // Split into sentences and group by 2
  const sentences = cleaned.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0)
  console.log('[POST-PROCESS] Found sentences:', sentences.length)
  
  const paragraphs = []
  
  for (let i = 0; i < sentences.length; i += 2) {
    let para = sentences[i]
    if (sentences[i + 1]) {
      para += ' ' + sentences[i + 1]
    }
    paragraphs.push(para.trim())
  }
  
  const result = paragraphs.join('\n\n').trim()
  console.log('[POST-PROCESS] Final result has newlines:', result.includes('\n\n'))
  console.log('[POST-PROCESS] Final paragraphs:', paragraphs.length)
  
  return result
}

// CONTEXT PROBING FOR MINIMAL CONTENT
function getContextProbePrompt(contentType: string): string {
  switch (contentType) {
    case 'email':
      return `EMAIL CONTEXT PROBE - GATHER STRATEGIC INTEL:

I can see you've shared the beginning of an email, but I need more context to provide surgical analysis.

Before I can give you the precise diagnosis this email needs, tell me:

Who is this email going to? (Business owners? Agency owners? Specific industry?)
What's the goal? (Book a call? Sell a product? Nurture relationship?)
What's the context? (Cold outreach? Follow-up sequence? Newsletter?)
Where are they in your funnel? (Cold prospect? Warm lead? Existing client?)

The more specific you are about your audience and objective, the more precisely I can dissect what's working and what's costing you opens, clicks, and conversions.

Paste the full email and context, and I'll show you exactly where it's failing and how to fix it.`

    case 'ad':
      return `AD COPY CONTEXT PROBE - GATHER TARGETING INTEL:

I can see you've shared ad copy, but I need strategic context for precision analysis.

Before I can diagnose what's killing your click-through rates, tell me:

What platform? (Facebook? Google? Instagram? LinkedIn?)
Who's your target? (Service providers? Agency owners? Specific industry?)
What's the offer? (Free consultation? Course? Service?)
What's your budget range? (This affects strategy)
What stage are they? (Cold traffic? Retargeting? Lookalike?)

Ad performance is all about audience-message match. Give me the full context and complete ad copy, and I'll pinpoint exactly why it's not converting and how to fix it.`

    case 'script':
      return `SALES SCRIPT CONTEXT PROBE - GATHER CONVERSATION INTEL:

I can see you've shared part of a script, but I need more context for surgical analysis.

Before I can diagnose what's causing hang-ups and objections, tell me:

What type of call? (Cold calling? Inbound? Discovery? Closing?)
Who are you calling? (Business owners? Decision makers? Specific industry?)
What's the offer? (Consultation? Service? Product?)
How did they get in your pipeline? (Lead magnet? Referral? Cold outreach?)
What's your typical objection pattern?

Script success depends on context and timing. Share the full script and background, and I'll show you exactly where prospects are mentally checking out and how to keep them engaged.`

    case 'landing_page':
      return `LANDING PAGE CONTEXT PROBE - GATHER CONVERSION INTEL:

I can see you've shared landing page copy, but I need more context for conversion analysis.

Before I can diagnose what's causing visitors to bounce, tell me:

What's driving traffic? (Ads? SEO? Email? Social?)
What's the offer? (Lead magnet? Course? Service? Product?)
Who's your target? (Service providers? Specific industry? Experience level?)
What's the desired action? (Email opt-in? Purchase? Book call?)
What's your current conversion rate? (If you know it)

Landing page optimization is about traffic-to-conversion alignment. Give me the full page copy and context, and I'll pinpoint exactly what's preventing visitors from taking action.`

    default:
      return `COPY CONTEXT PROBE - GATHER STRATEGIC INTEL:

I can see you've shared copy, but I need more context for precision analysis.

Tell me:

What type of copy is this? (Email? Ad? Sales page? Script?)
Who's your target audience?
What's the desired outcome?
Where will this be used?

The more context you provide, the more surgically I can analyze what's working and what needs fixing.`
  }
}

// SPECIALIZED PROMPTS FOR DIFFERENT CONTENT TYPES
function getSpecializedPrompt(detection: { type: string; confidence: number; context: any }, personality: string, isRewriteRequest: boolean, isFullPageRewrite: boolean): string {
  const baseRules = `FORBIDDEN FORMATTING: No asterisks, no bullet points, no numbered lists, no bold text. Just raw conversational paragraphs.`
  
  // Handle minimal content that needs more context
  if (detection.context?.needsContext && !isRewriteRequest) {
    const contextProbe = getContextProbePrompt(detection.type)
    return `${baseRules}\n\n${contextProbe}`
  }
  
  switch (detection.type) {
    case 'email':
      return `${baseRules}

EMAIL COPY ANALYSIS EXPERT - SURGICAL PRECISION:

${isRewriteRequest || isFullPageRewrite ? 
  'User wants EMAIL REWRITES. Quote their exact copy, explain precisely why it fails, then provide visceral alternatives for email psychology.' :
  `Your job: 1) QUOTE their exact email copy 2) DIAGNOSE the precise psychological mechanism that's failing (open rates, engagement, conversions) 3) PROVIDE visceral alternatives targeting email-specific psychology.

EMAIL PSYCHOLOGY RULES:
- Subject lines must create curiosity + urgency + personal relevance 
- Opening lines determine if they keep reading (first 8 words critical)
- Email rhythm: short paragraphs, conversational tone
- Call-to-action must feel like natural next step, not pushy sales

For solutions, avoid generic phrases. Use specific scenarios like "Your Inbox at 7 AM: 3 New Clients Instead of 3 Complaints" or "Finally, Emails That Don't Sound Like Everyone Else's Templates."

Target service providers who get 200+ emails daily - make yours stand out by addressing their specific Tuesday morning reality.`}

End with: "Want me to rewrite any specific sections or your entire email sequence?"`

    case 'ad':
      return `${baseRules}

AD COPY ANALYSIS EXPERT - CONVERSION SURGEON:

${isRewriteRequest || isFullPageRewrite ? 
  'User wants AD REWRITES. Quote their exact copy, explain precisely why it fails, then provide visceral alternatives for ad psychology.' :
  `Your job: 1) QUOTE their exact ad copy 2) DIAGNOSE the precise psychological mechanism that's failing (click-through rates, engagement, conversions) 3) PROVIDE visceral alternatives targeting ad-specific psychology.

AD PSYCHOLOGY RULES:
- Headlines must stop the scroll (interrupt their autopilot)
- Social proof beats features (show results, not promises)  
- Visual copy works differently than written copy (shorter, punchier)
- Ad fatigue means everyone sounds the same - be specific

For solutions, avoid generic benefits. Use specific scenarios like "While Your Competitors Post Generic Tips, You'll Post Client Success Stories" or "The Ad That Made Sarah $50K in 30 Days (Without Ads Manager Fees)."

Target service providers who see 500+ ads daily - make yours impossible to ignore by addressing their exact Thursday afternoon frustration.`}

End with: "Want me to rewrite any specific sections or your entire ad campaign?"`

    case 'script':
      return `${baseRules}

SALES SCRIPT ANALYSIS EXPERT - CONVERSATION SURGEON:

${isRewriteRequest || isFullPageRewrite ? 
  'User wants SCRIPT REWRITES. Quote their exact copy, explain precisely why it fails, then provide visceral alternatives for conversation psychology.' :
  `Your job: 1) QUOTE their exact script copy 2) DIAGNOSE the precise psychological mechanism that's failing (call outcomes, objection handling, closing rates) 3) PROVIDE visceral alternatives targeting conversation psychology.

SCRIPT PSYCHOLOGY RULES:
- First 15 seconds determine if they hang up (pattern interrupt critical)
- Questions beat statements (discovery over pitch)
- Handle objections before they're raised 
- Close with assumption, not asking permission

For solutions, avoid generic openers. Use specific scenarios like "Instead of 'How's business?' try 'I noticed your team doubled but your systems didn't - sound familiar?'" or "Replace 'Are you interested?' with 'When would you want this implemented?'"

Target service providers who get 10+ sales calls weekly - make yours sound different by addressing their exact Monday morning problem.`}

End with: "Want me to rewrite any specific sections or your entire script?"`

    case 'landing_page':
      return `${baseRules}

LANDING PAGE ANALYSIS EXPERT - CONVERSION ARCHITECT:

${isRewriteRequest || isFullPageRewrite ? 
  'User wants LANDING PAGE REWRITES. Quote their exact copy, explain precisely why it fails, then provide visceral alternatives for landing page psychology.' :
  `Your job: 1) QUOTE their exact landing page copy 2) DIAGNOSE the precise psychological mechanism that's failing (bounce rates, conversion rates, engagement) 3) PROVIDE visceral alternatives targeting landing page psychology.

LANDING PAGE PSYCHOLOGY RULES:
- Above fold must answer "What's in it for me?" in 3 seconds
- Headline + subheadline + visual tell complete story
- Social proof must be specific and relevant
- One clear path to conversion (no distractions)

For solutions, avoid generic benefits. Use specific scenarios like "Instead of 'Transform Your Business' try 'Turn Your 60-Hour Weeks Into 30-Hour Profits'" or "Replace 'Join Thousands' with 'Join 247 Agency Owners Who Fired Their Biggest Client.'"

Target service providers who see 100+ landing pages monthly - make yours convert by addressing their exact Wednesday afternoon doubt.`}

End with: "Want me to rewrite any specific sections or your entire landing page?"`

    default:
      return `${baseRules}

COPY ANALYSIS EXPERT - SURGICAL PRECISION:

${isRewriteRequest || isFullPageRewrite ? 
  'User wants COPY REWRITES. Quote their exact copy, explain precisely why it fails, then provide visceral alternatives.' :
  `Your job: 1) QUOTE their exact copy 2) DIAGNOSE the precise psychological mechanism that's failing 3) PROVIDE visceral alternatives targeting their audience's exact lived experience.

For solutions, avoid generic phrases. Use specific daily realities like "Stop Checking Slack at 11 PM Because Your Team Can't Decide" or "No More Weekend Calls About Problems You've Solved Three Times."

Target service providers - make them think "holy shit, that's exactly my Tuesday night."`}

End with: "Want me to rewrite any specific sections or your entire copy?"`
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('[AI-STRATEGIST-FIXED] API called - VERSION 2.0 - TIMESTAMP:', new Date().toISOString())
    
    const requestBody = await request.json()
    const { user_id, message, website_intelligence, personality } = requestBody
    
    // Detect content type using smart detection
    const contentDetection = detectContentType(message)
    console.log('[CONTENT-DETECTION]', contentDetection)
    
    // Check if this is a rewrite request
    const isRewriteRequest = message.toLowerCase().includes('please do') || 
                           message.toLowerCase().includes('rewrite') ||
                           message.toLowerCase().includes('yes, rewrite') ||
                           message.toLowerCase().includes('do it') ||
                           message.toLowerCase().includes('recreate') ||
                           message.toLowerCase().includes('help me create') ||
                           message.toLowerCase().includes('write an ad') ||
                           message.toLowerCase().includes('write an email') ||
                           message.toLowerCase().includes('can you write')
    
    // Detect rewrite request type from message
    let rewriteType = null
    if (message.toLowerCase().includes('email')) rewriteType = 'email'
    if (message.toLowerCase().includes('ad')) rewriteType = 'ad'  
    if (message.toLowerCase().includes('script')) rewriteType = 'script'
    if (message.toLowerCase().includes('landing page')) rewriteType = 'landing_page'
    
    // Check if this is a full page rewrite request
    const isFullPageRewrite = message.toLowerCase().includes('entire sales page') ||
                            message.toLowerCase().includes('full sales page') ||
                            message.toLowerCase().includes('whole sales page') ||
                            message.toLowerCase().includes('complete sales page')
    
    console.log('[AI-STRATEGIST-FIXED] Request data:', {
      user_id,
      message: message?.substring(0, 50) + '...',
      has_website_intelligence: !!website_intelligence,
      content_type: contentDetection.type
    })

    // Handle different content types with specialized analysis
    // Use rewriteType if detected, otherwise use content detection
    const finalContentType = rewriteType || (contentDetection.confidence > 0.6 ? contentDetection.type : null)
    
    if (finalContentType && finalContentType !== 'website') {
      console.log(`[AI-STRATEGIST-FIXED] Using specialized ${finalContentType.toUpperCase()} analysis (rewrite: ${!!rewriteType})`)
      
      // Create enhanced detection object
      const enhancedDetection = rewriteType ? 
        { type: rewriteType, confidence: 0.9, context: { isRewriteRequest: true } } : 
        contentDetection
      
      const systemPrompt = getSpecializedPrompt(enhancedDetection, personality, isRewriteRequest, isFullPageRewrite)
      
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message },
          { role: 'system', content: 'CRITICAL REMINDER: Write in natural paragraphs only. You are FORBIDDEN from using asterisks (*), numbered lists (1. 2. 3.), bullet points, or any formatting symbols. Talk like a human having a conversation.' }
        ],
        max_tokens: 1200,
        temperature: 0.7,
      })

      const rawResponse = completion.choices[0]?.message?.content || 'I apologize, but I encountered an error processing your request.'
      const aiResponse = removeFormattingAndAddSolutions(rawResponse)
      
      console.log(`[AI-STRATEGIST-FIXED] ${finalContentType.toUpperCase()} analysis response generated, length:`, aiResponse.length)
      
      return NextResponse.json({
        reply: aiResponse,
        has_reply: true,
        reply_preview: aiResponse.substring(0, 100) + "...",
        content_type: finalContentType,
        error: undefined
      })
    }

    // Handle website intelligence if available (existing logic)
    if (website_intelligence && website_intelligence.analysis) {
      console.log('[AI-STRATEGIST-FIXED] Using website intelligence for specific insights')
      
      let systemPrompt = `RUTH'S SALES PAGE CONTENT:
Headlines: ${JSON.stringify(website_intelligence.analysis.extractedMessaging?.headlines || [])}
CTAs: ${JSON.stringify(website_intelligence.analysis.extractedMessaging?.callsToAction || [])}
Page content: ${website_intelligence.analysis.competitivePositioning?.substring(0, 400) || 'Not found'}

FORBIDDEN FORMATTING: No asterisks, no bullet points, no numbered lists, no bold text. Just raw conversational paragraphs.`
      
      if (personality === 'savage') {
        systemPrompt += `

CLASSY SAVAGE ANALYSIS - MICRO-SPECIFIC DIAGNOSIS WITH VISCERAL SOLUTIONS:

${isRewriteRequest || isFullPageRewrite ? 
          'Ruth wants REWRITES. Quote her exact copy, explain precisely why it fails, then provide visceral alternatives that paint their audience\'s exact daily reality.' :
          'Your job is to deliver surgical precision analysis: 1) QUOTE her exact copy 2) DIAGNOSE the precise psychological/conversion mechanism that\'s failing 3) PROVIDE visceral, specific alternatives that capture their audience\'s exact lived experience - not generic benefits. Headlines should be 6-12 words max painting specific scenarios (like \"Stop Checking Slack at 11 PM Because Your Team Can\'t Decide\"). CTAs should be 2-4 words max, button text. For solutions, avoid generic phrases like \"Scale Beyond\" or \"Business Freedom\" - instead use specific daily realities like \"No More Weekend Calls About Problems You\'ve Solved Three Times.\" Make them think \"holy shit, that\'s exactly my Tuesday night.\"'}

End with: "Want me to rewrite any specific sections or your entire page?"`
      } else if (personality === 'strategic') {
        systemPrompt += `

STRATEGIC MODE: Know SALES PAGE STRUCTURE first. Headlines = short punchy benefits (6-12 words). CTAs = short button text (2-4 words). Body copy = detailed ROI explanations. Focus on business impact and competitive positioning. Example approach: "For your HEADLINE, try 'Scale Beyond Personal Capacity' (punchy benefit). For BODY COPY, explain the ROI impact and competitive advantage. For CTAs, use 'Get Started' (short button text)." Always end with: "I can provide a complete strategic rewrite with proper structure for each element."`
      } else if (personality === 'creative') {
        systemPrompt += `

CREATIVE MODE: Know SALES PAGE STRUCTURE first. Headlines = short punchy benefits (6-12 words). CTAs = short button text (2-4 words). Body copy = detailed stories and emotional hooks. Focus on emotional engagement and compelling messaging with proper structure for each element. Example approach: "For your HEADLINE, try 'Build Your Dream Business' (punchy benefit). For BODY COPY, paint vivid pictures: 'Imagine sipping coffee on a Tuesday morning while your business runs smoothly without a single phone call from your team.' For CTAs, use 'Get Started' (short button text)." Always end with: "I can rewrite this with engaging stories and emotional hooks that make prospects feel the transformation."`
      } else if (personality === 'analytical') {
        systemPrompt += `

ANALYTICAL MODE: Know SALES PAGE STRUCTURE first. Headlines = short punchy benefits (6-12 words). CTAs = short button text (2-4 words). Body copy = detailed analysis and data. Focus on conversion data, user psychology, and testing opportunities with proper structure for each element. Example approach: "For your HEADLINE, 'Remove Yourself' likely reduces click-through rates because it triggers loss aversion. Try 'Build Your Dream Business' (aspirational headlines outperform escape-focused messaging by 23%). For BODY COPY, include conversion data and psychological triggers. For CTAs, use 'Get Started' (short button text)." Always end with: "I can rewrite this with conversion-optimized copy and suggest A/B tests to validate improvements."`
      } else {
        systemPrompt += `

SUPPORTIVE MODE: Know SALES PAGE STRUCTURE first. Headlines = short punchy benefits (6-12 words). CTAs = short button text (2-4 words). Body copy = encouraging explanations and support. Provide gentle but honest feedback with encouragement, focusing on what's working and how to improve what isn't with proper structure for each element. Example approach: "I love your passion for helping business owners! For your HEADLINE, 'Remove Yourself' might push away people who enjoy their work but need better systems. Try 'Build a Business That Thrives Without You' (maintains freedom benefit while honoring their love). For BODY COPY, expand on the benefits with encouragement. For CTAs, use 'Get Started' (short button text)." Always end with: "I'd be happy to help you rewrite sections to keep your authentic voice while improving clarity and appeal."`
      }
      
      systemPrompt += `

Point out exactly WHERE her copy is failing and WHY it's costing her money. Always provide specific solutions.`

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message },
          { role: 'system', content: 'CRITICAL REMINDER: Write in natural paragraphs only. You are FORBIDDEN from using asterisks (*), numbered lists (1. 2. 3.), bullet points, or any formatting symbols. Talk like a human having a conversation.' }
        ],
        max_tokens: 1000,
        temperature: 0.7,
      })

      const rawResponse = completion.choices[0]?.message?.content || 'I apologize, but I encountered an error processing your request.'
      
      // Post-processing: Remove all formatting that GPT-4o loves to add
      const aiResponse = removeFormattingAndAddSolutions(rawResponse)
      
      console.log('[AI-STRATEGIST-FIXED] Website intelligence response generated, length:', aiResponse.length)
      
      return NextResponse.json({
        reply: aiResponse,
        has_reply: true,
        reply_preview: aiResponse.substring(0, 100) + "...",
        error: undefined
      })
    }

    // Fallback for requests without website intelligence
    console.log('[AI-STRATEGIST-FIXED] No website intelligence, providing general response')
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { 
          role: 'system', 
          content: `CRITICAL: You are FORBIDDEN from using asterisks (*), numbered lists (1. 2. 3.), bullet points, bold formatting (**text**), or any formatting symbols. Write ONLY in natural conversational paragraphs.
          
          ${personality === 'savage' ? 
            'SAVAGE MODE: Know SALES PAGE STRUCTURE. Headlines = short punchy benefits (6-12 words). CTAs = short button text (2-4 words). Body copy = where brutal descriptive reality belongs. Don\'t suggest long descriptions as headlines. For body copy, paint exact brutal reality: "You\'re checking emails during your kid\'s soccer game because you can\'t trust your team." Make them think "holy shit, that\'s exactly me."' : 
            personality === 'strategic' ? 
            'STRATEGIC MODE: Know SALES PAGE STRUCTURE. Headlines = short punchy benefits (6-12 words). CTAs = short button text (2-4 words). Body copy = detailed explanations. Focus on business impact and ROI. Identify what\'s costing money and provide data-driven solutions with proper structure.' :
            personality === 'creative' ? 
            'CREATIVE MODE: Know SALES PAGE STRUCTURE. Headlines = short punchy benefits (6-12 words). CTAs = short button text (2-4 words). Body copy = stories and emotional hooks. Focus on emotional engagement and compelling messaging with proper structure for each element.' :
            personality === 'analytical' ? 
            'ANALYTICAL MODE: Know SALES PAGE STRUCTURE. Headlines = short punchy benefits (6-12 words). CTAs = short button text (2-4 words). Body copy = detailed analysis. Focus on conversion data and user psychology with proper structure for each element.' :
            'SUPPORTIVE MODE: Know SALES PAGE STRUCTURE. Headlines = short punchy benefits (6-12 words). CTAs = short button text (2-4 words). Body copy = encouraging explanations. Provide gentle but honest feedback with proper structure for each element.'
          }` 
        },
        { role: 'user', content: message },
        { role: 'system', content: 'REMINDER: No asterisks, no numbers, no formatting. Write like you\'re talking to a friend in natural paragraphs only.' }
      ],
      max_tokens: 800,
      temperature: 0.7,
    })

    const rawResponse = completion.choices[0]?.message?.content || 'I apologize, but I encountered an error processing your request.'
    
    // Post-processing: Remove all formatting that GPT-4o loves to add
    const aiResponse = removeFormattingAndAddSolutions(rawResponse)
    
    console.log('[AI-STRATEGIST-FIXED] General response generated, length:', aiResponse.length)
    
    return NextResponse.json({
      reply: aiResponse,
      has_reply: true,
      reply_preview: aiResponse.substring(0, 100) + "...",
      error: undefined
    })
    
  } catch (error) {
    console.error('[AI-STRATEGIST-FIXED] Error:', error)
    
    return NextResponse.json({
      reply: 'I apologize, but I encountered an error processing your request. Please try again.',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}