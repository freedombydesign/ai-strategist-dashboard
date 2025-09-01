import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

// Fixed import script with better error handling and constraint checking

export async function POST(request: NextRequest) {
  try {
    const { airtableApiKey, baseId, tablesToFix } = await request.json()
    
    console.log('[FIX-IMPORT] Starting targeted fixes...')
    
    const results = []
    
    // Fix sprints table
    if (tablesToFix.includes('sprints')) {
      console.log('[FIX-IMPORT] Fixing sprints...')
      const sprintsResult = await fixSprints(airtableApiKey, baseId)
      results.push(sprintsResult)
    }
    
    // Fix SOP library
    if (tablesToFix.includes('sop_library')) {
      console.log('[FIX-IMPORT] Fixing SOPs...')
      const sopResult = await fixSOPs(airtableApiKey, baseId)
      results.push(sopResult)
    }
    
    // Fix diagnostic questions
    if (tablesToFix.includes('freedom_diagnostic_questions')) {
      console.log('[FIX-IMPORT] Fixing diagnostic questions...')
      const questionsResult = await fixQuestions(airtableApiKey, baseId)
      results.push(questionsResult)
    }
    
    // Fix users
    if (tablesToFix.includes('framework_users')) {
      console.log('[FIX-IMPORT] Fixing users...')
      const usersResult = await fixUsers(airtableApiKey, baseId)
      results.push(usersResult)
    }

    return NextResponse.json({
      success: true,
      results,
      summary: {
        totalTables: results.length,
        totalRecords: results.reduce((sum, r) => sum + r.recordsImported, 0),
        errors: results.flatMap(r => r.errors)
      }
    })

  } catch (error) {
    console.error('[FIX-IMPORT] Error:', error)
    return NextResponse.json({
      error: 'Fix import failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

async function fixSprints(apiKey: string, baseId: string) {
  const result = {
    tableName: 'sprints',
    recordsImported: 0,
    errors: []
  }
  
  try {
    const records = await fetchAirtableRecords(apiKey, baseId, 'tbl24cSX2YX60xZec')
    
    for (const record of records) {
      try {
        const sprintKey = `S${record.fields['Week Number'] || result.recordsImported + 1}`
        
        // Check if already exists
        const { data: existing } = await supabase
          .from('sprints')
          .select('sprint_key')
          .eq('sprint_key', sprintKey)
          .single()
        
        if (existing) {
          console.log(`[FIX-IMPORT] Sprint ${sprintKey} already exists, skipping`)
          continue
        }
        
        const sprintData = {
          sprint_key: sprintKey,
          name: record.fields['Name'] || 'Unnamed Sprint',
          full_title: record.fields['Name'] || 'Unnamed Sprint',
          description: record.fields['Description'] || '',
          methodology: record.fields['Goal'] || 'Sprint methodology',
          week_number: record.fields['Week Number'] || null,
          objectives: JSON.stringify([record.fields['Goal'] || '']),
          key_strategies: JSON.stringify([record.fields['Steps copy'] || '']),
          common_challenges: JSON.stringify([]),
          success_indicators: JSON.stringify([`Save ${record.fields['Time Saved/Week (hrs)'] || 0} hours per week`])
        }

        const { error } = await supabase
          .from('sprints')
          .insert(sprintData)

        if (error) {
          console.error('[FIX-IMPORT] Sprint insert error:', error)
          result.errors.push(`${record.fields['Name']}: ${error.message}`)
        } else {
          result.recordsImported++
        }

      } catch (err) {
        result.errors.push(`${record.fields['Name']}: ${err instanceof Error ? err.message : 'Unknown error'}`)
      }
    }
  } catch (error) {
    result.errors.push(`Fetch error: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
  
  return result
}

async function fixSOPs(apiKey: string, baseId: string) {
  const result = {
    tableName: 'sop_library', 
    recordsImported: 0,
    errors: []
  }
  
  try {
    const records = await fetchAirtableRecords(apiKey, baseId, 'tbltetGLQm6rCwJEO')
    
    for (const record of records) {
      try {
        // Check if already exists by title
        const { data: existing } = await supabase
          .from('sop_library')
          .select('title')
          .eq('title', record.fields['Title'])
          .single()
        
        if (existing) {
          console.log(`[FIX-IMPORT] SOP "${record.fields['Title']}" already exists, skipping`)
          continue
        }
        
        const sopData = {
          title: record.fields['Title'] || 'Unnamed SOP',
          category: Array.isArray(record.fields['Category']) ? record.fields['Category'][0] : record.fields['Category'] || null,
          keywords: record.fields['Keywords'] || '',
          content_steps: record.fields['Content/Steps'] || '',
          format: record.fields['Format'] || null
        }

        const { error } = await supabase
          .from('sop_library')
          .insert(sopData)

        if (error) {
          console.error('[FIX-IMPORT] SOP insert error:', error)
          result.errors.push(`${record.fields['Title']}: ${error.message}`)
        } else {
          result.recordsImported++
        }

      } catch (err) {
        result.errors.push(`${record.fields['Title']}: ${err instanceof Error ? err.message : 'Unknown error'}`)
      }
    }
  } catch (error) {
    result.errors.push(`Fetch error: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
  
  return result
}

async function fixQuestions(apiKey: string, baseId: string) {
  const result = {
    tableName: 'freedom_diagnostic_questions',
    recordsImported: 0,
    errors: []
  }
  
  try {
    const records = await fetchAirtableRecords(apiKey, baseId, 'tblfx5DhXexF08iwJ')
    
    for (const record of records) {
      try {
        const questionId = record.fields['Question ID'] || `Q${result.recordsImported + 1}`
        
        // Check if already exists
        const { data: existing } = await supabase
          .from('freedom_diagnostic_questions')
          .select('question_id')
          .eq('question_id', questionId)
          .single()
        
        if (existing) {
          console.log(`[FIX-IMPORT] Question ${questionId} already exists, skipping`)
          continue
        }
        
        const questionData = {
          question_id: questionId,
          module: record.fields['Module'] || '',
          sprint_title: record.fields['Sprint Title'] || '',
          field_name: record.fields['Field Name'] || '',
          question_text: record.fields['Question'] || '',
          options_text: record.fields['Options'] || '',
          category: Array.isArray(record.fields['Category']) ? record.fields['Category'][0] : record.fields['Category'] || null
        }

        const { error } = await supabase
          .from('freedom_diagnostic_questions')
          .insert(questionData)

        if (error) {
          console.error('[FIX-IMPORT] Question insert error:', error)
          result.errors.push(`${questionId}: ${error.message}`)
        } else {
          result.recordsImported++
        }

      } catch (err) {
        const questionId = record.fields['Question ID'] || 'Unknown'
        result.errors.push(`${questionId}: ${err instanceof Error ? err.message : 'Unknown error'}`)
      }
    }
  } catch (error) {
    result.errors.push(`Fetch error: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
  
  return result
}

async function fixUsers(apiKey: string, baseId: string) {
  const result = {
    tableName: 'framework_users',
    recordsImported: 0,
    errors: []
  }
  
  try {
    const records = await fetchAirtableRecords(apiKey, baseId, 'tblmMleXmZBHwWkZl')
    
    for (const record of records) {
      try {
        // Use Airtable record ID as user_id
        const userId = record.id
        
        // Check if already exists
        const { data: existing } = await supabase
          .from('framework_users')
          .select('user_id')
          .eq('user_id', userId)
          .single()
        
        if (existing) {
          console.log(`[FIX-IMPORT] User ${userId} already exists, skipping`)
          continue
        }
        
        const userData = {
          user_id: userId,
          name: record.fields['Name'] || '',
          email: record.fields['Email'] || '',
          business_size: record.fields['Business Size'] || '',
          niche: record.fields['Niche'] || '',
          freedom_score: record.fields['Freedom Score'] || null,
          start_date: record.fields['Start Date'] || null,
          current_sprint_key: null // We'll handle sprint relationships later
        }

        const { error } = await supabase
          .from('framework_users')
          .insert(userData)

        if (error) {
          console.error('[FIX-IMPORT] User insert error:', error)
          result.errors.push(`${record.fields['Name'] || userId}: ${error.message}`)
        } else {
          result.recordsImported++
        }

      } catch (err) {
        const userName = record.fields['Name'] || record.id || 'Unknown'
        result.errors.push(`${userName}: ${err instanceof Error ? err.message : 'Unknown error'}`)
      }
    }
  } catch (error) {
    result.errors.push(`Fetch error: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
  
  return result
}

async function fetchAirtableRecords(apiKey: string, baseId: string, tableId: string) {
  const records = []
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