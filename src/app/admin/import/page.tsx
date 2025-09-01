'use client'
import { useState } from 'react'

interface ImportResult {
  tableName: string
  recordsImported: number
  errors: string[]
  mappings: Record<string, string>
}

interface ImportSummary {
  totalTables: number
  totalRecords: number
  errors: string[]
}

export default function AirtableImport() {
  const [apiKey, setApiKey] = useState('')
  const [baseId, setBaseId] = useState('')
  const [importing, setImporting] = useState(false)
  const [results, setResults] = useState<ImportResult[] | null>(null)
  const [summary, setSummary] = useState<ImportSummary | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function startImport() {
    setImporting(true)
    setError(null)
    setResults(null)
    setSummary(null)

    try {
      const response = await fetch('/api/import-airtable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          airtableApiKey: apiKey, 
          baseId,
          importPlan: 'full' // Future: could support partial imports
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Import failed')
      }

      setResults(data.results)
      setSummary(data.summary)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setImporting(false)
    }
  }

  function getStatusColor(recordsImported: number, errors: string[]) {
    if (errors.length > 0 && recordsImported === 0) return 'text-red-600 bg-red-100'
    if (errors.length > 0 && recordsImported > 0) return 'text-yellow-600 bg-yellow-100'
    if (recordsImported > 0) return 'text-green-600 bg-green-100'
    return 'text-gray-600 bg-gray-100'
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Airtable Data Import</h1>
          <p className="text-gray-600">Import all your Airtable data with relationships preserved</p>
        </div>

        {/* Import Configuration */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Import Configuration</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Airtable API Key
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="pat1234567890abcdef..."
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Base ID
              </label>
              <input
                type="text"
                value={baseId}
                onChange={(e) => setBaseId(e.target.value)}
                placeholder="app1234567890abcd"
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Import Plan</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-medium text-green-600">Phase 1: Core Framework</h4>
                  <ul className="list-disc list-inside text-gray-600 ml-2">
                    <li>Sprints</li>
                    <li>Business Frameworks</li>
                    <li>Categories</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-blue-600">Phase 2: Content</h4>
                  <ul className="list-disc list-inside text-gray-600 ml-2">
                    <li>SOP Library</li>
                    <li>Template Library</li>
                    <li>AI Prompt Library</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-purple-600">Phase 3: Steps & Diagnostics</h4>
                  <ul className="list-disc list-inside text-gray-600 ml-2">
                    <li>Framework Steps</li>
                    <li>Diagnostic Questions</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-orange-600">Phase 4: Users & Progress</h4>
                  <ul className="list-disc list-inside text-gray-600 ml-2">
                    <li>Users</li>
                    <li>User Progress</li>
                    <li>Diagnostic Responses</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={startImport}
              disabled={importing || !apiKey || !baseId}
              className={`px-6 py-3 rounded-md font-semibold ${
                importing 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
              } text-white focus:ring-2 focus:ring-blue-500 disabled:opacity-50`}
            >
              {importing ? 'Importing...' : 'Start Full Import'}
            </button>
            
            {importing && (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <span className="text-gray-600">Processing your 12 tables...</span>
              </div>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <h3 className="text-red-800 font-semibold">Import Failed</h3>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Import Results Summary */}
        {summary && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Import Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{summary.totalTables}</div>
                <div className="text-gray-600">Tables Processed</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{summary.totalRecords}</div>
                <div className="text-gray-600">Records Imported</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600">{summary.errors.length}</div>
                <div className="text-gray-600">Errors</div>
              </div>
            </div>

            {summary.errors.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-red-600 mb-2">Import Errors:</h3>
                <div className="bg-red-50 p-3 rounded max-h-40 overflow-y-auto">
                  {summary.errors.map((error, index) => (
                    <div key={index} className="text-red-700 text-sm">{error}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Detailed Results */}
        {results && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Detailed Results</h2>
            <div className="space-y-4">
              {results.map((result, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-lg">{result.tableName}</h3>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(result.recordsImported, result.errors)}`}>
                      {result.recordsImported > 0 && result.errors.length === 0 ? 'Success' :
                       result.recordsImported > 0 && result.errors.length > 0 ? 'Partial' : 
                       'Failed'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    <div>
                      <span className="text-sm text-gray-500">Records Imported:</span>
                      <span className="ml-2 font-semibold text-green-600">{result.recordsImported}</span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Errors:</span>
                      <span className="ml-2 font-semibold text-red-600">{result.errors.length}</span>
                    </div>
                  </div>

                  {result.errors.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-red-600 mb-2">Errors:</h4>
                      <div className="bg-red-50 p-3 rounded max-h-32 overflow-y-auto">
                        {result.errors.map((error, errorIndex) => (
                          <div key={errorIndex} className="text-red-700 text-sm">{error}</div>
                        ))}
                      </div>
                    </div>
                  )}

                  {Object.keys(result.mappings).length > 0 && (
                    <div className="mt-3">
                      <span className="text-sm text-gray-500">
                        ID Mappings: {Object.keys(result.mappings).length} records mapped
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}