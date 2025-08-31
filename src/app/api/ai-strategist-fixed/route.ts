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
      
      const systemPrompt = `You are Ruth's AI Business Strategist. You have detailed analysis of Ruth's website: ${website_intelligence.website_url}

ACTUAL WEBSITE ANALYSIS DATA:
${JSON.stringify(website_intelligence.analysis, null, 2)}

Based on this ACTUAL analysis of Ruth's website, provide specific, actionable insights. Use the real data from the analysis to give concrete findings, not generic advice. 

For example:
- "I found only ${website_intelligence.analysis.socialProofElements?.length || 0} social proof elements on your page"
- "Your page structure analysis shows missing: ${JSON.stringify(website_intelligence.analysis.pageStructureAnalysis?.missingElements || [])}"
- "I identified ${website_intelligence.analysis.messagingGaps?.problemStatements?.length || 0} messaging gaps"

Be specific and reference the actual data.`

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
        message: aiResponse,
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
          content: `You are Ruth's AI Business Strategist. Provide helpful business strategy advice.` 
        },
        { role: 'user', content: message }
      ],
      max_tokens: 800,
      temperature: 0.7,
    })

    const aiResponse = completion.choices[0]?.message?.content || 'I apologize, but I encountered an error processing your request.'
    
    console.log('[AI-STRATEGIST-FIXED] General response generated, length:', aiResponse.length)
    
    return NextResponse.json({
      message: aiResponse,
      error: undefined
    })
    
  } catch (error) {
    console.error('[AI-STRATEGIST-FIXED] Error:', error)
    
    return NextResponse.json({
      message: 'I apologize, but I encountered an error processing your request. Please try again.',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}