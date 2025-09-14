import { supabase } from '../lib/supabase'
import { implementationService } from './implementationService'
import { businessMetricsService } from './businessMetricsService'
import { emailService } from './emailService'

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  category: 'streak' | 'completion' | 'business' | 'consistency' | 'milestone'
  requirement: number
  points: number
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  unlocked?: boolean
  unlockedAt?: string
  progress?: number
}

export interface UserAchievement {
  id: string
  user_id: string
  achievement_id: string
  unlocked_at: string
  progress: number
  created_at: string
}

export interface MomentumScore {
  current: number
  trend: 'up' | 'down' | 'stable'
  multiplier: number
  factors: {
    streakBonus: number
    consistencyBonus: number
    businessImpactBonus: number
    achievementBonus: number
  }
}

class AchievementService {
  // Cache to avoid repeated calculations
  private streakCache = new Map<string, { value: number, timestamp: number }>()
  private analyticsCache = new Map<string, { value: any, timestamp: number }>()
  private cacheTimeout = 30000 // 30 seconds

  // Define all achievements
  private achievements: Achievement[] = [
    // Check-in Achievements
    {
      id: 'first_steps',
      name: 'First Steps',
      description: 'Complete your first daily check-in',
      icon: '🚀',
      category: 'completion',
      requirement: 1,
      points: 10,
      rarity: 'common'
    },
    {
      id: 'getting_started',
      name: 'Getting Started',
      description: 'Maintain a 3-day check-in streak',
      icon: '🔥',
      category: 'streak',
      requirement: 3,
      points: 25,
      rarity: 'common'
    },
    {
      id: 'week_warrior',
      name: 'Week Warrior',
      description: 'Maintain a 2-day check-in streak (EMAIL TEST)',
      icon: '⚔️',
      category: 'streak',
      requirement: 2,
      points: 50,
      rarity: 'rare'
    },
    {
      id: 'unstoppable',
      name: 'Unstoppable',
      description: 'Maintain a 30-day check-in streak',
      icon: '💎',
      category: 'streak',
      requirement: 30,
      points: 150,
      rarity: 'epic'
    },
    {
      id: 'legendary_consistency',
      name: 'Legendary Consistency',
      description: 'Maintain a 90-day check-in streak',
      icon: '🏆',
      category: 'streak',
      requirement: 90,
      points: 500,
      rarity: 'legendary'
    },

    // Completion Achievements
    {
      id: 'task_master',
      name: 'Task Master',
      description: 'Complete 50 total tasks',
      icon: '✅',
      category: 'completion',
      requirement: 50,
      points: 75,
      rarity: 'rare'
    },
    {
      id: 'productivity_king',
      name: 'Productivity King',
      description: 'Complete 200 total tasks',
      icon: '👑',
      category: 'completion',
      requirement: 200,
      points: 200,
      rarity: 'epic'
    },
    {
      id: 'implementation_legend',
      name: 'Implementation Legend',
      description: 'Complete 500 total tasks',
      icon: '🌟',
      category: 'completion',
      requirement: 500,
      points: 1000,
      rarity: 'legendary'
    },

    // Business Achievements
    {
      id: 'profit_tracker',
      name: 'Profit Tracker',
      description: 'Track business metrics for 3 consecutive months',
      icon: '📈',
      category: 'business',
      requirement: 3,
      points: 100,
      rarity: 'rare'
    },
    {
      id: 'growth_hacker',
      name: 'Growth Hacker',
      description: 'Achieve 3 consecutive months of profit growth',
      icon: '🚀',
      category: 'business',
      requirement: 3,
      points: 250,
      rarity: 'epic'
    },
    {
      id: 'business_champion',
      name: 'Business Champion',
      description: 'Maintain profitable growth for 6+ months',
      icon: '🏅',
      category: 'business',
      requirement: 6,
      points: 750,
      rarity: 'legendary'
    },

    // Consistency Achievements
    {
      id: 'early_bird',
      name: 'Early Bird',
      description: 'Complete 10 check-ins before 9 AM',
      icon: '🌅',
      category: 'consistency',
      requirement: 10,
      points: 50,
      rarity: 'rare'
    },
    {
      id: 'energy_champion',
      name: 'Energy Champion',
      description: 'Maintain 8+ average energy for 2 weeks',
      icon: '⚡',
      category: 'consistency',
      requirement: 14,
      points: 100,
      rarity: 'epic'
    },
    {
      id: 'momentum_master',
      name: 'Momentum Master',
      description: 'Achieve 500+ momentum score',
      icon: '🎯',
      category: 'consistency',
      requirement: 500,
      points: 300,
      rarity: 'epic'
    },

    // Milestone Achievements
    {
      id: 'sprint_finisher',
      name: 'Sprint Finisher',
      description: 'Complete your first sprint 100%',
      icon: '🏁',
      category: 'milestone',
      requirement: 1,
      points: 200,
      rarity: 'epic'
    },
    {
      id: 'serial_implementer',
      name: 'Serial Implementer',
      description: 'Complete 3 sprints 100%',
      icon: '🔄',
      category: 'milestone',
      requirement: 3,
      points: 500,
      rarity: 'legendary'
    },
    {
      id: 'transformation_master',
      name: 'Transformation Master',
      description: 'Complete 10 sprints 100%',
      icon: '🦋',
      category: 'milestone',
      requirement: 10,
      points: 2000,
      rarity: 'legendary'
    }
  ]

