import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../../lib/supabase'
import OpenAI from 'openai'

export async function POST(request: NextRequest) {
  try {
    console.log('[ANALYZE-WORKFLOW] Starting workflow analysis...')

    // 1. Input Validation FIRST
    const { workflowId, workflowName, workflowSteps } = await request.json()

    if (!workflowId && !workflowName && !workflowSteps) {
      return NextResponse.json({
        error: 'Either workflowId or workflowName+workflowSteps required'
      }, { status: 400 })
    }

    console.log('[ANALYZE-WORKFLOW] Input validation passed')

    // 2. Database Connection Test
    const { data: testConnection, error: connectionError } = await supabase
      .from('service_workflow_templates')
      .select('id')
      .limit(1)

    if (connectionError) {
      console.error('[ANALYZE-WORKFLOW] Database connection failed:', connectionError)
      return NextResponse.json({
        error: 'Database connection failed',
        details: connectionError.message
      }, { status: 500 })
    }

    console.log('[ANALYZE-WORKFLOW] Database connection verified')

    // 3. Get workflow data (either from database or from request)
    let workflowData
    let stepsData

    if (workflowId) {
      // Fetch from database
      console.log('[ANALYZE-WORKFLOW] Fetching workflow from database:', workflowId)

      const { data: workflow, error: workflowError } = await supabase
        .from('service_workflow_templates')
        .select('*')
        .eq('id', workflowId)
        .single()

      if (workflowError) {
        return NextResponse.json({
          error: 'Workflow not found',
          details: workflowError.message
        }, { status: 404 })
      }

      const { data: steps, error: stepsError } = await supabase
        .from('service_workflow_steps')
        .select('*')
        .eq('workflow_template_id', workflowId)
        .order('step_number')

      if (stepsError) {
        return NextResponse.json({
          error: 'Steps not found',
          details: stepsError.message
        }, { status: 404 })
      }

      workflowData = workflow
      stepsData = steps || []
    } else {
      // Use provided data
      console.log('[ANALYZE-WORKFLOW] Using provided workflow data')
      workflowData = { name: workflowName }
      stepsData = workflowSteps.split('\n')
        .map((step: string, index: number) => ({
          step_number: index + 1,
          title: step.trim(),
          description: step.trim()
        }))
        .filter((step: any) => step.title.length > 0)
    }

    console.log('[ANALYZE-WORKFLOW] Workflow data prepared:', {
      name: workflowData.name,
      stepsCount: stepsData.length
    })

    // 4. OpenAI Connection Test
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        error: 'OpenAI API key not configured'
      }, { status: 500 })
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })

    console.log('[ANALYZE-WORKFLOW] OpenAI client initialized')

    // 5. AI Analysis with Fallback Plan
    try {
      const stepsText = stepsData
        .map((step: any) => `${step.step_number}. ${step.title || step.description}`)
        .join('\n')

      const analysisPrompt = `Analyze this service delivery workflow:

Workflow Name: ${workflowData.name}
Steps:
${stepsText}

Provide analysis in this JSON format:
{
  "complexity_score": 1-10,
  "estimated_hours": number,
  "risk_factors": ["factor1", "factor2"],
  "optimization_suggestions": ["suggestion1", "suggestion2"],
  "missing_steps": ["step1", "step2"],
  "automation_opportunities": ["opportunity1", "opportunity2"]
}

Be concise and practical.`

      console.log('[ANALYZE-WORKFLOW] Sending analysis request to OpenAI...')

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are an expert business process analyst. Provide detailed but concise workflow analysis."
          },
          {
            role: "user",
            content: analysisPrompt
          }
        ],
        max_tokens: 800,
        temperature: 0.3
      })

      const aiResponse = response.choices[0]?.message?.content

      if (!aiResponse) {
        throw new Error('No response from AI')
      }

      console.log('[ANALYZE-WORKFLOW] AI analysis received:', aiResponse.slice(0, 100) + '...')

      // Try to parse JSON response
      let analysisData
      try {
        analysisData = JSON.parse(aiResponse)
      } catch (parseError) {
        console.warn('[ANALYZE-WORKFLOW] JSON parse failed, using text response')
        analysisData = {
          complexity_score: 5,
          estimated_hours: stepsData.length * 2,
          analysis_text: aiResponse,
          parsing_note: "AI returned text format instead of JSON"
        }
      }

      // 6. Success Response with Analysis
      const result = {
        workflow: workflowData,
        steps: stepsData,
        analysis: analysisData,
        metadata: {
          analyzed_at: new Date().toISOString(),
          ai_model: "gpt-3.5-turbo",
          tokens_used: response.usage?.total_tokens || 0,
          steps_analyzed: stepsData.length
        }
      }

      console.log('[ANALYZE-WORKFLOW] Analysis complete successfully')

      return NextResponse.json({
        success: true,
        data: result
      })

    } catch (aiError) {
      console.error('[ANALYZE-WORKFLOW] AI analysis failed:', aiError)

      // Fallback: Return basic analysis without AI
      const fallbackAnalysis = {
        complexity_score: Math.min(10, Math.max(1, Math.ceil(stepsData.length / 2))),
        estimated_hours: stepsData.length * 2,
        analysis_note: "AI analysis unavailable, using basic heuristics",
        error_details: aiError instanceof Error ? aiError.message : 'AI processing failed'
      }

      return NextResponse.json({
        success: true,
        data: {
          workflow: workflowData,
          steps: stepsData,
          analysis: fallbackAnalysis,
          metadata: {
            analyzed_at: new Date().toISOString(),
            ai_model: "fallback-heuristic",
            steps_analyzed: stepsData.length,
            ai_error: true
          }
        },
        warning: "AI analysis failed, basic analysis provided"
      })
    }

  } catch (error) {
    console.error('[ANALYZE-WORKFLOW] Unexpected error:', error)
    return NextResponse.json({
      error: 'Workflow analysis failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET endpoint to retrieve existing analysis
export async function GET(request: NextRequest) {
  try {
    console.log('[ANALYZE-WORKFLOW] GET - Retrieving workflow analyses...')

    const { searchParams } = new URL(request.url)
    const workflowId = searchParams.get('workflowId')

    if (workflowId) {
      // Get specific workflow analysis
      const { data: workflow, error: workflowError } = await supabase
        .from('service_workflow_templates')
        .select('*')
        .eq('id', workflowId)
        .single()

      if (workflowError) {
        return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
      }

      const { data: steps, error: stepsError } = await supabase
        .from('service_workflow_steps')
        .select('*')
        .eq('workflow_template_id', workflowId)
        .order('step_number')

      return NextResponse.json({
        success: true,
        data: {
          workflow,
          steps: steps || [],
          analysis_available: true
        }
      })
    } else {
      // Get all workflows available for analysis
      const { data: workflows, error } = await supabase
        .from('service_workflow_templates')
        .select('id, name, description, created_at')
        .order('created_at', { ascending: false })

      if (error) {
        return NextResponse.json({
          error: 'Failed to fetch workflows',
          details: error.message
        }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        data: workflows || []
      })
    }

  } catch (error) {
    console.error('[ANALYZE-WORKFLOW] GET error:', error)
    return NextResponse.json({
      error: 'Failed to retrieve workflow data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}