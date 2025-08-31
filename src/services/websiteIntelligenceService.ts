import * as cheerio from 'cheerio'
import { conversationMemoryService } from './conversationMemoryService'

interface WebsiteAnalysis {
  extractedMessaging: {
    headlines: string[]
    valuePropositions: string[]
    callsToAction: string[]
    taglines: string[]
  }
  brandVoiceAnalysis: {
    tone: 'professional' | 'casual' | 'authoritative' | 'friendly' | 'technical' | 'creative'
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
  // Enhanced analysis fields
  pageStructureAnalysis: {
    hasHeroBanner: boolean
    hasAboutSection: boolean
    hasTestimonials: boolean
    hasFeatures: boolean
    hasPricing: boolean
    hasContact: boolean
    missingElements: string[]
  }
  messagingGaps: {
    problemStatements: string[]
    solutionClarification: string[]
    benefitCommunication: string[]
    urgencyCreation: string[]
    strategicGaps: string[]
    positioningWeaknesses: string[]
  }
  conversionOptimization: {
    ctaStrength: 'weak' | 'moderate' | 'strong'
    trustSignals: string[]
    riskReduction: string[]
    valuePropsClarity: 'unclear' | 'moderate' | 'clear'
    recommendations: string[]
  }
  audienceInsights: {
    painPoints: string[]
    demographics: string[]
    psychographics: string[]
    buyingStage: 'awareness' | 'consideration' | 'decision'
    languageMatching: 'poor' | 'good' | 'excellent'
  }
}

interface WebsiteScrapeResult {
  url: string
  title: string
  content: string
  analysis: WebsiteAnalysis
  success: boolean
  error?: string
}

export class WebsiteIntelligenceService {
  
  // Scrape and analyze a website
  async scrapeAndAnalyzeWebsite(url: string, userId: string): Promise<WebsiteScrapeResult> {
    try {
      console.log('[WEBSITE-INTEL] Starting website analysis for:', url)
      
      // Ensure URL has protocol
      const normalizedUrl = url.startsWith('http') ? url : `https://${url}`
      
      // Scrape website content with timeout and better error handling
      console.log('[WEBSITE-INTEL] Attempting to fetch:', normalizedUrl)
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout
      
      let response, html
      try {
        response = await fetch(normalizedUrl, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; Bot/1.0)',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          },
          redirect: 'follow'
        })
        
        clearTimeout(timeoutId)
        
        console.log('[WEBSITE-INTEL] Fetch response status:', response.status, response.statusText)
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        
        html = await response.text()
      } catch (fetchError) {
        clearTimeout(timeoutId)
        console.error('[WEBSITE-INTEL] Fetch error details:', {
          message: fetchError.message,
          name: fetchError.name,
          cause: fetchError.cause
        })
        throw fetchError
      }
      const $ = cheerio.load(html)
      
      // Extract text content and clean it
      const textContent = this.extractCleanText($)
      const title = $('title').text() || 'No title found'
      
      console.log('[WEBSITE-INTEL] Scraped content length:', textContent.length)
      
      // Analyze the content
      const analysis = await this.analyzeWebsiteContent($, textContent)
      
      // Store in database
      await conversationMemoryService.storeWebsiteIntelligence({
        user_id: userId,
        website_url: normalizedUrl,
        page_content: textContent.slice(0, 10000), // Limit content size
        extracted_messaging: analysis.extractedMessaging,
        brand_voice_analysis: analysis.brandVoiceAnalysis,
        competitive_positioning: analysis.competitivePositioning,
        target_audience_signals: analysis.targetAudienceSignals,
        service_offerings: analysis.serviceOfferings,
        pricing_signals: analysis.pricingSignals,
        social_proof_elements: analysis.socialProofElements,
        content_themes: analysis.contentThemes,
        seo_keywords: analysis.seoKeywords,
        // Enhanced analysis fields
        page_structure_analysis: analysis.pageStructureAnalysis,
        messaging_gaps: analysis.messagingGaps,
        conversion_optimization: analysis.conversionOptimization,
        audience_insights: analysis.audienceInsights
      })
      
