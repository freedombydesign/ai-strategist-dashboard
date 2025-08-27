import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('[SETUP-DATABASE] Creating database tables and seeding data...')

    // Create freedom_diagnostic_questions table if it doesn't exist
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS freedom_diagnostic_questions (
        id SERIAL PRIMARY KEY,
        order_index INTEGER UNIQUE NOT NULL,
        category VARCHAR(10) NOT NULL,
        question_text TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `

    const { error: tableError } = await supabase.rpc('execute_sql', { 
      sql: createTableQuery 
    })

    if (tableError) {
      console.error('[SETUP-DATABASE] Table creation error:', tableError)
      // Continue anyway, table might already exist
    }

    // Seed the diagnostic questions
    const questions = [
      { order_index: 1, category: 'M1', question_text: 'How clear is your unique value proposition to potential customers?' },
      { order_index: 2, category: 'M1', question_text: 'How well does your pricing reflect the value you deliver?' },
      { order_index: 3, category: 'M3', question_text: 'How systematized are your core business processes?' },
      { order_index: 4, category: 'M3', question_text: 'How effectively do you track and measure business performance?' },
      { order_index: 5, category: 'M2', question_text: 'How smooth is your customer journey from awareness to purchase?' },
      { order_index: 6, category: 'M2', question_text: 'How effective is your lead generation and nurturing process?' },
      { order_index: 7, category: 'M4', question_text: 'How consistent and predictable is your sales process?' },
      { order_index: 8, category: 'M4', question_text: 'How well do you convert qualified leads into paying customers?' },
      { order_index: 9, category: 'M6', question_text: 'How regularly do you review and optimize your business processes?' },
      { order_index: 10, category: 'M5', question_text: 'How efficiently do you deliver your product/service to customers?' },
      { order_index: 11, category: 'M5', question_text: 'How satisfied are your customers with their overall experience?' },
      { order_index: 12, category: 'M6', question_text: 'How quickly do you identify and resolve business bottlenecks?' }
    ]

    // Use upsert to insert or update questions
    const { data: questionData, error: questionError } = await supabase
      .from('freedom_diagnostic_questions')
      .upsert(questions, { 
        onConflict: 'order_index',
        ignoreDuplicates: false 
      })
      .select()

    if (questionError) {
      console.error('[SETUP-DATABASE] Question insert error:', questionError)
      return NextResponse.json({ 
        error: 'Failed to insert questions',
        details: questionError.message 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Database setup completed successfully',
      questionsCreated: questions.length,
      data: questionData
    })

  } catch (error) {
    console.error('[SETUP-DATABASE] Setup error:', error)
    return NextResponse.json({
      error: 'Database setup failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Use POST to setup database',
    endpoints: {
      setup: 'POST /api/setup-database',
      questions: 'GET /api/diagnostic-questions'
    }
  })
}