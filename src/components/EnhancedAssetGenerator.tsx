'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { FileText, Sparkles, Download, Eye, Calendar, Tag } from 'lucide-react'

interface AssetGeneratorProps {
  businessContext?: any
  websiteIntelligence?: any
}

interface GeneratedAsset {
  id: number
  asset_type: string
  asset_title: string
  asset_content: string
  created_at: string
  personalization_factors: {
    used_brand_voice: boolean
    used_business_context: boolean
    used_conversation_history: boolean
    used_completed_tasks: boolean
  }
}

const ASSET_TYPES = {
  email_sequence: { 
    name: 'Email Marketing Sequence', 
    icon: '📧',
    description: 'Multi-email nurture sequence with your brand voice'
  },
  landing_page: { 
    name: 'Landing Page Copy', 
    icon: '🎯',
    description: 'High-converting landing page copy with your messaging'
  },
  sales_script: { 
    name: 'Sales Script/Pitch', 
    icon: '🎤',
    description: 'Personalized sales script addressing your ideal clients'
  },
  content_strategy: { 
    name: 'Content Marketing Strategy', 
    icon: '📝',
    description: 'Strategic content plan aligned with your business goals'
  },
  social_media_plan: { 
    name: 'Social Media Plan', 
    icon: '📱',
    description: 'Platform-specific social media strategy and content themes'
  },
  case_study: { 
    name: 'Case Study Template', 
    icon: '📊',
    description: 'Professional case study showcasing your methodology'
  }
}

