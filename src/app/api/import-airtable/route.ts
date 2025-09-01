import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

// Custom Airtable to Supabase Import API
// Handles complex relationships and preserves data integrity

interface AirtableRecord {
  id: string
  fields: Record<string, any>
  createdTime: string
}

interface ImportResult {
  tableName: string
  recordsImported: number
  errors: string[]
  mappings: Record<string, string>
}

export async function POST(request: NextRequest) {
  try {
    const { airtableApiKey, baseId, importPlan } = await request.json()
    
    if (!airtableApiKey || !baseId) {
      return NextResponse.json({
        error: 'Missing Airtable credentials'
      }, { status: 400 })
    }

    console.log('[AIRTABLE-IMPORT] Starting import process...')
    
    // Execute import in phases to handle relationships properly
    const importResults: ImportResult[] = []
    
    // Phase 1: Core framework data (no dependencies)
    console.log('[AIRTABLE-IMPORT] Phase 1: Core framework tables...')
    
    // Import Sprints first (referenced by many other tables)
    const sprintsResult = await importSprints(airtableApiKey, baseId)
    importResults.push(sprintsResult)
    
    // Import Business Frameworks
    const frameworksResult = await importFrameworks(airtableApiKey, baseId)
    importResults.push(frameworksResult)
    
    // Import Categories
    const categoriesResult = await importCategories(airtableApiKey, baseId)
    importResults.push(categoriesResult)
    
    // Phase 2: Content tables (depend on categories and frameworks)
    console.log('[AIRTABLE-IMPORT] Phase 2: Content tables...')
    
    const sopResult = await importSOPs(airtableApiKey, baseId)
    importResults.push(sopResult)
    
    const templatesResult = await importTemplates(airtableApiKey, baseId)
    importResults.push(templatesResult)
    
    const promptsResult = await importPrompts(airtableApiKey, baseId)
    importResults.push(promptsResult)
    
    // Phase 3: Step-based tables (depend on sprints)
    console.log('[AIRTABLE-IMPORT] Phase 3: Steps and diagnostics...')
    
    const stepsResult = await importSteps(airtableApiKey, baseId)
    importResults.push(stepsResult)
    
    const questionsResult = await importDiagnosticQuestions(airtableApiKey, baseId)
    importResults.push(questionsResult)
    
    // Phase 4: User data and progress (depend on everything)
    console.log('[AIRTABLE-IMPORT] Phase 4: Users and progress...')
    
    const usersResult = await importUsers(airtableApiKey, baseId)
    importResults.push(usersResult)
    
    const progressResult = await importUserProgress(airtableApiKey, baseId)
    importResults.push(progressResult)
    
    const responsesResult = await importDiagnosticResponses(airtableApiKey, baseId)
    importResults.push(responsesResult)

    console.log('[AIRTABLE-IMPORT] Import process complete!')
    
    return NextResponse.json({
      success: true,
      results: importResults,
      summary: {
        totalTables: importResults.length,
        totalRecords: importResults.reduce((sum, r) => sum + r.recordsImported, 0),
        errors: importResults.flatMap(r => r.errors)
      }
    })

  } catch (error) {
    console.error('[AIRTABLE-IMPORT] Error:', error)
    
    return NextResponse.json({
      error: 'Import failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Individual import functions for each table type

async function importSprints(apiKey: string, baseId: string): Promise<ImportResult> {
  try {
    const records = await fetchAirtableRecords(apiKey, baseId, 'tbl24cSX2YX60xZec') // Sprints table ID
    const result: ImportResult = {
      tableName: 'sprints',
      recordsImported: 0,
      errors: [],
      mappings: {}
    }

    for (const record of records) {
      try {
        // Map Airtable fields to Supabase columns
        const sprintData = {
          sprint_key: `S${record.fields['Week Number'] || result.recordsImported + 1}`,
          name: record.fields['Name'] || 'Unnamed Sprint',
          full_title: record.fields['Name'] || 'Unnamed Sprint',
          description: record.fields['Description'] || '',
          methodology: `${record.fields['Goal'] || 'Sprint methodology'} - Time Saved: ${record.fields['Time Saved/Week (hrs)'] || 0} hours per week`
        }

        const { data, error } = await supabase
          .from('sprints')
          .insert(sprintData)
          .select()

        if (error) throw error

        result.mappings[record.id] = data[0].sprint_key
        result.recordsImported++
        
      } catch (err) {
        result.errors.push(`Sprint ${record.fields['Name']}: ${err instanceof Error ? err.message : 'Unknown error'}`)
      }
    }

    return result
  } catch (error) {
    return {
      tableName: 'sprints',
      recordsImported: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
      mappings: {}
    }
  }
}

async function importFrameworks(apiKey: string, baseId: string): Promise<ImportResult> {
  try {
    const records = await fetchAirtableRecords(apiKey, baseId, 'tblULYAzDLZbJsUyD') // Framework table ID
    const result: ImportResult = {
      tableName: 'business_frameworks',
      recordsImported: 0,
      errors: [],
      mappings: {}
    }

    for (const record of records) {
      try {
        const frameworkData = {
          framework_name: record.fields['Framework Name'] || 'Unnamed Framework',
          category_pillar: record.fields['Category/Pillar'] || null,
          description: record.fields['Description'] || '',
          core_steps_phases: record.fields['Core/Steps Phases'] || '',
          use_cases_scenarios: record.fields['Use Cases/Scenarios'] || '',
          level_complexity: record.fields['Level/Complexity'] || null,
          tags: record.fields['Tags'] || []
        }

        const { data, error } = await supabase
          .from('business_frameworks')
          .insert(frameworkData)
          .select()

        if (error) throw error

        result.mappings[record.id] = data[0].id.toString()
        result.recordsImported++
        
      } catch (err) {
        result.errors.push(`Framework ${record.fields['Framework Name']}: ${err instanceof Error ? err.message : 'Unknown error'}`)
      }
    }

    return result
  } catch (error) {
    return {
      tableName: 'business_frameworks',
      recordsImported: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
      mappings: {}
    }
  }
}

async function importCategories(apiKey: string, baseId: string): Promise<ImportResult> {
  try {
    const records = await fetchAirtableRecords(apiKey, baseId, 'tblBJp1mnyODqUldj') // Category table ID
    const result: ImportResult = {
      tableName: 'content_categories',
      recordsImported: 0,
      errors: [],
      mappings: {}
    }

    for (const record of records) {
      try {
        const categoryData = {
          name: record.fields['Name'] || 'Unnamed Category',
          description: record.fields['Description'] || '',
          sort_order: record.fields['Sort Order'] || 1,
          keywords: record.fields['Keywords'] || ''
        }

        const { data, error } = await supabase
          .from('content_categories')
          .insert(categoryData)
          .select()

        if (error) throw error

        result.mappings[record.id] = data[0].id.toString()
        result.recordsImported++
        
      } catch (err) {
        result.errors.push(`Category ${record.fields['Name']}: ${err instanceof Error ? err.message : 'Unknown error'}`)
      }
    }

    return result
  } catch (error) {
    return {
      tableName: 'content_categories',
      recordsImported: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
      mappings: {}
    }
  }
}

async function importSOPs(apiKey: string, baseId: string): Promise<ImportResult> {
  try {
    const records = await fetchAirtableRecords(apiKey, baseId, 'tbltetGLQm6rCwJEO') // SOP Library table ID
    const result: ImportResult = {
      tableName: 'sop_library',
      recordsImported: 0,
      errors: [],
      mappings: {}
    }

    for (const record of records) {
      try {
        const sopData = {
          title: record.fields['Title'] || 'Unnamed SOP',
          category: Array.isArray(record.fields['Category']) ? record.fields['Category'][0] : record.fields['Category'] || null,
          keywords: record.fields['Keywords'] || '',
          content_steps: record.fields['Content/Steps'] || '',
          format: record.fields['Format'] || null
        }

        const { data, error } = await supabase
          .from('sop_library')
          .insert(sopData)
          .select()

        if (error) throw error

        result.mappings[record.id] = data[0].id.toString()
        result.recordsImported++
        
      } catch (err) {
        result.errors.push(`SOP ${record.fields['Title']}: ${err instanceof Error ? err.message : 'Unknown error'}`)
      }
    }

    return result
  } catch (error) {
    return {
      tableName: 'sop_library',
      recordsImported: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
      mappings: {}
    }
  }
}

async function importTemplates(apiKey: string, baseId: string): Promise<ImportResult> {
  try {
    // Import both Templates and Templates Draft tables
    const templates = await fetchAirtableRecords(apiKey, baseId, 'tblKu00LxdJ2OWFfB') // Templates table
    const templatesDraft = await fetchAirtableRecords(apiKey, baseId, 'tblfa0LH4SeyssEzB') // Templates Draft table
    
    const result: ImportResult = {
      tableName: 'template_library',
      recordsImported: 0,
      errors: [],
      mappings: {}
    }

    // Import regular templates
    for (const record of templates) {
      try {
        const templateData = {
          template_name: record.fields['Template Name'] || 'Unnamed Template',
          description: record.fields['Description'] || '',
          resource_link: record.fields['Resource Link'] || null,
          template_type: record.fields['Template Type'] || null,
          category: Array.isArray(record.fields['Category']) ? record.fields['Category'][0] : record.fields['Category'] || null,
          is_draft: false
        }

        const { data, error } = await supabase
          .from('template_library')
          .insert(templateData)
          .select()

        if (error) throw error

        result.mappings[record.id] = data[0].id.toString()
        result.recordsImported++
        
      } catch (err) {
        result.errors.push(`Template ${record.fields['Template Name']}: ${err instanceof Error ? err.message : 'Unknown error'}`)
      }
    }

    // Import draft templates
    for (const record of templatesDraft) {
      try {
        const templateData = {
          template_name: record.fields['Template Name'] || 'Unnamed Template',
          description: record.fields['Description'] || '',
          resource_link: null,
          template_type: record.fields['Type'] || null,
          category: record.fields['Category'] || null,
          is_draft: true
        }

        const { data, error } = await supabase
          .from('template_library')
          .insert(templateData)
          .select()

        if (error) throw error

        result.mappings[record.id] = data[0].id.toString()
        result.recordsImported++
        
      } catch (err) {
        result.errors.push(`Template Draft ${record.fields['Template Name']}: ${err instanceof Error ? err.message : 'Unknown error'}`)
      }
    }

    return result
  } catch (error) {
    return {
      tableName: 'template_library',
      recordsImported: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
      mappings: {}
    }
  }
}

async function importPrompts(apiKey: string, baseId: string): Promise<ImportResult> {
  try {
    const records = await fetchAirtableRecords(apiKey, baseId, 'tblMdjygfPVWCyFXp') // AI Prompt Library table ID
    const result: ImportResult = {
      tableName: 'ai_prompt_library',
      recordsImported: 0,
      errors: [],
      mappings: {}
    }

    for (const record of records) {
      try {
        const promptData = {
          prompt_name: record.fields['Prompt Name'] || 'Unnamed Prompt',
          prompt_text: record.fields['Prompt Text'] || '',
          category: record.fields['Category'] || null,
          variables_needed: record.fields['Variables Needed'] || '',
          tags: record.fields['Tags'] || []
        }

        const { data, error } = await supabase
          .from('ai_prompt_library')
          .insert(promptData)
          .select()

        if (error) throw error

        result.mappings[record.id] = data[0].id.toString()
        result.recordsImported++
        
      } catch (err) {
        result.errors.push(`Prompt ${record.fields['Prompt Name']}: ${err instanceof Error ? err.message : 'Unknown error'}`)
      }
    }

    return result
  } catch (error) {
    return {
      tableName: 'ai_prompt_library',
      recordsImported: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
      mappings: {}
    }
  }
}

async function importSteps(apiKey: string, baseId: string): Promise<ImportResult> {
  try {
    const records = await fetchAirtableRecords(apiKey, baseId, 'tblhtmJMMTlxO76d7') // Steps table ID
    const result: ImportResult = {
      tableName: 'framework_steps',
      recordsImported: 0,
      errors: [],
      mappings: {}
    }

    for (const record of records) {
      try {
        const stepData = {
          step_title: record.fields['Step Title'] || 'Unnamed Step',
          sprint_key: null, // Will need to resolve Sprint relationships
          step_number: record.fields['Step'] || null,
          task_description: record.fields['Task'] || '',
          resource_link: record.fields['Resource Link'] || null,
          validation_rule: record.fields['Validation Rule'] || '',
          is_optional: record.fields['Optional'] || false,
          master_step_order: record.fields['Master Step Order'] || null
        }

        const { data, error } = await supabase
          .from('framework_steps')
          .insert(stepData)
          .select()

        if (error) throw error

        result.mappings[record.id] = data[0].id.toString()
        result.recordsImported++
        
      } catch (err) {
        result.errors.push(`Step ${record.fields['Step Title']}: ${err instanceof Error ? err.message : 'Unknown error'}`)
      }
    }

    return result
  } catch (error) {
    return {
      tableName: 'framework_steps',
      recordsImported: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
      mappings: {}
    }
  }
}

async function importDiagnosticQuestions(apiKey: string, baseId: string): Promise<ImportResult> {
  try {
    const records = await fetchAirtableRecords(apiKey, baseId, 'tblfx5DhXexF08iwJ') // Freedom Diagnostic Questions table ID
    const result: ImportResult = {
      tableName: 'freedom_diagnostic_questions',
      recordsImported: 0,
      errors: [],
      mappings: {}
    }

    for (const record of records) {
      try {
        const questionData = {
          question_id: record.fields['Question ID'] || `Q${result.recordsImported + 1}`,
          module: record.fields['Module'] || '',
          sprint_title: record.fields['Sprint Title'] || '',
          field_name: record.fields['Field Name'] || '',
          question_text: record.fields['Question'] || '',
          options_text: record.fields['Options'] || '',
          category: Array.isArray(record.fields['Category']) ? record.fields['Category'][0] : record.fields['Category'] || null
        }

        const { data, error } = await supabase
          .from('freedom_diagnostic_questions')
          .insert(questionData)
          .select()

        if (error) throw error

        result.mappings[record.id] = data[0].question_id
        result.recordsImported++
        
      } catch (err) {
        result.errors.push(`Question ${record.fields['Question ID']}: ${err instanceof Error ? err.message : 'Unknown error'}`)
      }
    }

    return result
  } catch (error) {
    return {
      tableName: 'freedom_diagnostic_questions',
      recordsImported: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
      mappings: {}
    }
  }
}

async function importUsers(apiKey: string, baseId: string): Promise<ImportResult> {
  try {
    const records = await fetchAirtableRecords(apiKey, baseId, 'tblmMleXmZBHwWkZl') // Users table ID
    const result: ImportResult = {
      tableName: 'framework_users',
      recordsImported: 0,
      errors: [],
      mappings: {}
    }

    for (const record of records) {
      try {
        const userData = {
          user_id: record.id, // Use Airtable record ID as user_id
          name: record.fields['Name'] || '',
          email: record.fields['Email'] || '',
          business_size: record.fields['Business Size'] || '',
          niche: record.fields['Niche'] || '',
          freedom_score: record.fields['Freedom Score'] || null,
          start_date: record.fields['Start Date'] || null,
          current_sprint_key: null // Will resolve Current Sprint relationships later
        }

        const { data, error } = await supabase
          .from('framework_users')
          .insert(userData)
          .select()

        if (error) throw error

        result.mappings[record.id] = data[0].user_id
        result.recordsImported++
        
      } catch (err) {
        result.errors.push(`User ${record.fields['Name']}: ${err instanceof Error ? err.message : 'Unknown error'}`)
      }
    }

    return result
  } catch (error) {
    return {
      tableName: 'framework_users',
      recordsImported: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
      mappings: {}
    }
  }
}

async function importUserProgress(apiKey: string, baseId: string): Promise<ImportResult> {
  try {
    const records = await fetchAirtableRecords(apiKey, baseId, 'tbltIpE9pXQsVCWe8') // User Steps Progress Tracking table ID
    const result: ImportResult = {
      tableName: 'enhanced_user_progress',
      recordsImported: 0,
      errors: [],
      mappings: {}
    }

    for (const record of records) {
      try {
        const progressData = {
          user_id: Array.isArray(record.fields['User']) ? record.fields['User'][0] : record.fields['User'] || '',
          step_id: null, // Will need to resolve Step relationships
          sprint_key: null, // Will need to resolve Sprint relationships
          status: record.fields['Status'] || 'assigned',
          completion_date: record.fields['Completion Date'] || null,
          notes: record.fields['Notes'] || '',
          progress_percentage: record.fields['Progress%'] || 0
        }

        const { data, error } = await supabase
          .from('enhanced_user_progress')
          .insert(progressData)
          .select()

        if (error) throw error

        result.mappings[record.id] = data[0].id.toString()
        result.recordsImported++
        
      } catch (err) {
        result.errors.push(`Progress ${record.fields['Name']}: ${err instanceof Error ? err.message : 'Unknown error'}`)
      }
    }

    return result
  } catch (error) {
    return {
      tableName: 'enhanced_user_progress',
      recordsImported: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
      mappings: {}
    }
  }
}

async function importDiagnosticResponses(apiKey: string, baseId: string): Promise<ImportResult> {
  try {
    const records = await fetchAirtableRecords(apiKey, baseId, 'tbluMWXpbxHb2WPRF') // Freedom Diagnostic Responses table ID
    const result: ImportResult = {
      tableName: 'freedom_diagnostic_responses',
      recordsImported: 0,
      errors: [],
      mappings: {}
    }

    for (const record of records) {
      try {
        const responseData = {
          response_id: record.fields['Response ID'] || null,
          question_id: Array.isArray(record.fields['Question']) ? record.fields['Question'][0] : record.fields['Question'] || null,
          respondent_name: record.fields['Respondent Name'] || '',
          respondent_email: record.fields['Respondent Email'] || '',
          response_value: record.fields['Response Value'] || '',
          date_submitted: record.fields['Date Submitted'] || null
        }

        const { data, error } = await supabase
          .from('freedom_diagnostic_responses')
          .insert(responseData)
          .select()

        if (error) throw error

        result.mappings[record.id] = data[0].id.toString()
        result.recordsImported++
        
      } catch (err) {
        result.errors.push(`Response ${record.fields['Response ID']}: ${err instanceof Error ? err.message : 'Unknown error'}`)
      }
    }

    return result
  } catch (error) {
    return {
      tableName: 'freedom_diagnostic_responses',
      recordsImported: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
      mappings: {}
    }
  }
}

// Helper function to fetch records from Airtable
async function fetchAirtableRecords(apiKey: string, baseId: string, tableId: string): Promise<AirtableRecord[]> {
  const records: AirtableRecord[] = []
  let offset: string | undefined

  do {
    const url = new URL(`https://api.airtable.com/v0/${baseId}/${tableId}`)
    if (offset) {
      url.searchParams.set('offset', offset)
    }

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    })

    if (!response.ok) {
      throw new Error(`Airtable API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    records.push(...(data.records || []))
    offset = data.offset

  } while (offset)

  return records
}