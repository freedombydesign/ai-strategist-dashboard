import { NextRequest, NextResponse } from 'next/server'
import { achievementService } from '@/services/achievementService'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    console.log('[FORCE-ACHIEVEMENT] Checking achievements for user:', userId)
    
    // Force check achievements and send emails
    const newlyUnlocked = await achievementService.checkAndUnlockAchievements(userId)
    
    console.log('[FORCE-ACHIEVEMENT] Results:', {
      newlyUnlocked: newlyUnlocked.length,
      achievements: newlyUnlocked.map(a => a.name)
    })
    
    return NextResponse.json({
      success: true,
      newlyUnlocked: newlyUnlocked.length,
      achievements: newlyUnlocked.map(a => ({ name: a.name, points: a.points }))
    })
    
  } catch (error) {
    console.error('[FORCE-ACHIEVEMENT] Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}