      return {
        url: normalizedUrl,
        title,
        content: textContent,
        analysis,
        success: true
      }
      
    } catch (error) {
      console.error('[WEBSITE-INTEL] Error scraping website:', error)
      
      return {
        url,
        title: 'Error',
        content: '',
        analysis: this.getEmptyAnalysis(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
  
  // Extract clean text content from HTML
  private extractCleanText($: cheerio.CheerioAPI): string {
    // Remove script and style elements
    $('script, style, nav, footer, .cookie-banner, .popup').remove()
    
    // Extract main content
    let content = ''
    
    // Try to find main content areas
    const mainSelectors = ['main', '.main-content', '#main-content', '.content', '#content', 'article']
    
    for (const selector of mainSelectors) {
      const mainContent = $(selector).first()
      if (mainContent.length && mainContent.text().trim().length > 100) {
        content = mainContent.text()
        break
      }
    }
    
    // Fallback to body if no main content found
    if (!content) {
      content = $('body').text()
    }
    
    // Clean up the text
    return content
      .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
      .replace(/\n+/g, '\n') // Replace multiple newlines with single newline
      .trim()
  }
  
  // Analyze website content and extract insights
  private async analyzeWebsiteContent($: cheerio.CheerioAPI, textContent: string): Promise<WebsiteAnalysis> {
    const analysis: WebsiteAnalysis = {
      extractedMessaging: await this.extractMessaging($),
      brandVoiceAnalysis: await this.analyzeBrandVoice(textContent),
      competitivePositioning: await this.analyzeCompetitivePositioning(textContent),
      targetAudienceSignals: await this.extractTargetAudienceSignals(textContent),
      serviceOfferings: await this.extractServiceOfferings(textContent),
      pricingSignals: await this.extractPricingSignals($, textContent),
      socialProofElements: await this.extractSocialProof($),
      contentThemes: await this.extractContentThemes(textContent),
      seoKeywords: await this.extractSEOKeywords($),
      // Enhanced analysis
      pageStructureAnalysis: await this.analyzePageStructure($),
      messagingGaps: await this.analyzeMessagingGaps($, textContent),
      conversionOptimization: await this.analyzeConversionOptimization($, textContent),
      audienceInsights: await this.analyzeAudienceInsights($, textContent)
    }
    
    return analysis
  }
  
  // Extract key messaging elements
  private async extractMessaging($: cheerio.CheerioAPI): Promise<WebsiteAnalysis['extractedMessaging']> {
    const headlines = []
    const valuePropositions = []
    const callsToAction = []
    const taglines = []
    
    // Extract headlines (h1, h2, prominent text)
    $('h1, h2, .hero-title, .main-headline, .banner-title').each((_, elem) => {
      const text = $(elem).text().trim()
      if (text && text.length > 5 && text.length < 200) {
        headlines.push(text)
      }
    })
    
    // Extract CTAs - Enhanced detection for various button types
    $('button, .btn, .cta, [class*="button"], a[href*="contact"], a[href*="signup"], a[href*="subscribe"], a[href*="buy"], a[href*="get-started"], a[href*="purchase"], a[href*="access"]').each((_, elem) => {
      const text = $(elem).text().trim()
      if (text && text.length > 2 && text.length < 100) {
        callsToAction.push(text)
      }
    })
    
    // Also look for common CTA text patterns in the content
    const ctaPatterns = /GET\s+(?:INSTANT\s+)?ACCESS|APPLY\s+NOW|GET\s+STARTED|BOOK\s+(?:A\s+)?CALL|SCHEDULE|CONTACT\s+(?:US|ME)|LEARN\s+MORE|SIGN\s+UP|JOIN\s+NOW/gi
    const ctaMatches = $('body').text().match(ctaPatterns)
    if (ctaMatches) {
      ctaMatches.forEach(match => callsToAction.push(match.trim()))
    }
    
    // Extract value propositions (common sections)
    $('.value-prop, .benefits, .why-us, .hero-subtitle, .description').each((_, elem) => {
      const text = $(elem).text().trim()
      if (text && text.length > 20 && text.length < 500) {
        valuePropositions.push(text)
      }
    })
    
    // Extract taglines (meta description, short descriptions)
    const metaDescription = $('meta[name="description"]').attr('content')
    if (metaDescription) {
      taglines.push(metaDescription)
    }
    
    return {
      headlines: headlines.slice(0, 10),
      valuePropositions: valuePropositions.slice(0, 5),
      callsToAction: [...new Set(callsToAction)].slice(0, 10), // Remove duplicates
      taglines: taglines.slice(0, 3)
    }
  }
  
  // Analyze brand voice and personality
  private async analyzeBrandVoice(textContent: string): Promise<WebsiteAnalysis['brandVoiceAnalysis']> {
    const words = textContent.toLowerCase().split(/\s+/)
    const sentences = textContent.split(/[.!?]+/).filter(s => s.trim().length > 0)
    
    // Analyze tone indicators
    let tone: WebsiteAnalysis['brandVoiceAnalysis']['tone'] = 'professional'
    
    const casualIndicators = ['hey', 'awesome', 'cool', 'amazing', 'love', 'fun', 'easy']
    const professionalIndicators = ['solution', 'expertise', 'experience', 'professional', 'industry', 'business']
    const authoritativeIndicators = ['proven', 'leading', 'expert', 'authority', 'trusted', 'established']
    const friendlyIndicators = ['welcome', 'help', 'support', 'care', 'together', 'team']
    const technicalIndicators = ['integration', 'api', 'platform', 'system', 'technology', 'data']
    const creativeIndicators = ['creative', 'design', 'innovative', 'unique', 'artistic', 'brand']
    
    const toneScores = {
      casual: this.countWordsInText(words, casualIndicators),
      professional: this.countWordsInText(words, professionalIndicators),
      authoritative: this.countWordsInText(words, authoritativeIndicators),
      friendly: this.countWordsInText(words, friendlyIndicators),
      technical: this.countWordsInText(words, technicalIndicators),
      creative: this.countWordsInText(words, creativeIndicators)
    }
    
    // Get the highest scoring tone
    tone = Object.entries(toneScores).reduce((a, b) => toneScores[a[0]] > toneScores[b[0]] ? a : b)[0] as typeof tone
    
    // Extract personality traits
    const personality = []
    if (toneScores.friendly > 3) personality.push('Friendly')
    if (toneScores.authoritative > 3) personality.push('Authoritative')
    if (toneScores.creative > 3) personality.push('Creative')
    if (toneScores.technical > 5) personality.push('Technical')
    if (words.length > 0 && sentences.length > 0 && words.length / sentences.length > 20) personality.push('Detail-oriented')
    if (sentences.length > 0 && sentences.filter(s => s.length < 80).length / sentences.length > 0.7) personality.push('Concise')
    
    // Communication style
    const avgSentenceLength = words.length / Math.max(sentences.length, 1)
    let communicationStyle = 'Balanced'
    if (avgSentenceLength < 12) communicationStyle = 'Concise and direct'
    else if (avgSentenceLength > 25) communicationStyle = 'Detailed and thorough'
    
    // Key phrases (most repeated meaningful phrases)
    const keyPhrases = this.extractKeyPhrases(textContent)
    
    return {
      tone,
      personality: personality.length > 0 ? personality : ['Professional'],
      communicationStyle,
      keyPhrases: keyPhrases.slice(0, 10)
    }
  }
  
  // Count specific words in text
  private countWordsInText(words: string[], indicators: string[]): number {
    return words.filter(word => indicators.includes(word.toLowerCase())).length
  }
  
  // Extract key repeated phrases
  private extractKeyPhrases(text: string): string[] {
    const phrases: { [key: string]: number } = {}
    const sentences = text.split(/[.!?]+/)
    
    for (const sentence of sentences) {
      const words = sentence.toLowerCase().match(/\b\w+\b/g) || []
      
      // Extract 2-4 word phrases
      for (let i = 0; i < words.length - 1; i++) {
        for (let len = 2; len <= Math.min(4, words.length - i); len++) {
          const phrase = words.slice(i, i + len).join(' ')
          if (phrase.length > 6 && phrase.length < 50) {
            phrases[phrase] = (phrases[phrase] || 0) + 1
          }
        }
      }
    }
    
    // Return most frequent phrases
    return Object.entries(phrases)
      .filter(([_, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .map(([phrase]) => phrase)
      .slice(0, 10)
  }
  
  // Analyze competitive positioning
  private async analyzeCompetitivePositioning(textContent: string): Promise<string> {
    const positioningKeywords = [
      'unlike', 'different', 'unique', 'only', 'first', 'leading', 'best', 'top',
      'exclusive', 'proprietary', 'innovative', 'revolutionary', 'breakthrough'
    ]
    
    const sentences = textContent.split(/[.!?]+/)
    const positioningSentences = sentences.filter(sentence =>
      positioningKeywords.some(keyword => 
        sentence.toLowerCase().includes(keyword)
      )
    )
    
    return positioningSentences.slice(0, 3).join('. ') || 'No clear competitive positioning found'
  }
  
  // Extract target audience signals
  private async extractTargetAudienceSignals(textContent: string): Promise<string[]> {
    const audienceSignals = []
    const text = textContent.toLowerCase()
    
    // Business types
    if (text.includes('small business') || text.includes('entrepreneur')) audienceSignals.push('Small Business Owners')
    if (text.includes('enterprise') || text.includes('large company')) audienceSignals.push('Enterprise Companies')
    if (text.includes('startup')) audienceSignals.push('Startups')
    if (text.includes('freelancer') || text.includes('consultant')) audienceSignals.push('Freelancers/Consultants')
    if (text.includes('agency') || text.includes('agencies')) audienceSignals.push('Agencies')
    
    // Professional levels
    if (text.includes('ceo') || text.includes('founder') || text.includes('executive')) audienceSignals.push('Executives/Leaders')
    if (text.includes('manager') || text.includes('director')) audienceSignals.push('Managers/Directors')
    if (text.includes('developer') || text.includes('technical')) audienceSignals.push('Technical Professionals')
    if (text.includes('marketing') || text.includes('marketer')) audienceSignals.push('Marketing Professionals')
    
    // Industries
    if (text.includes('saas') || text.includes('software')) audienceSignals.push('Software/SaaS')
    if (text.includes('ecommerce') || text.includes('retail')) audienceSignals.push('E-commerce/Retail')
    if (text.includes('healthcare') || text.includes('medical')) audienceSignals.push('Healthcare')
    if (text.includes('real estate')) audienceSignals.push('Real Estate')
    if (text.includes('financial') || text.includes('finance')) audienceSignals.push('Financial Services')
    
    return [...new Set(audienceSignals)]
  }
  
  // Extract service offerings
  private async extractServiceOfferings(textContent: string): Promise<string[]> {
    const services = []
    const text = textContent.toLowerCase()
    
    // Common service types
    const serviceKeywords = {
      'Consulting': ['consulting', 'advisory', 'guidance', 'strategy consulting'],
      'Web Development': ['web development', 'website design', 'web design', 'frontend', 'backend'],
      'Digital Marketing': ['digital marketing', 'seo', 'ppc', 'social media marketing', 'content marketing'],
      'Design Services': ['graphic design', 'ui design', 'ux design', 'branding', 'logo design'],
      'Training': ['training', 'coaching', 'workshops', 'courses', 'education'],
      'Software Development': ['software development', 'app development', 'custom software'],
      'Content Creation': ['content creation', 'copywriting', 'blog writing', 'content strategy'],
      'Analytics': ['analytics', 'data analysis', 'reporting', 'insights'],
      'Support': ['support', 'maintenance', 'help desk', 'customer service'],
      'Integration': ['integration', 'api', 'automation', 'workflow']
    }
    
    for (const [service, keywords] of Object.entries(serviceKeywords)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        services.push(service)
      }
    }
    
    return services
  }
  
  // Extract pricing signals
  private async extractPricingSignals($: cheerio.CheerioAPI, textContent: string): Promise<WebsiteAnalysis['pricingSignals']> {
    const text = textContent.toLowerCase()
    
    // Check for visible pricing
    const hasVisiblePricing = $('.price, .pricing, [class*="price"], [id*="price"]').length > 0 ||
                             text.includes('$') || text.includes('price') || text.includes('cost')
    
    // Determine pricing strategy
    let pricingStrategy = 'Unknown'
    if (text.includes('free') && (text.includes('trial') || text.includes('plan'))) pricingStrategy = 'Freemium'
    else if (text.includes('subscription') || text.includes('monthly') || text.includes('yearly')) pricingStrategy = 'Subscription'
    else if (text.includes('one-time') || text.includes('purchase')) pricingStrategy = 'One-time Purchase'
    else if (text.includes('custom') || text.includes('quote') || text.includes('contact for pricing')) pricingStrategy = 'Custom Pricing'
    
    // Extract price points
    const priceMatches = textContent.match(/\$[\d,]+(?:\.\d{2})?/g) || []
    const pricePoints = [...new Set(priceMatches)].slice(0, 10)
    
    return {
      hasVisiblePricing,
      pricingStrategy,
      pricePoints
    }
  }
  
  // Extract social proof elements
  private async extractSocialProof($: cheerio.CheerioAPI): Promise<string[]> {
    const socialProof = []
    
    // Testimonials - More specific detection to avoid false positives
    const testimonialElements = $('.testimonial, .testimonials, [class="testimonial"], [id="testimonials"], [class="review"], .client-testimonial')
    let actualTestimonials = 0
    
    // Verify testimonials contain actual customer quotes or feedback
    testimonialElements.each((_, el) => {
      const text = $(el).text().toLowerCase()
      if (text.length > 20 && (text.includes('"') || text.includes('testimonial') || text.includes('review'))) {
        actualTestimonials++
      }
    })
    
    if (actualTestimonials > 0) {
      socialProof.push(`${actualTestimonials} testimonials found`)
    }
    
    // Client logos
    const clientLogos = $('.client-logo, .partner-logo, [class*="client"], [class*="partner"] img')
    if (clientLogos.length > 0) {
      socialProof.push(`${clientLogos.length} client/partner logos`)
    }
    
    // Numbers/stats
    const statsElements = $('[class*="stat"], [class*="number"], .metric')
    statsElements.each((_, elem) => {
      const text = $(elem).text()
      if (text.match(/\d+[kK]?[\+%]?/)) {
        socialProof.push(text.trim())
      }
    })
    
    // Awards/certifications
    if ($('.award, .certification, [class*="award"], [class*="cert"]').length > 0) {
      socialProof.push('Awards/certifications displayed')
    }
    
    return socialProof.slice(0, 10)
  }
  
  // Extract content themes
  private async extractContentThemes(textContent: string): Promise<string[]> {
    const themes = []
    const text = textContent.toLowerCase()
    
    const themeKeywords = {
      'Growth': ['growth', 'scale', 'expand', 'increase', 'boost'],
      'Efficiency': ['efficiency', 'streamline', 'optimize', 'automate', 'faster'],
      'Innovation': ['innovation', 'innovative', 'cutting-edge', 'advanced', 'breakthrough'],
      'Results': ['results', 'roi', 'performance', 'success', 'achievement'],
      'Trust': ['trust', 'reliable', 'secure', 'proven', 'established'],
      'Support': ['support', 'help', 'assistance', 'guidance', 'service'],
      'Quality': ['quality', 'premium', 'excellence', 'best-in-class', 'superior'],
      'Simplicity': ['simple', 'easy', 'straightforward', 'user-friendly', 'intuitive']
    }
    
    for (const [theme, keywords] of Object.entries(themeKeywords)) {
      const count = keywords.filter(keyword => text.includes(keyword)).length
      if (count >= 2) {
        themes.push(theme)
      }
    }
    
    return themes
  }
  
  // Extract SEO keywords
  private async extractSEOKeywords($: cheerio.CheerioAPI): Promise<string[]> {
    const keywords = []
    
    // Meta keywords (if present)
    const metaKeywords = $('meta[name="keywords"]').attr('content')
    if (metaKeywords) {
      keywords.push(...metaKeywords.split(',').map(k => k.trim()))
    }
    
    // Title keywords
    const title = $('title').text()
    if (title) {
      keywords.push(...title.split(/\s+/).filter(word => word.length > 3))
    }
    
    // H1, H2 keywords
    $('h1, h2').each((_, elem) => {
      const text = $(elem).text()
      keywords.push(...text.split(/\s+/).filter(word => word.length > 3))
    })
    
    return [...new Set(keywords.map(k => k.toLowerCase()))].slice(0, 20)
  }
  
  // Get empty analysis structure
  private getEmptyAnalysis(): WebsiteAnalysis {
    return {
      extractedMessaging: {
        headlines: [],
        valuePropositions: [],
        callsToAction: [],
        taglines: []
      },
      brandVoiceAnalysis: {
        tone: 'professional',
        personality: [],
        communicationStyle: 'Unknown',
        keyPhrases: []
      },
      competitivePositioning: 'Unable to analyze',
      targetAudienceSignals: [],
      serviceOfferings: [],
      pricingSignals: {
        hasVisiblePricing: false,
        pricingStrategy: 'Unknown',
        pricePoints: []
      },
      socialProofElements: [],
      contentThemes: [],
      seoKeywords: [],
      pageStructureAnalysis: {
        hasHeroBanner: false,
        hasAboutSection: false,
        hasTestimonials: false,
        hasFeatures: false,
        hasPricing: false,
        hasContact: false,
        missingElements: []
      },
      messagingGaps: {
        problemStatements: [],
        solutionClarification: [],
        benefitCommunication: [],
        urgencyCreation: []
      },
      conversionOptimization: {
        ctaStrength: 'weak',
        trustSignals: [],
        riskReduction: [],
        valuePropsClarity: 'unclear',
        recommendations: []
      },
      audienceInsights: {
        painPoints: [],
        demographics: [],
        psychographics: [],
        buyingStage: 'awareness',
        languageMatching: 'poor'
      }
    }
  }

  // Analyze page structure and missing elements
  private async analyzePageStructure($: cheerio.CheerioAPI): Promise<WebsiteAnalysis['pageStructureAnalysis']> {
    const structure = {
      hasHeroBanner: false,
      hasAboutSection: false,
      hasTestimonials: false,
      hasFeatures: false,
      hasPricing: false,
      hasContact: false,
      missingElements: [] as string[]
    }

    // Check for hero banner - Enhanced detection for content patterns
    const hasHeroClasses = $('.hero, .banner, .jumbotron, .hero-section, .main-banner').length > 0
    
    // Look for hero-like structure: prominent headline + supporting text
    const hasMainHeadline = $('h1').length > 0
    const h1Text = $('h1').first().text()
    const hasSubheadline = $('h2, .subtitle, .subheading, p').first().text().length > 30
    
    // Check if first headlines form a hero pattern (main + supporting message)
    const headlines = []
    $('h1, h2').slice(0, 3).each((_, elem) => {
      const text = $(elem).text().trim()
      if (text.length > 10) headlines.push(text)
    })
    
    const hasHeroPattern = headlines.length >= 2 && headlines[0].length > 20 && headlines[1].length > 20
    
    // ALWAYS detect hero if we have substantial headlines (Ruth's case)
    const hasSubstantialHeadlines = headlines.length >= 2 && 
                                   headlines[0].length > 50 && 
                                   headlines[1].length > 50
    
    if (hasHeroClasses || (hasMainHeadline && hasSubheadline) || hasHeroPattern || hasSubstantialHeadlines) {
      structure.hasHeroBanner = true
    }

    // Check for about section
    if ($('[class*="about"], [id*="about"], section:contains("About"), .bio, .story').length > 0) {
      structure.hasAboutSection = true
    }

    // Check for testimonials - More specific detection to match social proof logic
    const testimonialElements = $('.testimonial, .testimonials, [class="testimonial"], [id="testimonials"], [class="review"], .client-testimonial')
    let actualTestimonials = 0
    
    testimonialElements.each((_, el) => {
      const text = $(el).text().toLowerCase()
      if (text.length > 20 && (text.includes('"') || text.includes('testimonial') || text.includes('review'))) {
        actualTestimonials++
      }
    })
    
    if (actualTestimonials > 0) {
      structure.hasTestimonials = true
    }

    // Check for features - Look for content patterns, not just CSS classes
    const fullText = $('body').text().toLowerCase()
    const hasFeatureKeywords = fullText.includes('features') || fullText.includes('benefits') || 
                              fullText.includes('what you get') || fullText.includes('what you\'ll') ||
                              fullText.includes('you\'ll walk away with') || fullText.includes('includes:') ||
                              fullText.includes('you\'ll install') || fullText.includes('systems:')
    
    const hasFeatureElements = $('[class*="feature"], .benefits, .services, .offerings, .what-we-do').length > 0
    
    if (hasFeatureKeywords || hasFeatureElements) {
      structure.hasFeatures = true
    }

    // Check for pricing - Use same logic as pricingSignals for consistency
    const textContent = $('body').text()
    const pricingElements = $('.price, .pricing, [class*="price"], [id*="price"]')
    const hasVisiblePricing = pricingElements.length > 0 || 
                             textContent.includes('$') || 
                             textContent.toLowerCase().includes('price') || 
                             textContent.toLowerCase().includes('cost')
    
    if (hasVisiblePricing) {
      structure.hasPricing = true
    }

    // Check for contact forms OR clear CTAs/next steps
    const hasContactForm = $('[class*="contact"], .get-in-touch, .reach-out, form, input[type="email"]').length > 0
    
    const hasCtAs = $('button, .btn, .cta, a[href*="contact"], a[href*="signup"], a[href*="buy"], a[href*="get-started"], a[href*="purchase"]').length > 0
    
    const hasActionText = fullText.includes('get started') || fullText.includes('contact us') || 
                         fullText.includes('book a call') || fullText.includes('schedule') ||
                         fullText.includes('get access') || fullText.includes('apply now')
    
    if (hasContactForm || hasCtAs || hasActionText) {
      structure.hasContact = true
    }

    // Identify missing elements
    const missingElements = []
    if (!structure.hasHeroBanner) missingElements.push('Hero banner with clear value proposition')
    if (!structure.hasAboutSection) missingElements.push('About section to build trust and credibility')
    if (!structure.hasTestimonials) missingElements.push('Testimonials or social proof')
    if (!structure.hasFeatures) missingElements.push('Clear features or benefits section')
    if (!structure.hasPricing) missingElements.push('Pricing or investment information')
    if (!structure.hasContact) missingElements.push('Contact form or clear next steps')

    structure.missingElements = missingElements

    return structure
  }

  // Analyze messaging gaps - STRATEGIC LEVEL
  private async analyzeMessagingGaps($: cheerio.CheerioAPI, textContent: string): Promise<WebsiteAnalysis['messagingGaps']> {
    const gaps = {
      problemStatements: [],
      solutionClarification: [],
      benefitCommunication: [],
      urgencyCreation: [],
      strategicGaps: [],
      positioningWeaknesses: []
    }

    const text = textContent.toLowerCase()
    const headlines = []
    $('h1, h2, h3').each((_, el) => headlines.push($(el).text().trim()))
    
    // STRATEGIC GAP ANALYSIS
    
    // 1. Pain Point Sophistication
    const basicPainWords = ['problem', 'challenge', 'struggle', 'difficult', 'frustrated']
    const sophisticatedPainWords = ['bottleneck', 'scaling', 'systematize', 'leverage', 'optimize']
    const hasSophisticatedPain = sophisticatedPainWords.some(word => text.includes(word))
    const hasBasicPain = basicPainWords.some(word => text.includes(word))
    
    if (hasBasicPain && !hasSophisticatedPain) {
      gaps.strategicGaps.push('Pain messaging targets low-sophistication prospects instead of premium buyers')
    }
    
    // 2. Outcome Specificity Analysis
    const vagueOutcomes = ['success', 'results', 'better', 'improve', 'grow']
    const specificOutcomes = ['revenue', 'profit', 'time', 'hours', 'days', '%', '$', 'x', 'roi']
    const hasVagueOnly = vagueOutcomes.some(word => text.includes(word)) && 
                         !specificOutcomes.some(word => text.includes(word))
    
    if (hasVagueOnly) {
      gaps.strategicGaps.push('Outcomes are too vague to justify premium pricing')
    }
    
    // 3. Authority Positioning Gaps  
    const authorityMarkers = ['proven', 'system', 'framework', 'methodology', 'proprietary']
    const hasAuthorityPositioning = authorityMarkers.some(word => text.includes(word))
    if (!hasAuthorityPositioning) {
      gaps.positioningWeaknesses.push('Missing intellectual property positioning that commands premium fees')
    }
    
    // 4. Buyer Journey Misalignment
    const awarenessWords = ['learn', 'discover', 'find out', 'understand']  
    const decisionWords = ['install', 'implement', 'get', 'start', 'begin']
    const hasAwarenessStage = awarenessWords.some(word => text.includes(word))
    const hasDecisionStage = decisionWords.some(word => text.includes(word))
    
    if (hasAwarenessStage && hasDecisionStage) {
      gaps.strategicGaps.push('Mixing awareness and decision stage messaging confuses buying intent')
    }
    if (!hasSolutionClarity) {
      gaps.solutionClarification.push('Solution is not clearly articulated')
      gaps.solutionClarification.push('Add specific outcomes and transformations you provide')
    }

    // Check for benefit communication
    const benefitWords = ['benefit', 'result', 'outcome', 'success', 'achieve', 'increase', 'improve', 'save']
    const hasBenefits = benefitWords.some(word => text.includes(word))
    if (!hasBenefits) {
      gaps.benefitCommunication.push('Benefits are not clearly communicated')
      gaps.benefitCommunication.push('Add specific, measurable results clients can expect')
    }

    // Check for urgency
    const urgencyWords = ['now', 'today', 'limited', 'urgent', 'deadline', 'act fast', 'don\'t wait']
    const hasUrgency = urgencyWords.some(word => text.includes(word))
    if (!hasUrgency) {
      gaps.urgencyCreation.push('No sense of urgency or reason to act now')
      gaps.urgencyCreation.push('Consider adding time-sensitive offers or consequences of delay')
    }

    return gaps
  }

  // Analyze conversion optimization opportunities
  private async analyzeConversionOptimization($: cheerio.CheerioAPI, textContent: string): Promise<WebsiteAnalysis['conversionOptimization']> {
    const optimization = {
      ctaStrength: 'weak' as 'weak' | 'moderate' | 'strong',
      trustSignals: [],
      riskReduction: [],
      valuePropsClarity: 'unclear' as 'unclear' | 'moderate' | 'clear',
      recommendations: []
    }

    // Analyze CTA strength
    const ctas = []
    $('button, .btn, .cta, a[href*="contact"], a[href*="buy"], a[href*="signup"]').each((_, elem) => {
      ctas.push($(elem).text().trim().toLowerCase())
    })
    
    const strongCtaWords = ['get started', 'transform', 'achieve', 'unlock', 'discover', 'claim']
    const weakCtaWords = ['click here', 'learn more', 'read more', 'submit']
    
    const hasStrongCtas = ctas.some(cta => strongCtaWords.some(word => cta.includes(word)))
    const hasWeakCtas = ctas.some(cta => weakCtaWords.some(word => cta.includes(word)))
    
    if (hasStrongCtas) optimization.ctaStrength = 'strong'
    else if (ctas.length > 0 && !hasWeakCtas) optimization.ctaStrength = 'moderate'
    
    // Identify trust signals
    if ($('img[alt*="certification"], img[alt*="award"], img[alt*="badge"]').length > 0) {
      optimization.trustSignals.push('Professional certifications or awards displayed')
    }
    if ($('[class*="testimonial"], [class*="review"]').length > 0) {
      optimization.trustSignals.push('Client testimonials present')
    }
    if ($('img[alt*="client"], img[alt*="logo"], .client-logos').length > 0) {
      optimization.trustSignals.push('Client logos or case studies shown')
    }

    // Check for risk reduction - More specific detection
    const text = textContent.toLowerCase()
    if (text.includes('money-back guarantee') || text.includes('100% guarantee') || 
        (text.includes('refund') && text.includes('guarantee')) ||
        text.includes('satisfaction guarantee')) {
      optimization.riskReduction.push('Money-back guarantee offered')
    }
    if (text.includes('free consultation') || text.includes('free call') || text.includes('no obligation')) {
      optimization.riskReduction.push('Free consultation reduces commitment risk')
    }

    // Analyze value prop clarity
    const headlines = []
    $('h1, h2, .hero-title').each((_, elem) => {
      headlines.push($(elem).text().trim())
    })
    
    const hasSpecificValue = headlines.some(h => 
      h.includes('increase') || h.includes('save') || h.includes('achieve') || 
      /\d+/.test(h) // Contains numbers
    )
    
    if (hasSpecificValue) optimization.valuePropsClarity = 'clear'
    else if (headlines.length > 0) optimization.valuePropsClarity = 'moderate'

    // Generate recommendations
    const recommendations = []
    if (optimization.ctaStrength === 'weak') {
      recommendations.push('Strengthen CTAs with action-oriented, benefit-focused language')
    }
    if (optimization.trustSignals.length < 2) {
      recommendations.push('Add more trust signals: testimonials, certifications, or client logos')
    }
    if (optimization.riskReduction.length === 0) {
      recommendations.push('Offer risk reduction: free consultation, guarantee, or trial period')
    }
    if (optimization.valuePropsClarity !== 'clear') {
      recommendations.push('Make value propositions more specific with numbers and concrete outcomes')
    }
    
    optimization.recommendations = recommendations

    return optimization
  }

  // Analyze audience insights
  private async analyzeAudienceInsights($: cheerio.CheerioAPI, textContent: string): Promise<WebsiteAnalysis['audienceInsights']> {
    const insights = {
      painPoints: [],
      demographics: [],
      psychographics: [],
      buyingStage: 'awareness' as 'awareness' | 'consideration' | 'decision',
      languageMatching: 'poor' as 'poor' | 'good' | 'excellent'
    }

    const text = textContent.toLowerCase()

    // Extract pain points from content
    const painPatterns = [
      /struggling with (\w+(?:\s+\w+)*)/g,
      /tired of (\w+(?:\s+\w+)*)/g,
      /frustrated by (\w+(?:\s+\w+)*)/g,
      /problem with (\w+(?:\s+\w+)*)/g,
      /difficulty (\w+(?:\s+\w+)*)/g
    ]

    painPatterns.forEach(pattern => {
      const matches = [...text.matchAll(pattern)]
      matches.forEach(match => {
        if (match[1] && match[1].length < 50) {
          insights.painPoints.push(match[1])
        }
      })
    })

    // Identify demographics from language patterns
    if (text.includes('entrepreneur') || text.includes('founder') || text.includes('ceo')) {
      insights.demographics.push('Business owners/entrepreneurs')
    }
    if (text.includes('professional') || text.includes('executive') || text.includes('manager')) {
      insights.demographics.push('Corporate professionals')
    }
    if (text.includes('consultant') || text.includes('freelancer') || text.includes('coach')) {
      insights.demographics.push('Service providers/consultants')
    }

    // Identify psychographics
    if (text.includes('growth') || text.includes('scale') || text.includes('expand')) {
      insights.psychographics.push('Growth-oriented')
    }
    if (text.includes('efficient') || text.includes('productive') || text.includes('optimize')) {
      insights.psychographics.push('Efficiency-focused')
    }
    if (text.includes('success') || text.includes('achieve') || text.includes('results')) {
      insights.psychographics.push('Results-driven')
    }

    // Determine buying stage based on content focus
    const awarenessWords = ['learn', 'understand', 'discover', 'explore', 'what is', 'how to']
    const considerationWords = ['compare', 'versus', 'benefits', 'features', 'why choose']
    const decisionWords = ['buy', 'purchase', 'get started', 'sign up', 'contact', 'schedule']

    const awarenessCount = awarenessWords.filter(word => text.includes(word)).length
    const considerationCount = considerationWords.filter(word => text.includes(word)).length
    const decisionCount = decisionWords.filter(word => text.includes(word)).length

    if (decisionCount > awarenessCount && decisionCount > considerationCount) {
      insights.buyingStage = 'decision'
    } else if (considerationCount > awarenessCount) {
      insights.buyingStage = 'consideration'
    }

    // Assess language matching (professional vs casual)
    const professionalWords = ['solution', 'expertise', 'professional', 'strategic', 'optimize']
    const casualWords = ['easy', 'simple', 'awesome', 'great', 'love', 'fun']
    
    const professionalCount = professionalWords.filter(word => text.includes(word)).length
    const casualCount = casualWords.filter(word => text.includes(word)).length
    
    const totalWords = text.split(' ').length
    const professionalRatio = professionalCount / totalWords * 1000
    const casualRatio = casualCount / totalWords * 1000

    if (professionalRatio > 2 || casualRatio > 2) {
      insights.languageMatching = professionalRatio > casualRatio ? 'excellent' : 'good'
    } else {
      insights.languageMatching = 'good'
    }

    return insights
  }
  
  // Get website intelligence for user
  async getWebsiteIntelligence(userId: string) {
    return conversationMemoryService.getWebsiteIntelligence(userId)
  }
}

export const websiteIntelligenceService = new WebsiteIntelligenceService()