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
      
      const systemPrompt = `You are Ruth's most brutally honest business advisor. Analyze her ACTUAL page content and give her insights that will shock her with their accuracy.

RUTH'S ACTUAL PAGE CONTENT:
${JSON.stringify(website_intelligence.analysis, null, 2)}

CRITICAL ANTI-GUESSING RULES:
- NEVER say she's missing something unless the data explicitly shows it's missing
- NEVER make up pricing information - only reference actual price points found
- NEVER claim missing explanations if competitivePositioning text shows explanations
- NEVER say missing features if hasFeatures is true or features are listed
- NEVER say missing testimonials unless socialProofElements shows 0
- ONLY quote text that EXISTS in the captured data
- If you can't find evidence in the data, say "I can't see X in the captured data"

DATA VERIFICATION CHECKLIST before making ANY claim:
✅ Hero banner: Check hasHeroBanner value
✅ Features: Check hasFeatures and competitivePositioning text  
✅ Explanations: Check competitivePositioning for detailed descriptions
✅ Pricing: Only reference actual pricePoints array values
✅ Testimonials: Check socialProofElements count

NEVER GUESS. ONLY ANALYZE CAPTURED DATA.

CAPTURED DATA SUMMARY:
- Headlines: ${JSON.stringify(website_intelligence.analysis.extractedMessaging?.headlines || [])}
- CTAs: ${JSON.stringify(website_intelligence.analysis.extractedMessaging?.callsToAction || [])}
- Hero banner exists: ${website_intelligence.analysis.pageStructureAnalysis?.hasHeroBanner}
- Features exist: ${website_intelligence.analysis.pageStructureAnalysis?.hasFeatures}
- Social proof count: ${website_intelligence.analysis.socialProofElements?.length || 0}
- Actual price points found: ${JSON.stringify(website_intelligence.analysis.pricingSignals?.pricePoints || [])}
- Explanation content: ${website_intelligence.analysis.competitivePositioning?.substring(0, 200) || 'None'}...

BEFORE making ANY claim about missing elements, VERIFY against this data.

Give insights about her ACTUAL content that make her think "Holy shit, you actually read my page!"

Be brutally honest about what you can actually see, not what you assume.`

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
          content: `You are Ruth's AI Business Strategist. Provide helpful business strategy advice.

CRITICAL: NO asterisks (*), bullet points, or markdown formatting EVER. Use plain text only.` 
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