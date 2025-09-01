'use client'
import { useState } from 'react'

interface DiagnosticResult {
  baseId: string
  totalTables: number
  tables: Array<{
    name: string
    id: string
    fieldCount: number
    recordCount: number | string
    fields: Array<{
      name: string
      type: string
      options?: any
    }>
    sampleData?: any[]
    recommendedSupabaseTable: string
    importComplexity: string
    error?: string
  }>
  importRecommendations: any[]
  migrationPlan: string[]
}

export default function AirtableDiagnostic() {
  const [apiKey, setApiKey] = useState('')
  const [baseId, setBaseId] = useState('')
  const [loading, setLoading] = useState(false)
  const [diagnostic, setDiagnostic] = useState<DiagnosticResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function runDiagnostic() {
    setLoading(true)
    setError(null)
    setDiagnostic(null)

    try {
      const response = await fetch('/api/diagnose-airtable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ airtableApiKey: apiKey, baseId })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Diagnostic failed')
      }

      setDiagnostic(data.diagnostic)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  function getComplexityColor(complexity: string) {
    switch (complexity) {
      case 'Simple': return 'text-green-600 bg-green-100'
      case 'Moderate': return 'text-yellow-600 bg-yellow-100'
      case 'Complex': return 'text-orange-600 bg-orange-100'
      case 'Very Complex': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  function getPriorityColor(priority: string) {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'low': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Airtable Data Diagnostic</h1>
          <p className="text-gray-600">Analyze your Airtable data and get import recommendations</p>
        </div>

        {/* API Configuration */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Configure Airtable Access</h2>
          
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
              <p className="text-xs text-gray-500 mt-1">
                Get from <a href="https://airtable.com/create/tokens" target="_blank" rel="noopener noreferrer" className="text-blue-600">airtable.com/create/tokens</a>
              </p>
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
              <p className="text-xs text-gray-500 mt-1">
                Found in your Airtable URL: airtable.com/[BASE_ID]/...
              </p>
            </div>
          </div>

          <button
            onClick={runDiagnostic}
            disabled={loading || !apiKey || !baseId}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Analyzing...' : 'Run Diagnostic'}
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <h3 className="text-red-800 font-semibold">Error</h3>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Results */}
        {diagnostic && (
          <div className="space-y-8">
            {/* Overview */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{diagnostic.totalTables}</div>
                  <div className="text-gray-600">Total Tables</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {diagnostic.tables.reduce((sum, t) => sum + (typeof t.recordCount === 'number' ? t.recordCount : 0), 0)}
                  </div>
                  <div className="text-gray-600">Sample Records</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">
                    {diagnostic.importRecommendations.filter(r => r.priority === 'high').length}
                  </div>
                  <div className="text-gray-600">High Priority</div>
                </div>
              </div>
            </div>

            {/* Migration Plan */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Recommended Migration Plan</h2>
              <div className="space-y-2">
                {diagnostic.migrationPlan.map((step, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                      {index + 1}
                    </div>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Table Analysis */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Table Analysis</h2>
              <div className="space-y-6">
                {diagnostic.tables.map((table, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">{table.name}</h3>
                      <div className="flex space-x-2">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${getComplexityColor(table.importComplexity)}`}>
                          {table.importComplexity}
                        </span>
                        <span className="px-2 py-1 rounded text-xs font-semibold bg-blue-100 text-blue-600">
                          → {table.recommendedSupabaseTable}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <span className="text-sm text-gray-500">Fields:</span>
                        <span className="ml-2 font-semibold">{table.fieldCount}</span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Records:</span>
                        <span className="ml-2 font-semibold">{table.recordCount}</span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Table ID:</span>
                        <span className="ml-2 font-mono text-xs">{table.id}</span>
                      </div>
                    </div>

                    {/* Field Types */}
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Field Types</h4>
                      <div className="flex flex-wrap gap-2">
                        {table.fields.map((field, fieldIndex) => (
                          <span key={fieldIndex} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                            {field.name} ({field.type})
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Sample Data */}
                    {table.sampleData && table.sampleData.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Sample Data</h4>
                        <div className="bg-gray-50 p-3 rounded text-xs">
                          <pre className="whitespace-pre-wrap">
                            {JSON.stringify(table.sampleData[0], null, 2).substring(0, 500)}...
                          </pre>
                        </div>
                      </div>
                    )}

                    {table.error && (
                      <div className="bg-yellow-50 border border-yellow-200 p-3 rounded">
                        <span className="text-yellow-800 text-sm">{table.error}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Import Recommendations */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Import Recommendations</h2>
              <div className="space-y-4">
                {diagnostic.importRecommendations.map((rec, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold">{rec.tableName}</h3>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${getPriorityColor(rec.priority)}`}>
                        {rec.priority} priority
                      </span>
                    </div>

                    <div className="mb-3">
                      <span className="text-sm text-gray-600">Import Method: </span>
                      <span className="font-semibold">{rec.importMethod === 'csv' ? 'CSV Export/Import' : 'API Script'}</span>
                    </div>

                    {rec.issues.length > 0 && (
                      <div className="mb-3">
                        <span className="text-sm font-semibold text-red-600">Issues:</span>
                        <ul className="list-disc list-inside text-sm text-red-600 ml-4">
                          {rec.issues.map((issue: string, issueIndex: number) => (
                            <li key={issueIndex}>{issue}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div>
                      <span className="text-sm font-semibold text-green-600">Steps:</span>
                      <ul className="list-disc list-inside text-sm text-green-700 ml-4">
                        {rec.steps.map((step: string, stepIndex: number) => (
                          <li key={stepIndex}>{step}</li>
                        ))}
                      </ul>
                    </div>
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