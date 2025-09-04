import { NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

export async function POST() {
  try {
    console.log('[UPDATE-REAL-DECISION-CALL] Adding Ruth\'s ACTUAL Decision Call Structure...')
    
    const realDecisionCallContent = `RUTH'S ACTUAL DECISION CALL STRUCTURE:

This is a voice or conversation framework designed for decision-based sales calls—not discovery calls. By the time someone reaches this point, they've already gone through your screening and pre-sell process. This structure affirms their fit and supports them in making a final aligned decision.

PRE-CALL MINDSET:
You've already pre-qualified this person. You're not here to diagnose or pitch—you're here to confirm mutual fit and walk them through any final decision points.

1. OPEN WITH CERTAINTY AND CALM:
"Hey [Name], so glad to connect. Based on everything you shared in your [application/evaluation], I can already see a strong fit."

2. REAFFIRM THEIR VISION:
"Before we go any further, I'd love to hear—what feels most aligned or exciting about this next step for you?"

3. CONFIRM READINESS (NOT PITCHING):
"Everything you've shared lines up with what [Offer] is built for. From your intake, it's clear that [insert key result or need] is the priority right now. Does that still feel true for you?"

4. ADDRESS ANY HESITATIONS:
"I want to make sure this feels completely aligned. Is there anything coming up for you that we should talk through?"

5. AFFIRM THE FIT:
"Based on everything we've covered, this feels like a perfect match. How does it feel for you?"

6. GUIDE TO DECISION:
"Great! So the next step would be [specific next action]. Does that timeline work for you?"

KEY PRINCIPLES:
- This is NOT a sales call—it's a decision call
- They're already qualified and interested
- Your role is to confirm fit and guide the decision
- Use certainty in your language, not persuasion
- Address hesitations, don't overcome objections
- Support their decision-making process

Resource: https://docs.google.com/document/d/1sbyaaiisR91XEeXGooAQ9xVo0e2iyTFg/edit?usp=sharing`

    // Update with the REAL Decision Call Structure content
    const { data, error } = await supabase
      .from('template_library')
      .update({ 
        description: realDecisionCallContent
      })
      .eq('template_name', 'Decision Call Structure')
      .select()
    
    if (error) {
      console.error('[UPDATE-REAL-DECISION-CALL] Update error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    console.log('[UPDATE-REAL-DECISION-CALL] Template updated with REAL Decision Call Structure')
    
    return NextResponse.json({
      success: true,
      message: 'Decision Call Structure updated with Ruth\'s ACTUAL 6-step framework',
      updated_template: data[0]
    })
    
  } catch (error) {
    console.error('[UPDATE-REAL-DECISION-CALL] Error:', error)
    return NextResponse.json({
      error: 'Failed to update template',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}