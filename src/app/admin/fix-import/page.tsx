'use client'
import { useState } from 'react'

export default function FixImport() {
  const [apiKey, setApiKey] = useState('')
  const [baseId, setBaseId] = useState('')
  const [selectedTables, setSelectedTables] = useState([
    'sprints', 
    'sop_library', 
    'freedom_diagnostic_questions', 
    'framework_users'
  ])
  const [fixing, setFixing] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)

  const failedTables = [
    { key: 'sprints', label: 'Sprints (5 errors)', description: 'Your Freedom by Design sprint methodology' },
    { key: 'sop_library', label: 'SOP Library (30 errors)', description: 'Standard Operating Procedures' },
    { key: 'freedom_diagnostic_questions', label: 'Diagnostic Questions (12 errors)', description: 'Freedom Score assessment questions' },
    { key: 'framework_users', label: 'Framework Users (9 errors)', description: 'User accounts and progress tracking' }
  ]

  async function fixImport() {
    setFixing(true)
    setError(null)
    setResults(null)

    try {
      const response = await fetch('/api/fix-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          airtableApiKey: apiKey, 
          baseId,
          tablesToFix: selectedTables
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Fix failed')
      }

      setResults(data)
      
    } catch (err) {
      setError(err.message)
    } finally {
      setFixing(false)
    }
  }

  function toggleTable(tableKey) {
    setSelectedTables(prev => 
      prev.includes(tableKey) 
        ? prev.filter(t => t !== tableKey)
        : [...prev, tableKey]
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Fix Import Errors</h1>
          <p className="text-gray-600">Targeted fixes for tables that failed during import with proper constraint handling</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">API Key</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Base ID</label>
              <input
                type="text"
                value={baseId}
                onChange={(e) => setBaseId(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md"
              />
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Select Tables to Fix:</h3>
            <div className="space-y-3">
              {failedTables.map(table => (
                <div key={table.key} className="flex items-center">
                  <input
                    type="checkbox"
                    id={table.key}
                    checked={selectedTables.includes(table.key)}
                    onChange={() => toggleTable(table.key)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor={table.key} className="ml-3">
                    <div className="text-sm font-medium text-gray-900">{table.label}</div>
                    <div className="text-sm text-gray-500">{table.description}</div>
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <h4 className="text-sm font-semibold text-blue-800 mb-2">What This Fix Does:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Checks for existing records to prevent duplicates</li>
              <li>• Handles constraint violations and unique key conflicts</li>
              <li>• Maps Airtable data correctly to Supabase columns</li>
              <li>• Provides detailed error messages for any remaining issues</li>
            </ul>
          </div>

          <div className="space-x-4">
            <button
              onClick={async () => {
                setFixing(true)
                setError(null)
                try {
                  const response = await fetch('/api/simple-import', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ airtableApiKey: apiKey, baseId })
                  })
                  const data = await response.json()
                  if (!response.ok) throw new Error(data.error || 'Test failed')
                  setResults(data)
                } catch (err: any) {
                  setError(err.message)
                } finally {
                  setFixing(false)
                }
              }}
              disabled={fixing || !apiKey || !baseId}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium"
            >
              Test Simple Import (2 records each)
            </button>
            
            <button
              onClick={async () => {
                try {
                  const response = await fetch('/api/check-imported-data')
                  const data = await response.json()
                  console.log('📊 IMPORTED DATA ANALYSIS:', data)
                  alert(`Data Check Complete!\n\nSprints: ${data.imported_data.sprints.count}\nSOPs: ${data.imported_data.sop_library.count}\nTemplates: ${data.imported_data.template_library.count}\nFrameworks: ${data.imported_data.business_frameworks.count}\nQuestions: ${data.imported_data.freedom_diagnostic_questions.count}\nModules: ${data.imported_data.framework_modules.count}\nGuidance: ${data.imported_data.strategic_guidance.count}\n\nDecision Call Data: ${data.summary.has_decision_call_data ? 'Found!' : 'Not found'}\n\nCheck console for full details.`)
                } catch (err) {
                  console.error('Error checking data:', err)
                  alert('Error checking imported data')
                }
              }}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium"
            >
              Check Imported Data
            </button>
            
            <button
              onClick={async () => {
                try {
                  const response = await fetch('/api/show-template-data')
                  const data = await response.json()
                  console.log('📋 TEMPLATE ANALYSIS:', data)
                  
                  if (data.success) {
                    let alertMsg = 'DATA ANALYSIS:\n\n'
                    
                    if (data.steps_analysis) {
                      const steps = data.steps_analysis
                      alertMsg += `STEPS TABLE:\n- Count: ${steps.total_count}\n- Columns: ${steps.columns.join(', ')}\n- Sample Resource Links: ${steps.sample_steps[0]?.resource_links}\n\n`
                    } else {
                      alertMsg += 'STEPS TABLE: Not found\n\n'
                    }
                    
                    if (data.template_analysis) {
                      const templates = data.template_analysis
                      alertMsg += `TEMPLATES TABLE:\n- Count: ${templates.total_count}\n- Columns: ${templates.available_columns.join(', ')}\n- Has Attachments: ${templates.sample_templates[0]?.has_attachments}\n\n`
                    } else {
                      alertMsg += 'TEMPLATES TABLE: Not found\n\n'
                    }
                    
                    alertMsg += 'Check console for full raw data!'
                    alert(alertMsg)
                  } else {
                    alert(`No data found: ${data.message}`)
                  }
                } catch (err) {
                  console.error('Error checking templates:', err)
                  alert('Error checking template data')
                }
              }}
              className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-md font-medium"
            >
              Show Template Details
            </button>
            
            <button
              onClick={fixImport}
              disabled={fixing || !apiKey || !baseId || selectedTables.length === 0}
              className={`px-6 py-3 rounded-md font-semibold ${
                fixing 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-red-600 hover:bg-red-700'
              } text-white focus:ring-2 focus:ring-red-500 disabled:opacity-50`}
            >
              {fixing ? 'Fixing Import...' : `Fix ${selectedTables.length} Tables`}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <h3 className="text-red-800 font-semibold">Fix Failed</h3>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {results && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Fix Results Summary</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{results.summary.totalTables}</div>
                  <div className="text-gray-600">Tables Fixed</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{results.summary.totalRecords}</div>
                  <div className="text-gray-600">Records Added</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600">{results.summary.errors.length}</div>
                  <div className="text-gray-600">Remaining Errors</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Detailed Fix Results</h2>
              <div className="space-y-4">
                {results.results.map((result, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-lg">{result.tableName}</h3>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        result.recordsImported > 0 && result.errors.length === 0 ? 'bg-green-100 text-green-600' :
                        result.recordsImported > 0 && result.errors.length > 0 ? 'bg-yellow-100 text-yellow-600' : 
                        'bg-red-100 text-red-600'
                      }`}>
                        {result.recordsImported > 0 && result.errors.length === 0 ? 'Fixed' :
                         result.recordsImported > 0 && result.errors.length > 0 ? 'Partial' : 
                         'Failed'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                      <div>
                        <span className="text-sm text-gray-500">Records Added:</span>
                        <span className="ml-2 font-semibold text-green-600">{result.recordsImported}</span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Errors:</span>
                        <span className="ml-2 font-semibold text-red-600">{result.errors.length}</span>
                      </div>
                    </div>

                    {result.errors.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-red-600 mb-2">Remaining Errors:</h4>
                        <div className="bg-red-50 p-3 rounded max-h-32 overflow-y-auto">
                          {result.errors.map((error, errorIndex) => (
                            <div key={errorIndex} className="text-red-700 text-sm">{error}</div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}