export default function EnhancedAssetGenerator({ businessContext, websiteIntelligence }: AssetGeneratorProps) {
  const { user } = useAuth()
  const [selectedAssetType, setSelectedAssetType] = useState('')
  const [assetTitle, setAssetTitle] = useState('')
  const [userRequirements, setUserRequirements] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedAsset, setGeneratedAsset] = useState<any>(null)
  const [savedAssets, setSavedAssets] = useState<GeneratedAsset[]>([])
  const [showAssetHistory, setShowAssetHistory] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user?.id) {
      loadAssetHistory()
    }
  }, [user?.id])

  const loadAssetHistory = async () => {
    try {
      const response = await fetch(`/api/generate-asset?user_id=${user?.id}`)
      const result = await response.json()
      
      if (result.success) {
        setSavedAssets(result.assets || [])
      }
    } catch (error) {
      console.error('Error loading asset history:', error)
    }
  }

  const handleGenerateAsset = async () => {
    if (!selectedAssetType || !assetTitle.trim() || !userRequirements.trim() || !user?.id) return

    try {
      setIsGenerating(true)
      setError(null)
      console.log('[ASSET-GEN] Generating asset:', selectedAssetType, assetTitle)

      const response = await fetch('/api/generate-asset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          asset_type: selectedAssetType,
          asset_title: assetTitle,
          user_requirements: userRequirements,
          user_id: user.id
        }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to generate asset')
      }

      console.log('[ASSET-GEN] Asset generated successfully:', result.asset.personalization_summary)
      setGeneratedAsset(result.asset)
      
      // Refresh asset history
      loadAssetHistory()
      
      // Clear form
      setSelectedAssetType('')
      setAssetTitle('')
      setUserRequirements('')

    } catch (error) {
      console.error('[ASSET-GEN] Error generating asset:', error)
      setError(error instanceof Error ? error.message : 'Failed to generate asset')
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    // Could add toast notification here
  }

  const downloadAsText = (title: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title.replace(/\s+/g, '_')}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (!user) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <p className="text-gray-500">Please sign in to generate assets</p>
      </div>
    )
  }

  const personalizationScore = businessContext && websiteIntelligence ? 100 : 
                              businessContext || websiteIntelligence ? 70 : 40

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Sparkles className="w-6 h-6 text-purple-600 mr-3" />
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Enhanced Asset Generator</h3>
            <p className="text-sm text-gray-600">
              Personalization Score: <span className={`font-medium ${
                personalizationScore >= 90 ? 'text-green-600' : 
                personalizationScore >= 70 ? 'text-yellow-600' : 'text-red-600'
              }`}>{personalizationScore}%</span>
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowAssetHistory(!showAssetHistory)}
          className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
        >
          <Calendar className="w-4 h-4 mr-1" />
          History ({savedAssets.length})
        </button>
      </div>

      {/* Personalization Status */}
      <div className="bg-blue-50 rounded-lg p-4 mb-6">
        <h5 className="font-medium text-blue-900 mb-2">🎯 Personalization Context</h5>
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div className={`flex items-center ${businessContext ? 'text-green-700' : 'text-gray-500'}`}>
            <div className={`w-2 h-2 rounded-full mr-2 ${businessContext ? 'bg-green-500' : 'bg-gray-300'}`}></div>
            Business Profile {businessContext ? '✓' : '✗'}
          </div>
          <div className={`flex items-center ${websiteIntelligence ? 'text-green-700' : 'text-gray-500'}`}>
            <div className={`w-2 h-2 rounded-full mr-2 ${websiteIntelligence ? 'bg-green-500' : 'bg-gray-300'}`}></div>
            Brand Voice Analysis {websiteIntelligence ? '✓' : '✗'}
          </div>
          <div className="flex items-center text-green-700">
            <div className="w-2 h-2 rounded-full mr-2 bg-green-500"></div>
            Conversation Memory ✓
          </div>
        </div>
        <p className="text-xs text-blue-600 mt-2">
          Higher personalization creates more relevant, business-specific assets
        </p>
      </div>

      <div className="space-y-6">
        {/* Asset Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Asset Type
          </label>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(ASSET_TYPES).map(([key, type]) => (
              <button
                key={key}
                onClick={() => setSelectedAssetType(key)}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  selectedAssetType === key
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center mb-2">
                  <span className="text-2xl mr-2">{type.icon}</span>
                  <span className="font-medium text-gray-900">{type.name}</span>
                </div>
                <p className="text-xs text-gray-600">{type.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Asset Title */}
        {selectedAssetType && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Asset Title
            </label>
            <input
              type="text"
              value={assetTitle}
              onChange={(e) => setAssetTitle(e.target.value)}
              placeholder={`Enter a title for your ${ASSET_TYPES[selectedAssetType as keyof typeof ASSET_TYPES].name.toLowerCase()}`}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              disabled={isGenerating}
            />
          </div>
        )}

        {/* Requirements */}
        {selectedAssetType && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Specific Requirements
            </label>
            <textarea
              value={userRequirements}
              onChange={(e) => setUserRequirements(e.target.value)}
              placeholder="Describe your specific needs, target audience, key messages, tone, length, or any other requirements..."
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              disabled={isGenerating}
            />
          </div>
        )}

        {/* Generate Button */}
        {selectedAssetType && assetTitle && userRequirements && (
          <button
            onClick={handleGenerateAsset}
            disabled={isGenerating}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center transition-colors"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Generating Personalized Asset...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Generate Asset
              </>
            )}
          </button>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Generated Asset Display */}
        {generatedAsset && (
          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-900">
                {generatedAsset.asset_title}
              </h4>
              <div className="flex space-x-2">
                <button
                  onClick={() => copyToClipboard(generatedAsset.asset_content)}
                  className="text-sm text-blue-600 hover:text-blue-800 px-3 py-1 rounded border"
                >
                  Copy
                </button>
                <button
                  onClick={() => downloadAsText(generatedAsset.asset_title, generatedAsset.asset_content)}
                  className="text-sm text-green-600 hover:text-green-800 px-3 py-1 rounded border flex items-center"
                >
                  <Download className="w-3 h-3 mr-1" />
                  Download
                </button>
              </div>
            </div>

            {/* Personalization Summary */}
            <div className="bg-green-50 rounded-lg p-3 mb-4">
              <h5 className="font-medium text-green-900 mb-2">✨ Personalization Applied</h5>
              <div className="flex flex-wrap gap-2 text-xs">
                {generatedAsset.personalization_summary.brand_voice_applied && (
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded">Brand Voice</span>
                )}
                {generatedAsset.personalization_summary.business_context_used && (
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded">Business Profile</span>
                )}
                {generatedAsset.personalization_summary.conversation_history_referenced && (
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded">Conversation History</span>
                )}
                {generatedAsset.personalization_summary.completed_tasks_referenced && (
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded">Strategic Progress</span>
                )}
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {generatedAsset.personalization_summary.total_context_elements} Context Elements
                </span>
              </div>
            </div>

            {/* Asset Content */}
            <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
                {generatedAsset.asset_content}
              </pre>
            </div>
          </div>
        )}

        {/* Asset History */}
        {showAssetHistory && savedAssets.length > 0 && (
          <div className="border-t pt-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Asset History</h4>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {savedAssets.map((asset) => (
                <div key={asset.id} className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-1">
                      <Tag className="w-4 h-4 text-gray-500 mr-2" />
                      <span className="font-medium text-gray-900">{asset.asset_title}</span>
                      <span className="text-xs text-gray-500 ml-2">
                        {ASSET_TYPES[asset.asset_type as keyof typeof ASSET_TYPES]?.name}
                      </span>
                    </div>
                    <div className="flex items-center text-xs text-gray-500">
                      <Calendar className="w-3 h-3 mr-1" />
                      {new Date(asset.created_at).toLocaleDateString()}
                      {asset.personalization_factors && (
                        <span className="ml-3">
                          Personalization: {Object.values(asset.personalization_factors).filter(Boolean).length}/4
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setGeneratedAsset({
                      ...asset,
                      personalization_summary: {
                        brand_voice_applied: asset.personalization_factors?.used_brand_voice || false,
                        business_context_used: asset.personalization_factors?.used_business_context || false,
                        conversation_history_referenced: asset.personalization_factors?.used_conversation_history || false,
                        completed_tasks_referenced: asset.personalization_factors?.used_completed_tasks || false,
                        total_context_elements: Object.values(asset.personalization_factors || {}).filter(Boolean).length
                      }
                    })}
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    View
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        {!selectedAssetType && !isGenerating && (
          <div className="bg-purple-50 rounded-lg p-4">
            <h5 className="font-medium text-purple-900 mb-2">✨ How Enhanced Asset Generation Works</h5>
            <ul className="text-sm text-purple-800 space-y-1">
              <li>• Uses your business profile and brand voice to create personalized content</li>
              <li>• References your completed strategic work and conversation history</li>
              <li>• Adapts to your target audience and competitive positioning</li>
              <li>• Creates assets that sound like they were written specifically for your business</li>
              <li>• Each asset builds on your previous conversations and strategic decisions</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}