'use client'

import { useState, useEffect } from 'react'
import NavigationHeader from '../../components/NavigationHeader'
// Note: signIn will be implemented as a direct API call for now
// import { signIn } from 'next-auth/react'

interface Workflow {
  id: string
  name: string
  description: string
  category: string
  created_at: string
}

interface ExportConfig {
  includeTemplates: boolean
  includeTimelines: boolean
  includeAssignments: boolean
  customFields: Record<string, any>
  exportFormat: 'json' | 'csv' | 'native'
}

interface PlatformConnection {
  id: string
  platform: string
  platform_username: string
  platform_workspace_name: string
  connected_at: string
  last_used_at: string
  is_active: boolean
  hasValidToken: boolean
  tokenExpires: string | null
  scope: string
}

interface PlatformSettings {
  [key: string]: any
}

interface ExportResult {
  success: boolean
  exportId?: string
  platform?: string
  exportedAt?: string
  summary?: {
    workflowName: string
    totalSteps: number
    templatesIncluded: number
    exportFormat: string
  }
  platformResponse?: any
  downloadUrl?: string
  externalUrl?: string
  error?: string
}

const PLATFORMS = [
  {
    id: 'asana',
    name: 'Asana',
    icon: '📋',
    description: 'Export as projects and tasks',
    requiredFields: ['workspaceId'],
    optionalFields: ['projectName'],
    requiresOAuth: true
  },
  {
    id: 'clickup',
    name: 'ClickUp',
    icon: '⚡',
    description: 'Export as tasks in a list',
    requiredFields: ['listId'],
    optionalFields: ['teamId'],
    requiresOAuth: true
  },
  {
    id: 'monday',
    name: 'Monday.com',
    icon: '📊',
    description: 'Export as board items',
    requiredFields: ['boardId'],
    optionalFields: [],
    requiresOAuth: true
  },
  {
    id: 'trello',
    name: 'Trello',
    icon: '📌',
    description: 'Export as cards in a board',
    requiredFields: ['boardId', 'listId'],
    optionalFields: [],
    requiresOAuth: true
  },
  {
    id: 'notion',
    name: 'Notion',
    icon: '📝',
    description: 'Export as database pages',
    requiredFields: ['databaseId'],
    optionalFields: [],
    requiresOAuth: true
  }
]

