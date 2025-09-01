'use client'
import { useState } from 'react'

export default function DebugImport() {
  const [apiKey, setApiKey] = useState('')
  const [baseId, setBaseId] = useState('')
  const [tableName, setTableName] = useState('sprints')
  const [debugging, setDebugging] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)

  async function debugTable() {
    setDebugging(true)
    setError(null)
    setResults(null)

    try {
      const response = await fetch('/api/debug-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          airtableApiKey: apiKey, 
          baseId,
          tableName
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Debug failed')
      }

      setResults(data)
      
    } catch (err) {
      setError(err.message)
    } finally {
      setDebugging(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Debug Import Errors</h1>
          <p className="text-gray-600">Test individual tables to see detailed error messages</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Table to Debug</label>
              <select
                value={tableName}
                onChange={(e) => setTableName(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md"
              >
                <option value="sprints">Sprints (5 errors)</option>
                <option value="sop_library">SOP Library (30 errors)</option>
                <option value="freedom_diagnostic_questions">Diagnostic Questions (12 errors)</option>
              </select>
            </div>
          </div>
          
          <button
            onClick={debugTable}
            disabled={debugging || !apiKey || !baseId}
            className="px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
          >
            {debugging ? 'Debugging...' : `Debug ${tableName}`}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <h3 className="text-red-800 font-semibold">Debug Error</h3>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {results && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Debug Results: {results.tableName}</h2>
            
            {results.sampleRecord && (
              <div className="mb-6">
                <h3 className="font-semibold mb-2">Sample Airtable Record:</h3>
                <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
                  {JSON.stringify(results.sampleRecord, null, 2)}
                </pre>
              </div>
            )}

            <div className="space-y-4">
              {results.results?.map((result, index) => (
                <div key={index} className="border border-gray-200 rounded p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      result.status === 'success' ? 'bg-green-100 text-green-600' :
                      result.status === 'skipped' ? 'bg-yellow-100 text-yellow-600' :
                      'bg-red-100 text-red-600'
                    }`}>
                      {result.status}
                    </span>
                  </div>
                  
                  {result.error && (
                    <div className="mb-2">
                      <strong className="text-red-600">Error:</strong>
                      <p className="text-red-700">{result.error}</p>
                    </div>
                  )}
                  
                  {result.reason && (
                    <div className="mb-2">
                      <strong className="text-yellow-600">Reason:</strong>
                      <p className="text-yellow-700">{result.reason}</p>
                    </div>
                  )}
                  
                  <div>
                    <strong>Record Data:</strong>
                    <pre className="bg-gray-50 p-2 rounded text-xs mt-1 overflow-auto">
                      {JSON.stringify(result.record, null, 2)}
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}