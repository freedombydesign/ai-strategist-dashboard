import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

export async function POST(request: NextRequest) {
  try {
    const { userEmail, scoreResult, previousScore, isRetake, userName } = await request.json()
    
    if (!userEmail || !scoreResult) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    console.log('[ASSESSMENT-EMAIL-API] 📧 Sending assessment email to:', userEmail)
    
    const resend = new Resend(process.env.RESEND_API_KEY)
    
    // Personalization based on score range
    const getPersonalizedContent = (score: number, previous?: number, retake = false) => {
      const isImprovement = previous && score > previous
      const improvement = previous ? score - previous : 0
      
      if (score >= 85) {
        return {
          title: "🌟 Outstanding! You're Ready to Scale!",
          message: "You're operating at an elite level! Your business systems are primed for explosive growth.",
          color: "#10b981",
          urgency: "high-opportunity",
          nextStep: isImprovement 
            ? `Amazing ${improvement}% improvement! Time to accelerate your growth strategy.`
            : "You're in the top tier - let's maximize this momentum for breakthrough results!"
        }
      } else if (score >= 70) {
        return {
          title: "🚀 Strong Foundation - Time to Accelerate!",
          message: "You're well-positioned for growth. A few strategic tweaks will unlock your next level.",
          color: "#3b82f6",
          urgency: "medium-opportunity", 
          nextStep: isImprovement
            ? `Excellent ${improvement}% improvement! You're building serious momentum.`
            : "You're close to breakthrough territory - let's identify the key levers to pull!"
        }
      } else if (score >= 50) {
        return {
          title: "⚡ Solid Progress - Major Opportunity Ahead!",
          message: "You've built good fundamentals. Now let's systematically eliminate the bottlenecks holding you back.",
          color: "#f59e0b",
          urgency: "medium-potential",
          nextStep: isImprovement
            ? `Great ${improvement}% improvement! Your strategic changes are working.`
            : retake ? "Every assessment reveals new insights - you're on the right path!" : "You have untapped potential waiting to be unleashed!"
        }
      } else {
        return {
          title: "🎯 Perfect Timing - Huge Growth Potential!",
          message: "This is your transformation moment! Every successful entrepreneur started exactly where you are.",
          color: "#dc2626", 
          urgency: "high-potential",
          nextStep: isImprovement
            ? `Fantastic ${improvement}% improvement! You're gaining momentum fast.`
            : retake ? "Growth takes courage - you're investing in your future!" : "You're at the perfect starting point for dramatic improvement!"
        }
      }
    }
    
    const personalizedContent = getPersonalizedContent(scoreResult.percent, previousScore, isRetake)
    
    const emailResult = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'coach@scalewithruth.com',
      to: userEmail,
      subject: `${personalizedContent.title} Your Freedom Diagnostic Results`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, ${personalizedContent.color} 0%, ${personalizedContent.color}dd 100%); color: white; padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
            <h1 style="margin: 0; font-size: 28px;">${personalizedContent.title}</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px;">${personalizedContent.message}</p>
          </div>
          
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="margin: 0 0 15px 0; color: #1e293b;">👋 Hey ${userName || 'there'}!</h3>
            <p style="color: #475569; margin: 0; font-size: 16px;">Your Freedom Diagnostic results are ready and they reveal some exciting insights about your business transformation journey!</p>
          </div>
          
          ${previousScore ? `
          <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #10b981;">
            <p style="margin: 0; color: #065f46; font-weight: bold;">📈 ${personalizedContent.nextStep}</p>
            <p style="margin: 5px 0 0 0; color: #047857; font-size: 14px;">Previous Score: ${previousScore}% → Current Score: ${scoreResult.percent}%</p>
          </div>
          ` : `
          <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #f59e0b;">
            <p style="margin: 0; color: #92400e; font-weight: bold;">🎯 ${personalizedContent.nextStep}</p>
          </div>
          `}
          
          <div style="background: #f8f9ff; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="margin: 0 0 15px 0; color: #333;">📊 Your Business Health Score</h3>
            <div style="font-size: 48px; font-weight: bold; color: ${personalizedContent.color}; text-align: center; margin-bottom: 15px;">
              ${scoreResult.percent}%
            </div>
            <p style="text-align: center; color: #666; margin: 0;">Total: ${scoreResult.totalScore}/60</p>
          </div>
          
          <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="margin: 0 0 15px 0; color: #333;">📈 Module Breakdown</h3>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
              ${Object.entries(scoreResult.moduleAverages || {}).map(([module, score]) => `
                <div style="background: white; padding: 10px; border-radius: 6px; text-align: center; border: 1px solid #e5e7eb;">
                  <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">${getModuleName(module)}</div>
                  <div style="font-size: 18px; font-weight: bold; color: #1f2937;">${score}/10</div>
                </div>
              `).join('')}
            </div>
          </div>
          
          <div style="text-align: center; margin-bottom: 20px;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://scalewithruth.com'}/dashboard" 
               style="display: inline-block; background: ${personalizedContent.color}; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
              ${scoreResult.percent >= 70 ? 'Accelerate Your Growth →' : 'Start Your Transformation →'}
            </a>
          </div>
          
          <div style="background: ${scoreResult.percent >= 70 ? '#f0fdf4' : '#fff3cd'}; border: 1px solid ${scoreResult.percent >= 70 ? '#10b981' : '#ffeaa7'}; padding: 15px; border-radius: 8px;">
            <p style="margin: 0 0 10px 0; font-weight: bold; color: ${scoreResult.percent >= 70 ? '#065f46' : '#856404'};">🚀 Your Personalized Action Plan:</p>
            <ul style="color: ${scoreResult.percent >= 70 ? '#047857' : '#856404'}; margin: 0; padding-left: 20px;">
              ${scoreResult.percent >= 85 ? 
                '<li>Focus on scaling and optimization sprints</li><li>Implement advanced automation systems</li><li>Explore new market opportunities</li><li>Consider strategic partnerships and expansion</li>' :
                scoreResult.percent >= 70 ?
                '<li>Target your lowest-scoring modules first</li><li>Complete 2-3 high-impact sprints this month</li><li>Set up daily momentum tracking</li><li>Schedule weekly AI strategy sessions</li>' :
                scoreResult.percent >= 50 ?
                '<li>Start with your highest-impact sprint</li><li>Focus on foundational systems first</li><li>Use daily check-ins to build consistency</li><li>Get AI coaching for breakthrough insights</li>' :
                '<li>Begin with the fundamentals sprint sequence</li><li>Take small, consistent daily actions</li><li>Use the AI strategist for step-by-step guidance</li><li>Celebrate every small win to build momentum</li>'
              }
            </ul>
          </div>
        </div>
      `
    })
    
    console.log('[ASSESSMENT-EMAIL-API] ✅ Email sent successfully:', emailResult)
    
    return NextResponse.json({
      success: true,
      emailId: emailResult.data?.id
    })
    
  } catch (error) {
    console.error('[ASSESSMENT-EMAIL-API] Error sending email:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

function getModuleName(module: string): string {
  const names = {
    'M1': 'Position for Profit',
    'M2': 'Engineer Buyer Journey', 
    'M3': 'Set Up Systems',
    'M4': 'Build Sales System',
    'M5': 'Deliver Without Doing All',
    'M6': 'Refine, Release, Repeat'
  }
  return names[module as keyof typeof names] || module
}