  async getUserAchievements(userId: string): Promise<Achievement[]> {
    try {
      const { data, error } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', userId)

      if (error) throw error

      const userAchievements = data || []
      
      // Calculate current progress for each achievement
      const achievementsWithProgress = await Promise.all(
        this.achievements.map(async (achievement) => {
          const userAchievement = userAchievements.find(ua => ua.achievement_id === achievement.id)
          
          if (userAchievement) {
            return {
              ...achievement,
              unlocked: true,
              unlockedAt: userAchievement.unlocked_at,
              progress: achievement.requirement
            }
          } else {
            const progress = await this.calculateProgress(userId, achievement)
            return {
              ...achievement,
              unlocked: false,
              progress
            }
          }
        })
      )

      return achievementsWithProgress

    } catch (error) {
      console.error('[ACHIEVEMENTS] Error fetching user achievements:', error)
      return []
    }
  }

  // Cached streak calculation
  private async getCachedStreak(userId: string): Promise<number> {
    const now = Date.now()
    const cached = this.streakCache.get(userId)
    
    if (cached && (now - cached.timestamp) < this.cacheTimeout) {
      console.log(`[ACHIEVEMENTS] Using cached streak for ${userId}:`, cached.value)
      return cached.value
    }
    
    const streak = await implementationService.calculateStreakDays(userId)
    this.streakCache.set(userId, { value: streak, timestamp: now })
    console.log(`[ACHIEVEMENTS] Calculated and cached new streak for ${userId}:`, streak)
    return streak
  }

  // Cached analytics calculation  
  private async getCachedAnalytics(userId: string): Promise<any> {
    const now = Date.now()
    const cached = this.analyticsCache.get(userId)
    
    if (cached && (now - cached.timestamp) < this.cacheTimeout) {
      console.log(`[ACHIEVEMENTS] Using cached analytics for ${userId}`)
      return cached.value
    }
    
    const analytics = await implementationService.getImplementationAnalytics(userId)
    this.analyticsCache.set(userId, { value: analytics, timestamp: now })
    console.log(`[ACHIEVEMENTS] Calculated and cached new analytics for ${userId}`)
    return analytics
  }

