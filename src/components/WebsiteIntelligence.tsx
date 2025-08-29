'use client'

import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Globe, Brain, Target, MessageSquare, TrendingUp, Users } from 'lucide-react'

interface WebsiteIntelligenceProps {
  onIntelligenceGathered?: (intelligence: any) => void
}

interface WebsiteAnalysis {
  extractedMessaging: {
    headlines: string[]
    valuePropositions: string[]
    callsToAction: string[]
    taglines: string[]
  }
  brandVoiceAnalysis: {
    tone: string
    personality: string[]
    communicationStyle: string
    keyPhrases: string[]
  }
  competitivePositioning: string
  targetAudienceSignals: string[]
  serviceOfferings: string[]
  pricingSignals: {
    hasVisiblePricing: boolean
    pricingStrategy: string
    pricePoints: string[]
  }
  socialProofElements: string[]
  contentThemes: string[]
  seoKeywords: string[]
}

export default function WebsiteIntelligence({ onIntelligenceGathered }: WebsiteIntelligenceProps) {
  const { user } = useAuth()
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<WebsiteAnalysis | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleAnalyzeWebsite = async () => {
    if (!websiteUrl.trim() || !user?.id) return

    try {
      setIsAnalyzing(true)
      setError(null)
      console.log('[WEBSITE-INTEL] Starting website analysis for:', websiteUrl)

      const response = await fetch('/api/scrape-website', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          website_url: websiteUrl.trim(),
          user_id: user.id
        }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to analyze website')
      }

      console.log('[WEBSITE-INTEL] Analysis completed:', result.summary)
      setAnalysis(result.data.analysis)
      
      if (onIntelligenceGathered) {
        onIntelligenceGathered(result.data)
      }

    } catch (error) {
      console.error('[WEBSITE-INTEL] Error analyzing website:', error)
      setError(error instanceof Error ? error.message : 'Failed to analyze website')
    } finally {
      setIsAnalyzing(false)
    }
  }

  if (!user) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <p className="text-gray-500">Please sign in to analyze your website</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center mb-6">
        <Brain className="w-6 h-6 text-blue-600 mr-3" />
        <h3 className="text-xl font-semibold text-gray-900">Website Intelligence</h3>
      </div>

      <div className="space-y-6">
        {/* URL Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Website URL
          </label>
          <div className="flex space-x-3">
            <div className="flex-1 relative">
              <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://yourwebsite.com"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isAnalyzing}
              />
            </div>
            <button
              onClick={handleAnalyzeWebsite}
              disabled={!websiteUrl.trim() || isAnalyzing}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg font-medium flex items-center transition-colors"
            >
              {isAnalyzing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Analyzing...
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4 mr-2" />
                  Analyze
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Analysis Results */}
        {analysis && (
          <div className="space-y-6">
            <div className="border-t pt-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Analysis Results</h4>
              
              {/* Brand Voice */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <MessageSquare className="w-5 h-5 text-blue-600 mr-2" />
                    <h5 className="font-medium text-gray-900">Brand Voice</h5>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium text-gray-600">Tone:</span>
                      <span className="ml-2 text-sm text-gray-900 capitalize">{analysis.brandVoiceAnalysis.tone}</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Style:</span>
                      <span className="ml-2 text-sm text-gray-900">{analysis.brandVoiceAnalysis.communicationStyle}</span>
                    </div>
                    {analysis.brandVoiceAnalysis.personality.length > 0 && (
                      <div>
                        <span className="text-sm font-medium text-gray-600">Personality:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {analysis.brandVoiceAnalysis.personality.map((trait, index) => (
                            <span key={index} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                              {trait}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Target Audience */}
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <Users className="w-5 h-5 text-green-600 mr-2" />
                    <h5 className="font-medium text-gray-900">Target Audience</h5>
                  </div>
                  {analysis.targetAudienceSignals.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {analysis.targetAudienceSignals.map((signal, index) => (
                        <span key={index} className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                          {signal}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No specific audience signals detected</p>
                  )}
                </div>
              </div>

              {/* Key Messages */}
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <Target className="w-5 h-5 text-purple-600 mr-2" />
                  <h5 className="font-medium text-gray-900">Key Messages</h5>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  {analysis.extractedMessaging.headlines.length > 0 && (
                    <div>
                      <h6 className="text-sm font-medium text-gray-600 mb-2">Headlines</h6>
                      <ul className="space-y-1">
                        {analysis.extractedMessaging.headlines.slice(0, 3).map((headline, index) => (
                          <li key={index} className="text-sm text-gray-700">• {headline}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {analysis.extractedMessaging.valuePropositions.length > 0 && (
                    <div>
                      <h6 className="text-sm font-medium text-gray-600 mb-2">Value Propositions</h6>
                      <ul className="space-y-1">
                        {analysis.extractedMessaging.valuePropositions.slice(0, 2).map((prop, index) => (
                          <li key={index} className="text-sm text-gray-700">• {prop.slice(0, 100)}...</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* Services & Positioning */}
              <div className="grid md:grid-cols-2 gap-4">
                {analysis.serviceOfferings.length > 0 && (
                  <div className="bg-orange-50 rounded-lg p-4">
                    <div className="flex items-center mb-3">
                      <TrendingUp className="w-5 h-5 text-orange-600 mr-2" />
                      <h5 className="font-medium text-gray-900">Services Detected</h5>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {analysis.serviceOfferings.map((service, index) => (
                        <span key={index} className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded">
                          {service}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {analysis.contentThemes.length > 0 && (
                  <div className="bg-indigo-50 rounded-lg p-4">
                    <div className="flex items-center mb-3">
                      <MessageSquare className="w-5 h-5 text-indigo-600 mr-2" />
                      <h5 className="font-medium text-gray-900">Content Themes</h5>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {analysis.contentThemes.map((theme, index) => (
                        <span key={index} className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded">
                          {theme}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Competitive Positioning */}
              {analysis.competitivePositioning && analysis.competitivePositioning !== 'No clear competitive positioning found' && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h5 className="font-medium text-gray-900 mb-2">Competitive Positioning</h5>
                  <p className="text-sm text-gray-700">{analysis.competitivePositioning}</p>
                </div>
              )}

              {/* Social Proof */}
              {analysis.socialProofElements.length > 0 && (
                <div className="bg-yellow-50 rounded-lg p-4">
                  <h5 className="font-medium text-gray-900 mb-2">Social Proof Elements</h5>
                  <ul className="space-y-1">
                    {analysis.socialProofElements.map((element, index) => (
                      <li key={index} className="text-sm text-gray-700">• {element}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Instructions */}
        {!analysis && !isAnalyzing && (
          <div className="bg-blue-50 rounded-lg p-4">
            <h5 className="font-medium text-blue-900 mb-2">🧠 What Website Intelligence Does</h5>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Analyzes your website's brand voice and messaging</li>
              <li>• Identifies your target audience signals</li>
              <li>• Extracts your unique value propositions</li>
              <li>• Maps your service offerings and positioning</li>
              <li>• This intelligence will personalize all future AI responses and asset generation</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}