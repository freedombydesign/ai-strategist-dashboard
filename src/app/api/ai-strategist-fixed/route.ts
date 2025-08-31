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
  
  // Split into sentences and create natural paragraph breaks
  const sentences = cleaned.split(/(?<=[.!?])\s+/)
  let result = ''
  let currentParagraph = ''
  let sentenceCount = 0
  
  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim()
    if (!trimmedSentence) continue
    
    currentParagraph += trimmedSentence + ' '
    sentenceCount++
    
    // Create paragraph break after 2-3 sentences or when we hit certain patterns
    if (sentenceCount >= 2 && (
      trimmedSentence.includes('Instead') ||
      trimmedSentence.includes('Try') ||
      trimmedSentence.includes('Consider') ||
      trimmedSentence.includes('Your CTAs') ||
      trimmedSentence.includes('The page content') ||
      trimmedSentence.includes('There\'s also') ||
      sentenceCount >= 3
    )) {
      result += currentParagraph.trim() + '\n\n'
      currentParagraph = ''
      sentenceCount = 0
    }
  }
  
  // Add remaining content
  if (currentParagraph.trim()) {
    result += currentParagraph.trim()
  }
  
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
- Only critique copy that's genuinely weak or unclear
- Recognize when copy is actually working well (like Ruth's sales page which clearly shows sophistication)
- Focus on real conversion issues, not stylistic preferences
- If the copy is strong, acknowledge what's working and suggest refinements, not overhauls
- Avoid generic guru-speak critiques that don't apply to sophisticated copy

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
SAVAGE MODE: ${isRewriteRequest ? 
  'Ruth asked for rewrites! Provide ACTUAL rewritten copy sections, not just critiques. Give her the exact headlines, CTAs, and body copy she should use instead. Be specific with word-for-word alternatives.' :
  'Be brutally honest about what\'s genuinely wrong, but recognize that Ruth\'s copy shows sophistication. Don\'t critique strong elements just for the sake of being savage. Focus on real conversion issues that are costing money, not stylistic preferences.'
}

${isRewriteRequest ? 
  'Format like: "Here\'s your rewritten headline: [EXACT NEW HEADLINE]. Here\'s your new CTA: [EXACT NEW CTA]. Here\'s the rewritten section: [EXACT NEW COPY]"' :
  'Example approach: "Ruth, \'Remove Yourself\' makes you sound like a tumor. Try \'Step Back From Day-to-Day Operations\' instead."'
}

${isRewriteRequest ? '' : 'Always end with: "Want me to rewrite this entire section for you?"'}
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
            'SAVAGE MODE: Be brutally honest about Ruth\'s copy. Call out exactly what\'s wrong, why it\'s killing conversions, then provide SPECIFIC solutions and rewrites. Write like a brutal friend who cares about results.' : 
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