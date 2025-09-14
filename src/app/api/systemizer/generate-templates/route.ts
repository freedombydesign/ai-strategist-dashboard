import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../../lib/supabase'
import OpenAI from 'openai'

export async function POST(request: NextRequest) {
  try {
    console.log('[GENERATE-TEMPLATES] Starting template generation...')

    // 1. Input Validation
    const { workflowId, stepId, templateTypes, personalityMode, customization } = await request.json()

    if (!workflowId) {
      return NextResponse.json({
        error: 'workflowId is required'
      }, { status: 400 })
    }

    const validTemplateTypes = ['email', 'document', 'checklist', 'task_list']
    const requestedTypes = templateTypes || ['email', 'document']

    for (const type of requestedTypes) {
      if (!validTemplateTypes.includes(type)) {
        return NextResponse.json({
          error: `Invalid template type: ${type}. Valid types: ${validTemplateTypes.join(', ')}`
        }, { status: 400 })
      }
    }

    console.log('[GENERATE-TEMPLATES] Input validation passed:', { workflowId, stepId, templateTypes: requestedTypes })

    // 2. Database Connection Test
    const { data: testConnection, error: connectionError } = await supabase
      .from('service_workflow_templates')
      .select('id')
      .limit(1)

    if (connectionError) {
      return NextResponse.json({
        error: 'Database connection failed',
        details: connectionError.message
      }, { status: 500 })
    }

    console.log('[GENERATE-TEMPLATES] Database connection verified')

    // 3. Get Workflow Data
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

    // 4. Get Steps Data
    let stepsData
    if (stepId) {
      // Generate for specific step
      const { data: step, error: stepError } = await supabase
        .from('service_workflow_steps')
        .select('*')
        .eq('id', stepId)
        .eq('workflow_template_id', workflowId)
        .single()

      if (stepError) {
        return NextResponse.json({
          error: 'Step not found',
          details: stepError.message
        }, { status: 404 })
      }
      stepsData = [step]
    } else {
      // Generate for all steps
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
      stepsData = steps || []
    }

    if (stepsData.length === 0) {
      return NextResponse.json({
        error: 'No steps found for this workflow'
      }, { status: 404 })
    }

    console.log('[GENERATE-TEMPLATES] Retrieved workflow data:', {
      workflowName: workflow.name,
      stepsCount: stepsData.length
    })

    // 4.5. Clear existing templates for this workflow (optional - only if replacing)
    const shouldReplaceExisting = true // You can make this configurable
    if (shouldReplaceExisting) {
      console.log('[GENERATE-TEMPLATES] Clearing existing templates for workflow...')
      const { error: clearError } = await supabase
        .from('service_template_assets')
        .delete()
        .eq('workflow_template_id', workflowId)

      if (clearError) {
        console.warn('[GENERATE-TEMPLATES] Failed to clear existing templates:', clearError.message)
        // Continue anyway - don't fail the entire operation
      } else {
        console.log('[GENERATE-TEMPLATES] Cleared existing templates successfully')
      }
    }

    // 5. OpenAI Setup
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        error: 'OpenAI API key not configured'
      }, { status: 500 })
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    // 6. Generate Templates
    const generatedTemplates = []
    let totalTokensUsed = 0

    for (const step of stepsData) {
      console.log(`[GENERATE-TEMPLATES] Processing step ${step.step_number}: ${step.title}`)

      for (const templateType of requestedTypes) {
        try {
          console.log(`[GENERATE-TEMPLATES] Generating ${templateType} template for step ${step.step_number}`)

          const templateContent = await generateTemplate(
            openai,
            workflow,
            step,
            templateType,
            personalityMode || 'professional',
            customization || {}
          )

          if (templateContent.success) {
            // Save to database
            const assetData = {
              workflow_template_id: workflowId,
              workflow_step_id: step.id,
              asset_type: templateType + '_template',
              asset_name: `${templateType} for: ${step.title}`,
              content: JSON.stringify(templateContent.template),
              metadata: {
                generated_at: new Date().toISOString(),
                ai_model: 'gpt-3.5-turbo',
                tokens_used: templateContent.tokensUsed,
                step_number: step.step_number,
                step_title: step.title
              },
              status: 'generated'
            }

            const { data: savedAsset, error: saveError } = await supabase
              .from('service_template_assets')
              .insert(assetData)
              .select()
              .single()

            if (saveError) {
              console.error(`[GENERATE-TEMPLATES] Failed to save ${templateType} for step ${step.step_number}:`, saveError)
              generatedTemplates.push({
                stepId: step.id,
                stepNumber: step.step_number,
                templateType,
                success: false,
                error: saveError.message,
                content: templateContent.template // Still return the generated content
              })
            } else {
              console.log(`[GENERATE-TEMPLATES] Saved ${templateType} template for step ${step.step_number}`)
              generatedTemplates.push({
                stepId: step.id,
                stepNumber: step.step_number,
                templateType,
                success: true,
                assetId: savedAsset.id,
                content: templateContent.template
              })
            }

            totalTokensUsed += templateContent.tokensUsed
          } else {
            console.error(`[GENERATE-TEMPLATES] Failed to generate ${templateType} for step ${step.step_number}:`, templateContent.error)
            generatedTemplates.push({
              stepId: step.id,
              stepNumber: step.step_number,
              templateType,
              success: false,
              error: templateContent.error
            })
          }

          // Small delay to avoid rate limits
          await new Promise(resolve => setTimeout(resolve, 100))

        } catch (error) {
          console.error(`[GENERATE-TEMPLATES] Error generating ${templateType} for step ${step.step_number}:`, error)
          generatedTemplates.push({
            stepId: step.id,
            stepNumber: step.step_number,
            templateType,
            success: false,
            error: error instanceof Error ? error.message : 'Generation failed'
          })
        }
      }
    }

    // 7. Summary
    const successful = generatedTemplates.filter(t => t.success).length
    const failed = generatedTemplates.filter(t => !t.success).length

    console.log(`[GENERATE-TEMPLATES] Generation complete: ${successful} successful, ${failed} failed`)
    console.log(`[GENERATE-TEMPLATES] Template types generated: ${requestedTypes.join(', ')}`)
    console.log(`[GENERATE-TEMPLATES] Steps processed: ${stepsData.length}`)
    console.log(`[GENERATE-TEMPLATES] Total templates created this session: ${generatedTemplates.length}`)

    return NextResponse.json({
      success: true,
      data: {
        workflow: {
          id: workflow.id,
          name: workflow.name
        },
        summary: {
          totalTemplatesThisSession: generatedTemplates.length,
          templatesPerStep: requestedTypes.length,
          stepsProcessed: stepsData.length,
          expectedTotal: stepsData.length * requestedTypes.length,
          successful,
          failed,
          totalTokensUsed,
          estimatedCost: (totalTokensUsed * 0.000002).toFixed(4), // Rough estimate for GPT-3.5
          replacedExistingTemplates: shouldReplaceExisting
        },
        templates: generatedTemplates,
        generationMetadata: {
          personalityUsed: personalityMode || 'professional',
          templateCount: generatedTemplates.length,
          variablesIdentified: generatedTemplates.reduce((sum, t) => sum + (t.variables?.length || 0), 0),
          customizationLevel: customization?.companyName ? 'high' : customization?.brandVoice ? 'medium' : 'low',
          customization: {
            companyName: customization?.companyName || null,
            brandVoice: customization?.brandVoice || null,
            industryTerms: customization?.industryTerms || []
          }
        }
      }
    })

  } catch (error) {
    console.error('[GENERATE-TEMPLATES] Unexpected error:', error)
    return NextResponse.json({
      error: 'Template generation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Helper function to generate individual templates
async function generateTemplate(
  openai: OpenAI,
  workflow: any,
  step: any,
  templateType: string,
  personalityMode: string = 'professional',
  customization: any = {}
) {
  try {
    console.log(`[GENERATE-TEMPLATES] Generating ${templateType} with personality: ${personalityMode}`)

    // Create safe local variables
    const personality = personalityMode || 'professional'
    const companyName = customization?.companyName || ''
    const brandVoice = customization?.brandVoice || ''
    const industryTerms = customization?.industryTerms || []

    let systemPrompt = ''
    let userPrompt = ''

    // Build customization context for all template types
    const hasCustomization = companyName || brandVoice || industryTerms.length > 0
    const companyInfo = companyName ? `COMPANY: ${companyName}` : ''
    const brandInfo = brandVoice ? `BRAND VOICE: ${brandVoice}` : ''
    const industryInfo = industryTerms.length > 0 ? `INDUSTRY TERMS: ${industryTerms.join(', ')}` : ''

    if (templateType === 'email') {
      if (hasCustomization) {
        // ADVANCED CUSTOMIZED EMAIL
        systemPrompt = 'You are an expert email copywriter who creates HIGHLY CUSTOMIZED templates that reflect specific company personalities. You MUST make this email sound unique to the company.'

        const personalityInstructions = {
          casual: 'Use friendly, conversational language with contractions like "we\'re", "you\'ll", etc. Be warm and approachable.',
          executive: 'Use authoritative, confident language. Be direct and commanding respect.',
          creative: 'Use engaging, creative language with personality and flair. Be memorable.',
          technical: 'Use precise, detailed language with technical terminology.',
          professional: 'Use formal, business-appropriate language with clear structure.'
        }

        userPrompt = `CUSTOM EMAIL GENERATION - Make this UNIQUE and PERSONALIZED!

${companyInfo}
${brandInfo}
${industryInfo}
PERSONALITY: ${personality}

WORKFLOW STEP: ${step.title}

REQUIREMENTS - This email MUST:
1. Use "${companyName}" prominently throughout (NOT just {{company_name}})
2. Embody "${brandVoice}" voice in every sentence
3. Naturally include these terms: ${industryTerms.join(', ')}
4. Sound like it came from ${companyName}, NOT a generic template

STYLE: ${personalityInstructions[personality] || personalityInstructions.professional}

CRITICAL: You must respond with ONLY valid JSON, no markdown, no explanations, no code blocks. Just the JSON object:

{
  "name": "Custom ${personality} email for ${companyName}",
  "subject": "[Create subject that sounds like ${companyName} would write]",
  "body": "[Write email body that embodies ${brandVoice} with ${personality} style]",
  "format": "html",
  "variables": ["client_name", "company_name", "project_name"]
}`
      } else {
        // STANDARD EMAIL
        systemPrompt = `You are an expert email copywriter. Create ${personality} email templates for business workflows.`

        userPrompt = `Generate a standard ${personality} email template:

Workflow: ${workflow.name}
Step: ${step.title}

CRITICAL: You must respond with ONLY valid JSON, no markdown, no explanations, no code blocks. Just the JSON object:

{
  "name": "Standard ${personality} email",
  "subject": "{{company_name}} - ${step.title}",
  "body": "Professional email content for ${step.title}",
  "format": "html",
  "variables": ["client_name", "company_name", "project_name"]
}`
      }
    } else if (templateType === 'document') {
      const docPersonalityStyles = {
        professional: "formal documentation style with clear structure and business terminology",
        casual: "approachable, easy-to-understand language while maintaining clarity",
        technical: "detailed, precise documentation with technical specifications",
        executive: "high-level overview focused on key points and outcomes",
        creative: "engaging presentation with visual elements and creative formatting"
      }

      if (hasCustomization) {
        systemPrompt = `You are an expert business process documentarian who creates HIGHLY CUSTOMIZED documents that reflect specific company personalities. Create ${docPersonalityStyles[personality] || docPersonalityStyles.professional} documents.`

        userPrompt = `CUSTOM DOCUMENT GENERATION - Make this UNIQUE to the company!

${companyInfo}
${brandInfo}
${industryInfo}
PERSONALITY: ${personality}

Workflow: "${workflow.name}"
Step ${step.step_number}: "${step.title}"
Description: "${step.description || step.title}"

REQUIREMENTS - This document MUST:
1. Use "${companyName}" throughout (not generic placeholders)
2. Embody "${brandVoice}" in the writing style
3. Include industry terms: ${industryTerms.join(', ')}
4. Sound like internal ${companyName} documentation

Create a document with:
- Clear, ${personality} title
- Purpose/introduction in ${personality} style
- Main content using {{placeholders}}
- Notes or tips section
- Markdown formatting

Format as JSON:
{
  "name": "Custom ${personality} document for ${companyName}",
  "title": "document title with {{placeholders}}",
  "introduction": "purpose and overview with {{placeholders}}",
  "main_content": "detailed content in markdown format with {{placeholders}}",
  "notes": "additional tips or notes",
  "format": "markdown",
  "variables": ["client_name", "project_name", "deadline"]
}`
      } else {
        systemPrompt = `You are an expert business process documentarian. Create ${docPersonalityStyles[personality] || docPersonalityStyles.professional} documents.`

        userPrompt = `Generate a standard ${personality} document template:

Workflow: "${workflow.name}"
Step ${step.step_number}: "${step.title}"
Description: "${step.description || step.title}"

Format as JSON:
{
  "name": "Standard ${personality} document",
  "title": "document title with {{placeholders}}",
  "introduction": "purpose and overview",
  "main_content": "detailed content with {{placeholders}}",
  "notes": "additional guidance",
  "format": "markdown",
  "variables": ["client_name", "project_name", "deadline"]
}`
      }
    } else if (templateType === 'checklist') {
      systemPrompt = "You are an expert at creating actionable business checklists. Create comprehensive, step-by-step checklists."

      userPrompt = `Generate a checklist for this workflow step:

Workflow: "${workflow.name}"
Step ${step.step_number}: "${step.title}"
Description: "${step.description || step.title}"

${companyInfo}
${brandInfo}
${industryInfo}

Create a checklist with:
- Clear title
- 5-10 specific, actionable items
- Optional notes for complex items

Format as JSON:
{
  "title": "checklist title",
  "items": ["actionable item 1", "actionable item 2", "..."],
  "notes": "additional guidance if needed"
}`
    } else if (templateType === 'task_list') {
      systemPrompt = "You are an expert project manager. Create detailed task breakdowns for workflow steps."

      userPrompt = `Generate a task list for this workflow step:

Workflow: "${workflow.name}"
Step ${step.step_number}: "${step.title}"
Description: "${step.description || step.title}"

${companyInfo}
${brandInfo}
${industryInfo}

Create a task list with:
- Main task title
- 3-7 sub-tasks
- Estimated time for each
- Priority levels

Format as JSON:
{
  "main_task": "primary task name",
  "sub_tasks": [
    {"task": "sub-task 1", "estimated_minutes": 30, "priority": "high"},
    {"task": "sub-task 2", "estimated_minutes": 15, "priority": "medium"}
  ],
  "total_estimated_minutes": 45
}`
    } else {
      throw new Error(`Unknown template type: ${templateType}`)
    }

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_tokens: 600,
      temperature: 0.3
    })

    const content = response.choices[0]?.message?.content

    if (!content) {
      throw new Error('No response from AI')
    }

    let parsedTemplate
    try {
      parsedTemplate = JSON.parse(content)
      console.log(`[GENERATE-TEMPLATES] Successfully parsed JSON for ${templateType}`)
    } catch (parseError) {
      console.warn(`[GENERATE-TEMPLATES] JSON parse failed for ${templateType}, attempting advanced extraction`)

      // Try multiple extraction methods
      let extractedJson = null

      // Method 1: Extract from various markdown code block formats
      const codeBlockMatches = [
        content.match(/```json\s*\n([\s\S]*?)\n\s*```/),
        content.match(/```\s*\n([\s\S]*?)\n\s*```/),
        content.match(/`{3}json\s*\n([\s\S]*?)\n\s*`{3}/),
        content.match(/```json([\s\S]*?)```/)
      ]

      for (const match of codeBlockMatches) {
        if (match && match[1]) {
          try {
            extractedJson = JSON.parse(match[1].trim())
            console.log(`[GENERATE-TEMPLATES] Successfully extracted JSON from markdown for ${templateType}`)
            break
          } catch (innerParseError) {
            continue
          }
        }
      }

      // Method 2: Look for JSON-like structure in text
      if (!extractedJson) {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            extractedJson = JSON.parse(jsonMatch[0])
            console.log(`[GENERATE-TEMPLATES] Successfully extracted JSON object for ${templateType}`)
          } catch (innerParseError) {
            // Continue to method 3
          }
        }
      }

      // Method 3: Try to construct JSON from text patterns for email templates
      if (!extractedJson && templateType === 'email') {
        const subjectMatch = content.match(/subject[:\s]*["\']?([^"\n\r]+)["\']?/i)
        const bodyMatch = content.match(/body[:\s]*["\']?([\s\S]*?)(?:["\']?\s*$|variables|format)/i)

        if (subjectMatch) {
          extractedJson = {
            name: `Reconstructed ${personality} email`,
            subject: subjectMatch[1].trim(),
            body: bodyMatch ? bodyMatch[1].trim() : `This is a ${personality} email template for ${step.title}`,
            format: "html",
            variables: ["client_name", "company_name", "project_name"]
          }
          console.log(`[GENERATE-TEMPLATES] Reconstructed email template for ${templateType}`)
        }
      }

      // Final result
      if (extractedJson) {
        parsedTemplate = extractedJson
      } else {
        console.error(`[GENERATE-TEMPLATES] All parsing methods failed for ${templateType}`)
        // Provide meaningful fallback structure
        if (templateType === 'email') {
          parsedTemplate = {
            parsing_note: "All JSON extraction methods failed - using fallback",
            name: `Fallback ${personality} email`,
            subject: `${step.title} - Follow Up Required`,
            body: `This email template could not be automatically generated. Please review the original AI response and create the template manually.\n\nOriginal Response:\n${content}`,
            format: "html",
            variables: ["client_name", "company_name"],
            raw_content: content
          }
        } else {
          parsedTemplate = {
            parsing_note: "All JSON extraction methods failed",
            raw_content: content,
            name: `Failed ${templateType}`,
            title: `${step.title} - Template Generation Failed`
          }
        }
      }
    }

    // Extract variables from the template content
    const variables = parsedTemplate.variables || extractVariablesFromTemplate(parsedTemplate)
    const customizationLevel = customization.companyName ? 'high' : customization.brandVoice ? 'medium' : 'low'

    return {
      success: true,
      template: parsedTemplate,
      variables: variables,
      format: parsedTemplate.format || 'json',
      customizationLevel: customizationLevel,
      tokensUsed: response.usage?.total_tokens || 0
    }

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Template generation failed'
    }
  }
}

// Helper function to extract variables from template content
function extractVariablesFromTemplate(template: any): string[] {
  const variables = new Set<string>()
  const variableRegex = /\{\{(\w+)\}\}/g

  const searchInValue = (value: any) => {
    if (typeof value === 'string') {
      let match
      while ((match = variableRegex.exec(value)) !== null) {
        variables.add(match[1])
      }
    } else if (typeof value === 'object' && value !== null) {
      Object.values(value).forEach(searchInValue)
    }
  }

  searchInValue(template)
  return Array.from(variables)
}

// GET endpoint to retrieve generated templates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const workflowId = searchParams.get('workflowId')
    const assetId = searchParams.get('assetId')

    if (assetId) {
      // Get specific template asset
      const { data: asset, error } = await supabase
        .from('service_template_assets')
        .select('*')
        .eq('id', assetId)
        .single()

      if (error) {
        return NextResponse.json({ error: 'Template not found' }, { status: 404 })
      }

      return NextResponse.json({
        success: true,
        data: asset
      })
    } else if (workflowId) {
      // Get all templates for a workflow
      const { data: assets, error } = await supabase
        .from('service_template_assets')
        .select('*')
        .eq('workflow_template_id', workflowId)
        .order('created_at', { ascending: false })

      if (error) {
        return NextResponse.json({
          error: 'Failed to fetch templates',
          details: error.message
        }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        data: assets || []
      })
    } else {
      return NextResponse.json({
        error: 'workflowId or assetId parameter required'
      }, { status: 400 })
    }

  } catch (error) {
    console.error('[GENERATE-TEMPLATES] GET error:', error)
    return NextResponse.json({
      error: 'Failed to retrieve templates',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}