export default function ExportManagerPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [selectedWorkflow, setSelectedWorkflow] = useState<string>('')
  const [selectedPlatform, setSelectedPlatform] = useState<string>('')
  const [exportConfig, setExportConfig] = useState<ExportConfig>({
    includeTemplates: true,
    includeTimelines: false,
    includeAssignments: false,
    customFields: {},
    exportFormat: 'native'
  })
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings>({})
  const [platformConnections, setPlatformConnections] = useState<PlatformConnection[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [exportResult, setExportResult] = useState<ExportResult | null>(null)
  const [error, setError] = useState('')
  const [connectionStatus, setConnectionStatus] = useState<string>('')

  useEffect(() => {
    fetchWorkflows()
    fetchPlatformConnections()

    // Check for OAuth connection status from URL
    const urlParams = new URLSearchParams(window.location.search)
    const connected = urlParams.get('connected')
    const success = urlParams.get('success')
    const error = urlParams.get('error')

    if (success === 'true' && connected) {
      setConnectionStatus(`${connected.charAt(0).toUpperCase() + connected.slice(1)} connected successfully!`)
      // Clear URL parameters after a delay
      setTimeout(() => {
        window.history.replaceState({}, document.title, window.location.pathname)
        setConnectionStatus('')
        fetchPlatformConnections() // Refresh connections
      }, 3000)
    }
    if (error) {
      setError(`OAuth connection failed: ${error.replace(/_/g, ' ')}`)
    }
  }, [])

  const fetchWorkflows = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/systemizer/workflows')
      if (response.ok) {
        const data = await response.json()
        setWorkflows(data.workflows || [])
      } else {
        setError('Failed to fetch workflows')
      }
    } catch (err) {
      setError('Network error while fetching workflows')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchPlatformConnections = async () => {
    try {
      console.log('[Platform-Connections] Fetching connections...')
      const response = await fetch('/api/platform-connections')

      console.log('[Platform-Connections] Response status:', response.status)

      if (response.ok) {
        const data = await response.json()
        console.log('[Platform-Connections] Response data:', data)
        setPlatformConnections(data.connections || [])
      } else {
        const errorText = await response.text()
        console.error('[Platform-Connections] Error response:', errorText)
        setError(`Failed to fetch connections: ${response.status} ${response.statusText}`)
      }
    } catch (err) {
      console.error('[Platform-Connections] Fetch error:', err)
      setError(`Network error fetching connections: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  const handleConnect = async (platform: string) => {
    try {
      console.log(`[OAuth] Attempting to connect to ${platform}`)

      // Clear any existing errors
      setError('')
      setConnectionStatus('Initiating connection...')

      // Use direct OAuth URLs to avoid detectStore issues
      if (typeof window !== 'undefined') {
        // Use proper NextAuth callback URLs for each platform
        const baseUrl = window.location.origin
        let oauthUrl = ''

        switch (platform) {
          case 'asana':
            oauthUrl = `${baseUrl}/api/oauth/asana`
            break
          case 'monday':
            oauthUrl = `${baseUrl}/api/oauth/monday`
            break
          case 'trello':
            const trelloCallback = `${baseUrl}/api/auth/callback/trello`
            oauthUrl = `https://trello.com/1/authorize?expiration=never&name=Business%20Systemizer&scope=read,write,account&response_type=token&key=${process.env.NEXT_PUBLIC_TRELLO_API_KEY || ''}&return_url=${encodeURIComponent(trelloCallback)}`
            break
          case 'clickup':
            oauthUrl = `${baseUrl}/api/oauth/clickup`
            break
          case 'notion':
            const notionCallback = `${baseUrl}/api/auth/callback/notion`
            oauthUrl = `https://api.notion.com/v1/oauth/authorize?client_id=${process.env.NEXT_PUBLIC_NOTION_CLIENT_ID || ''}&redirect_uri=${encodeURIComponent(notionCallback)}&response_type=code&owner=user`
            break
          default:
            // Fallback to NextAuth for unsupported platforms
            const { signIn } = await import('next-auth/react')
            await signIn(platform, {
              callbackUrl: `${baseUrl}/export-manager?connected=true`,
              redirect: true
            })
            return
        }

        if (oauthUrl) {
          console.log(`[OAuth] Redirecting directly to ${platform} OAuth:`, oauthUrl)
          window.location.href = oauthUrl
        } else {
          throw new Error(`No OAuth configuration found for ${platform}`)
        }
      }

    } catch (err) {
      console.error(`[OAuth] Connection error for ${platform}:`, err)
      setError(`Failed to connect to ${platform}: ${err instanceof Error ? err.message : 'Unknown error'}`)
      setConnectionStatus('')
    }
  }

  const handleDisconnect = async (connectionId: string, platform: string) => {
    try {
      const response = await fetch(`/api/platform-connections?id=${connectionId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setConnectionStatus(`${platform} disconnected successfully`)
        fetchPlatformConnections()
      } else {
        setError(`Failed to disconnect ${platform}`)
      }
    } catch (err) {
      setError(`Network error while disconnecting ${platform}`)
    }
  }

  const handleExport = async () => {
    if (!selectedWorkflow || !selectedPlatform) {
      setError('Please select both a workflow and platform')
      return
    }

    const platform = PLATFORMS.find(p => p.id === selectedPlatform)
    if (!platform) {
      setError('Invalid platform selected')
      return
    }

    // Check if platform is connected via OAuth
    const connection = platformConnections.find(c => c.platform === selectedPlatform && c.is_active)
    if (platform.requiresOAuth && !connection) {
      setError(`Please connect to ${platform.name} first using the Connect button`)
      return
    }

    // Validate required fields
    const missingFields = platform.requiredFields.filter(field => !platformSettings[field]?.trim())
    if (missingFields.length > 0) {
      setError(`Missing required fields: ${missingFields.join(', ')}`)
      return
    }

    setIsExporting(true)
    setError('')
    setExportResult(null)

    try {
      const response = await fetch(`/api/systemizer/export/${selectedPlatform}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workflowId: selectedWorkflow,
          exportConfig,
          platformSettings: {
            ...platformSettings,
            useOAuthConnection: true // Flag to use stored OAuth token
          }
        }),
      })

      const result = await response.json()

      if (response.ok) {
        setExportResult(result)
        // Update last used timestamp
        fetchPlatformConnections()
      } else {
        setError(result.error || 'Export failed')
      }
    } catch (err) {
      setError('Network error during export')
    } finally {
      setIsExporting(false)
    }
  }

  const updatePlatformSetting = (field: string, value: string) => {
    setPlatformSettings(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const selectedPlatformData = PLATFORMS.find(p => p.id === selectedPlatform)
  const selectedWorkflowData = workflows.find(w => w.id === selectedWorkflow)
  const platformConnection = platformConnections.find(c => c.platform === selectedPlatform && c.is_active)
  const isConnected = !!platformConnection

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900">
      <NavigationHeader
        title="🚀 Export Manager"
        subtitle="Export your workflows to external project management platforms"
      />

      <div className="p-8">
        <div className="max-w-6xl mx-auto">

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Step 1: Select Workflow */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-6">
              📋 Step 1: Select Workflow
            </h2>

            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin text-4xl mb-4">⏳</div>
                <p className="text-purple-200">Loading workflows...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {workflows.map((workflow) => (
                  <div
                    key={workflow.id}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      selectedWorkflow === workflow.id
                        ? 'bg-purple-500/20 border-purple-400'
                        : 'bg-black/20 border-white/10 hover:bg-white/10'
                    }`}
                    onClick={() => setSelectedWorkflow(workflow.id)}
                  >
                    <h3 className="font-semibold text-white">{workflow.name}</h3>
                    <p className="text-sm text-purple-200 mt-1">
                      {workflow.description || 'No description'}
                    </p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs bg-purple-500/20 text-purple-200 px-2 py-1 rounded">
                        {workflow.category}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(workflow.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}

                {workflows.length === 0 && (
                  <div className="text-center py-8 text-purple-300">
                    <div className="text-4xl mb-4">📭</div>
                    <p>No workflows found. Create a workflow first.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Step 2: Select Platform */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-6">
              🎯 Step 2: Select Platform
            </h2>

            <div className="space-y-4">
              {PLATFORMS.map((platform) => (
                <div
                  key={platform.id}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedPlatform === platform.id
                      ? 'bg-blue-500/20 border-blue-400'
                      : 'bg-black/20 border-white/10 hover:bg-white/10'
                  }`}
                  onClick={() => setSelectedPlatform(platform.id)}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{platform.icon}</span>
                    <div>
                      <h3 className="font-semibold text-white">{platform.name}</h3>
                      <p className="text-sm text-blue-200">{platform.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Platform Connection Status */}
            {selectedPlatformData && (
              <div className="mt-6 space-y-4">
                <h3 className="text-lg font-semibold text-white border-t border-white/10 pt-4">
                  Connection Status
                </h3>

                {isConnected ? (
                  <div className="bg-green-500/10 border border-green-400/20 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-green-400">✅</span>
                          <span className="text-green-200 font-medium">Connected</span>
                        </div>
                        <div className="text-sm text-green-300 mt-1">
                          {platformConnection?.platform_username}
                          {platformConnection?.platform_workspace_name && (
                            <span> • {platformConnection.platform_workspace_name}</span>
                          )}
                        </div>
                        <div className="text-xs text-green-400 mt-1">
                          Last used: {platformConnection?.last_used_at ?
                            new Date(platformConnection.last_used_at).toLocaleDateString() : 'Never'}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDisconnect(platformConnection!.id, selectedPlatformData.name)}
                        className="bg-red-500/20 hover:bg-red-500/30 text-red-200 px-3 py-1 rounded text-sm transition-colors"
                      >
                        Disconnect
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-yellow-500/10 border border-yellow-400/20 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-yellow-400">⚠️</span>
                          <span className="text-yellow-200 font-medium">Not Connected</span>
                        </div>
                        <div className="text-sm text-yellow-300 mt-1">
                          Connect to {selectedPlatformData.name} to enable exports
                        </div>
                      </div>
                      <button
                        onClick={() => handleConnect(selectedPlatformData.id)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
                      >
                        Connect
                      </button>
                    </div>
                  </div>
                )}

                {/* Platform Settings */}
                {isConnected && (
                  <div className="space-y-4">
                    <h4 className="text-md font-semibold text-white">
                      Platform Settings
                    </h4>

                    {selectedPlatformData.requiredFields.map((field) => (
                      <div key={field}>
                        <label className="block text-sm font-medium text-blue-200 mb-2">
                          {field} *
                        </label>
                        <input
                          type="text"
                          value={platformSettings[field] || ''}
                          onChange={(e) => updatePlatformSetting(field, e.target.value)}
                          placeholder={`Enter ${field}`}
                          className="w-full px-3 py-2 bg-black/30 border border-white/20 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    ))}

                    {selectedPlatformData.optionalFields.map((field) => (
                      <div key={field}>
                        <label className="block text-sm font-medium text-blue-200 mb-2">
                          {field} (optional)
                        </label>
                        <input
                          type="text"
                          value={platformSettings[field] || ''}
                          onChange={(e) => updatePlatformSetting(field, e.target.value)}
                          placeholder={`Enter ${field}`}
                          className="w-full px-3 py-2 bg-black/30 border border-white/20 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Step 3: Configure & Export */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-6">
              ⚙️ Step 3: Configure & Export
            </h2>

            {/* Export Configuration */}
            <div className="space-y-4 mb-6">
              <h3 className="text-lg font-semibold text-white">Export Options</h3>

              <div className="space-y-3">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={exportConfig.includeTemplates}
                    onChange={(e) => setExportConfig(prev => ({
                      ...prev,
                      includeTemplates: e.target.checked
                    }))}
                    className="rounded bg-black/30 border-white/20 text-purple-500 focus:ring-purple-500"
                  />
                  <span className="text-white">Include Templates</span>
                </label>

                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={exportConfig.includeTimelines}
                    onChange={(e) => setExportConfig(prev => ({
                      ...prev,
                      includeTimelines: e.target.checked
                    }))}
                    className="rounded bg-black/30 border-white/20 text-purple-500 focus:ring-purple-500"
                  />
                  <span className="text-white">Include Timelines</span>
                </label>

                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={exportConfig.includeAssignments}
                    onChange={(e) => setExportConfig(prev => ({
                      ...prev,
                      includeAssignments: e.target.checked
                    }))}
                    className="rounded bg-black/30 border-white/20 text-purple-500 focus:ring-purple-500"
                  />
                  <span className="text-white">Include Assignments</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">
                  Export Format
                </label>
                <select
                  value={exportConfig.exportFormat}
                  onChange={(e) => setExportConfig(prev => ({
                    ...prev,
                    exportFormat: e.target.value as 'json' | 'csv' | 'native'
                  }))}
                  className="w-full px-3 py-2 bg-black/30 border border-white/20 rounded text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="native">Native Format</option>
                  <option value="json">JSON</option>
                  <option value="csv">CSV</option>
                </select>
              </div>
            </div>

            {/* Export Button */}
            <button
              onClick={handleExport}
              disabled={!selectedWorkflow || !selectedPlatform || isExporting}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 disabled:cursor-not-allowed"
            >
              {isExporting ? '🚀 Exporting...' : '🚀 Export Workflow'}
            </button>

            {/* Status Messages */}
            {connectionStatus && (
              <div className="mt-4 bg-green-500/20 border border-green-400/30 text-green-200 p-4 rounded-lg">
                {connectionStatus}
              </div>
            )}

            {error && (
              <div className="mt-4 bg-red-500/20 border border-red-400/30 text-red-200 p-4 rounded-lg">
                {error}
              </div>
            )}

            {/* Export Result */}
            {exportResult && (
              <div className="mt-6 space-y-4">
                <h3 className="text-lg font-semibold text-green-200">✅ Export Successful!</h3>

                <div className="bg-green-500/10 border border-green-400/20 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-green-200">Workflow:</span>
                      <div className="text-white font-medium">
                        {exportResult.summary?.workflowName}
                      </div>
                    </div>
                    <div>
                      <span className="text-green-200">Platform:</span>
                      <div className="text-white font-medium capitalize">
                        {exportResult.platform}
                      </div>
                    </div>
                    <div>
                      <span className="text-green-200">Total Steps:</span>
                      <div className="text-white font-medium">
                        {exportResult.summary?.totalSteps}
                      </div>
                    </div>
                    <div>
                      <span className="text-green-200">Templates:</span>
                      <div className="text-white font-medium">
                        {exportResult.summary?.templatesIncluded || 0}
                      </div>
                    </div>
                  </div>

                  {exportResult.externalUrl && (
                    <div className="mt-4 pt-4 border-t border-green-400/20">
                      <a
                        href={exportResult.externalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        <span>🔗</span>
                        <span>View in {selectedPlatformData?.name}</span>
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Selected Workflow Summary */}
            {selectedWorkflowData && (
              <div className="mt-6 pt-6 border-t border-white/10">
                <h3 className="text-sm font-semibold text-purple-200 mb-2">Selected Workflow</h3>
                <div className="text-sm text-white">
                  <div className="font-medium">{selectedWorkflowData.name}</div>
                  <div className="text-purple-200 mt-1">
                    {selectedWorkflowData.description || 'No description'}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}