import { NextRequest, NextResponse } from 'next/server'

// Airtable Diagnostic API Route
// This will help inventory Ruth's Airtable data and suggest import strategies

export async function POST(request: NextRequest) {
  try {
    const { airtableApiKey, baseId } = await request.json()
    
    if (!airtableApiKey || !baseId) {
      return NextResponse.json({
        error: 'Missing Airtable API key or Base ID',
        instructions: `
To get these values:
1. Go to https://airtable.com/create/tokens
2. Create a personal access token with 'data.records:read' scope
3. Copy your API key
4. Get your Base ID from the URL: https://airtable.com/[BASE_ID]/...
        `
      }, { status: 400 })
    }

    console.log('[AIRTABLE-DIAGNOSTIC] Starting diagnostic for base:', baseId.substring(0, 10) + '...')

    // Get base schema
    const schemaResponse = await fetch(`https://api.airtable.com/v0/meta/bases/${baseId}/tables`, {
      headers: {
        'Authorization': `Bearer ${airtableApiKey}`
      }
    })

    if (!schemaResponse.ok) {
      const error = await schemaResponse.text()
      return NextResponse.json({
        error: 'Failed to connect to Airtable',
        details: error,
        status: schemaResponse.status
      }, { status: 400 })
    }

    const schemaData = await schemaResponse.json()
    console.log('[AIRTABLE-DIAGNOSTIC] Found', schemaData.tables?.length || 0, 'tables')

    const diagnostic = {
      baseId,
      totalTables: schemaData.tables?.length || 0,
      tables: [],
      importRecommendations: [],
      migrationPlan: []
    }

    // Analyze each table
    for (const table of schemaData.tables || []) {
      console.log('[AIRTABLE-DIAGNOSTIC] Analyzing table:', table.name)
      
      // Get sample records to understand data structure
      try {
        const recordsResponse = await fetch(
          `https://api.airtable.com/v0/${baseId}/${table.id}?maxRecords=5`,
          {
            headers: {
              'Authorization': `Bearer ${airtableApiKey}`
            }
          }
        )

        let sampleRecords = []
        let recordCount = 0
        
        if (recordsResponse.ok) {
          const recordsData = await recordsResponse.json()
          sampleRecords = recordsData.records || []
          recordCount = recordsData.records?.length || 0
        }

        const tableInfo = {
          name: table.name,
          id: table.id,
          fieldCount: table.fields?.length || 0,
          recordCount,
          fields: table.fields?.map(field => ({
            name: field.name,
            type: field.type,
            options: field.options
          })) || [],
          sampleData: sampleRecords.slice(0, 2).map(record => record.fields),
          recommendedSupabaseTable: suggestSupabaseTable(table.name, table.fields || []),
          importComplexity: calculateImportComplexity(table.fields || [])
        }

        diagnostic.tables.push(tableInfo)

        // Generate import recommendations
        diagnostic.importRecommendations.push(generateImportRecommendation(tableInfo))
        
      } catch (recordError) {
        console.error('[AIRTABLE-DIAGNOSTIC] Error getting records for table:', table.name, recordError)
        
        diagnostic.tables.push({
          name: table.name,
          id: table.id,
          fieldCount: table.fields?.length || 0,
          recordCount: 'Unknown - API Error',
          fields: table.fields?.map(field => ({
            name: field.name,
            type: field.type
          })) || [],
          recommendedSupabaseTable: suggestSupabaseTable(table.name, table.fields || []),
          importComplexity: 'Unknown',
          error: 'Could not fetch records'
        })
      }
    }

    // Generate overall migration plan
    diagnostic.migrationPlan = generateMigrationPlan(diagnostic.tables)

    console.log('[AIRTABLE-DIAGNOSTIC] Diagnostic complete')

    return NextResponse.json({
      success: true,
      diagnostic,
      nextSteps: [
        '1. Review the recommended table mappings below',
        '2. Run the complete-framework-migration.sql in Supabase first',
        '3. Export priority tables from Airtable as CSV',
        '4. Import to Supabase using the Table Editor',
        '5. Or use our automated import scripts for complex data'
      ]
    })

  } catch (error) {
    console.error('[AIRTABLE-DIAGNOSTIC] Error:', error)
    
    return NextResponse.json({
      error: 'Diagnostic failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

function suggestSupabaseTable(tableName: string, fields: any[]): string {
  const name = tableName.toLowerCase()
  
  // Smart table mapping based on name and structure
  if (name.includes('sprint') || name.includes('freedom') && name.includes('design')) {
    return 'sprints'
  }
  if (name.includes('guidance') || name.includes('strategy') || name.includes('framework')) {
    return 'strategic_guidance'
  }
  if (name.includes('client') || name.includes('business') || name.includes('context')) {
    return 'business_context'
  }
  if (name.includes('score') || name.includes('assessment') || name.includes('component')) {
    return 'freedom_score_components'
  }
  if (name.includes('content') || name.includes('template') || name.includes('copy')) {
    return 'content_library'
  }
  if (name.includes('user') || name.includes('assignment') || name.includes('progress')) {
    return 'user_sprint_assignments'
  }
  if (name.includes('website') || name.includes('intelligence') || name.includes('analysis')) {
    return 'website_intelligence'
  }
  if (name.includes('personality') || name.includes('ai') || name.includes('mode')) {
    return 'ai_personalities'
  }
  
  return 'custom_table_needed'
}

function calculateImportComplexity(fields: any[]): string {
  let complexity = 0
  
  for (const field of fields) {
    switch (field.type) {
      case 'multipleRecordLinks':
      case 'lookup':
      case 'rollup':
        complexity += 3
        break
      case 'multipleSelects':
      case 'multipleAttachments':
        complexity += 2
        break
      case 'formula':
      case 'count':
      case 'autoNumber':
        complexity += 1
        break
    }
  }
  
  if (complexity === 0) return 'Simple'
  if (complexity <= 3) return 'Moderate'
  if (complexity <= 6) return 'Complex'
  return 'Very Complex'
}

function generateImportRecommendation(tableInfo: any): any {
  const recommendation = {
    tableName: tableInfo.name,
    targetSupabaseTable: tableInfo.recommendedSupabaseTable,
    importMethod: 'csv',
    priority: 'medium',
    issues: [],
    steps: []
  }

  // Determine import priority
  const name = tableInfo.name.toLowerCase()
  if (name.includes('sprint') || name.includes('framework') || name.includes('guidance')) {
    recommendation.priority = 'high'
    recommendation.steps.push('Import this first - core framework data')
  }
  
  if (name.includes('client') || name.includes('user') || name.includes('business')) {
    recommendation.priority = 'high'
    recommendation.steps.push('Import early - user context needed for AI')
  }

  // Check for complex field types
  const complexFields = tableInfo.fields?.filter(f => 
    ['multipleRecordLinks', 'lookup', 'rollup', 'formula'].includes(f.type)
  ) || []
  
  if (complexFields.length > 0) {
    recommendation.importMethod = 'api_script'
    recommendation.issues.push(`Contains ${complexFields.length} complex fields requiring custom script`)
    recommendation.steps.push('Use API import script for relationships and formulas')
  } else {
    recommendation.steps.push('Can use simple CSV export/import method')
  }

  // Check if target table exists
  if (tableInfo.recommendedSupabaseTable === 'custom_table_needed') {
    recommendation.issues.push('May need custom Supabase table creation')
    recommendation.steps.push('Review table structure and create matching Supabase table')
  }

  return recommendation
}

function generateMigrationPlan(tables: any[]): string[] {
  const plan = []
  
  // High priority tables first
  const highPriorityTables = tables.filter(t => 
    t.name.toLowerCase().includes('sprint') || 
    t.name.toLowerCase().includes('framework') ||
    t.name.toLowerCase().includes('guidance')
  )
  
  if (highPriorityTables.length > 0) {
    plan.push(`Phase 1: Import core framework tables (${highPriorityTables.map(t => t.name).join(', ')})`)
  }
  
  // User/business context tables
  const contextTables = tables.filter(t => 
    t.name.toLowerCase().includes('client') || 
    t.name.toLowerCase().includes('business') ||
    t.name.toLowerCase().includes('user')
  )
  
  if (contextTables.length > 0) {
    plan.push(`Phase 2: Import user/business context (${contextTables.map(t => t.name).join(', ')})`)
  }
  
  // Content and templates
  const contentTables = tables.filter(t => 
    t.name.toLowerCase().includes('content') || 
    t.name.toLowerCase().includes('template') ||
    t.name.toLowerCase().includes('copy')
  )
  
  if (contentTables.length > 0) {
    plan.push(`Phase 3: Import content library (${contentTables.map(t => t.name).join(', ')})`)
  }
  
  // Everything else
  const remainingTables = tables.filter(t => 
    !highPriorityTables.includes(t) && 
    !contextTables.includes(t) && 
    !contentTables.includes(t)
  )
  
  if (remainingTables.length > 0) {
    plan.push(`Phase 4: Import remaining tables (${remainingTables.map(t => t.name).join(', ')})`)
  }
  
  plan.push('Phase 5: Validate data integrity and test AI functionality')
  
  return plan
}