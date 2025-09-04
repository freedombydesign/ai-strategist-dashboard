import { supabase } from '../lib/supabase'
import { emailService } from './emailService'

export interface ImplementationProgress {
  id: string
  user_id: string
  sprint_id: string
  total_tasks: number
  completed_tasks: number
  completion_percentage: number
  streak_days: number
  last_activity_date: string
  momentum_score: number
  created_at: string
  updated_at: string
}

export interface DailyCheckin {
  id: string
  user_id: string
  checkin_date: string
  completed_tasks: string[]
  obstacles: string
  energy_level: number
  business_updates: any
  notes: string
}

class ImplementationService {

  // Progress tracking methods
  async getProgressForSprint(userId: string, sprintId: string): Promise<ImplementationProgress | null> {
    try {
      const { data, error } = await supabase
        .from('implementation_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('sprint_id', sprintId)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return data
    } catch (error) {
      console.error('[IMPLEMENTATION] Error fetching progress:', error)
      return null
    }
  }

  async updateSprintProgress(
    userId: string, 
    sprintId: string, 
    completedTasks: number, 
    totalTasks: number
  ): Promise<boolean> {
    try {
      const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
      const today = new Date().toISOString().split('T')[0]
      
      // Calculate momentum score (completed tasks + consistency bonus)
      const streakDays = await this.calculateStreakDays(userId)
      const momentumScore = this.calculateMomentumScore(completedTasks, totalTasks, streakDays)

      const progressData = {
        user_id: userId,
        sprint_id: sprintId,
        total_tasks: totalTasks,
        completed_tasks: completedTasks,
        completion_percentage: completionPercentage,
        streak_days: streakDays,
        last_activity_date: today,
        momentum_score: momentumScore
      }

      const { error } = await supabase
        .from('implementation_progress')
        .upsert(progressData, { 
          onConflict: 'user_id,sprint_id' 
        })

      if (error) throw error

      console.log('[IMPLEMENTATION] Progress updated:', progressData)
      return true
    } catch (error) {
      console.error('[IMPLEMENTATION] Error updating progress:', error)
      return false
    }
  }

  // Momentum and streak calculations
  private calculateMomentumScore(completed: number, total: number, streakDays: number): number {
    const completionScore = total > 0 ? (completed / total) * 100 : 0
    const streakBonus = Math.min(streakDays * 5, 50) // Max 50 point streak bonus
    return Math.round(completionScore + streakBonus)
  }

  async calculateStreakDays(userId: string): Promise<number> {
    try {
      // Get recent check-ins to calculate streak
      const { data, error } = await supabase
        .from('daily_checkins')
        .select('checkin_date')
        .eq('user_id', userId)
        .order('checkin_date', { ascending: false })
        .limit(30) // Look at last 30 days

      if (error) throw error
      if (!data || data.length === 0) return 0

      // Calculate consecutive days with check-ins
      let streak = 0
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      for (let i = 0; i < data.length; i++) {
        const checkinDate = new Date(data[i].checkin_date)
        checkinDate.setHours(0, 0, 0, 0)
        
        const expectedDate = new Date(today)
        expectedDate.setDate(today.getDate() - streak)

        if (checkinDate.getTime() === expectedDate.getTime()) {
          streak++
        } else {
          break
        }
      }

      return streak
    } catch (error) {
      console.error('[IMPLEMENTATION] Error calculating streak:', error)
      return 0
    }
  }

  // Daily check-in methods
  async getTodaysCheckin(userId: string): Promise<DailyCheckin | null> {
    try {
      const today = new Date().toISOString().split('T')[0]
      const { data, error } = await supabase
        .from('daily_checkins')
        .select('*')
        .eq('user_id', userId)
        .eq('checkin_date', today)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return data
    } catch (error) {
      console.error('[IMPLEMENTATION] Error fetching today\'s check-in:', error)
      return null
    }
  }

  async getRecentCheckins(userId: string, days: number = 7): Promise<DailyCheckin[]> {
    try {
      const { data, error } = await supabase
        .from('daily_checkins')
        .select('*')
        .eq('user_id', userId)
        .order('checkin_date', { ascending: false })
        .limit(days)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('[IMPLEMENTATION] Error fetching recent check-ins:', error)
      return []
    }
  }

  async saveCheckin(checkinData: Omit<DailyCheckin, 'id' | 'created_at' | 'updated_at'>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('daily_checkins')
        .upsert(checkinData, { 
          onConflict: 'user_id,checkin_date' 
        })

      if (error) throw error

      // Update missed check-in email tracking
      try {
        await emailService.resetMissedCheckinTracking(checkinData.user_id);
      } catch (emailError) {
        console.error('[IMPLEMENTATION] Error updating email tracking:', emailError);
        // Don't fail the check-in for email issues
      }

      return true
    } catch (error) {
      console.error('[IMPLEMENTATION] Error saving check-in:', error)
      return false
    }
  }

  // Analytics and insights
  async getImplementationAnalytics(userId: string): Promise<{
    totalCheckins: number
    averageEnergyLevel: number
    currentStreak: number
    longestStreak: number
    completionTrend: number[]
  }> {
    try {
      const checkins = await this.getRecentCheckins(userId, 30)
      const currentStreak = await this.calculateStreakDays(userId)
      
      const totalCheckins = checkins.length
      const averageEnergyLevel = checkins.length > 0 
        ? Math.round(checkins.reduce((sum, c) => sum + (c.energy_level || 0), 0) / checkins.length)
        : 0

      // Calculate longest streak (simplified)
      const longestStreak = Math.max(currentStreak, 0)

      // Completion trend over last 7 days
      const completionTrend = checkins
        .slice(0, 7)
        .reverse()
        .map(c => c.completed_tasks?.length || 0)

      return {
        totalCheckins,
        averageEnergyLevel,
        currentStreak,
        longestStreak,
        completionTrend
      }
    } catch (error) {
      console.error('[IMPLEMENTATION] Error calculating analytics:', error)
      return {
        totalCheckins: 0,
        averageEnergyLevel: 0,
        currentStreak: 0,
        longestStreak: 0,
        completionTrend: []
      }
    }
  }

  // Migration helpers (to move from localStorage to database)
  async migrateLocalStorageProgress(userId: string, sprintId: string, localStorageData: any): Promise<boolean> {
    try {
      // Count completed tasks from localStorage format
      const completedTasks = localStorageData.completedTasks?.size || 0
      const totalTasks = localStorageData.totalTasks || 0
      
      return await this.updateSprintProgress(userId, sprintId, completedTasks, totalTasks)
    } catch (error) {
      console.error('[IMPLEMENTATION] Error migrating localStorage:', error)
      return false
    }
  }
}

export const implementationService = new ImplementationService()