  private async calculateProgress(userId: string, achievement: Achievement): Promise<number> {
    try {
      console.log(`[ACHIEVEMENTS] Calculating progress for ${achievement.id} (${achievement.category})`)
      
      switch (achievement.category) {
        case 'streak':
          const streak = await this.getCachedStreak(userId)
          console.log(`[ACHIEVEMENTS] Streak for ${achievement.id}:`, streak)
          return Math.min(streak, achievement.requirement)

        case 'completion':
          if (achievement.id === 'first_steps') {
            // For first steps, count total check-ins, not tasks
            const analytics = await this.getCachedAnalytics(userId)
            console.log(`[ACHIEVEMENTS] Check-ins for ${achievement.id}:`, analytics.totalCheckins)
            return Math.min(analytics.totalCheckins, achievement.requirement)
          } else {
            // For other completion achievements, count completed tasks
            const analytics = await this.getCachedAnalytics(userId)
            console.log(`[ACHIEVEMENTS] Analytics for ${achievement.id}:`, analytics)
            const totalTasks = analytics.completionTrend.reduce((sum: number, count: number) => sum + count, 0)
            console.log(`[ACHIEVEMENTS] Total tasks for ${achievement.id}:`, totalTasks)
            return Math.min(totalTasks, achievement.requirement)
          }

        case 'business':
          try {
            const businessData = await businessMetricsService.getBusinessAnalytics(userId)
            if (achievement.id === 'profit_tracker') {
              return Math.min(businessData.totalSnapshots || 0, achievement.requirement)
            }
          } catch (error) {
            console.log(`[ACHIEVEMENTS] Business data not available for ${achievement.id}:`, error.message)
          }
          return 0

        case 'consistency':
          if (achievement.id === 'early_bird') {
            // Would need to track check-in times - simplified for now
            return 0
          } else if (achievement.id === 'energy_champion') {
            const recentCheckins = await implementationService.getRecentCheckins(userId, 14)
            console.log(`[ACHIEVEMENTS] Recent checkins for ${achievement.id}:`, recentCheckins.length)
            const highEnergyDays = recentCheckins.filter(c => (c.energy_level || 0) >= 8).length
            console.log(`[ACHIEVEMENTS] High energy days for ${achievement.id}:`, highEnergyDays)
            return Math.min(highEnergyDays, achievement.requirement)
          } else if (achievement.id === 'momentum_master') {
            // Use cached analytics to avoid recursive momentum calculation
            const analytics = await this.getCachedAnalytics(userId)
            const streak = await this.getCachedStreak(userId)
            const baseScore = analytics.completionTrend.reduce((sum: number, count: number) => sum + count, 0) * 10
            const momentum = baseScore + (streak * 5)
            console.log(`[ACHIEVEMENTS] Momentum for ${achievement.id}:`, momentum)
            return Math.min(momentum, achievement.requirement)
          }
          return 0

        case 'milestone':
          // Would need sprint completion tracking - simplified for now
          return 0

        default:
          return 0
      }
    } catch (error) {
      console.error(`[ACHIEVEMENTS] Error calculating progress for ${achievement.id}:`, error)
      return 0
    }
  }

  async checkAndUnlockAchievements(userId: string): Promise<Achievement[]> {
    try {
      console.log('[ACHIEVEMENTS] checkAndUnlockAchievements called for user:', userId)
      const achievements = await this.getUserAchievements(userId)
      const newlyUnlocked: Achievement[] = []

      console.log('[ACHIEVEMENTS] Checking', achievements.length, 'achievements for unlocks')
      
      for (const achievement of achievements) {
        console.log(`[ACHIEVEMENTS] Checking ${achievement.id}: unlocked=${achievement.unlocked}, progress=${achievement.progress}/${achievement.requirement}`)
        
        if (!achievement.unlocked && achievement.progress! >= achievement.requirement) {
          console.log(`[ACHIEVEMENTS] 🎉 UNLOCKING ACHIEVEMENT: ${achievement.id} - ${achievement.name}`)
          
          // Unlock achievement
          const { error } = await supabase
            .from('user_achievements')
            .insert({
              user_id: userId,
              achievement_id: achievement.id,
              progress: achievement.requirement,
              unlocked_at: new Date().toISOString()
            })

          if (!error) {
            const unlockedAchievement = { ...achievement, unlocked: true, unlockedAt: new Date().toISOString() }
            newlyUnlocked.push(unlockedAchievement)

            // Schedule milestone celebration email
            try {
              console.log(`[ACHIEVEMENTS] 📧 Scheduling celebration email for ${achievement.name}`)
              await emailService.scheduleMilestoneCelebrationEmail(userId, {
                name: unlockedAchievement.name,
                title: `${unlockedAchievement.icon} ${unlockedAchievement.name}`,
                progress: `+${achievement.points} points`,
                percentage: '100',
                impact: unlockedAchievement.description,
                description: `You've unlocked the "${unlockedAchievement.name}" achievement! This ${unlockedAchievement.rarity} achievement is worth ${achievement.points} points.`,
                totalPoints: achievements.filter(a => a.unlocked).reduce((sum, a) => sum + a.points, 0) + achievement.points,
                achievementData: unlockedAchievement,
                unlockedAt: new Date().toISOString()
              });
              console.log(`[ACHIEVEMENTS] ✅ Email scheduled successfully for ${achievement.name}`)
            } catch (emailError) {
              console.error('[ACHIEVEMENTS] ❌ Error scheduling celebration email:', emailError);
              // Don't fail achievement unlock for email issues
            }
          } else {
            console.error('[ACHIEVEMENTS] Error unlocking achievement:', error)
          }
        }
      }

      console.log(`[ACHIEVEMENTS] Unlock check complete. Found ${newlyUnlocked.length} newly unlocked achievements`)
      return newlyUnlocked

    } catch (error) {
      console.error('[ACHIEVEMENTS] Error checking achievements:', error)
      return []
    }
  }

