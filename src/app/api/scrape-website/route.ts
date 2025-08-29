import { NextResponse } from 'next/server'
import { websiteIntelligenceService } from '../../../services/websiteIntelligenceService'

interface WebsiteScrapeRequest {
  website_url: string
  user_id: string
}

export async function POST(request: Request) {
  try {
    console.log('[SCRAPE-WEBSITE] Starting website scraping...')
    
    const body: WebsiteScrapeRequest = await request.json()
    const { website_url, user_id } = body

    if (!website_url || !user_id) {
      return NextResponse.json({ 
        error: 'Website URL and user ID are required' 
      }, { status: 400 })
    }

    console.log('[SCRAPE-WEBSITE] Scraping website:', website_url, 'for user:', user_id)

    // Scrape and analyze the website
    const result = await websiteIntelligenceService.scrapeAndAnalyzeWebsite(website_url, user_id)

    if (!result.success) {
      console.error('[SCRAPE-WEBSITE] Scraping failed:', result.error)
      return NextResponse.json({
        success: false,
        error: result.error,
        message: 'Failed to scrape website. Please check the URL and try again.'
      }, { status: 400 })
    }

    console.log('[SCRAPE-WEBSITE] Website scraping completed successfully')
    console.log('[SCRAPE-WEBSITE] Analysis summary:', {
      headlines_found: result.analysis.extractedMessaging.headlines.length,
      value_props_found: result.analysis.extractedMessaging.valuePropositions.length,
      services_identified: result.analysis.serviceOfferings.length,
      brand_voice_tone: result.analysis.brandVoiceAnalysis.tone,
      social_proof_elements: result.analysis.socialProofElements.length
    })

    return NextResponse.json({
      success: true,
      data: {
        website_url: result.url,
        title: result.title,
        analysis: result.analysis
      },
      message: 'Website scraped and analyzed successfully',
      summary: {
        messaging_elements: result.analysis.extractedMessaging.headlines.length + result.analysis.extractedMessaging.valuePropositions.length,
        brand_voice_tone: result.analysis.brandVoiceAnalysis.tone,
        services_identified: result.analysis.serviceOfferings.length,
        audience_signals: result.analysis.targetAudienceSignals.length,
        content_themes: result.analysis.contentThemes.length
      }
    })

  } catch (error) {
    console.error('[SCRAPE-WEBSITE] Error scraping website:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to scrape website',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const userId = url.searchParams.get('user_id')

    if (!userId) {
      return NextResponse.json({ 
        error: 'User ID is required' 
      }, { status: 400 })
    }

    console.log('[SCRAPE-WEBSITE] Getting website intelligence for user:', userId)

    // Get existing website intelligence
    const intelligence = await websiteIntelligenceService.getWebsiteIntelligence(userId)

    if (!intelligence) {
      return NextResponse.json({
        success: false,
        message: 'No website intelligence found for this user'
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        website_url: intelligence.website_url,
        scraped_at: intelligence.scraped_at,
        analysis: {
          extractedMessaging: intelligence.extracted_messaging,
          brandVoiceAnalysis: intelligence.brand_voice_analysis,
          competitivePositioning: intelligence.competitive_positioning,
          targetAudienceSignals: intelligence.target_audience_signals,
          serviceOfferings: intelligence.service_offerings,
          pricingSignals: intelligence.pricing_signals,
          socialProofElements: intelligence.social_proof_elements,
          contentThemes: intelligence.content_themes,
          seoKeywords: intelligence.seo_keywords
        }
      }
    })

  } catch (error) {
    console.error('[SCRAPE-WEBSITE] Error getting website intelligence:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to get website intelligence',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}