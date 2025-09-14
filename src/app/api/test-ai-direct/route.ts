import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { getFrameworkContext } from '../../../lib/strategicFrameworks'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function GET() {
  try {
    console.log('[TEST-AI-DIRECT] Testing AI with Decision Call Structure...')
    
    const message = "Help me create a sales script based on the decision call structure"
    
    // Get framework context
    const frameworkContext = await getFrameworkContext(message)
    console.log('[TEST-AI-DIRECT] Framework context:', {
      strategicGuidanceCount: frameworkContext.strategicGuidance.length,
      guidanceTitles: frameworkContext.strategicGuidance.map(g => g.title),
      hasDecisionCall: frameworkContext.strategicGuidance.some(g => 
        g.title?.toLowerCase().includes('decision call structure')
      )
    })
    
    // Check if Decision Call Structure is found
    const hasDecisionCallStructure = frameworkContext.strategicGuidance.some(g => 
      g.title?.toLowerCase().includes('decision call structure') && g.content?.includes('https://docs.google.com')
    )
    
    const prompt = hasDecisionCallStructure ? 
      `🎯 DECISION CALL STRUCTURE TEMPLATE FOUND:
Ruth's specific Decision Call Structure framework is available! Use this template: "How to lead sales calls with an evaluation approach from module four". 

Full resource available at: https://docs.google.com/document/d/1sbyaaiisR91XEeXGooAQ9xVo0e2iyTFg/edit?usp=sharing

Create a sales script using Ruth's specific Decision Call Structure methodology. Reference the Google Doc link.` :
      `Create a generic sales script.`
    
    console.log('[TEST-AI-DIRECT] Using prompt with Decision Call Structure:', hasDecisionCallStructure)
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are Ruth's AI business strategist. Use her specific frameworks and methodologies."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.7
    })
    
    const aiResponse = response.choices[0]?.message?.content || "No response"
    
    return NextResponse.json({
      success: true,
      hasDecisionCallStructure,
      frameworkContext: {
        strategicGuidanceCount: frameworkContext.strategicGuidance.length,
        guidanceTitles: frameworkContext.strategicGuidance.map(g => g.title)
      },
      aiResponse: aiResponse.substring(0, 500) + "...",
      fullResponse: aiResponse
    })
    
  } catch (error) {
    console.error('[TEST-AI-DIRECT] Error:', error)
    return NextResponse.json({
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}