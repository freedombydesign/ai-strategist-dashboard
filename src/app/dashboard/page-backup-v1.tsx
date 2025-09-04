'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useAuth } from '@/context/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import { PremiumHeader, WelcomeBanner } from '@/components/PremiumHeader'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Progress } from '@/components/ui/Progress'
import LoadingSkeleton from '@/components/LoadingSkeleton'
import { diagnosticService } from '@/services/diagnosticService'
import BusinessContextOnboarding from '@/components/BusinessContextOnboarding'
import DailyCheckinPrompt from '@/components/DailyCheckinPrompt'
import { 
  ChartBarIcon,
  TrophyIcon,
  RocketLaunchIcon,
  SparklesIcon,
  ArrowTrendingUpIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline'
import { MobileNavigation, FloatingActionButton } from '@/components/MobileNavigation'

// Import components directly to debug RSC issue
import SimpleSprintPlanner from '@/components/SimpleSprintPlanner'
import SimpleDashboardProgress from '@/components/SimpleDashboardProgress'
import BusinessMetricsWidget from '@/components/BusinessMetricsWidget'
import ImplementationMetricsOverview from '@/components/ImplementationMetricsOverview'
import AchievementWidget from '@/components/AchievementWidget'
import EnhancedSprintTracker from '@/components/EnhancedSprintTracker'
// const SimpleSprintPlanner = lazy(() => import('@/components/SimpleSprintPlanner'))
// const SimpleDashboardProgress = lazy(() => import('@/components/SimpleDashboardProgress'))  
// const BusinessMetricsWidget = lazy(() => import('@/components/BusinessMetricsWidget'))
// const ImplementationMetricsOverview = lazy(() => import('@/components/ImplementationMetricsOverview'))
// const AchievementWidget = lazy(() => import('@/components/AchievementWidget'))
// const EnhancedSprintTracker = lazy(() => import('@/components/EnhancedSprintTracker'))

export default function Dashboard() {
  console.log('[DASHBOARD] *** COMPONENT RENDERED WITH LATEST CHANGES ***');
  console.log('[DASHBOARD] Render triggered - checking if dev tools caused re-render');
  const { user, signOut, isSigningOut } = useAuth()
  const [freedomScore, setFreedomScore] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)
  const [businessContext, setBusinessContext] = useState<any>(null)
  const [showBusinessOnboarding, setShowBusinessOnboarding] = useState(false)
  const [contextLoading, setContextLoading] = useState(true)
  const [showDebugInfo, setShowDebugInfo] = useState(false)
  const [debugData, setDebugData] = useState<any>(null)

  // Hydration effect
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (!isHydrated) {
      console.log('[DASHBOARD] Waiting for hydration...')
      return
    }
    
    if (!user?.id) {
      console.log('[DASHBOARD] No user found, ProtectedRoute will handle redirect')
      setLoading(false)
      setContextLoading(false)
      return
    }
    
    console.log('[DASHBOARD] Ready to load data for user:', user.id)
    loadUserDiagnosticData()
  }, [isHydrated, user])

  // Check for business context
  useEffect(() => {
    console.log('[DASHBOARD] Business context useEffect triggered:', { isHydrated, userId: user?.id, userObject: !!user });
    if (!isHydrated) {
      console.log('[DASHBOARD] Skipping business context - not hydrated');
      return;
    }
    
    if (!user?.id) {
      console.log('[DASHBOARD] Skipping business context - no user ID:', { user: !!user, id: user?.id });
      return;
    }
    
    console.log('[DASHBOARD] All conditions met - triggering business context check');
    checkBusinessContext();
  }, [isHydrated, user])

  const checkBusinessContext = async () => {
    try {
      setContextLoading(true)
      console.log('[DASHBOARD] Fetching business context for user:', user?.id)
      const response = await fetch(`/api/business-context?userId=${user?.id}`)
      const result = await response.json()
      console.log('[DASHBOARD] Business context API response:', result)
      
      if (result.success && result.data) {
        console.log('[DASHBOARD] Found business context data:', result.data)
        // Transform database data to match component interface
        const transformedData = {
          businessName: result.data.business_name || '',
          businessModel: result.data.business_model || 'B2B',
          revenueModel: result.data.revenue_model || '',
          currentRevenue: result.data.current_revenue || '',
          teamSize: result.data.team_size || '',
          growthStage: result.data.growth_stage || 'Growth',
          targetMarket: result.data.target_market || '',
          idealClientProfile: (() => {
            console.log('[DASHBOARD] Processing ideal_client_profile:', result.data.ideal_client_profile, typeof result.data.ideal_client_profile);
            try {
              if (result.data.ideal_client_profile) {
                // If it's already an object, use it directly
                if (typeof result.data.ideal_client_profile === 'object') {
                  return {
                    title: result.data.ideal_client_profile.title || result.data.ideal_client_profile.niche || '',
                    companySize: result.data.ideal_client_profile.companySize || result.data.ideal_client_profile.company_size || '',
                    painPoints: result.data.ideal_client_profile.painPoints || result.data.ideal_client_profile.pain_points || ''
                  };
                }
                // If it's a string, try to parse as JSON
                if (typeof result.data.ideal_client_profile === 'string') {
                  try {
                    const parsed = JSON.parse(result.data.ideal_client_profile);
                    return {
                      title: parsed.title || parsed.niche || '',
                      companySize: parsed.companySize || parsed.company_size || '',
                      painPoints: parsed.painPoints || parsed.pain_points || ''
                    };
                  } catch {
                    // If JSON parsing fails, treat as simple string for title
                    return {
                      title: result.data.ideal_client_profile,
                      companySize: '',
                      painPoints: ''
                    };
                  }
                }
              }
            } catch (error) {
              console.error('[DASHBOARD] Error processing ideal_client_profile:', error);
            }
            return {
              title: '',
              companySize: '',
              painPoints: ''
            };
          })(),
          uniqueValueProposition: result.data.unique_value_proposition || '',
          mainCompetitors: result.data.main_competitors || '',
          competitiveAdvantage: result.data.competitive_advantage || '',
          topBottlenecks: (() => {
            console.log('[DASHBOARD] Processing top_bottlenecks:', result.data.top_bottlenecks, typeof result.data.top_bottlenecks);
            try {
              if (!result.data.top_bottlenecks) return [];
              
              // If it's already an array, return it
              if (Array.isArray(result.data.top_bottlenecks)) {
                return result.data.top_bottlenecks;
              }
              
              // If it's a string, try JSON parse first
              if (typeof result.data.top_bottlenecks === 'string') {
                try {
                  const parsed = JSON.parse(result.data.top_bottlenecks);
                  if (Array.isArray(parsed)) return parsed;
                } catch {
                  // If JSON parse fails, try comma-separated string
                  return result.data.top_bottlenecks.split(',').map((item: string) => item.trim()).filter(Boolean);
                }
              }
              
              return [];
            } catch (error) {
              console.error('[DASHBOARD] Error processing top_bottlenecks:', error);
              return [];
            }
          })(),
          biggestChallenge: result.data.biggest_challenge || '',
          previousFrameworks: result.data.previous_frameworks || '',
          primaryGoal: result.data.primary_goal || '',
          successMetrics: result.data.success_metrics || '',
          timeframe: result.data.timeframe || '',
          industry: result.data.industry || '',
          businessAge: result.data.business_age || '',
          websiteUrl: result.data.website_url || '',
          additionalContext: result.data.additional_context || ''
        }
        setBusinessContext(transformedData)
        console.log('[DASHBOARD] Transformed business context:', transformedData)
        setShowBusinessOnboarding(false)
      } else {
        console.log('[DASHBOARD] No business context found, showing onboarding')
        // No business context found, show onboarding
        setShowBusinessOnboarding(true)
      }
    } catch (error) {
      console.error('[DASHBOARD] Error checking business context:', error)
    } finally {
      setContextLoading(false)
    }
  }

  const handleBusinessContextComplete = (data: any) => {
    setBusinessContext(data)
    setShowBusinessOnboarding(false)
    console.log('[DASHBOARD] Business context completed:', data.businessName)
  }

  const handleSkipBusinessContext = () => {
    setShowBusinessOnboarding(false)
    setContextLoading(false)
  }

  const handleRetakeBusinessContext = () => {
    setShowBusinessOnboarding(true)
  }
  
  const handleUpdateBusinessContext = () => {
    // Show onboarding with existing data pre-populated
    console.log('[DASHBOARD] Updating business profile with existing data:', businessContext);
    console.log('[DASHBOARD] Setting showBusinessOnboarding to true with existingData');
    setShowBusinessOnboarding(true)
  }

  const fetchDebugInfo = async () => {
    try {
      const response = await fetch(`/api/debug-user-data?userId=${user?.id}`)
      const result = await response.json()
      setDebugData(result)
      setShowDebugInfo(true)
      
      // Also log localStorage for debugging
      if (typeof window !== 'undefined') {
        console.log('[DEBUG] localStorage lastFreedomScore:', localStorage.getItem('lastFreedomScore'))
        console.log('[DEBUG] localStorage scoreCompletedAt:', localStorage.getItem('scoreCompletedAt'))
      }
    } catch (error) {
      console.error('[DEBUG] Error fetching debug info:', error)
    }
  }

  const loadUserDiagnosticData = async () => {
    try {
      setLoading(true)
      console.log('[DASHBOARD] Starting to load user diagnostic data')
      
      // First try localStorage for immediate loading
      const scoreData = localStorage.getItem('lastFreedomScore')
      const completedAt = localStorage.getItem('scoreCompletedAt')
      
      if (scoreData) {
        console.log('[DASHBOARD] Found localStorage data, loading immediately')
        const parsed = JSON.parse(scoreData)
        setFreedomScore({
          ...parsed,
          completedAt: completedAt
        })
        setLoading(false)
        
        // Then try database in background for updates
        console.log('[DASHBOARD] Checking database for updates...')
        try {
          const userResponses = await diagnosticService.getUserResponses(user!.id)
          
          if (userResponses.length > 0) {
            const mostRecent = userResponses[0]
            console.log('[DASHBOARD] Found database data, updating')
            setFreedomScore({
              ...mostRecent.scoreResult,
              completedAt: mostRecent.created_at
            })
          }
        } catch (dbError) {
          console.error('[DASHBOARD] Database lookup failed, using localStorage:', dbError)
        }
      } else {
        // No localStorage, must try database
        console.log('[DASHBOARD] No localStorage, trying database...')
        const userResponses = await diagnosticService.getUserResponses(user!.id)
        
        if (userResponses.length > 0) {
          const mostRecent = userResponses[0]
          setFreedomScore({
            ...mostRecent.scoreResult,
            completedAt: mostRecent.created_at
          })
        }
        setLoading(false)
      }
    } catch (err) {
      console.error('[DASHBOARD] Error loading dashboard data:', err)
      setError('Error loading diagnostic data')
      setLoading(false)
    }
  }

  // Add timeout to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading && isHydrated) {
        console.log('[DASHBOARD] Loading timeout - forcing load completion after hydration')
        setLoading(false)
        if (!user?.id) {
          setError('Authentication timeout - please try refreshing the page')
        }
      }
    }, 8000) // 8 second timeout

    return () => clearTimeout(timeout)
  }, [loading, isHydrated, user])

  // Let ProtectedRoute handle authentication loading
  if ((user && loading) || (user && contextLoading)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Error: {error}</p>
          <button 
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.location.reload()
              }
            }} 
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  // Show business context onboarding if needed
  if (showBusinessOnboarding) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 py-8">
          <BusinessContextOnboarding 
            onComplete={handleBusinessContextComplete}
            onSkip={handleSkipBusinessContext}
            existingData={businessContext}
          />
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background transition-colors duration-300">
        {/* Premium Header */}
        <PremiumHeader />

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-6 py-8">
          {/* Welcome Banner */}
          <WelcomeBanner 
            userName={user?.email?.split('@')[0]} 
            className="mb-8"
          />

          {freedomScore ? (
            <motion.div 
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              {/* Main Dashboard Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Premium Freedom Score Card */}
                <Card variant="gold" hover="glow" animate>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rich-gold to-rose-gold flex items-center justify-center">
                        <TrophyIcon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-display text-xl">Your Freedom Score</CardTitle>
                        <CardDescription>
                          {freedomScore.completedAt && `Last updated ${new Date(freedomScore.completedAt).toLocaleDateString()}`}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-6">
                        <Progress 
                          value={freedomScore.percent} 
                          size="lg" 
                          variant="gold"
                          animate
                        />
                        <div>
                          <div className="text-3xl font-bold text-display text-foreground">
                            {freedomScore.percent}%
                          </div>
                          <div className="text-sm text-medium-gray">
                            Total: {freedomScore.totalScore}/60
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Module Breakdown */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                      {Object.entries(freedomScore.moduleAverages).map(([module, score]: [string, any]) => (
                        <motion.div 
                          key={module} 
                          className="bg-light-gray/50 rounded-xl p-4 text-center border border-black/5"
                          whileHover={{ scale: 1.02 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="text-heading text-xs text-medium-gray mb-2">
                            {getModuleName(module)}
                          </div>
                          <div className="text-2xl font-bold text-display text-foreground mb-1">{score}</div>
                          <div className="text-xs text-medium-gray">out of 10</div>
                        </motion.div>
                      ))}
                    </div>

                    <div className="flex items-center gap-4">
                      <Button variant="primary" className="btn-gradient-gold">
                        <RocketLaunchIcon className="w-4 h-4" />
                        Retake Assessment
                      </Button>
                      <Button variant="outline">
                        <SparklesIcon className="w-4 h-4" />
                        Discuss with AI
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Daily Check-in Prompt - Your Accountability System */}
                <DailyCheckinPrompt className="mb-6" />
                
                {/* Enhanced Sprint Tracking - Your Main Sprint Interface */}
                <EnhancedSprintTracker freedomScore={freedomScore} className="mb-6" />
                
                {/* Simple Sprint Progress - Your Implementation Tracking */}
                <SimpleDashboardProgress freedomScore={freedomScore} className="mb-6" />
                
                {/* Implementation Metrics Overview - Your Progress Analytics */}
                <ImplementationMetricsOverview className="mb-6" />
                
                {/* Sprint Planning - Your Strategic Roadmap */}
                <SimpleSprintPlanner freedomScore={freedomScore} />
            </div>

              {/* Premium Sidebar */}
              <aside className="space-y-6">
                {/* Quick Stats */}
                <Card variant="elevated" animate>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-info to-blue-600 flex items-center justify-center">
                        <ChartBarIcon className="w-5 h-5 text-white" />
                      </div>
                      <CardTitle>Quick Stats</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-light-gray/30 rounded-lg">
                        <div className="text-xl font-bold text-display text-success">94%</div>
                        <div className="text-xs text-medium-gray">Implementation</div>
                      </div>
                      <div className="text-center p-3 bg-light-gray/30 rounded-lg">
                        <div className="text-xl font-bold text-display text-warning">12</div>
                        <div className="text-xs text-medium-gray">Active Goals</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Achievement Widget */}
                <AchievementWidget />
                
                {/* Business Metrics Widget */}
                <BusinessMetricsWidget />
              
                {/* AI Coaches */}
                <Card variant="default" animate>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-rose-gold to-rich-gold flex items-center justify-center">
                        <UserGroupIcon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <CardTitle>AI Coaches</CardTitle>
                        <CardDescription>Your personal business advisors</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <Button 
                        variant="primary" 
                        className="w-full btn-gradient-gold"
                        icon={<SparklesIcon className="w-4 h-4" />}
                      >
                        Strategic Coach
                      </Button>
                      <Button 
                        variant="secondary" 
                        className="w-full btn-gradient-rose"
                        icon={<RocketLaunchIcon className="w-4 h-4" />}
                      >
                        Implementation Coach
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card variant="default" animate>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ArrowTrendingUpIcon className="w-5 h-5 text-rich-gold" />
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <Link
                        href="/assessment"
                        className="flex items-center gap-3 text-medium-gray hover:text-foreground transition-colors p-2 rounded-lg hover:bg-light-gray/50"
                      >
                        <ChartBarIcon className="w-4 h-4" />
                        <span className="text-body font-medium">Retake Freedom Score</span>
                      </Link>
                      <button
                        onClick={() => {
                          console.log('[DASHBOARD] Update Business Profile button clicked');
                          handleUpdateBusinessContext();
                        }}
                        className="flex items-center gap-3 text-medium-gray hover:text-foreground transition-colors p-2 rounded-lg hover:bg-light-gray/50 w-full text-left"
                      >
                        <UserGroupIcon className="w-4 h-4" />
                        <span className="text-body font-medium">Update Business Profile</span>
                      </button>
                      <Link
                        href="/ai-strategist"
                        className="flex items-center gap-3 text-medium-gray hover:text-foreground transition-colors p-2 rounded-lg hover:bg-light-gray/50"
                      >
                        <SparklesIcon className="w-4 h-4" />
                        <span className="text-body font-medium">Ask AI Strategist</span>
                      </Link>
                      <Link
                        href="/implementation-coach"
                        className="flex items-center gap-3 text-medium-gray hover:text-foreground transition-colors p-2 rounded-lg hover:bg-light-gray/50"
                      >
                        <RocketLaunchIcon className="w-4 h-4" />
                        <span className="text-body font-medium">Implementation Coaching</span>
                      </Link>
                      <Link
                        href="/achievements"
                        className="flex items-center gap-3 text-medium-gray hover:text-foreground transition-colors p-2 rounded-lg hover:bg-light-gray/50"
                      >
                        <TrophyIcon className="w-4 h-4" />
                        <span className="text-body font-medium">View Achievements</span>
                      </Link>
                      <button
                        onClick={fetchDebugInfo}
                        className="flex items-center gap-3 text-error hover:text-error/80 transition-colors p-2 rounded-lg hover:bg-error/5 w-full text-left"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-body text-sm font-medium">Debug Data Access</span>
                      </button>
                    </div>
                  </CardContent>
                </Card>

                {/* Sprint Sequence */}
                {freedomScore.recommendedOrder && (
                  <Card variant="success" animate>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <RocketLaunchIcon className="w-5 h-5 text-success" />
                        Sprint Sequence
                      </CardTitle>
                      <CardDescription>Your personalized implementation roadmap</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {freedomScore.recommendedOrder.slice(0, 3).map((sprint: any, index: number) => (
                          <motion.div 
                            key={sprint.sprintKey} 
                            className="flex items-start gap-4"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                          >
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold ${
                              index === 0 
                                ? 'bg-gradient-to-br from-success to-green-600 text-white' 
                                : 'bg-light-gray text-medium-gray'
                            }`}>
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <div className={`text-body font-medium ${
                                index === 0 ? 'text-foreground' : 'text-medium-gray'
                              }`}>
                                {sprint.title}
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </aside>
            </motion.div>
          ) : (
            /* No Score Yet - Premium Empty State */
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Card variant="gold" size="xl" className="text-center">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-rich-gold to-rose-gold flex items-center justify-center mx-auto mb-6">
                  <TrophyIcon className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-display text-2xl font-bold text-foreground mb-4">
                  Take Your Freedom Score Assessment
                </h3>
                <p className="text-body text-medium-gray text-lg mb-8 max-w-md mx-auto">
                  Discover your business bottlenecks and get personalized recommendations to scale with confidence.
                </p>
                <Button 
                  variant="primary" 
                  className="btn-gradient-gold px-8 py-3"
                  icon={<RocketLaunchIcon className="w-5 h-5" />}
                >
                  Start Assessment
                </Button>
              </Card>
            </motion.div>
          )}
        
        {/* Debug Info Modal */}
        {showDebugInfo && debugData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">Debug Information</h3>
              <button
                onClick={() => setShowDebugInfo(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">User ID</h4>
                <p className="text-sm text-gray-600 font-mono">{debugData.userId}</p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Business Context</h4>
                <div className="bg-gray-50 p-3 rounded text-sm">
                  <p>Found: {debugData.data?.businessContext?.found ? '✅ Yes' : '❌ No'}</p>
                  {debugData.data?.businessContext?.error && (
                    <p className="text-red-600">Error: {debugData.data.businessContext.error}</p>
                  )}
                  {debugData.data?.businessContext?.data && (
                    <div className="mt-2">
                      <p>Business Name: {debugData.data.businessContext.data.business_name}</p>
                      <p>Created: {new Date(debugData.data.businessContext.data.created_at).toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Freedom Score Responses</h4>
                <div className="bg-gray-50 p-3 rounded text-sm">
                  <p>Found: {debugData.data?.freedomResponses?.found ? '✅ Yes' : '❌ No'}</p>
                  <p>Count: {debugData.data?.freedomResponses?.count || 0}</p>
                  {debugData.data?.freedomResponses?.latestScore && (
                    <div className="mt-2">
                      <p>Latest ID: {debugData.data.freedomResponses.latestScore.id}</p>
                      <p>Created: {new Date(debugData.data.freedomResponses.latestScore.created_at).toLocaleString()}</p>
                      <p>Has Score Result: {debugData.data.freedomResponses.latestScore.hasScoreResult ? '✅ Yes' : '❌ No'}</p>
                    </div>
                  )}
                  {debugData.data?.freedomResponses?.error && (
                    <p className="text-red-600">Error: {debugData.data.freedomResponses.error}</p>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">AI Conversations</h4>
                <div className="bg-gray-50 p-3 rounded text-sm">
                  <p>Found: {debugData.data?.conversations?.found ? '✅ Yes' : '❌ No'}</p>
                  <p>Count: {debugData.data?.conversations?.count || 0}</p>
                  {debugData.data?.conversations?.latest && (
                    <div className="mt-2">
                      <p>Latest ID: {debugData.data.conversations.latest.id}</p>
                      <p>Created: {new Date(debugData.data.conversations.latest.created_at).toLocaleString()}</p>
                      <p>Preview: {debugData.data.conversations.latest.message_preview}...</p>
                    </div>
                  )}
                  {debugData.data?.conversations?.error && (
                    <p className="text-red-600">Error: {debugData.data.conversations.error}</p>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">LocalStorage Check</h4>
                <div className="bg-gray-50 p-3 rounded text-sm">
                  <p>Keys to check: {debugData.data?.localStorage_check?.keys_to_check?.join(', ')}</p>
                  <p className="text-orange-600 mt-1">{debugData.data?.localStorage_check?.note}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        )}
        
        {/* Mobile Navigation */}
        <MobileNavigation />
        <FloatingActionButton />
        </main>
      </div>
    </ProtectedRoute>
  )
}

function getModuleName(module: string) {
  const names: Record<string, string> = {
    'M1': 'Position for Profit',
    'M2': 'Buyer Journey',
    'M3': 'Systems',
    'M4': 'Sales System',
    'M5': 'Delivery',
    'M6': 'Improvement'
  }
  return names[module] || module
}