import { supabase } from '../lib/supabase'

export interface Sprint {
  id: string
  name: string
  client_facing_title: string
  description: string
  goal: string
  time_saved_hours: number
  created_at?: string
}

export interface Step {
  id: string
  sprint_id: string
  title: string
  description: string
  estimated_minutes: number
  day_number: number
  order_index: number
  category?: string
  created_at?: string
}

export interface UserSprintProgress {
  id: string
  user_id: string
  sprint_id: string
  status: 'not_started' | 'in_progress' | 'completed'
  started_at?: string
  completed_at?: string
  current_step?: number
  created_at?: string
}

export interface UserStepProgress {
  id: string
  user_id: string
  step_id: string
  sprint_id: string
  status: 'not_started' | 'in_progress' | 'completed'
  completed_at?: string
  notes?: string
  created_at?: string
}

export const sprintService = {
  // Get all available sprints
  async getAllSprints(): Promise<Sprint[]> {
    try {
      console.log('[SPRINT-SERVICE] Fetching all sprints')
      
      const { data, error } = await supabase
        .from('sprints')
        .select('*')
        .order('time_saved_hours', { ascending: true })

      if (error) {
        console.error('[SPRINT-SERVICE] Error fetching sprints:', error)
        return []
      }

      console.log('[SPRINT-SERVICE] Retrieved', data?.length || 0, 'sprints')
      return data || []
    } catch (error) {
      console.error('[SPRINT-SERVICE] Sprint service error:', error)
      return []
    }
  },

  // Get a specific sprint by ID
  async getSprintById(sprintId: string): Promise<Sprint | null> {
    try {
      const { data, error } = await supabase
        .from('sprints')
        .select('*')
        .eq('id', sprintId)
        .single()

      if (error) {
        console.error('Error fetching sprint:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Sprint fetch error:', error)
      return null
    }
  },

  // Get sprint by the diagnostic mapping key
  async getSprintByKey(sprintKey: string): Promise<Sprint | null> {
    try {
      // Map diagnostic sprint keys to your database sprint names
      const sprintMapping: Record<string, string> = {
        'S1': 'profitable_service',
        'S2': 'smooth_path', 
        'S3': 'sell_bottleneck',
        'S4': 'streamline_delivery',
        'S5': 'continuous_improve'
      }

      const sprintName = sprintMapping[sprintKey]
      if (!sprintName) {
        console.warn(`Unknown sprint key: ${sprintKey}`)
        return null
      }

      const { data, error } = await supabase
        .from('sprints')
        .select('*')
        .eq('name', sprintName)
        .single()

      if (error) {
        console.error('Error fetching sprint by key:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Sprint key fetch error:', error)
      return null
    }
  },

  // Get all steps for a specific sprint
  async getSprintSteps(sprintId: string): Promise<Step[]> {
    try {
      const { data, error } = await supabase
        .from('steps')
        .select('*')
        .eq('sprint_id', sprintId)
        .order('day_number')
        .order('order_index')

      if (error) {
        console.error('Error fetching sprint steps:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Steps fetch error:', error)
      return []
    }
  },

  // Get user's sprint progress (adapted for existing table structure)
  async getUserSprintProgress(userId: string): Promise<UserSprintProgress[]> {
    try {
      console.log('[SPRINT-SERVICE] Fetching progress for user:', userId)
      
      // Since user_sprint_progress doesn't exist, check user_steps for now
      // This is a temporary solution until proper tables are created
      const { data, error } = await supabase
        .from('user_steps')
        .select('*')
        .eq('user_id', userId)

      if (error) {
        console.error('[SPRINT-SERVICE] Error fetching from user_steps:', error)
        return []
      }

      console.log('[SPRINT-SERVICE] Found', data?.length || 0, 'user step entries')
      
      // For now, return empty array since we don't have sprint progress tracking
      // Once proper tables are created, this will work normally
      return []
    } catch (error) {
      console.error('[SPRINT-SERVICE] User progress fetch error:', error)
      return []
    }
  },

  // Start a new sprint for user (temporary implementation)
  async startUserSprint(userId: string, sprintId: string): Promise<UserSprintProgress | null> {
    try {
      console.log('[SPRINT-SERVICE] Starting sprint:', sprintId, 'for user:', userId)
      
      // Temporary: Store in user_steps table until proper tables are created
      const { data, error } = await supabase
        .from('user_steps')
        .insert({
          user_id: userId,
          sprint_id: sprintId,
          status: 'started',
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        console.error('[SPRINT-SERVICE] Error starting sprint in user_steps:', error)
        return null
      }

      console.log('[SPRINT-SERVICE] Sprint started successfully in user_steps:', data)
      
      // Return a UserSprintProgress-like object
      return {
        id: data.id,
        user_id: userId,
        sprint_id: sprintId,
        status: 'in_progress',
        started_at: new Date().toISOString(),
        created_at: data.created_at
      }
    } catch (error) {
      console.error('[SPRINT-SERVICE] Start sprint error:', error)
      return null
    }
  },

  // Complete a sprint step
  async completeStep(userId: string, stepId: string, sprintId: string, notes?: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_step_progress')
        .upsert({
          user_id: userId,
          step_id: stepId,
          sprint_id: sprintId,
          status: 'completed',
          completed_at: new Date().toISOString(),
          notes: notes
        }, {
          onConflict: 'user_id,step_id'
        })

      if (error) {
        console.error('Error completing step:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Complete step error:', error)
      return false
    }
  },

  // Get user's step progress for a sprint
  async getUserStepProgress(userId: string, sprintId: string): Promise<UserStepProgress[]> {
    try {
      const { data, error } = await supabase
        .from('user_step_progress')
        .select(`
          *,
          steps:step_id (
            id,
            title,
            day_number,
            order_index
          )
        `)
        .eq('user_id', userId)
        .eq('sprint_id', sprintId)
        .order('created_at')

      if (error) {
        console.error('Error fetching user step progress:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Step progress fetch error:', error)
      return []
    }
  }
}

export type { UserSprintProgress, UserStepProgress }