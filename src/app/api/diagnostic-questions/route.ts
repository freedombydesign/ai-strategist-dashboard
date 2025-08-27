import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

const DIAGNOSTIC_QUESTIONS = [
  {
    order_index: 1,
    category: 'M1',
    question_text: 'How clear is your unique value proposition to potential customers?'
  },
  {
    order_index: 2,
    category: 'M1', 
    question_text: 'How well does your pricing reflect the value you deliver?'
  },
  {
    order_index: 3,
    category: 'M3',
    question_text: 'How systematized are your core business processes?'
  },
  {
    order_index: 4,
    category: 'M3',
    question_text: 'How effectively do you track and measure business performance?'
  },
  {
    order_index: 5,
    category: 'M2',
    question_text: 'How smooth is your customer journey from awareness to purchase?'
  },
  {
    order_index: 6,
    category: 'M2',
    question_text: 'How effective is your lead generation and nurturing process?'
  },
  {
    order_index: 7,
    category: 'M4',
    question_text: 'How consistent and predictable is your sales process?'
  },
  {
    order_index: 8,
    category: 'M4',
    question_text: 'How well do you convert qualified leads into paying customers?'
  },
  {
    order_index: 9,
    category: 'M6',
    question_text: 'How regularly do you review and optimize your business processes?'
  },
  {
    order_index: 10,
    category: 'M5',
    question_text: 'How efficiently do you deliver your product/service to customers?'
  },
  {
    order_index: 11,
    category: 'M5',
    question_text: 'How satisfied are your customers with their overall experience?'
  },
  {
    order_index: 12,
    category: 'M6',
    question_text: 'How quickly do you identify and resolve business bottlenecks?'
  }
]

export async function GET(request: NextRequest) {
  try {
    console.log('[DIAGNOSTIC-QUESTIONS] Fetching diagnostic questions...')
    
    // First try to get existing questions
    const { data: existingQuestions, error: fetchError } = await supabase
      .from('freedom_diagnostic_questions')
      .select('*')
      .order('order_index')
      .limit(12)

    if (fetchError) {
      console.error('[DIAGNOSTIC-QUESTIONS] Error fetching questions:', fetchError)
      
      // If table doesn't exist or has issues, try to seed it
      console.log('[DIAGNOSTIC-QUESTIONS] Attempting to seed questions...')
      const { data: seededQuestions, error: seedError } = await supabase
        .from('freedom_diagnostic_questions')
        .upsert(DIAGNOSTIC_QUESTIONS, { 
          onConflict: 'order_index',
          ignoreDuplicates: false 
        })
        .select()

      if (seedError) {
        console.error('[DIAGNOSTIC-QUESTIONS] Seed error:', seedError)
        return NextResponse.json({ 
          error: 'Failed to create diagnostic questions',
          details: seedError.message 
        }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        questions: DIAGNOSTIC_QUESTIONS,
        message: 'Questions seeded successfully'
      })
    }

    // If we have questions but not 12, seed the missing ones
    if (!existingQuestions || existingQuestions.length < 12) {
      console.log(`[DIAGNOSTIC-QUESTIONS] Found ${existingQuestions?.length || 0} questions, seeding all 12...`)
      
      const { data: seededQuestions, error: seedError } = await supabase
        .from('freedom_diagnostic_questions')
        .upsert(DIAGNOSTIC_QUESTIONS, { 
          onConflict: 'order_index',
          ignoreDuplicates: false 
        })
        .select()
        .order('order_index')

      if (seedError) {
        console.error('[DIAGNOSTIC-QUESTIONS] Seed error:', seedError)
        return NextResponse.json({ 
          error: 'Failed to seed diagnostic questions',
          details: seedError.message 
        }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        questions: seededQuestions || DIAGNOSTIC_QUESTIONS,
        message: `Seeded ${DIAGNOSTIC_QUESTIONS.length} questions`
      })
    }

    // Return existing questions
    console.log(`[DIAGNOSTIC-QUESTIONS] Returning ${existingQuestions.length} existing questions`)
    return NextResponse.json({
      success: true,
      questions: existingQuestions
    })

  } catch (error) {
    console.error('[DIAGNOSTIC-QUESTIONS] Unexpected error:', error)
    return NextResponse.json({
      error: 'Failed to load diagnostic questions',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// POST method to manually seed questions if needed
export async function POST(request: NextRequest) {
  try {
    console.log('[DIAGNOSTIC-QUESTIONS] Manual seeding requested...')
    
    const { data, error } = await supabase
      .from('freedom_diagnostic_questions')
      .upsert(DIAGNOSTIC_QUESTIONS, { 
        onConflict: 'order_index',
        ignoreDuplicates: false 
      })
      .select()

    if (error) {
      console.error('[DIAGNOSTIC-QUESTIONS] Manual seed error:', error)
      return NextResponse.json({ 
        error: 'Failed to seed questions',
        details: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      questions: data,
      message: `Successfully seeded ${DIAGNOSTIC_QUESTIONS.length} questions`
    })

  } catch (error) {
    console.error('[DIAGNOSTIC-QUESTIONS] Manual seed error:', error)
    return NextResponse.json({
      error: 'Failed to manually seed questions',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}