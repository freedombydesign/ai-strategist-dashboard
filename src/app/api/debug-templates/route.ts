import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'
import OpenAI from 'openai'

export async function GET(request: NextRequest) {
  try {
    console.log('[DEBUG-TEMPLATES] Starting template generation diagnostic...')

    // 1. Environment Check
    const openaiKey = process.env.OPENAI_API_KEY
    console.log('[DEBUG-TEMPLATES] OpenAI key exists:', !!openaiKey)

    if (!openaiKey) {
      return NextResponse.json({
        success: false,
        error: 'OpenAI API key not found'
      }, { status: 400 })
    }

    // 2. Database Connection Check
    const { data: templateAssets, error: dbError } = await supabase
      .from('service_template_assets')
      .select('id')
      .limit(1)

    if (dbError) {
      console.error('[DEBUG-TEMPLATES] Database connection failed:', dbError)
      return NextResponse.json({
        success: false,
        error: 'Database connection failed',
        details: dbError.message
      }, { status: 500 })
    }

    console.log('[DEBUG-TEMPLATES] Database connection verified')

    // 3. Test Email Template Generation
    const openai = new OpenAI({ apiKey: openaiKey })

    const testEmailPrompt = `Generate a professional email template for this workflow step:

Step: "Send welcome email to new client"
Context: "Client onboarding process"

Create an email template with:
- Subject line
- Professional greeting
- Welcome message
- Next steps
- Professional closing

Format as JSON:
{
  "subject": "...",
  "body": "..."
}`

    console.log('[DEBUG-TEMPLATES] Testing email template generation...')

    const emailResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an expert email copywriter. Create professional, clear, and actionable email templates."
        },
        {
          role: "user",
          content: testEmailPrompt
        }
      ],
      max_tokens: 500,
      temperature: 0.3
    })

    const emailContent = emailResponse.choices[0]?.message?.content

    // 4. Test Document Template Generation
    const testDocPrompt = `Generate a checklist document for this workflow step:

Step: "Collect project requirements"
Context: "Client onboarding process"

Create a checklist with:
- Title
- Introduction
- 5-7 specific items to check/collect
- Notes section

Format as JSON:
{
  "title": "...",
  "introduction": "...",
  "checklist_items": ["item1", "item2", "..."],
  "notes": "..."
}`

    console.log('[DEBUG-TEMPLATES] Testing document template generation...')

    const docResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an expert business process documentarian. Create clear, actionable checklists and documents."
        },
        {
          role: "user",
          content: testDocPrompt
        }
      ],
      max_tokens: 400,
      temperature: 0.3
    })

    const docContent = docResponse.choices[0]?.message?.content

    // 5. Try to parse responses
    let emailTemplate, docTemplate

    try {
      emailTemplate = JSON.parse(emailContent || '{}')
    } catch (err) {
      emailTemplate = {
        parsing_error: true,
        raw_content: emailContent,
        note: "AI returned text format instead of JSON"
      }
    }

    try {
      docTemplate = JSON.parse(docContent || '{}')
    } catch (err) {
      docTemplate = {
        parsing_error: true,
        raw_content: docContent,
        note: "AI returned text format instead of JSON"
      }
    }

    console.log('[DEBUG-TEMPLATES] Template generation test completed')

    return NextResponse.json({
      success: true,
      environment: {
        openaiKeyExists: true,
        databaseConnected: true
      },
      templateTests: {
        emailTemplate: {
          generated: !!emailContent,
          parsedSuccessfully: !emailTemplate.parsing_error,
          content: emailTemplate,
          tokensUsed: emailResponse.usage?.total_tokens
        },
        documentTemplate: {
          generated: !!docContent,
          parsedSuccessfully: !docTemplate.parsing_error,
          content: docTemplate,
          tokensUsed: docResponse.usage?.total_tokens
        }
      },
      totalTokensUsed: (emailResponse.usage?.total_tokens || 0) + (docResponse.usage?.total_tokens || 0)
    })

  } catch (error) {
    console.error('[DEBUG-TEMPLATES] Unexpected error:', error)
    return NextResponse.json({
      success: false,
      error: 'Template diagnostic failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// POST endpoint for custom template testing
export async function POST(request: NextRequest) {
  try {
    const { stepName, stepContext, templateType } = await request.json()

    if (!stepName || !templateType) {
      return NextResponse.json({
        error: 'stepName and templateType are required'
      }, { status: 400 })
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        error: 'OpenAI API key not configured'
      }, { status: 500 })
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    let prompt, systemPrompt

    if (templateType === 'email') {
      systemPrompt = "You are an expert email copywriter. Create professional, clear, and actionable email templates."
      prompt = `Generate a professional email template for this workflow step:

Step: "${stepName}"
Context: "${stepContext || 'Business process'}"

Create an email template with:
- Subject line
- Professional greeting
- Main content relevant to the step
- Next steps or call to action
- Professional closing

Format as JSON:
{
  "subject": "...",
  "body": "..."
}`
    } else if (templateType === 'document') {
      systemPrompt = "You are an expert business process documentarian. Create clear, actionable checklists and documents."
      prompt = `Generate a document template for this workflow step:

Step: "${stepName}"
Context: "${stepContext || 'Business process'}"

Create a document with:
- Title
- Introduction/purpose
- Main content (checklist, instructions, or guide)
- Notes section

Format as JSON:
{
  "title": "...",
  "introduction": "...",
  "main_content": "...",
  "notes": "..."
}`
    } else {
      return NextResponse.json({
        error: 'templateType must be "email" or "document"'
      }, { status: 400 })
    }

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ],
      max_tokens: 600,
      temperature: 0.3
    })

    const content = response.choices[0]?.message?.content

    let parsedTemplate
    try {
      parsedTemplate = JSON.parse(content || '{}')
    } catch (err) {
      parsedTemplate = {
        parsing_error: true,
        raw_content: content,
        note: "AI returned text format, manual parsing may be needed"
      }
    }

    return NextResponse.json({
      success: true,
      template: {
        stepName,
        templateType,
        content: parsedTemplate,
        tokensUsed: response.usage?.total_tokens,
        parsedSuccessfully: !parsedTemplate.parsing_error
      }
    })

  } catch (error) {
    console.error('[DEBUG-TEMPLATES] POST error:', error)
    return NextResponse.json({
      success: false,
      error: 'Template generation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}