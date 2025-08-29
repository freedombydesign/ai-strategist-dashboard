'use client'

import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Globe, Brain, Sparkles, CheckCircle, AlertCircle } from 'lucide-react'

interface WebsiteAnalyzerProps {
  onAnalysisComplete?: (analysis: any) => void
  className?: string
}

export default function WebsiteAnalyzer({ onAnalysisComplete, className = '' }: WebsiteAnalyzerProps) {
  const { user } = useAuth()
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleAnalyzeWebsite = async () => {
    if (!websiteUrl.trim() || !user?.id) return

    try {
      setIsAnalyzing(true)
      setError(null)
      console.log('[WEBSITE-ANALYZER] Starting website analysis for:', websiteUrl)

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

      console.log('[WEBSITE-ANALYZER] Analysis completed successfully:', result.summary)
      setAnalysisResult(result)
      
      // Store in localStorage as backup for immediate use
      if (typeof window !== 'undefined' && user?.id) {
        const storageKey = `website_intelligence_${user.id}`
        localStorage.setItem(storageKey, JSON.stringify({
          website_url: result.data.website_url,
          analysis: result.data.analysis,
          timestamp: new Date().toISOString()
        }))
        console.log('[WEBSITE-ANALYZER] Stored in localStorage as backup:', storageKey)
      }
      
      if (onAnalysisComplete) {
        onAnalysisComplete(result.data)
      }

    } catch (error) {
      console.error('[WEBSITE-ANALYZER] Error analyzing website:', error)
      setError(error instanceof Error ? error.message : 'Failed to analyze website')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isAnalyzing) {
      handleAnalyzeWebsite()
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className={`bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-4 ${className}`}>
      <div className="flex items-center mb-3">
        <Brain className="w-5 h-5 text-blue-600 mr-2" />
        <h4 className="font-medium text-gray-900">Website Intelligence</h4>
      </div>

      {!analysisResult ? (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            I can analyze your website to understand your brand voice, messaging, and target audience. This will make all my responses more personalized to your business.
          </p>
          
          <div className="flex space-x-2">
            <div className="flex-1 relative">
              <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter your website URL (e.g., https://yoursite.com)"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                disabled={isAnalyzing}
              />
            </div>
            <button
              onClick={handleAnalyzeWebsite}
              disabled={!websiteUrl.trim() || isAnalyzing}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors"
            >
              {isAnalyzing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Analyze
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="flex items-center text-red-600 text-sm">
              <AlertCircle className="w-4 h-4 mr-1" />
              {error}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center text-green-600 text-sm">
            <CheckCircle className="w-4 h-4 mr-2" />
            Website analyzed successfully! Your responses are now personalized.
          </div>
          
          <div className="bg-white rounded-lg p-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="font-medium text-gray-600">Brand Tone:</span>
                <span className="ml-1 text-gray-900 capitalize">
                  {analysisResult.data.analysis.brandVoiceAnalysis.tone}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Messages Found:</span>
                <span className="ml-1 text-gray-900">
                  {analysisResult.summary.messaging_elements}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Services:</span>
                <span className="ml-1 text-gray-900">
                  {analysisResult.summary.services_identified}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Content Themes:</span>
                <span className="ml-1 text-gray-900">
                  {analysisResult.summary.content_themes}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              setAnalysisResult(null)
              setWebsiteUrl('')
            }}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Analyze Different Website
          </button>
        </div>
      )}
    </div>
  )
}