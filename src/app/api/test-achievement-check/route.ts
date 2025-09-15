import { NextRequest, NextResponse } from 'next/server'
import { achievementService } from '@/services/achievementService'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()
    
    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    console.log('[TEST-ACHIEVEMENT-CHECK] 🧪 Testing achievement check for user:', userId)
    
    // Get current achievements
    const currentAchievements = await achievementService.getUserAchievements(userId)
    console.log('[TEST-ACHIEVEMENT-CHECK] Current achievements:', currentAchievements.length)
    
    // Check for new achievements
    const newlyUnlocked = await achievementService.checkAndUnlockAchievements(userId)
    console.log('[TEST-ACHIEVEMENT-CHECK] Newly unlocked:', newlyUnlocked.length)
    
    // Get momentum score
    const momentumScore = await achievementService.calculateMomentumScore(userId)
    console.log('[TEST-ACHIEVEMENT-CHECK] Momentum score:', momentumScore)
    
    return NextResponse.json({
      success: true,
      currentAchievements: currentAchievements.length,
      newlyUnlocked: newlyUnlocked.length,
      newAchievements: newlyUnlocked,
      momentumScore
    })
    
  } catch (error) {
    console.error('[TEST-ACHIEVEMENT-CHECK] Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}