// src/app/api/implementation-coach/route.ts
import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { supabase } from '../../../lib/supabase'
import { implementationService } from '../../../services/implementationService'
import { businessMetricsService } from '../../../services/businessMetricsService'

interface CoachingContext {
  userId: string
  recentCheckins: any[]
  currentStreak: number
  analytics: any
  businessMetrics: any
  obstacles: string[]
  energyTrend: number[]
  completionPattern: number[]
}

async function getCoachingContext(userId: string): Promise<CoachingContext> {
  try {
    const [recentCheckins, currentStreak, analytics, businessMetrics] = await Promise.all([
      implementationService.getRecentCheckins(userId, 7),
      implementationService.calculateStreakDays(userId),
      implementationService.getImplementationAnalytics(userId),
      businessMetricsService.getBusinessAnalytics(userId)
    ])

    // Extract patterns
    const obstacles = recentCheckins
      .filter(c => c.obstacles && c.obstacles.trim())
      .map(c => c.obstacles.trim())
      .slice(0, 5) // Last 5 obstacles

    const energyTrend = recentCheckins
      .slice(0, 7)
      .reverse()
      .map(c => c.energy_level || 0)

    const completionPattern = recentCheckins
      .slice(0, 7)
      .reverse()
      .map(c => c.completed_tasks?.length || 0)

    return {
      userId,
      recentCheckins,
      currentStreak,
      analytics,
      businessMetrics,
      obstacles,
      energyTrend,
      completionPattern
    }
  } catch (error) {
    console.error('[IMPLEMENTATION-COACH] Error getting context:', error)
    return {
      userId,
      recentCheckins: [],
      currentStreak: 0,
      analytics: null,
      businessMetrics: null,
      obstacles: [],
      energyTrend: [],
      completionPattern: []
    }
  }
}

function generateCoachingPrompt(context: CoachingContext, message: string): string {
  const { 
    currentStreak, 
    analytics, 
    businessMetrics, 
    obstacles, 
    energyTrend, 
    completionPattern 
  } = context

  // Analyze patterns
  const avgEnergy = energyTrend.length > 0 
    ? Math.round(energyTrend.reduce((a, b) => a + b, 0) / energyTrend.length)
    : 0
  
  const avgCompletion = completionPattern.length > 0
    ? Math.round(completionPattern.reduce((a, b) => a + b, 0) / completionPattern.length)
    : 0

  const isEnergyDecreasing = energyTrend.length >= 3 && 
    energyTrend[energyTrend.length - 1] < energyTrend[0]
  
  const isProductivityDecreasing = completionPattern.length >= 3 &&
    completionPattern[completionPattern.length - 1] < completionPattern[0]

  // Recent obstacles summary
  const obstaclesSummary = obstacles.length > 0 
    ? obstacles.join('; ')
    : 'No recent obstacles reported'

  // Business trend
  const businessTrend = businessMetrics?.recentTrend || 'neutral'
  const businessTrendText = businessTrend === 'up' ? 'improving' : 
                           businessTrend === 'down' ? 'declining' : 'stable'

  return `You are an AI Implementation Coach focused on accountability and progress acceleration. Your personality is encouraging but direct, data-driven, and results-oriented.

CURRENT IMPLEMENTATION STATUS:
• Streak: ${currentStreak} days
• Total Check-ins: ${analytics?.totalCheckins || 0} 
• Average Energy: ${avgEnergy}/10 ${isEnergyDecreasing ? '(declining trend ⚠️)' : ''}
• Average Daily Tasks: ${avgCompletion} ${isProductivityDecreasing ? '(declining trend ⚠️)' : ''}
• Business Metrics: ${businessTrendText} trend
• Recent Obstacles: ${obstaclesSummary}

COACHING FOCUS AREAS:
${currentStreak === 0 ? '🚀 GETTING STARTED: Help them build initial momentum and establish daily habits' : ''}
${currentStreak >= 1 && currentStreak < 7 ? '🔥 BUILDING MOMENTUM: Strengthen daily consistency and overcome early obstacles' : ''}
${currentStreak >= 7 ? '⚡ OPTIMIZING PERFORMANCE: Focus on efficiency, scaling, and advanced strategies' : ''}
${isEnergyDecreasing ? '🔋 ENERGY MANAGEMENT: Address declining energy levels and prevent burnout' : ''}
${isProductivityDecreasing ? '📈 PRODUCTIVITY RECOVERY: Identify blockers and restore completion rates' : ''}
${obstacles.length > 2 ? '🛠️ OBSTACLE RESOLUTION: Pattern-match recurring challenges and provide solutions' : ''}

COACHING APPROACH:
• Be specific and actionable - no generic advice
• Use data to identify patterns and trends
• Celebrate wins and acknowledge progress
• Address obstacles with practical solutions
• Connect daily actions to business results
• Ask probing questions about implementation barriers
• Suggest accountability systems and habits
• Provide framework-based guidance when relevant

CONVERSATION STYLE:
• Start responses with encouragement about their progress
• Reference specific data points from their tracking
• Ask one focused question to understand blockers
• End with 1-2 specific action items for today/tomorrow

User's Message: "${message}"

Respond as their dedicated Implementation Coach with insights based on their actual data.`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, userId } = body

    if (!message || !userId) {
      return NextResponse.json(
        { error: 'Message and userId are required' }, 
        { status: 400 }
      )
    }

    // Initialize OpenAI
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    // Get comprehensive coaching context
    const coachingContext = await getCoachingContext(userId)
    
    // Generate contextual coaching prompt
    const systemPrompt = generateCoachingPrompt(coachingContext, message)

    // Get AI response
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],
      temperature: 0.7,
      max_tokens: 1000
    })

    const aiResponse = completion.choices[0]?.message?.content || "I apologize, but I couldn't generate a response at the moment."

    // Save conversation to database
    try {
      const { error } = await supabase
        .from('ai_conversations')
        .insert({
          user_id: userId,
          message: message,
          response: aiResponse,
          conversation_type: 'implementation_coach',
          created_at: new Date().toISOString()
        })

      if (error) {
        console.error('[IMPLEMENTATION-COACH] Error saving conversation:', error)
      }
    } catch (saveError) {
      console.error('[IMPLEMENTATION-COACH] Database save error:', saveError)
    }

    return NextResponse.json({ 
      response: aiResponse,
      coachingContext: {
        streak: coachingContext.currentStreak,
        totalCheckins: coachingContext.analytics?.totalCheckins || 0,
        avgEnergy: coachingContext.energyTrend.length > 0 
          ? Math.round(coachingContext.energyTrend.reduce((a, b) => a + b, 0) / coachingContext.energyTrend.length)
          : 0
      }
    })

  } catch (error) {
    console.error('[IMPLEMENTATION-COACH] API Error:', error)
    return NextResponse.json(
      { error: 'Failed to get coaching response' }, 
      { status: 500 }
    )
  }
}