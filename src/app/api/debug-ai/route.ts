import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export async function GET(request: NextRequest) {
  try {
    console.log('[DEBUG-AI] Starting AI diagnostic...')

    // Check environment variables
    const openaiKey = process.env.OPENAI_API_KEY

    console.log('[DEBUG-AI] Environment check:')
    console.log('- OPENAI_API_KEY exists:', !!openaiKey)
    console.log('- OPENAI_API_KEY preview:', openaiKey?.slice(0, 10) + '...' || 'not found')

    if (!openaiKey) {
      return NextResponse.json({
        success: false,
        error: 'OpenAI API key not found',
        environment: {
          openaiKeyExists: false
        }
      }, { status: 400 })
    }

    // Test OpenAI connection with minimal request
    const openai = new OpenAI({
      apiKey: openaiKey
    })

    console.log('[DEBUG-AI] Testing OpenAI connection...')

    const testResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: "Respond with exactly: 'AI connection test successful'"
        }
      ],
      max_tokens: 20,
      temperature: 0
    })

    const aiResponse = testResponse.choices[0]?.message?.content || 'No response'

    console.log('[DEBUG-AI] AI Response:', aiResponse)

    return NextResponse.json({
      success: true,
      environment: {
        openaiKeyExists: true,
        openaiKeyPreview: openaiKey.slice(0, 10) + '...'
      },
      connectionTest: {
        model: "gpt-3.5-turbo",
        aiResponse: aiResponse,
        tokenUsage: testResponse.usage,
        working: aiResponse.includes('AI connection test successful')
      }
    })

  } catch (error) {
    console.error('[DEBUG-AI] Error:', error)

    return NextResponse.json({
      success: false,
      error: 'AI diagnostic failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      environment: {
        openaiKeyExists: !!process.env.OPENAI_API_KEY
      }
    }, { status: 500 })
  }
}

// Test endpoint with POST to verify different request types
export async function POST(request: NextRequest) {
  try {
    const { testMessage } = await request.json()

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'OpenAI API key not configured'
      }, { status: 400 })
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: testMessage || "Say 'Custom test successful'"
        }
      ],
      max_tokens: 30,
      temperature: 0
    })

    return NextResponse.json({
      success: true,
      testMessage: testMessage || "Default test",
      aiResponse: response.choices[0]?.message?.content,
      tokenUsage: response.usage
    })

  } catch (error) {
    console.error('[DEBUG-AI] POST Error:', error)
    return NextResponse.json({
      success: false,
      error: 'AI test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}