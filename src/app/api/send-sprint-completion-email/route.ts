import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

export async function POST(request: NextRequest) {
  try {
    const { userEmail, sprintData, userProgress, completionData } = await request.json()
    
    if (!userEmail || !sprintData) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    console.log('[SPRINT-EMAIL-API] 🎉 Sending sprint completion email to:', userEmail)
    console.log('[SPRINT-EMAIL-API] Sprint:', sprintData.name)
    
    const resend = new Resend(process.env.RESEND_API_KEY)
    
    // Personalization based on sprint completion patterns
    const getPersonalizedContent = (sprint: any, progress: any, completion: any) => {
      const tasksCompleted = progress?.totalStepsCompleted || 0
      const timeSaved = sprint.time_saved_hours || 0
      const isFirstSprint = completion?.isFirstSprint || false
      const consecutiveSprintsCompleted = completion?.consecutiveSprintsCompleted || 1
      const completionTimeInDays = completion?.completionTimeInDays || 1
      const sprintDifficulty = sprint.difficulty || 'medium' // easy, medium, hard
      
      // Determine achievement level
      let achievementLevel = 'good'
      if (timeSaved >= 10 || tasksCompleted >= 15 || consecutiveSprintsCompleted >= 3) {
        achievementLevel = 'exceptional'
      } else if (timeSaved >= 5 || tasksCompleted >= 8 || consecutiveSprintsCompleted >= 2) {
        achievementLevel = 'excellent'
      }
      
      // Fast completion bonus
      const isFastCompletion = completionTimeInDays <= 3
      const isSlowButSteady = completionTimeInDays >= 7
      
      if (achievementLevel === 'exceptional') {
        return {
          title: isFirstSprint ? "🌟 Incredible First Sprint!" : "🔥 Sprint Mastery Achieved!",
          message: isFirstSprint 
            ? "What an amazing start! You've just proven what's possible when you take focused action."
            : `${consecutiveSprintsCompleted} sprints completed! You're building unstoppable momentum.`,
          color: "#8b5cf6",
          celebrationLevel: "exceptional",
          nextStepMessage: isFastCompletion 
            ? "Your speed is impressive! You're ready for advanced challenges."
            : "Your consistent execution is exceptional. Time to tackle bigger opportunities!"
        }
      } else if (achievementLevel === 'excellent') {
        return {
          title: isFirstSprint ? "🚀 Outstanding First Sprint!" : "💪 Excellent Progress!",
          message: isFirstSprint
            ? "You've taken the most important step - from planning to execution. This is how transformation begins!"
            : "You're developing a strong execution rhythm. Each sprint builds more freedom!",
          color: "#10b981",
          celebrationLevel: "excellent", 
          nextStepMessage: isFastCompletion
            ? "Great pace! You're building serious momentum."
            : isSlowButSteady 
            ? "Steady progress wins the game. You're building lasting habits!"
            : "Perfect execution! You're ready for your next breakthrough."
        }
      } else {
        return {
          title: isFirstSprint ? "🎉 First Sprint Complete!" : "✅ Sprint Achieved!",
          message: isFirstSprint
            ? "Congratulations! You've just completed your first step toward business freedom."
            : "Another step forward! Each sprint brings you closer to your goals.",
          color: "#3b82f6",
          celebrationLevel: "good",
          nextStepMessage: isSlowButSteady
            ? "Taking your time shows wisdom. Quality over speed builds lasting success!"
            : "Great work! You're building the foundation for bigger breakthroughs."
        }
      }
    }
    
    const personalizedContent = getPersonalizedContent(sprintData, userProgress, completionData)
    
    const emailResult = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'coach@scalewithruth.com',
      to: userEmail,
      subject: `${personalizedContent.title} ${sprintData.client_facing_title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, ${personalizedContent.color} 0%, ${personalizedContent.color}dd 100%); color: white; padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
            <h1 style="margin: 0; font-size: 28px;">${personalizedContent.title}</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px;">${personalizedContent.message}</p>
          </div>
          
          ${completionData?.consecutiveSprintsCompleted > 1 ? `
          <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #10b981;">
            <p style="margin: 0; color: #065f46; font-weight: bold;">🔥 Streak Alert!</p>
            <p style="margin: 5px 0 0 0; color: #047857; font-size: 14px;">
              ${completionData.consecutiveSprintsCompleted} consecutive sprints completed! 
              ${completionData.consecutiveSprintsCompleted >= 5 ? "You're in elite territory!" : 
                completionData.consecutiveSprintsCompleted >= 3 ? "You're building serious momentum!" : 
                "Keep this momentum going!"}
            </p>
          </div>
          ` : ''}
          
          <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #f59e0b;">
            <p style="margin: 0; color: #92400e; font-weight: bold;">💡 ${personalizedContent.nextStepMessage}</p>
          </div>
          
          <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="margin: 0 0 15px 0; color: #065f46;">✅ Sprint: ${sprintData.client_facing_title}</h3>
            <p style="color: #047857; margin: 0 0 15px 0; font-size: 16px;">${sprintData.description}</p>
            <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #10b981;">
              <p style="margin: 0; color: #065f46; font-weight: bold;">🎯 Goal Achieved:</p>
              <p style="margin: 5px 0 0 0; color: #047857;">${sprintData.goal}</p>
            </div>
          </div>
          
          ${userProgress ? `
          <div style="background: #fffbeb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="margin: 0 0 15px 0; color: #92400e;">📊 Your Progress Impact</h3>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
              <div style="background: white; padding: 15px; border-radius: 6px; text-align: center;">
                <div style="font-size: 24px; font-weight: bold; color: #dc2626;">${userProgress.totalStepsCompleted || 0}</div>
                <div style="font-size: 12px; color: #92400e;">Steps Completed</div>
              </div>
              <div style="background: white; padding: 15px; border-radius: 6px; text-align: center;">
                <div style="font-size: 24px; font-weight: bold; color: #dc2626;">${sprintData.time_saved_hours || 0}h</div>
                <div style="font-size: 12px; color: #92400e;">Time Saved/Week</div>
              </div>
            </div>
          </div>
          ` : ''}
          
          <div style="text-align: center; margin-bottom: 20px;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://scalewithruth.com'}/dashboard" 
               style="display: inline-block; background: ${personalizedContent.color}; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; margin: 0 10px 10px 0;">
              View Dashboard →
            </a>
            <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://scalewithruth.com'}/ai-strategist" 
               style="display: inline-block; background: #3b82f6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
              ${personalizedContent.celebrationLevel === 'exceptional' ? 'Claim Your Next Challenge →' : 
                personalizedContent.celebrationLevel === 'excellent' ? 'Plan Next Sprint →' : 
                'Continue Building →'}
            </a>
          </div>
          
          <div style="background: ${personalizedContent.celebrationLevel === 'exceptional' ? '#f3e8ff' : 
                                     personalizedContent.celebrationLevel === 'excellent' ? '#f0fdf4' : '#fef3c7'}; 
                      border: 1px solid ${personalizedContent.celebrationLevel === 'exceptional' ? '#a855f7' : 
                                         personalizedContent.celebrationLevel === 'excellent' ? '#10b981' : '#f59e0b'}; 
                      padding: 15px; border-radius: 8px;">
            <p style="margin: 0 0 10px 0; font-weight: bold; color: ${personalizedContent.celebrationLevel === 'exceptional' ? '#6b21a8' : 
                                                                      personalizedContent.celebrationLevel === 'excellent' ? '#065f46' : '#92400e'};">
              🚀 ${personalizedContent.celebrationLevel === 'exceptional' ? 'You\'re Ready for Elite-Level Growth!' : 
                   personalizedContent.celebrationLevel === 'excellent' ? 'Maintain This Excellent Momentum!' : 
                   'Keep Building Your Success!'}
            </p>
            <ul style="color: ${personalizedContent.celebrationLevel === 'exceptional' ? '#7c3aed' : 
                               personalizedContent.celebrationLevel === 'excellent' ? '#047857' : '#92400e'}; 
                       margin: 0; padding-left: 20px;">
              ${personalizedContent.celebrationLevel === 'exceptional' ? 
                '<li>Consider tackling multiple sprints simultaneously</li><li>Explore advanced automation and scaling strategies</li><li>Share your success story to inspire others</li><li>Set bigger, more ambitious goals</li>' :
                personalizedContent.celebrationLevel === 'excellent' ?
                '<li>Maintain your daily check-in rhythm</li><li>Tackle your next highest-impact sprint</li><li>Share this win with your support network</li><li>Document lessons learned for future sprints</li>' :
                '<li>Check in daily to build consistency</li><li>Choose your next sprint based on biggest pain point</li><li>Celebrate this important milestone</li><li>Trust the process - you\'re building real freedom!</li>'
              }
            </ul>
          </div>
          
          <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 12px; margin: 0;">
              You're one step closer to business freedom! 🌟
            </p>
          </div>
        </div>
      `
    })
    
    console.log('[SPRINT-EMAIL-API] ✅ Sprint completion email sent successfully:', emailResult)
    
    return NextResponse.json({
      success: true,
      emailId: emailResult.data?.id
    })
    
  } catch (error) {
    console.error('[SPRINT-EMAIL-API] Error sending sprint completion email:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}