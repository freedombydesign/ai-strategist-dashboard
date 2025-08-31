import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    console.log('[AI-STRATEGIST-FIXED] API called')
    
    const requestBody = await request.json()
    const { user_id, message, website_intelligence, personality } = requestBody
    
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

Ruth's personality setting: ${personality || 'strategic'}

${personality === 'savage' ? `
I need to be SAVAGE and BRUTAL about Ruth's copy choices. No holding back - real critiques that sting but help.

Examples of SAVAGE mode:
"Ruth, 'Remove Yourself' makes you sound like a tumor. Nobody wants to be 'removed' from their business."
"'Everything Falling Apart' - you're literally selling panic. This creates anxiety, not desire."  
"'Freedom by Design' is meaningless word salad. What does this actually mean? Your prospects have no clue."
"'This isn't for beginners' - lazy guru speak. Every coach says this boring shit."

Be ruthlessly direct about what's wrong and why it's killing her conversions. No sugar-coating.
` : `
I need to analyze Ruth's copy with the ${personality || 'strategic'} personality approach while being specific about her actual content.
`}

Point out exactly WHERE her copy is failing and WHY it's costing her money.`

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
          content: `${personality === 'savage' ? 
            'I need to be SAVAGE about Ruth\'s copy. Brutally honest, no holding back. Call out exactly what\'s wrong and why it\'s killing her conversions.' : 
            `I need to give Ruth ${personality || 'strategic'} feedback about her sales copy while being specific about her actual content.`
          }` 
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