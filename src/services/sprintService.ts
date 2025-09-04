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

// Enhanced interfaces matching Ruth's Airtable structure
export interface EnhancedStep {
  id: number
  step_name: string
  sprint_category: string
  step_number: number
  task_description: string
  resource_link?: string
  deliverable: string
  sprint_outcome: string
  connected_ai_prompt?: string
  completion_status?: 'checked' | null
  created_at?: string
}

export interface SprintCategory {
  id: number
  category_name: string
  description: string
  outcome: string
  phase_number: number
  time_saved_hours: number
  included_steps: string
  step_numbers: string
  connected_ai_prompts: string
  step_range_start: number
  step_range_end: number
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

  // Start a new sprint for user (enhanced implementation)
  async startUserSprint(userId: string, sprintId: string): Promise<UserSprintProgress | null> {
    try {
      console.log('[SPRINT-SERVICE] Starting enhanced sprint:', sprintId, 'for user:', userId)
      
      // Check if this is an enhanced sprint
      const enhancedSprints = await this.getEnhancedSprintData()
      const enhancedSprint = enhancedSprints.find(s => s.id === sprintId)
      
      if (enhancedSprint) {
        console.log('[SPRINT-SERVICE] Found enhanced sprint, ensuring it exists in database')
        
        // Ensure the enhanced sprint exists in the sprints table
        await this.ensureEnhancedSprintExists(enhancedSprint)
        
        // Get the first enhanced step for this sprint
        const enhancedSteps = await this.getEnhancedStepsForOldSprint(enhancedSprint.name)
        const firstStep = enhancedSteps.length > 0 ? enhancedSteps[0] : null
        
        // Store in user_steps table with enhanced data
        const { data, error } = await supabase
          .from('user_steps')
          .insert({
            user_id: userId,
            sprint_id: sprintId,
            step_number: firstStep ? firstStep.step_number : 1,
            step_title: firstStep ? firstStep.step_name : 'Getting Started',
            status: 'started',
            created_at: new Date().toISOString()
          })
          .select()
          .single()

        if (error) {
          console.error('[SPRINT-SERVICE] Error starting enhanced sprint in user_steps:', error)
          return null
        }

        console.log('[SPRINT-SERVICE] Enhanced sprint started successfully:', data)
        
        return {
          id: data.id,
          user_id: userId,
          sprint_id: sprintId,
          status: 'in_progress',
          started_at: new Date().toISOString(),
          created_at: data.created_at
        }
      } else {
        // Fallback to regular sprint system
        console.log('[SPRINT-SERVICE] Using regular sprint system for:', sprintId)
        
        const stepsData = await this.getSprintSteps(sprintId)
        const firstStep = stepsData.length > 0 ? stepsData[0] : null
        
        const { data, error } = await supabase
          .from('user_steps')
          .insert({
            user_id: userId,
            sprint_id: sprintId,
            step_number: 1,
            step_title: firstStep ? firstStep.title : 'Getting Started',
            status: 'started',
            created_at: new Date().toISOString()
          })
          .select()
          .single()

        if (error) {
          console.error('[SPRINT-SERVICE] Error starting regular sprint in user_steps:', error)
          return null
        }

        return {
          id: data.id,
          user_id: userId,
          sprint_id: sprintId,
          status: 'in_progress',
          started_at: new Date().toISOString(),
          created_at: data.created_at
        }
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
  },

  // Enhanced methods for Ruth's Airtable data
  
  // Get all sprint categories (Ruth's 5 main phases)
  async getAllSprintCategories(): Promise<SprintCategory[]> {
    try {
      console.log('[SPRINT-SERVICE] Fetching all sprint categories')
      
      const { data, error } = await supabase
        .from('sprint_categories')
        .select('*')
        .order('phase_number', { ascending: true })

      if (error) {
        console.error('[SPRINT-SERVICE] Error fetching sprint categories:', error)
        return []
      }

      console.log('[SPRINT-SERVICE] Retrieved', data?.length || 0, 'sprint categories')
      return data || []
    } catch (error) {
      console.error('[SPRINT-SERVICE] Sprint categories service error:', error)
      return []
    }
  },

  // Get all enhanced steps (Ruth's 17 detailed steps)
  async getAllEnhancedSteps(): Promise<EnhancedStep[]> {
    try {
      console.log('[SPRINT-SERVICE] Fetching all enhanced steps')
      
      const { data, error } = await supabase
        .from('enhanced_steps')
        .select('*')
        .order('step_number', { ascending: true })

      if (error) {
        console.error('[SPRINT-SERVICE] Error fetching enhanced steps:', error)
        return []
      }

      console.log('[SPRINT-SERVICE] Retrieved', data?.length || 0, 'enhanced steps')
      return data || []
    } catch (error) {
      console.error('[SPRINT-SERVICE] Enhanced steps service error:', error)
      return []
    }
  },

  // Get enhanced steps for a specific sprint category
  async getEnhancedStepsByCategory(categoryName: string): Promise<EnhancedStep[]> {
    try {
      console.log('[SPRINT-SERVICE] Fetching enhanced steps for category:', categoryName)
      
      const { data, error } = await supabase
        .from('enhanced_steps')
        .select('*')
        .ilike('sprint_category', `%${categoryName}%`)
        .order('step_number', { ascending: true })

      if (error) {
        console.error('[SPRINT-SERVICE] Error fetching enhanced steps by category:', error)
        return []
      }

      console.log('[SPRINT-SERVICE] Retrieved', data?.length || 0, 'enhanced steps for category')
      return data || []
    } catch (error) {
      console.error('[SPRINT-SERVICE] Enhanced steps by category service error:', error)
      return []
    }
  },

  // Get steps in a specific range (useful for phase grouping)
  async getEnhancedStepsByRange(startStep: number, endStep: number): Promise<EnhancedStep[]> {
    try {
      console.log('[SPRINT-SERVICE] Fetching enhanced steps in range:', startStep, 'to', endStep)
      
      const { data, error } = await supabase
        .from('enhanced_steps')
        .select('*')
        .gte('step_number', startStep)
        .lte('step_number', endStep)
        .order('step_number', { ascending: true })

      if (error) {
        console.error('[SPRINT-SERVICE] Error fetching enhanced steps by range:', error)
        return []
      }

      console.log('[SPRINT-SERVICE] Retrieved', data?.length || 0, 'enhanced steps in range')
      return data || []
    } catch (error) {
      console.error('[SPRINT-SERVICE] Enhanced steps by range service error:', error)
      return []
    }
  },

  // Get completed steps count for progress tracking
  async getCompletedStepsCount(): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('enhanced_steps')
        .select('id')
        .eq('completion_status', 'checked')

      if (error) {
        console.error('[SPRINT-SERVICE] Error fetching completed steps count:', error)
        return 0
      }

      return data?.length || 0
    } catch (error) {
      console.error('[SPRINT-SERVICE] Completed steps count error:', error)
      return 0
    }
  },

