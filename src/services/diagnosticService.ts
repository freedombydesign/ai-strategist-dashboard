import { supabase } from '../lib/supabase'
import { scoreAndRecommend, DiagnosticAnswers, FreedomScoreResult } from '../utils/freedomScoring'
import { emailService } from './emailService'

// Define types to match your freedom_diagnostic_questions table structure
interface FreedomDiagnosticQuestion {
  id: number
  question_text: string
  order_index: number
  category: string
  created_at?: string
}

interface Sprint {
  id: string
  name: string
  client_facing_title: string
  description: string
  goal: string
  time_saved_hours: number
}

interface SavedResponse {
  id: string
  user_id?: string
  created_at: string
  scoreResult: FreedomScoreResult
}

export const diagnosticService = {
  // Fetch the 12 diagnostic questions from API route (which handles seeding)
  async getDiagnosticQuestions(): Promise<FreedomDiagnosticQuestion[]> {
    try {
      const response = await fetch('/api/diagnostic-questions')
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch questions')
      }
      
      return result.questions || []
    } catch (error) {
      console.error('Error fetching diagnostic questions:', error)
      throw error
    }
  },

  // Fetch all sprints
  async getSprints(): Promise<Sprint[]> {
    try {
      const { data, error } = await supabase
        .from('sprints')
        .select('*')
        .order('time_saved_hours')
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching sprints:', error)
      throw error
    }
  },

  // Save diagnostic responses and calculate score
  async saveResponsesAndCalculateScore(
    answers: DiagnosticAnswers, 
    userId?: string
  ): Promise<SavedResponse> {
    console.log('[DIAGNOSTIC] 🚀 saveResponsesAndCalculateScore called!')
    console.log('[DIAGNOSTIC] 📝 Answers received:', answers)
    console.log('[DIAGNOSTIC] 👤 User ID:', userId)
    try {
      // Calculate the score using our new algorithm
      const scoreResult = scoreAndRecommend(answers);

      // Save the raw responses to the database  
      // Try JSON column approach first, fallback to individual columns if needed
      let responseData = null;
      let saveError = null;
      
      try {
        // Use the existing diagnostic_responses table
        const { data, error } = await supabase
          .from('diagnostic_responses')
          .insert({
            user_id: userId,
            responses: answers,
            score_result: scoreResult,
            created_at: new Date().toISOString()
          })
          .select()
          .single();
        responseData = data;
        saveError = error;
      } catch (error: any) {
        console.error('[DIAGNOSTIC] Error saving to diagnostic_responses:', error);
        saveError = error;
      }

      if (saveError) {
        console.error('Error saving responses:', saveError);
        // Continue anyway - we can still return the calculated score
      }

      // Send diagnostic results email directly if user is authenticated
      if (userId && responseData?.id) {
        try {
          // Get user email from Supabase
          const { data: userData } = await supabase.auth.admin.getUserById(userId)
          const userEmail = userData?.user?.email
          
          if (userEmail) {
            const { Resend } = await import('resend')
            const resend = new Resend(process.env.RESEND_API_KEY)
            
            const emailResult = await resend.emails.send({
              from: process.env.EMAIL_FROM || 'coach@scalewithruth.com',
              to: userEmail,
              subject: '🎯 Your Freedom Diagnostic Results Are Ready!',
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
                    <h1 style="margin: 0; font-size: 28px;">🎯 Your Freedom Diagnostic Results</h1>
                    <p style="margin: 10px 0 0 0; font-size: 16px;">Your business transformation roadmap is ready!</p>
                  </div>
                  
                  <div style="background: #f8f9ff; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <h3 style="margin: 0 0 15px 0; color: #333;">📊 Your Business Health Score</h3>
                    <div style="font-size: 48px; font-weight: bold; color: #3B82F6; text-align: center; margin-bottom: 15px;">
                      ${scoreResult?.percent || 'N/A'}%
                    </div>
                    <p style="text-align: center; color: #666; margin: 0;">Total: ${scoreResult?.totalScore || 0}/60</p>
                  </div>
                  
                  <div style="text-align: center; margin-bottom: 20px;">
                    <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://suite.scalewithruth.com'}/dashboard" 
                       style="display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                      View Your Complete Sprint Plan →
                    </a>
                  </div>
                  
                  <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px;">
                    <p style="margin: 0 0 10px 0; font-weight: bold; color: #856404;">What's Next?</p>
                    <ul style="color: #856404; margin: 0; padding-left: 20px;">
                      <li>Review your personalized sprint sequence</li>
                      <li>Start with your highest-impact sprint</li>
                      <li>Use daily check-ins to track progress</li>
                      <li>Get AI coaching support when needed</li>
                    </ul>
                  </div>
                </div>
              `
            })
            
            console.log(`[DIAGNOSTIC] ✅ Assessment email sent successfully:`, emailResult)
          } else {
            console.log(`[DIAGNOSTIC] ⚠️ No email found for user ${userId}`)
          }
        } catch (emailError) {
          console.error('[DIAGNOSTIC] Error sending results email:', emailError);
          // Don't fail the main operation for email issues
        }
      }

      return {
        id: responseData?.id || 'temp-' + Date.now(),
        user_id: userId,
        created_at: responseData?.created_at || new Date().toISOString(),
        scoreResult
      };

    } catch (error) {
      console.error('Error calculating score:', error)
      throw error
    }
  },

  // Get historical responses for a user
  async getUserResponses(userId: string): Promise<SavedResponse[]> {
    try {
      const { data, error } = await supabase
        .from('diagnostic_responses')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      // Transform the data and recalculate scores - handle both schema types
      return (data || []).map(row => {
        // Try JSON column first, fallback to individual columns
        const responses = row.responses || {
          M1_Q1: row.M1_Q1, M1_Q2: row.M1_Q2,
          M2_Q1: row.M2_Q1, M2_Q2: row.M2_Q2,
          M3_Q1: row.M3_Q1, M3_Q2: row.M3_Q2,
          M4_Q1: row.M4_Q1, M4_Q2: row.M4_Q2,
          M5_Q1: row.M5_Q1, M5_Q2: row.M5_Q2,
          M6_Q1: row.M6_Q1, M6_Q2: row.M6_Q2
        };
        
        return {
          id: row.id,
          user_id: row.user_id,
          created_at: row.created_at,
          scoreResult: scoreAndRecommend(responses)
        }
      });

    } catch (error) {
      console.error('Error fetching user responses:', error)
      throw error
    }
  },

  // Get a specific sprint by key
  async getSprintByKey(sprintKey: string): Promise<Sprint | null> {
    try {
      const sprints = await this.getSprints();
      
      // Map sprint keys to your database entries
      const sprintMapping = {
        'S1': 'profitable_service',      // Lock In Your Most Profitable Service Zone
        'S2': 'smooth_path',            // Create a Smooth Path from First Contact to Commitment  
        'S3': 'sell_bottleneck',        // Sell Without Being a Bottleneck
        'S4': 'streamline_delivery',    // Streamline Client Delivery without Losing Your Personal Touch
        'S5': 'continuous_improve'      // Continuously Improve without Burning It Down
      };

      const dbSprintName = sprintMapping[sprintKey as keyof typeof sprintMapping];
      return sprints.find(s => s.name === dbSprintName) || null;

    } catch (error) {
      console.error('Error fetching sprint by key:', error)
      return null
    }
  }
}

// Export the types so other files can use them
export type { FreedomDiagnosticQuestion, Sprint, SavedResponse, DiagnosticAnswers, FreedomScoreResult }