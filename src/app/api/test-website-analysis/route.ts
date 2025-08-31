import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    console.log('[TEST-ANALYSIS] Starting test analysis...')
    
    const requestBody = await request.json()
    const { user_id, message, website_intelligence, freedom_score, file_context, user_name, personality, completed_tasks, is_fresh_start } = requestBody
    
    console.log('[TEST-ANALYSIS] Received data:', {
      user_id,
      message,
      has_website_intelligence: !!website_intelligence,
      website_url: website_intelligence?.website_url
    })
    
    if (!website_intelligence || !website_intelligence.analysis) {
      return NextResponse.json({
        message: "No website analysis data provided. Please analyze your website first.",
        error: "missing_analysis"
      })
    }
    
    console.log('[TEST-ANALYSIS] Analysis keys:', Object.keys(website_intelligence.analysis))
    
    // Create a focused system prompt with the actual analysis data
    const systemPrompt = `You are Ruth's AI Business Strategist. You have detailed analysis of Ruth's website: ${website_intelligence.website_url}

ACTUAL WEBSITE ANALYSIS DATA:
${JSON.stringify(website_intelligence.analysis, null, 2)}

Based on this ACTUAL analysis of Ruth's website, provide specific, actionable insights. Use the real data from the analysis to give concrete findings, not generic advice.

For example, instead of "You might need testimonials" say "I found only ${website_intelligence.analysis.socialProofElements?.length || 0} social proof elements on your page" or "Your page structure analysis shows: ${JSON.stringify(website_intelligence.analysis.pageStructureAnalysis?.missingElements || []).slice(0, 100)}"

Be specific and reference the actual data.`

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: message }
    ]

    console.log('[TEST-ANALYSIS] Calling OpenAI...')
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      max_tokens: 1000,
      temperature: 0.7,
    })

    const aiResponse = completion.choices[0]?.message?.content || 'Sorry, I could not analyze your website.'
    
    console.log('[TEST-ANALYSIS] OpenAI response length:', aiResponse.length)
    
    return NextResponse.json({
      message: aiResponse,
      error: undefined,
      has_reply: true,
      reply_preview: aiResponse.substring(0, 100) + "..."
    })
    
  } catch (error) {
    console.error('[TEST-ANALYSIS] Error:', error)
    return NextResponse.json({
      message: 'Test analysis failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      success: false
    }, { status: 500 })
  }
}