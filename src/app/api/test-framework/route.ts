import { NextResponse } from 'next/server'
import { getFrameworkContext } from '../../../lib/strategicFrameworks'

export async function GET() {
  try {
    console.log('[TEST-FRAMEWORK] Testing Decision Call Structure detection...')
    
    const frameworkContext = await getFrameworkContext(
      "Help me create a sales script based on the decision call structure"
    )
    
    console.log('[TEST-FRAMEWORK] Framework context result:', {
      strategicGuidanceCount: frameworkContext.strategicGuidance.length,
      guidanceTitles: frameworkContext.strategicGuidance.map(g => g.title),
      hasDecisionCallStructure: frameworkContext.strategicGuidance.some(g => 
        g.title?.toLowerCase().includes('decision call structure')
      )
    })
    
    return NextResponse.json({
      success: true,
      frameworkContext,
      decisionCallFound: frameworkContext.strategicGuidance.some(g => 
        g.title?.toLowerCase().includes('decision call structure')
      )
    })
    
  } catch (error) {
    console.error('[TEST-FRAMEWORK] Error:', error)
    return NextResponse.json({
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}