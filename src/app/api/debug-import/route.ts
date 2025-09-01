import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

// Debug import to see actual error messages

export async function POST(request: NextRequest) {
  try {
    const { airtableApiKey, baseId, tableName } = await request.json()
    
    console.log(`[DEBUG-IMPORT] Testing ${tableName} import...`)
    
    if (tableName === 'sprints') {
      return await debugSprints(airtableApiKey, baseId)
    } else if (tableName === 'sop_library') {
      return await debugSOPs(airtableApiKey, baseId)
    } else if (tableName === 'freedom_diagnostic_questions') {
      return await debugQuestions(airtableApiKey, baseId)
    }
    
    return NextResponse.json({ error: 'Table not supported for debug' }, { status: 400 })
    
  } catch (error) {
    console.error('[DEBUG-IMPORT] Error:', error)
    return NextResponse.json({
      error: 'Debug failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

async function debugSprints(apiKey: string, baseId: string) {
  try {
    console.log('[DEBUG] Fetching sprints from Airtable...')
    
    const records = await fetchAirtableRecords(apiKey, baseId, 'tbl24cSX2YX60xZec')
    console.log(`[DEBUG] Got ${records.length} sprint records`)
    
    const results = []
    
    for (const record of records.slice(0, 1)) { // Test just one record
      console.log('[DEBUG] Raw record:', JSON.stringify(record.fields, null, 2))
      
      try {
        // Check if sprint_key already exists
        const sprintKey = `S${record.fields['Week Number'] || 1}`
        console.log('[DEBUG] Checking if sprint_key exists:', sprintKey)
        
        const { data: existingSprint } = await supabase
          .from('sprints')
          .select('sprint_key')
          .eq('sprint_key', sprintKey)
          .single()
          
        if (existingSprint) {
          console.log('[DEBUG] Sprint already exists:', sprintKey)
          results.push({ status: 'skipped', reason: 'already exists', record: record.fields })
          continue
        }
        
        const sprintData = {
          sprint_key: sprintKey,
          name: record.fields['Name'] || 'Unnamed Sprint',
          full_title: record.fields['Name'] || 'Unnamed Sprint',
          description: record.fields['Description'] || '',
          methodology: `${record.fields['Goal'] || 'Sprint methodology'} - Time Saved: ${record.fields['Time Saved/Week (hrs)'] || 0} hours per week`
        }
        
        console.log('[DEBUG] Attempting to insert:', JSON.stringify(sprintData, null, 2))
        
        const { data, error } = await supabase
          .from('sprints')
          .insert(sprintData)
          .select()
        
        if (error) {
          console.error('[DEBUG] Insert error:', error)
          results.push({ status: 'error', error: error.message, record: record.fields })
        } else {
          console.log('[DEBUG] Insert success:', data)
          results.push({ status: 'success', data, record: record.fields })
        }
        
      } catch (err) {
        console.error('[DEBUG] Processing error:', err)
        results.push({ 
          status: 'processing_error', 
          error: err instanceof Error ? err.message : 'Unknown processing error',
          record: record.fields 
        })
      }
    }
    
    return NextResponse.json({
      tableName: 'sprints',
      results,
      sampleRecord: records[0]?.fields || null
    })
    
  } catch (error) {
    console.error('[DEBUG] Sprint debug error:', error)
    return NextResponse.json({
      error: 'Sprint debug failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

async function debugSOPs(apiKey: string, baseId: string) {
  try {
    console.log('[DEBUG] Fetching SOPs from Airtable...')
    
    const records = await fetchAirtableRecords(apiKey, baseId, 'tbltetGLQm6rCwJEO')
    console.log(`[DEBUG] Got ${records.length} SOP records`)
    
    const results = []
    
    for (const record of records.slice(0, 1)) { // Test just one record
      console.log('[DEBUG] Raw SOP record:', JSON.stringify(record.fields, null, 2))
      
      try {
        const sopData = {
          title: record.fields['Title'] || 'Unnamed SOP',
          category: Array.isArray(record.fields['Category']) ? record.fields['Category'][0] : record.fields['Category'] || null,
          keywords: record.fields['Keywords'] || '',
          content_steps: record.fields['Content/Steps'] || '',
          format: record.fields['Format'] || null
        }
        
        console.log('[DEBUG] Attempting to insert SOP:', JSON.stringify(sopData, null, 2))
        
        const { data, error } = await supabase
          .from('sop_library')
          .insert(sopData)
          .select()
        
        if (error) {
          console.error('[DEBUG] SOP Insert error:', error)
          results.push({ status: 'error', error: error.message, record: record.fields })
        } else {
          console.log('[DEBUG] SOP Insert success:', data)
          results.push({ status: 'success', data, record: record.fields })
        }
        
      } catch (err) {
        console.error('[DEBUG] SOP Processing error:', err)
        results.push({ 
          status: 'processing_error', 
          error: err instanceof Error ? err.message : 'Unknown processing error',
          record: record.fields 
        })
      }
    }
    
    return NextResponse.json({
      tableName: 'sop_library',
      results,
      sampleRecord: records[0]?.fields || null
    })
    
  } catch (error) {
    console.error('[DEBUG] SOP debug error:', error)
    return NextResponse.json({
      error: 'SOP debug failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

async function debugQuestions(apiKey: string, baseId: string) {
  try {
    console.log('[DEBUG] Fetching Questions from Airtable...')
    
    const records = await fetchAirtableRecords(apiKey, baseId, 'tblfx5DhXexF08iwJ')
    console.log(`[DEBUG] Got ${records.length} question records`)
    
    const results = []
    
    for (const record of records.slice(0, 1)) { // Test just one record
      console.log('[DEBUG] Raw Question record:', JSON.stringify(record.fields, null, 2))
      
      try {
        const questionData = {
          question_id: record.fields['Question ID'] || `Q${Math.random().toString(36).substr(2, 9)}`,
          module: record.fields['Module'] || '',
          sprint_title: record.fields['Sprint Title'] || '',
          field_name: record.fields['Field Name'] || '',
          question_text: record.fields['Question'] || '',
          options_text: record.fields['Options'] || '',
          category: Array.isArray(record.fields['Category']) ? record.fields['Category'][0] : record.fields['Category'] || null
        }
        
        console.log('[DEBUG] Attempting to insert Question:', JSON.stringify(questionData, null, 2))
        
        const { data, error } = await supabase
          .from('freedom_diagnostic_questions')
          .insert(questionData)
          .select()
        
        if (error) {
          console.error('[DEBUG] Question Insert error:', error)
          results.push({ status: 'error', error: error.message, record: record.fields })
        } else {
          console.log('[DEBUG] Question Insert success:', data)
          results.push({ status: 'success', data, record: record.fields })
        }
        
      } catch (err) {
        console.error('[DEBUG] Question Processing error:', err)
        results.push({ 
          status: 'processing_error', 
          error: err instanceof Error ? err.message : 'Unknown processing error',
          record: record.fields 
        })
      }
    }
    
    return NextResponse.json({
      tableName: 'freedom_diagnostic_questions',
      results,
      sampleRecord: records[0]?.fields || null
    })
    
  } catch (error) {
    console.error('[DEBUG] Question debug error:', error)
    return NextResponse.json({
      error: 'Question debug failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
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