import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

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

export async function POST(request: NextRequest) {
  try {
    console.log('[AI-STRATEGIST-FIXED] API called - VERSION 2.0 - TIMESTAMP:', new Date().toISOString())
    
    const requestBody = await request.json()
    const { user_id, message, website_intelligence, personality } = requestBody
    
    // Check if this is a rewrite request
    const isRewriteRequest = message.toLowerCase().includes('please do') || 
                           message.toLowerCase().includes('rewrite') ||
                           message.toLowerCase().includes('yes, rewrite') ||
                           message.toLowerCase().includes('do it')
    
    // Check if this is a full page rewrite request
    const isFullPageRewrite = message.toLowerCase().includes('entire sales page') ||
                            message.toLowerCase().includes('full sales page') ||
                            message.toLowerCase().includes('whole sales page') ||
                            message.toLowerCase().includes('complete sales page')
    
    console.log('[AI-STRATEGIST-FIXED] Request data:', {
      user_id,
      message: message?.substring(0, 50) + '...',
      has_website_intelligence: !!website_intelligence
    })

    // Handle website intelligence if available
    if (website_intelligence && website_intelligence.analysis) {
      console.log('[AI-STRATEGIST-FIXED] Using website intelligence for specific insights')
      
      let systemPrompt = `RUTH'S SALES PAGE CONTENT:
Headlines: ${JSON.stringify(website_intelligence.analysis.extractedMessaging?.headlines || [])}
CTAs: ${JSON.stringify(website_intelligence.analysis.extractedMessaging?.callsToAction || [])}
Page content: ${website_intelligence.analysis.competitivePositioning?.substring(0, 400) || 'Not found'}

FORBIDDEN FORMATTING: No asterisks, no bullet points, no numbered lists, no bold text. Just raw conversational paragraphs.`
      
      if (personality === 'savage') {
        systemPrompt += `

DESCRIPTIVE ANALYSIS MODE - FLY-ON-THE-WALL NEUTRAL OBSERVER:

${isRewriteRequest || isFullPageRewrite ? 
          'Ruth wants REWRITES. Provide exact copy alternatives without commentary.' :
          'Your job is to be a neutral, factual observer describing what you see. No compliments, no criticism - just descriptive observations. Paint precise pictures of the reader\'s current reality without emotion or judgment. Headlines should be 6-12 words max, punchy benefits. CTAs should be 2-4 words max, button text. Body copy is where you describe the detailed reality. Describe what is, not what should be. Be factual and descriptive like a documentary narrator.'}

End with: "These observations are based on current copy elements."`
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