import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Post-processing function to remove all formatting and add solutions
function removeFormattingAndAddSolutions(text: string): string {
  // Remove numbered lists (1., 2), 3-)
  let cleaned = text.replace(/^\s*\d+[\.\)\-]\s*/gm, '')
  
  // Remove bullet points (*, -, •)
  cleaned = cleaned.replace(/^\s*[\*\-\u2022]\s*/gm, '')
  
  // Remove bold formatting (**text**) - more aggressive approach
  cleaned = cleaned.replace(/\*\*(.*?)\*\*/g, '$1')
  cleaned = cleaned.replace(/\*([^*]+)\*/g, '$1')
  
  // Remove any remaining asterisks used for emphasis
  cleaned = cleaned.replace(/\*/g, '')
  
  // Clean up section headers that use colons or dashes
  cleaned = cleaned.replace(/^\s*\d+\.\s*\*\*(.*?)\*\*\s*[-:]?\s*/gm, '$1: ')
  
  // Use ChatGPT's grouped paragraph approach
  // Step 1: split by double newlines = paragraph boundaries
  const rawParagraphs = cleaned.split(/\n\s*\n/)
  const grouped = []
  
  for (const para of rawParagraphs) {
    // collapse line breaks inside a paragraph
    const lines = para.split('\n').map(line => line.trim()).filter(line => line.length > 0)
    if (lines.length > 0) {
      grouped.push(lines.join(' '))
    }
  }
  
  // Step 2: re-join paragraphs with double newlines
  let result = grouped.join('\n\n')
  
  // Step 3: Force paragraph breaks - split every 2-3 sentences regardless
  const sentences = result.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0)
  let paragraphs = []
  
  for (let i = 0; i < sentences.length; i += 2) {
    // Take 2-3 sentences at a time
    let paragraphSentences = []
    let maxSentences = 2
    
    // Check if next sentence starts with transition word - if so, take 3 sentences
    if (sentences[i + 2] && /^(However|First|Another|Also|Moving|Your|The|Consider|Instead|Lastly|Finally|Next)/i.test(sentences[i + 2])) {
      maxSentences = 3
    }
    
    for (let j = 0; j < maxSentences && (i + j) < sentences.length; j++) {
      paragraphSentences.push(sentences[i + j])
    }
    
    if (paragraphSentences.length > 0) {
      paragraphs.push(paragraphSentences.join(' '))
    }
  }
  
  result = paragraphs.join('\n\n')
  
  // Clean up spacing
  result = result.replace(/\s+/g, ' ')
  result = result.replace(/\s+([,.!?;:])/g, '$1')
  result = result.replace(/\n{3,}/g, '\n\n')
  
  // Add solution prompt if it's critique without solutions
  if (!result.toLowerCase().includes('try') && !result.toLowerCase().includes('instead') && 
      !result.toLowerCase().includes('rewrite') && !result.toLowerCase().includes('consider')) {
    result += '\n\nWant me to rewrite these sections with copy that actually converts? I can turn this weak messaging into something that drives sales.'
  }
  
  return result.trim()
}

