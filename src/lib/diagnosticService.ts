import { supabase } from './supabase'  // Fixed import path

// Define types for our data
interface DiagnosticQuestion {
  id: number
  question_text: string
  order_index: number
  created_at?: string
}

interface Sprint {
  id: number
  title: string
  description: string
  min_score: number
  max_score: number
  created_at?: string
}

export const diagnosticService = {
  // Fetch all diagnostic questions
  async getDiagnosticQuestions(): Promise<DiagnosticQuestion[]> {
    try {
      const { data, error } = await supabase
        .from('freedom_diagnostic_questions')  // Fixed table name
        .select('*')
        .order('order_index')
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching diagnostic questions:', error)
      throw error
    }
  },

  // Fetch all sprints with score ranges
  async getSprints(): Promise<Sprint[]> {
    try {
      const { data, error } = await supabase
        .from('sprints')
        .select('*')
        .order('min_score')
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching sprints:', error)
      throw error
    }
  },

  // Get recommended sprint based on score
  async getRecommendedSprint(score: number): Promise<Sprint | null> {
    try {
      const { data, error } = await supabase
        .from('sprints')
        .select('*')
        .gte('max_score', score)
        .lte('min_score', score)
        .single()
      
      if (error && error.code !== 'PGRST116') throw error
      if (data) return data
      
      // Fallback: get the sprint with the closest score range
      const { data: sprints } = await supabase
        .from('sprints')
        .select('*')
        .order('min_score')
      
      if (sprints && sprints.length > 0) {
        // Find the best matching sprint
        const matchingSprint = sprints.find((sprint: Sprint) =>  // Added type
          score >= sprint.min_score && score <= sprint.max_score
        ) || sprints[0] // Fallback to first sprint if no exact match
        
        return matchingSprint
      }
      return null
    } catch (error) {
      console.error('Error fetching recommended sprint:', error)
      throw error
    }
  }
}

// Export the types so other files can use them
export type { DiagnosticQuestion, Sprint }