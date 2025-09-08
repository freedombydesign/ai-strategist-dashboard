import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const funnelType = searchParams.get('type')
    const industry = searchParams.get('industry')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '25')

    let query = supabase
      .from('convert_flow_funnels')
      .select(`
        *,
        convert_flow_funnel_analytics!convert_flow_funnel_analytics_funnel_id_fkey(
          date,
          unique_visitors,
          opt_ins,
          conversions,
          revenue,
          opt_in_rate,
          conversion_rate
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (funnelType && funnelType !== 'all') {
      query = query.eq('funnel_type', funnelType)
    }

    if (industry && industry !== 'all') {
      query = query.eq('industry', industry)
    }

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data: funnels, error, count } = await query

    if (error) {
      console.error('[CONVERT-FLOW] Error fetching funnels:', error)
      return NextResponse.json({ error: 'Failed to fetch funnels' }, { status: 500 })
    }

    // Get funnel performance summary
    const performanceSummary = await getFunnelPerformanceSummary()

    return NextResponse.json({
      funnels: funnels || [],
      pagination: {
        total: count || 0,
        page,
        limit,
        pages: Math.ceil((count || 0) / limit)
      },
      performanceSummary
    })

  } catch (error) {
    console.error('[CONVERT-FLOW] Unexpected error fetching funnels:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const funnelData = await request.json()

    // Validate required fields
    const requiredFields = ['name', 'funnel_type', 'pages']
    for (const field of requiredFields) {
      if (!funnelData[field]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 })
      }
    }

    // Validate funnel pages structure
    if (!Array.isArray(funnelData.pages) || funnelData.pages.length === 0) {
      return NextResponse.json({ error: 'Funnel must have at least one page' }, { status: 400 })
    }

    // Apply industry-specific template if not provided
    if (!funnelData.pages[0].template && funnelData.industry) {
      funnelData.pages = applyIndustryTemplate(funnelData.pages, funnelData.industry, funnelData.funnel_type)
    }

    // Set up default automation rules based on funnel type
    const automationRules = funnelData.automation_rules || getDefaultAutomationRules(funnelData.funnel_type)

    // Set up default integrations
    const integrations = funnelData.integrations || getDefaultIntegrations()

    // Create funnel
    const { data: newFunnel, error } = await supabase
      .from('convert_flow_funnels')
      .insert({
        ...funnelData,
        automation_rules: automationRules,
        integrations,
        status: 'draft',
        is_published: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('[CONVERT-FLOW] Error creating funnel:', error)
      return NextResponse.json({ error: 'Failed to create funnel' }, { status: 500 })
    }

    // Initialize analytics record
    await supabase
      .from('convert_flow_funnel_analytics')
      .insert({
        funnel_id: newFunnel.id,
        date: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString()
      })

    return NextResponse.json({
      funnel: newFunnel,
      message: 'Funnel created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('[CONVERT-FLOW] Unexpected error creating funnel:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Apply industry-specific templates to funnel pages
function applyIndustryTemplate(pages: any[], industry: string, funnelType: string): any[] {
  const templates = getIndustryTemplates()
  const industryTemplate = templates[industry]?.[funnelType]
  
  if (!industryTemplate) return pages

  return pages.map((page, index) => {
    const templatePage = industryTemplate.pages?.[index]
    if (!templatePage) return page

    return {
      ...page,
      template: templatePage.template,
      content: {
        ...templatePage.content,
        ...page.content // Allow override of template content
      },
      settings: {
        ...templatePage.settings,
        ...page.settings // Allow override of template settings
      }
    }
  })
}

// Get industry-specific funnel templates for service providers
function getIndustryTemplates() {
  return {
    // BUSINESS & PROFESSIONAL SERVICES
    'consulting': {
      'lead_magnet': {
        pages: [
          {
            type: 'landing',
            template: 'consulting_authority_builder',
            content: {
              headline: 'The {Industry} Growth Blueprint That Generated $2.3M+ for Our Clients',
              subheadline: 'Discover the exact 5-step framework we use to help {industry} businesses scale from 6 to 7 figures',
              bulletPoints: [
                'The #1 mistake that keeps {industry} businesses stuck at 6-figures',
                'Our proprietary {Industry} Scale Framework used by 200+ successful firms',
                'Case studies showing real results from real businesses'
              ],
              cta: 'Download the Blueprint (Free)',
              trustSignals: ['featured_in', 'client_results', 'testimonials']
            }
          }
        ]
      },
      'consultation_booking': {
        pages: [
          {
            type: 'landing',
            template: 'consulting_strategy_call',
            content: {
              headline: 'Book Your Complimentary {Industry} Strategy Session',
              subheadline: 'Discover the 3 hidden profit levers in your business (Worth $50K+ in additional revenue)',
              bulletPoints: [
                'Identify your biggest growth bottleneck in 15 minutes',
                'Get a custom roadmap to add $500K+ in annual revenue',
                'Learn if you qualify for our done-for-you program'
              ],
              cta: 'Book My Strategy Session',
              valueProps: ['No pitch, pure value', '45-minute session', 'Limited spots available'],
              calendar: { type: 'calendly', duration: 45 }
            }
          }
        ]
      }
    },
    
    'accounting': {
      'lead_magnet': {
        pages: [
          {
            type: 'landing',
            template: 'accounting_tax_guide',
            content: {
              headline: 'The Ultimate Tax Strategy Guide That Saved Our Clients $2.1M Last Year',
              subheadline: 'Discover 17 legal tax strategies that most business owners miss (and their CPAs never mention)',
              bulletPoints: [
                '17 overlooked deductions that could save you $15K+ annually',
                'The "Hidden Asset" strategy that reduces taxes by 40%',
                'How to legally pay ZERO taxes on business profits'
              ],
              cta: 'Get My Tax Strategy Guide',
              urgency: 'Tax season is coming - don\'t wait!'
            }
          }
        ]
      },
      'consultation_booking': {
        pages: [
          {
            type: 'landing',
            template: 'accounting_tax_review',
            content: {
              headline: 'Free Tax Review: Find Hidden Savings in Your Business',
              subheadline: 'Our CPAs review your books and identify $10K+ in missed deductions (guaranteed)',
              bulletPoints: [
                'Comprehensive review of your financial statements',
                'Identify overlooked deductions and credits',
                'Get a custom tax optimization strategy'
              ],
              cta: 'Book My Free Tax Review',
              guarantee: 'We guarantee to find $10K+ in savings or the review is free'
            }
          }
        ]
      }
    },

    'legal': {
      'lead_magnet': {
        pages: [
          {
            type: 'landing',
            template: 'legal_business_protection',
            content: {
              headline: 'The Business Protection Checklist That Prevents 90% of Lawsuits',
              subheadline: 'Protect your business assets and avoid costly legal mistakes with this attorney-created checklist',
              bulletPoints: [
                'The 7 legal documents every business MUST have',
                'How to structure your business to minimize liability',
                'Contract clauses that prevent 95% of disputes'
              ],
              cta: 'Download the Checklist (Free)',
              authority: 'Created by attorneys with 25+ years experience'
            }
          }
        ]
      },
      'consultation_booking': {
        pages: [
          {
            type: 'landing',
            template: 'legal_consultation',
            content: {
              headline: 'Free Legal Risk Assessment for Your Business',
              subheadline: 'Identify legal vulnerabilities before they become expensive problems',
              bulletPoints: [
                'Comprehensive review of your business structure',
                'Identify gaps in contracts and agreements',
                'Get priority action items to protect your assets'
              ],
              cta: 'Schedule My Risk Assessment',
              credentials: ['Licensed attorneys', 'No obligation', 'Confidential review']
            }
          }
        ]
      }
    },

    // MARKETING & CREATIVE SERVICES
    'marketing_agency': {
      'lead_magnet': {
        pages: [
          {
            type: 'landing',
            template: 'agency_roi_calculator',
            content: {
              headline: 'ROI Calculator: See How Much Revenue You\'re Leaving on the Table',
              subheadline: 'Input your current marketing spend and discover your true revenue potential',
              bulletPoints: [
                'Calculate your current marketing ROI in 60 seconds',
                'See exactly how much revenue you\'re missing',
                'Get specific recommendations to 3x your results'
              ],
              cta: 'Calculate My Revenue Potential',
              interactive: { type: 'calculator', fields: ['monthly_spend', 'current_leads', 'close_rate'] }
            }
          }
        ]
      },
      'case_study': {
        pages: [
          {
            type: 'landing',
            template: 'agency_case_study',
            content: {
              headline: 'Case Study: How We Helped {Client} Generate $1.2M in 90 Days',
              subheadline: 'See the exact strategy, tactics, and results that transformed this business',
              sections: [
                { title: 'The Challenge', content: 'What {Client} was struggling with' },
                { title: 'Our Solution', content: 'The specific strategy we implemented' },
                { title: 'The Results', content: '$1.2M in revenue, 340% ROI' }
              ],
              cta: 'Get the Full Case Study',
              socialProof: ['client_testimonial', 'revenue_screenshots', 'timeline']
            }
          }
        ]
      }
    },

    'web_design': {
      'lead_magnet': {
        pages: [
          {
            type: 'landing',
            template: 'web_design_audit',
            content: {
              headline: 'Free Website Audit: 47-Point Conversion Optimization Checklist',
              subheadline: 'Discover exactly what\'s stopping visitors from becoming customers',
              bulletPoints: [
                '47 conversion factors we check on every website',
                'Identify the #1 thing killing your conversions',
                'Get specific recommendations to double your results'
              ],
              cta: 'Get My Free Website Audit',
              form: { fields: ['website_url', 'monthly_visitors', 'current_conversion'] }
            }
          }
        ]
      },
      'portfolio_showcase': {
        pages: [
          {
            type: 'landing',
            template: 'web_design_portfolio',
            content: {
              headline: 'See How We\'ve Helped 200+ Businesses Increase Conversions by 340%',
              subheadline: 'Browse our portfolio of high-converting websites and the results they generated',
              portfolioItems: [
                { industry: 'E-commerce', result: '+340% conversions', image: 'placeholder' },
                { industry: 'SaaS', result: '+250% signups', image: 'placeholder' },
                { industry: 'Professional Services', result: '+180% leads', image: 'placeholder' }
              ],
              cta: 'See Full Portfolio & Get Quote'
            }
          }
        ]
      }
    },

    // HEALTH & WELLNESS SERVICES
    'fitness_coaching': {
      'lead_magnet': {
        pages: [
          {
            type: 'landing',
            template: 'fitness_transformation_guide',
            content: {
              headline: 'The 30-Day Transformation Blueprint (No Gym Required)',
              subheadline: 'The exact system that helped 2,847 people lose 15-30 pounds in their first month',
              bulletPoints: [
                'The 15-minute home workout that burns fat for 24 hours',
                'Simple meal planning system (no counting calories)',
                'How to stay motivated when life gets crazy'
              ],
              cta: 'Get My Transformation Blueprint',
              beforeAfter: { images: ['before1', 'after1'], testimonials: ['Lost 23 pounds!'] }
            }
          }
        ]
      },
      'challenge_registration': {
        pages: [
          {
            type: 'landing',
            template: 'fitness_challenge',
            content: {
              headline: '5-Day Fat Loss Challenge: Lose 5-8 Pounds This Week',
              subheadline: 'Join 3,000+ people who are transforming their bodies in just 5 days',
              bulletPoints: [
                'Daily 15-minute fat-burning workouts',
                'Simple meal plans delivered daily',
                'Private Facebook group for support',
                'Live Q&A sessions with certified trainers'
              ],
              cta: 'Join the Challenge (Free)',
              countdown: { startDate: 'next_monday', urgency: 'Challenge starts Monday!' }
            }
          }
        ]
      }
    },

    'wellness_coaching': {
      'lead_magnet': {
        pages: [
          {
            type: 'landing',
            template: 'wellness_stress_relief',
            content: {
              headline: 'The 7-Day Stress Elimination System',
              subheadline: 'Reduce stress, increase energy, and reclaim your life with this proven system',
              bulletPoints: [
                'The 5-minute morning routine that eliminates anxiety',
                'How to turn stress into unstoppable energy',
                'Sleep optimization techniques for 8 hours of deep rest'
              ],
              cta: 'Get My Stress Elimination System',
              meditation: { type: 'sample_audio', duration: '5-minute guided meditation' }
            }
          }
        ]
      }
    },

    // FINANCIAL SERVICES
    'financial_advisor': {
      'lead_magnet': {
        pages: [
          {
            type: 'landing',
            template: 'financial_retirement_calculator',
            content: {
              headline: 'Retirement Reality Check: Will You Have Enough Money to Retire?',
              subheadline: 'Calculate exactly how much you need to retire comfortably (most people are shocked by this number)',
              bulletPoints: [
                'Calculate your true retirement needs in 3 minutes',
                'See if you\'re on track or falling behind',
                'Get a personalized action plan to catch up'
              ],
              cta: 'Check My Retirement Readiness',
              calculator: { type: 'retirement_planner', fields: ['age', 'income', 'savings', 'retirement_age'] }
            }
          }
        ]
      },
      'consultation_booking': {
        pages: [
          {
            type: 'landing',
            template: 'financial_consultation',
            content: {
              headline: 'Free Wealth Strategy Session: Optimize Your Financial Future',
              subheadline: 'Get a personalized roadmap to build wealth faster and retire earlier',
              bulletPoints: [
                'Comprehensive review of your financial situation',
                'Identify opportunities to save on taxes',
                'Create a custom investment strategy'
              ],
              cta: 'Book My Strategy Session',
              credentials: ['CFP Certified', 'Fiduciary Advisor', '20+ Years Experience']
            }
          }
        ]
      }
    },

    // REAL ESTATE SERVICES
    'real_estate': {
      'lead_magnet': {
        pages: [
          {
            type: 'landing',
            template: 'real_estate_market_report',
            content: {
              headline: 'Exclusive {City} Market Report: Home Values Expected to Rise 12% This Year',
              subheadline: 'Get insider knowledge on the best neighborhoods to buy before prices surge',
              bulletPoints: [
                'Which neighborhoods will see the biggest price increases',
                'The best time to buy or sell in the current market',
                'Hidden opportunities most buyers miss'
              ],
              cta: 'Get My Market Report',
              localData: { type: 'market_stats', updateFrequency: 'weekly' }
            }
          }
        ]
      },
      'home_valuation': {
        pages: [
          {
            type: 'landing',
            template: 'real_estate_valuation',
            content: {
              headline: 'What\'s Your Home Really Worth? Get Your Free Valuation',
              subheadline: 'Get an accurate estimate of your home\'s value in today\'s market',
              bulletPoints: [
                'Instant home value estimate using recent sales data',
                'See how your home compares to similar properties',
                'Get tips to increase your home\'s value'
              ],
              cta: 'Get My Home Value',
              form: { type: 'address_lookup', fields: ['address', 'property_details'] }
            }
          }
        ]
      }
    },

    // TECHNOLOGY SERVICES
    'it_services': {
      'lead_magnet': {
        pages: [
          {
            type: 'landing',
            template: 'it_security_audit',
            content: {
              headline: 'Free Cybersecurity Audit: Is Your Business a Sitting Duck for Hackers?',
              subheadline: 'Identify critical security vulnerabilities before cybercriminals find them',
              bulletPoints: [
                '23-point security assessment of your systems',
                'Identify your biggest vulnerabilities',
                'Get a priority action plan to secure your business'
              ],
              cta: 'Get My Security Audit',
              urgency: 'Cyberattacks increase 400% during economic uncertainty'
            }
          }
        ]
      }
    },

    // EDUCATION & TRAINING
    'corporate_training': {
      'lead_magnet': {
        pages: [
          {
            type: 'landing',
            template: 'training_roi_calculator',
            content: {
              headline: 'Training ROI Calculator: See the Real Cost of Untrained Employees',
              subheadline: 'Calculate how much money you\'re losing to poor performance and high turnover',
              bulletPoints: [
                'Calculate the true cost of employee turnover',
                'See ROI of proper training programs',
                'Get benchmarks for your industry'
              ],
              cta: 'Calculate My Training ROI',
              calculator: { type: 'training_roi', fields: ['employees', 'turnover_rate', 'avg_salary'] }
            }
          }
        ]
      }
    }
  }
}

// Get default automation rules based on funnel type
function getDefaultAutomationRules(funnelType: string) {
  const defaultRules: Record<string, any> = {
    'lead_magnet': {
      triggers: [
        {
          event: 'form_submit',
          actions: [
            { type: 'send_email', template: 'lead_magnet_delivery' },
            { type: 'add_to_sequence', sequence: 'nurture_new_leads' },
            { type: 'create_hubspot_contact' },
            { type: 'add_tag', tag: 'lead_magnet_download' }
          ]
        },
        {
          event: 'email_open',
          delay: '1 day',
          actions: [
            { type: 'send_email', template: 'implementation_tips' }
          ]
        }
      ],
      scoring: {
        form_submit: 25,
        email_open: 5,
        email_click: 10,
        page_revisit: 8
      }
    },
    'webinar': {
      triggers: [
        {
          event: 'webinar_register',
          actions: [
            { type: 'send_email', template: 'webinar_confirmation' },
            { type: 'add_to_sequence', sequence: 'webinar_reminder_sequence' },
            { type: 'create_calendar_reminder' }
          ]
        },
        {
          event: 'webinar_attend',
          actions: [
            { type: 'add_tag', tag: 'webinar_attendee' },
            { type: 'update_lead_score', points: 50 }
          ]
        },
        {
          event: 'webinar_no_show',
          actions: [
            { type: 'send_email', template: 'webinar_replay' },
            { type: 'add_to_sequence', sequence: 'replay_nurture' }
          ]
        }
      ]
    },
    'consultation': {
      triggers: [
        {
          event: 'call_booked',
          actions: [
            { type: 'send_email', template: 'call_confirmation' },
            { type: 'create_hubspot_deal' },
            { type: 'send_slack_notification', channel: 'sales_team' }
          ]
        },
        {
          event: 'call_completed',
          actions: [
            { type: 'send_email', template: 'call_followup' },
            { type: 'create_proposal_task' }
          ]
        }
      ]
    }
  }

  return defaultRules[funnelType] || { triggers: [], scoring: {} }
}

// Get default integration settings
function getDefaultIntegrations() {
  return {
    email: {
      provider: 'resend',
      enabled: true,
      settings: {
        from_name: 'Your Company',
        from_email: 'hello@yourcompany.com'
      }
    },
    crm: {
      provider: 'hubspot',
      enabled: true,
      settings: {
        create_contacts: true,
        create_deals: true,
        sync_activities: true
      }
    },
    analytics: {
      provider: 'google_analytics',
      enabled: false,
      settings: {
        track_conversions: true,
        enhanced_ecommerce: false
      }
    }
  }
}

// Get funnel performance summary
async function getFunnelPerformanceSummary() {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const { data: recentAnalytics } = await supabase
      .from('convert_flow_funnel_analytics')
      .select(`
        *,
        convert_flow_funnels!inner(name, funnel_type, status)
      `)
      .gte('date', thirtyDaysAgo)

    if (!recentAnalytics?.length) {
      return {
        totalVisitors: 0,
        totalConversions: 0,
        avgConversionRate: 0,
        totalRevenue: 0,
        topPerformingFunnels: []
      }
    }

    const totalVisitors = recentAnalytics.reduce((sum, a) => sum + (a.unique_visitors || 0), 0)
    const totalConversions = recentAnalytics.reduce((sum, a) => sum + (a.conversions || 0), 0)
    const totalRevenue = recentAnalytics.reduce((sum, a) => sum + (a.revenue || 0), 0)
    const avgConversionRate = totalVisitors > 0 ? (totalConversions / totalVisitors) * 100 : 0

    // Group by funnel for top performers
    const funnelPerformance = recentAnalytics.reduce((acc, analytics) => {
      const funnelId = analytics.funnel_id
      if (!acc[funnelId]) {
        acc[funnelId] = {
          name: analytics.convert_flow_funnels.name,
          type: analytics.convert_flow_funnels.funnel_type,
          visitors: 0,
          conversions: 0,
          revenue: 0
        }
      }
      acc[funnelId].visitors += analytics.unique_visitors || 0
      acc[funnelId].conversions += analytics.conversions || 0
      acc[funnelId].revenue += analytics.revenue || 0
      return acc
    }, {} as Record<string, any>)

    const topPerformingFunnels = Object.entries(funnelPerformance)
      .map(([id, data]: [string, any]) => ({
        ...data,
        conversionRate: data.visitors > 0 ? (data.conversions / data.visitors) * 100 : 0
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)

    return {
      totalVisitors,
      totalConversions,
      avgConversionRate: Math.round(avgConversionRate * 100) / 100,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      topPerformingFunnels
    }

  } catch (error) {
    console.error('[CONVERT-FLOW] Error calculating funnel performance:', error)
    return {
      totalVisitors: 0,
      totalConversions: 0,
      avgConversionRate: 0,
      totalRevenue: 0,
      topPerformingFunnels: []
    }
  }
}