export async function POST(request: NextRequest) {
  try {
    console.log('[AI-STRATEGIST-FIXED] API called')
    
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
      
      const systemPrompt = `I'm analyzing Ruth's sales page. I need to provide HIGH-QUALITY, INSIGHTFUL feedback that actually helps, not nitpicky critiques of strong copy.

RUTH'S ACTUAL CONTENT:
Headlines: ${JSON.stringify(website_intelligence.analysis.extractedMessaging?.headlines || [])}
CTAs: ${JSON.stringify(website_intelligence.analysis.extractedMessaging?.callsToAction || [])}
Page content: ${website_intelligence.analysis.competitivePositioning?.substring(0, 400) || 'Not found'}

QUALITY ANALYSIS REQUIREMENTS:
- Ruth's sales page is sophisticated direct response copy - recognize what's working before critiquing
- Her headline uses proven direct response structure (desire + objection handling)
- Her copy shows professional sophistication - don't attack strong elements just to be savage  
- Only critique what's genuinely hurting conversions, not stylistic preferences
- True savage feedback acknowledges what works and brutally calls out what doesn't
- Focus on real conversion gaps, not imaginary problems

ABSOLUTE FORMATTING REQUIREMENTS - NO EXCEPTIONS:
You are FORBIDDEN from using any of these formatting elements:
- NO asterisks (*) anywhere in your response
- NO numbered lists (1. 2. 3. etc.)
- NO bullet points or dashes (- •)  
- NO bold formatting (**text**)
- NO section headers or titles
Write ONLY in natural conversational paragraphs like you're talking to a friend
Always provide specific solutions and alternatives
Always offer to rewrite problematic sections

${personality === 'savage' ? `
SAVAGE MODE: ${isRewriteRequest || isFullPageRewrite ? 
  (isFullPageRewrite ? 
    'Ruth asked for a FULL PAGE REWRITE! Provide a complete rewritten sales page with new headlines, subheadlines, body copy, CTAs, and benefit statements. Structure it as a complete sales page, not just suggestions.' :
    'Ruth asked for rewrites! Provide ACTUAL rewritten copy sections, not just critiques. Give her the exact headlines, CTAs, and body copy she should use instead. Be specific with word-for-word alternatives.'
  ) :
  'SAVAGE MODE MISSION: Describe EXACT brutal reality without blame or shame. No cheerleader "empowering" words or consultant speak. Paint the precise picture of what their life looks like RIGHT NOW. Instead of "you can\'t let go of control" say "you\'re up at midnight double-checking your team\'s work because you don\'t trust they\'ll deliver correctly." Raw descriptive truth that makes them go "holy shit, that\'s exactly me." No fluff, no judgment - just brutal accuracy that makes them feel SEEN. When Ruth\'s copy is good, make it more descriptively savage.'
}

${isRewriteRequest || isFullPageRewrite ? 
  (isFullPageRewrite ?
    'Format as a COMPLETE SALES PAGE with sections clearly labeled: HEADLINE, SUBHEADLINE, OPENING, BENEFITS, CTAs, CLOSING, etc.' :
    'Format like: "Here\'s your rewritten headline: [EXACT NEW HEADLINE]. Here\'s your new CTA: [EXACT NEW CTA]. Here\'s the rewritten section: [EXACT NEW COPY]"'
  ) :
  'Example brutal descriptive truth: "Ruth, your headline works but let\'s make it more descriptively savage. Instead of \'Remove Yourself\' - try \'You Check Slack at 11 PM Because You Can\'t Trust Your Business to Run Without You\' or \'Your Phone Buzzes During Family Dinner Because Your Team Needs Approval for Everything.\' Raw truth that makes them think \'Fuck, that\'s exactly my life.\' No fluff words, just brutal reality they recognize."'
}

${isRewriteRequest ? '' : 'Always end with savage energy: "Want me to turn up the SAVAGE on this copy?" or "Ready to inject some real attitude into this section?"'}
` : personality === 'strategic' ? `
STRATEGIC MODE: Focus on business impact, ROI, and competitive positioning. Identify what's costing money and provide data-driven solutions.

Example approach: "Your headline 'Remove Yourself' is costing you conversions because it frames business ownership negatively. Strategic alternative: 'Scale Beyond Your Personal Capacity' positions growth as the goal."

Always end with: "I can provide a complete strategic rewrite that positions you as the growth solution, not the escape route."
` : personality === 'creative' ? `
CREATIVE MODE: Focus on emotional engagement, storytelling, and compelling messaging. Make copy more vivid and engaging.

Example approach: "Your copy lacks emotional punch. Instead of 'Remove Yourself,' paint a picture: 'Imagine sipping coffee on a Tuesday morning while your business runs smoothly without a single phone call from your team.'"

Always end with: "I can rewrite this with engaging stories and emotional hooks that make prospects feel the transformation."
` : personality === 'analytical' ? `
ANALYTICAL MODE: Focus on conversion data, user psychology, and testing opportunities. Identify what elements hurt performance.

Example approach: "Your headline 'Remove Yourself' likely reduces click-through rates because it triggers loss aversion. Testing shows aspirational headlines like 'Build Your Dream Business' outperform escape-focused messaging by 23%."

Always end with: "I can rewrite this with conversion-optimized copy and suggest A/B tests to validate improvements."
` : `
SUPPORTIVE MODE: Provide gentle but honest feedback with encouragement. Focus on what's working and how to improve what isn't.

Example approach: "I love your passion for helping business owners! Your 'Remove Yourself' headline might be pushing away people who actually enjoy their work but need better systems. Consider 'Build a Business That Thrives Without You' - it maintains the freedom benefit while honoring their love for what they do."

Always end with: "I'd be happy to help you rewrite sections to keep your authentic voice while improving clarity and appeal."
`}

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
            'SAVAGE MODE: Describe brutal reality with zero fluff or cheerleader words. Paint the exact picture of their life RIGHT NOW. No "empowering" consultant speak like "Ready to Break Free!" Instead use raw descriptive truth: "You\'re checking emails during your kid\'s soccer game because you can\'t trust your team." Make them think "holy shit, that\'s exactly me." Brutal accuracy, not judgment.' : 
            personality === 'strategic' ? 
            'STRATEGIC MODE: Focus on business impact and ROI. Identify what\'s costing money and provide data-driven solutions. Write in natural paragraphs and always offer strategic rewrites.' :
            personality === 'creative' ? 
            'CREATIVE MODE: Focus on emotional engagement and compelling messaging. Make copy more vivid and engaging. Write in natural paragraphs and always offer creative rewrites with stories and emotional hooks.' :
            personality === 'analytical' ? 
            'ANALYTICAL MODE: Focus on conversion data and user psychology. Identify performance issues and testing opportunities. Write in natural paragraphs and always offer conversion-optimized rewrites.' :
            'SUPPORTIVE MODE: Provide gentle but honest feedback with encouragement. Focus on what works and how to improve. Write in natural paragraphs and always offer supportive rewrites that maintain authenticity.'
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