  async calculateMomentumScore(userId: string): Promise<MomentumScore> {
    try {
      const [analytics, streak, businessData] = await Promise.all([
        implementationService.getImplementationAnalytics(userId),
        implementationService.calculateStreakDays(userId),
        businessMetricsService.getBusinessAnalytics(userId)
      ])

      // Base momentum from task completion
      const avgDailyTasks = analytics.completionTrend.length > 0
        ? analytics.completionTrend.reduce((a: number, b: number) => a + b, 0) / analytics.completionTrend.length
        : 0

      const baseScore = Math.min(avgDailyTasks * 20, 200) // Max 200 from tasks

      // Bonus calculations
      const streakBonus = Math.min(streak * 5, 100) // Max 100 from streak
      const consistencyBonus = analytics.averageEnergyLevel >= 7 ? 50 : 0 // 50 for high energy
      const businessImpactBonus = businessData.recentTrend === 'up' ? 75 : 0 // 75 for business growth
      
      // Achievement bonus (5 points per unlocked achievement)
      const achievements = await this.getUserAchievements(userId)
      const achievementBonus = achievements.filter(a => a.unlocked).length * 5

      const totalScore = baseScore + streakBonus + consistencyBonus + businessImpactBonus + achievementBonus

      // Calculate trend based on recent performance
      const recentAvg = analytics.completionTrend.slice(-3).reduce((a: number, b: number) => a + b, 0) / 3
      const olderAvg = analytics.completionTrend.slice(0, -3).reduce((a: number, b: number) => a + b, 0) / 
                      Math.max(analytics.completionTrend.length - 3, 1)
      
      let trend: 'up' | 'down' | 'stable' = 'stable'
      if (recentAvg > olderAvg * 1.1) trend = 'up'
      else if (recentAvg < olderAvg * 0.9) trend = 'down'

      // Multiplier based on streak and consistency
      const multiplier = 1 + (streak * 0.02) + (analytics.averageEnergyLevel >= 8 ? 0.1 : 0)

      return {
        current: Math.round(totalScore * multiplier),
        trend,
        multiplier: Math.round(multiplier * 100) / 100,
        factors: {
          streakBonus,
          consistencyBonus,
          businessImpactBonus,
          achievementBonus
        }
      }

    } catch (error) {
      console.error('[ACHIEVEMENTS] Error calculating momentum:', error)
      return {
        current: 0,
        trend: 'stable',
        multiplier: 1,
        factors: {
          streakBonus: 0,
          consistencyBonus: 0,
          businessImpactBonus: 0,
          achievementBonus: 0
        }
      }
    }
  }

  getAchievementsByCategory(): Record<string, Achievement[]> {
    return this.achievements.reduce((acc, achievement) => {
      if (!acc[achievement.category]) {
        acc[achievement.category] = []
      }
      acc[achievement.category].push(achievement)
      return acc
    }, {} as Record<string, Achievement[]>)
  }

  getRarityColor(rarity: Achievement['rarity']): string {
    switch (rarity) {
      case 'common': return 'text-gray-600 bg-gray-100'
      case 'rare': return 'text-blue-600 bg-blue-100'
      case 'epic': return 'text-purple-600 bg-purple-100'
      case 'legendary': return 'text-yellow-600 bg-yellow-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }
}

export const achievementService = new AchievementService()