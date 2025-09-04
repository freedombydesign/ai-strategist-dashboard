import { NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

export async function POST() {
  try {
    console.log('[UPDATE-DECISION-CALL] Adding Decision Call Structure content...')
    
    const decisionCallContent = `RUTH'S DECISION CALL STRUCTURE (Module 4):

EVALUATION APPROACH - Lead with qualification, not pitching:

1. OPENING (First 2 minutes):
   - Pattern interrupt: "I help [specific type] of business owners who are [specific challenge]"
   - Purpose: "I'm calling to see if we'd be a good fit to work together"
   - Permission: "Do you have a few minutes to explore this?"

2. QUALIFICATION PHASE (5-10 minutes):
   - Current situation discovery
   - Problem identification and impact
   - Previous solution attempts
   - Decision-making authority
   - Budget and timeline reality

3. EVALUATION CRITERIA (3-5 minutes):
   - What would ideal solution look like?
   - Success metrics definition
   - Implementation timeline
   - Investment parameters

4. DECISION PROCESS (2-3 minutes):
   - If this seems like a fit, next steps would be...
   - Timeline for decision
   - Any other stakeholders involved?

5. CLOSE WITH EVALUATION:
   - Based on our conversation, it sounds like [summary]
   - From my perspective, [fit assessment]
   - What are your thoughts?

KEY PRINCIPLES:
- Lead with questions, not features
- Qualify before you present
- Position as evaluation, not sales
- Create mutual decision criteria
- End with next steps, not pressure

Resource: https://docs.google.com/document/d/1sbyaaiisR91XEeXGooAQ9xVo0e2iyTFg/edit?usp=sharing`

    // Update the Decision Call Structure template with the actual content
    const { data, error } = await supabase
      .from('template_library')
      .update({ 
        description: decisionCallContent
      })
      .eq('template_name', 'Decision Call Structure')
      .select()
    
    if (error) {
      console.error('[UPDATE-DECISION-CALL] Update error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    console.log('[UPDATE-DECISION-CALL] Template updated successfully with full content')
    
    return NextResponse.json({
      success: true,
      message: 'Decision Call Structure template updated with full methodology content',
      updated_template: data[0]
    })
    
  } catch (error) {
    console.error('[UPDATE-DECISION-CALL] Error:', error)
    return NextResponse.json({
      error: 'Failed to update template',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}