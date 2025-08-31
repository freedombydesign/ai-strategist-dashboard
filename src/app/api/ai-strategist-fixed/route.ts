import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    console.log('[AI-STRATEGIST-FIXED] API called')
    
    const requestBody = await request.json()
    const { user_id, message, website_intelligence } = requestBody
    
    console.log('[AI-STRATEGIST-FIXED] Request data:', {
      user_id,
      message: message?.substring(0, 50) + '...',
      has_website_intelligence: !!website_intelligence
    })

    // Handle website intelligence if available
    if (website_intelligence && website_intelligence.analysis) {
      console.log('[AI-STRATEGIST-FIXED] Using website intelligence for specific insights')
      
      const systemPrompt = `I'm analyzing Ruth's sales page. I need to be SUPER SPECIFIC about her actual content.

RUTH'S ACTUAL CONTENT:
Headlines: ${JSON.stringify(website_intelligence.analysis.extractedMessaging?.headlines || [])}
CTAs: ${JSON.stringify(website_intelligence.analysis.extractedMessaging?.callsToAction || [])}
Page content: ${website_intelligence.analysis.competitivePositioning?.substring(0, 400) || 'Not found'}

I'm going to quote Ruth's EXACT words and give her insights about specific phrases she chose. Like:

"Ruth, when you say 'Remove Yourself Without Revenue Dipping' - that word 'remove' is doing something interesting..."

or

"Your CTA 'GET INSTANT ACCESS TO FREEDOM BY DESIGN' - the phrase 'instant access' creates urgency, but 'Freedom by Design' might be too abstract..."

or 

"I see you wrote 'A buyer-led sales engine so you stop doing calls' - that phrase 'buyer-led' is smart because..."

I need to reference her SPECIFIC copy, not just general concepts. Talk like I'm looking at her page right now and pointing to exact words and phrases.

NO generic advice. Only insights about HER specific word choices and copy.`

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        max_tokens: 1000,
        temperature: 0.7,
      })

      const aiResponse = completion.choices[0]?.message?.content || 'I apologize, but I encountered an error processing your request.'
      
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
          content: `I'm talking to Ruth about her sales page. I need to sound human, not like ChatGPT. NO NUMBERED LISTS. NO ASTERISKS. NO BULLET POINTS. Just normal conversation.` 
        },
        { role: 'user', content: message }
      ],
      max_tokens: 800,
      temperature: 0.7,
    })

    const aiResponse = completion.choices[0]?.message?.content || 'I apologize, but I encountered an error processing your request.'
    
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