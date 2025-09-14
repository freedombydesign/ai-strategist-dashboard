import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function POST(request: NextRequest) {
  try {
    const { airtableApiKey, baseId } = await request.json()
    
    // Create a fresh Supabase client to avoid schema cache issues
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    console.log('[SIMPLE-IMPORT] Starting fresh import with minimal schema...')
    
    const results: any[] = []
    
    // Test sprints import with minimal data
    try {
      console.log('[SIMPLE-IMPORT] Testing sprints...')
      const sprintRecords = await fetchAirtableRecords(airtableApiKey, baseId, 'tbl24cSX2YX60xZec')
      
      let importedCount = 0
      const errors: string[] = []
      
      for (const record of sprintRecords.slice(0, 2)) { // Test with first 2 records
        try {
          // Extremely minimal data
          const { error } = await supabase
            .from('sprints')
            .insert({
              name: record.fields['Name'] || 'Test Sprint'
            })
          
          if (error) {
            errors.push(`${record.fields['Name']}: ${error.message}`)
            console.error('[SIMPLE-IMPORT] Sprint error:', error)
          } else {
            importedCount++
          }
        } catch (err) {
          errors.push(`${record.fields['Name']}: ${err}`)
        }
      }
      
      results.push({
        tableName: 'sprints',
        recordsImported: importedCount,
        errors: errors
      })
      
    } catch (err) {
      results.push({
        tableName: 'sprints', 
        recordsImported: 0,
        errors: [`Fetch error: ${err}`]
      })
    }
    
    // Test questions import
    try {
      console.log('[SIMPLE-IMPORT] Testing questions...')
      const questionRecords = await fetchAirtableRecords(airtableApiKey, baseId, 'tblfx5DhXexF08iwJ')
      
      let importedCount = 0
      const errors: string[] = []
      
      for (const record of questionRecords.slice(0, 2)) { // Test with first 2 records
        try {
          // Extremely minimal data
          const { error } = await supabase
            .from('freedom_diagnostic_questions')
            .insert({
              question_text: record.fields['Question'] || 'Test Question'
            })
          
          if (error) {
            errors.push(`${record.fields['Question']}: ${error.message}`)
            console.error('[SIMPLE-IMPORT] Question error:', error)
          } else {
            importedCount++
          }
        } catch (err) {
          errors.push(`${record.fields['Question']}: ${err}`)
        }
      }
      
      results.push({
        tableName: 'freedom_diagnostic_questions',
        recordsImported: importedCount,
        errors: errors
      })
      
    } catch (err) {
      results.push({
        tableName: 'freedom_diagnostic_questions',
        recordsImported: 0,
        errors: [`Fetch error: ${err}`]
      })
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
    console.error('[SIMPLE-IMPORT] Error:', error)
    return NextResponse.json({
      error: 'Simple import failed',
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