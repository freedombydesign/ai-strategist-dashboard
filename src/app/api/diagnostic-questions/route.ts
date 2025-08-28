import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

const DIAGNOSTIC_QUESTIONS = [
  {
    order_index: 1,
    category: 'M1',
    question_text: 'I have a clear process for generating consistent leads'
  },
  {
    order_index: 2,
    category: 'M1', 
    question_text: 'I can take time off without my business collapsing'
  },
  {
    order_index: 3,
    category: 'M3',
    question_text: 'I have systems that help me efficiently qualify potential clients'
  },
  {
    order_index: 4,
    category: 'M3',
    question_text: 'My team can handle most client requests without my involvement'
  },
  {
    order_index: 5,
    category: 'M2',
    question_text: 'I have a clear pricing strategy that feels good to me and clients'
  },
  {
    order_index: 6,
    category: 'M2',
    question_text: 'I consistently hit my revenue targets with ease'
  },
  {
    order_index: 7,
    category: 'M4',
    question_text: 'I have a documented process for onboarding new clients'
  },
  {
    order_index: 8,
    category: 'M4',
    question_text: 'I have clear systems for managing client expectations'
  },
  {
    order_index: 9,
    category: 'M6',
    question_text: 'I regularly review and improve my business processes'
  },
  {
    order_index: 10,
    category: 'M5',
    question_text: 'I can deliver quality work without being personally involved in every detail'
  },
  {
    order_index: 11,
    category: 'M5',
    question_text: 'My clients are consistently satisfied with the value they receive'
  },
  {
    order_index: 12,
    category: 'M6',
    question_text: 'I have processes in place for continuous improvement and growth'
  }
]

export async function GET(request: NextRequest) {
  try {
    console.log('[DIAGNOSTIC-QUESTIONS] Fetching diagnostic questions...')
    
    // For now, just return the hardcoded questions to get the site working
    // We can fix the database integration later
    const questionsWithIds = DIAGNOSTIC_QUESTIONS.map(q => ({
      id: q.order_index,
      ...q,
      created_at: new Date().toISOString()
    }))
    
    console.log(`[DIAGNOSTIC-QUESTIONS] Returning ${questionsWithIds.length} hardcoded questions`)
    return NextResponse.json({
      success: true,
      questions: questionsWithIds,
      message: 'Using hardcoded questions for now'
    })

    // TODO: Uncomment this database logic once tables are properly set up
    /*
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
        // Fall back to hardcoded questions
        return NextResponse.json({
          success: true,
          questions: questionsWithIds,
          message: 'Using fallback questions due to database error'
        })
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
        // Fall back to hardcoded questions
        return NextResponse.json({
          success: true,
          questions: questionsWithIds,
          message: 'Using fallback questions due to database error'
        })
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
    */

  } catch (error) {
    console.error('[DIAGNOSTIC-QUESTIONS] Unexpected error:', error)
    
    // Always fall back to hardcoded questions
    const questionsWithIds = DIAGNOSTIC_QUESTIONS.map(q => ({
      id: q.order_index,
      ...q,
      created_at: new Date().toISOString()
    }))
    
    return NextResponse.json({
      success: true,
      questions: questionsWithIds,
      message: 'Using fallback questions due to error'
    })
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