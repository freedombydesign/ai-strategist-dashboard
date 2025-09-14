import { NextRequest, NextResponse } from 'next/server'
import { implementationService } from '../../../services/implementationService'
import { achievementService } from '../../../services/achievementService'
import { supabase } from '../../../lib/supabase'

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId')
  
  if (!userId) {
    return NextResponse.json({ error: 'userId parameter required' }, { status: 400 })
  }

  try {
    console.log('[DEBUG-API] Debugging achievements for user:', userId)
    
    // 1. Check if user has any check-ins
    const { data: checkins, error: checkinsError } = await supabase
      .from('daily_checkins')
      .select('*')
      .eq('user_id', userId)
      .order('checkin_date', { ascending: false })
      .limit(10)
    
    console.log('[DEBUG-API] Raw checkins query result:', { 
      count: checkins?.length || 0, 
      error: checkinsError?.message,
      sample: checkins?.slice(0, 2) 
    })

    // 2. Test streak calculation
    const streak = await implementationService.calculateStreakDays(userId)
    console.log('[DEBUG-API] Streak calculation result:', streak)

    // 3. Test analytics
    const analytics = await implementationService.getImplementationAnalytics(userId)
    console.log('[DEBUG-API] Analytics result:', analytics)

    // 4. Test achievements
    const achievements = await achievementService.getUserAchievements(userId)
    console.log('[DEBUG-API] Achievements result:', {
      count: achievements.length,
      unlocked: achievements.filter(a => a.unlocked).length,
      sample: achievements.slice(0, 3).map(a => ({ id: a.id, progress: a.progress, unlocked: a.unlocked }))
    })

    // 5. Test momentum score
    const momentum = await achievementService.calculateMomentumScore(userId)
    console.log('[DEBUG-API] Momentum result:', momentum)

    return NextResponse.json({
      success: true,
      debug: {
        userId,
        checkins: {
          count: checkins?.length || 0,
          recent: checkins?.slice(0, 3).map(c => ({ 
            date: c.checkin_date, 
            energy: c.energy_level,
            tasks: c.completed_tasks?.length || 0 
          }))
        },
        streak,
        analytics,
        achievements: {
          total: achievements.length,
          unlocked: achievements.filter(a => a.unlocked).length,
          progress: achievements.slice(0, 5).map(a => ({ 
            id: a.id, 
            progress: a.progress, 
            requirement: a.requirement, 
            unlocked: a.unlocked 
          }))
        },
        momentum
      }
    })
  } catch (error) {
    console.error('[DEBUG-API] Error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      success: false 
    }, { status: 500 })
  }
}