  // Mark a step as completed
  async markStepCompleted(stepId: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('enhanced_steps')
        .update({ 
          completion_status: 'checked',
          updated_at: new Date().toISOString()
        })
        .eq('id', stepId)

      if (error) {
        console.error('[SPRINT-SERVICE] Error marking step completed:', error)
        return false
      }

      console.log('[SPRINT-SERVICE] Step marked as completed:', stepId)
      return true
    } catch (error) {
      console.error('[SPRINT-SERVICE] Mark step completed error:', error)
      return false
    }
  },

  // Get steps with specific AI prompt connections
  async getStepsByAIPrompt(promptName: string): Promise<EnhancedStep[]> {
    try {
      const { data, error } = await supabase
        .from('enhanced_steps')
        .select('*')
        .ilike('connected_ai_prompt', `%${promptName}%`)
        .order('step_number', { ascending: true })

      if (error) {
        console.error('[SPRINT-SERVICE] Error fetching steps by AI prompt:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('[SPRINT-SERVICE] Steps by AI prompt error:', error)
      return []
    }
  },

  // Ensure enhanced sprint exists in the sprints table (for foreign key constraint)
  async ensureEnhancedSprintExists(sprint: Sprint): Promise<void> {
    try {
      // Check if sprint already exists
      const { data: existing } = await supabase
        .from('sprints')
        .select('id')
        .eq('id', sprint.id)
        .single()

      if (!existing) {
        console.log('[SPRINT-SERVICE] Inserting enhanced sprint into database:', sprint.id)
        const { error } = await supabase
          .from('sprints')
          .insert({
            id: sprint.id,
            name: sprint.name,
            client_facing_title: sprint.client_facing_title,
            description: sprint.description,
            goal: sprint.goal,
            time_saved_hours: sprint.time_saved_hours,
            created_at: sprint.created_at
          })
        
        if (error) {
          console.error('[SPRINT-SERVICE] Error inserting enhanced sprint:', error)
          throw error
        }
        
        console.log('[SPRINT-SERVICE] Enhanced sprint inserted successfully')
      } else {
        console.log('[SPRINT-SERVICE] Enhanced sprint already exists in database')
      }
    } catch (error) {
      console.error('[SPRINT-SERVICE] Error ensuring enhanced sprint exists:', error)
      throw error
    }
  },

  // Enhanced method that combines old sprint system with Ruth's rich Airtable data
  async getEnhancedSprintData(): Promise<Sprint[]> {
    try {
      console.log('[SPRINT-SERVICE] Fetching enhanced sprint data from Airtable categories')
      
      const categories = await this.getAllSprintCategories()
      
      if (categories.length === 0) {
        console.log('[SPRINT-SERVICE] No categories found, falling back to regular sprints')
        return await this.getAllSprints()
      }

      // Map Ruth's sprint categories to the old sprint interface format
      // Use consistent UUIDs based on the old system for compatibility
      const sprintIdMapping: Record<string, string> = {
        'Lock in Your Most Profitable Service Zone': 'c8b5a7d9-2e4f-4a1b-8c9d-1e2f3a4b5c6d',
        'Create A Smooth Path From First Contact to Commitment': '00371e13-e1ee-49db-b22b-4667ed04c0d2', // Keep existing ID
        'Sell Without Being The Bottleneck': 'f1a2b3c4-5d6e-7f8a-9b0c-1d2e3f4a5b6c',
        'Streamline Client Delivery Without Losing Your Personal Touch': 'a9b8c7d6-e5f4-3a2b-1c9d-8e7f6a5b4c3d',
        'Continuously Improve Without Burning it Down': '5e4d3c2b-1a9f-8e7d-6c5b-4a3f2e1d9c8b'
      }

      const enhancedSprints: Sprint[] = categories.map(category => ({
        id: sprintIdMapping[category.category_name] || `enhanced-${category.id}`,
        name: this.mapCategoryToSprintName(category.category_name),
        client_facing_title: category.category_name,
        description: category.description,
        goal: category.outcome,
        time_saved_hours: category.time_saved_hours,
        created_at: category.created_at
      }))

      console.log('[SPRINT-SERVICE] Enhanced sprint data created:', enhancedSprints.length, 'sprints')
      return enhancedSprints
    } catch (error) {
      console.error('[SPRINT-SERVICE] Error fetching enhanced sprint data:', error)
      return await this.getAllSprints() // Fallback
    }
  },

  // Map Ruth's category names to old sprint names for compatibility
  mapCategoryToSprintName(categoryName: string): string {
    const mapping: Record<string, string> = {
      'Lock in Your Most Profitable Service Zone': 'profitable_service',
      'Create A Smooth Path From First Contact to Commitment': 'smooth_path', 
      'Sell Without Being The Bottleneck': 'sell_bottleneck',
      'Streamline Client Delivery Without Losing Your Personal Touch': 'streamline_delivery',
      'Continuously Improve Without Burning it Down': 'continuous_improve'
    }
    
    return mapping[categoryName] || categoryName.toLowerCase().replace(/\s+/g, '_')
  },

  // Get enhanced steps for a specific old sprint name (for backward compatibility)
  async getEnhancedStepsForOldSprint(sprintName: string): Promise<EnhancedStep[]> {
    try {
      // Map old sprint names to Ruth's category names
      const sprintToCategory: Record<string, string> = {
        'profitable_service': 'Lock in Your Most Profitable Service Zone',
        'smooth_path': 'Create A Smooth Path From First Contact to Commitment',
        'sell_bottleneck': 'Sell Without Being The Bottleneck', 
        'streamline_delivery': 'Streamline Client Delivery Without Losing Your Personal Touch',
        'continuous_improve': 'Continuously Improve Without Burning it Down'
      }

      const categoryName = sprintToCategory[sprintName]
      if (!categoryName) {
        console.log('[SPRINT-SERVICE] No category mapping found for sprint:', sprintName)
        return []
      }

      return await this.getEnhancedStepsByCategory(categoryName)
    } catch (error) {
      console.error('[SPRINT-SERVICE] Error fetching enhanced steps for old sprint:', error)
      return []
    }
  }
}

export type { UserSprintProgress, UserStepProgress, EnhancedStep, SprintCategory }