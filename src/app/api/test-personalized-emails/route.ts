import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { userEmail, testType } = await request.json()
    
    if (!userEmail) {
      return NextResponse.json({ error: 'Missing user email' }, { status: 400 })
    }

    console.log('[TEST-PERSONALIZED-EMAILS] 🧪 Testing personalized emails for:', userEmail)

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://scalewithruth.com'
    const results = []

    if (testType === 'assessment' || testType === 'all') {
      // Test different assessment score scenarios
      const assessmentTests = [
        {
          name: 'High Score First Time',
          scoreResult: { percent: 88, totalScore: 53, moduleAverages: { M1: 9, M2: 8, M3: 9, M4: 9, M5: 9, M6: 9 } },
          previousScore: null,
          isRetake: false
        },
        {
          name: 'Medium Score with Improvement',
          scoreResult: { percent: 65, totalScore: 39, moduleAverages: { M1: 7, M2: 6, M3: 6, M4: 7, M5: 7, M6: 6 } },
          previousScore: 45,
          isRetake: true
        },
        {
          name: 'Low Score First Time',
          scoreResult: { percent: 35, totalScore: 21, moduleAverages: { M1: 4, M2: 3, M3: 3, M4: 4, M5: 4, M6: 3 } },
          previousScore: null,
          isRetake: false
        }
      ]

      for (const test of assessmentTests) {
        try {
          const response = await fetch(`${siteUrl}/api/send-assessment-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userEmail,
              scoreResult: test.scoreResult,
              previousScore: test.previousScore,
              isRetake: test.isRetake,
              userName: userEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
            })
          })
          const result = await response.json()
          results.push({
            test: `Assessment - ${test.name}`,
            success: result.success,
            emailId: result.emailId,
            error: result.error
          })
        } catch (error) {
          results.push({
            test: `Assessment - ${test.name}`,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      }
    }

    if (testType === 'sprint' || testType === 'all') {
      // Test different sprint completion scenarios
      const sprintTests = [
        {
          name: 'First Sprint - Excellent Performance',
          sprintData: {
            client_facing_title: 'Email Marketing Automation',
            description: 'Set up automated email sequences that nurture leads and drive conversions',
            goal: 'Generate 50% more qualified leads with automated nurturing',
            time_saved_hours: 8,
            difficulty: 'medium'
          },
          userProgress: { totalStepsCompleted: 12 },
          completionData: {
            isFirstSprint: true,
            consecutiveSprintsCompleted: 1,
            completionTimeInDays: 2
          }
        },
        {
          name: 'Sprint Streak - Exceptional',
          sprintData: {
            client_facing_title: 'Client Onboarding System',
            description: 'Create a streamlined process that wow clients from day one',
            goal: 'Reduce onboarding time by 75% while improving client satisfaction',
            time_saved_hours: 15,
            difficulty: 'hard'
          },
          userProgress: { totalStepsCompleted: 18 },
          completionData: {
            isFirstSprint: false,
            consecutiveSprintsCompleted: 5,
            completionTimeInDays: 4
          }
        },
        {
          name: 'Steady Progress - Good',
          sprintData: {
            client_facing_title: 'Social Media Content Calendar',
            description: 'Plan and schedule content that engages your audience consistently',
            goal: 'Maintain consistent posting with 2 hours of weekly planning',
            time_saved_hours: 3,
            difficulty: 'easy'
          },
          userProgress: { totalStepsCompleted: 6 },
          completionData: {
            isFirstSprint: false,
            consecutiveSprintsCompleted: 1,
            completionTimeInDays: 9
          }
        }
      ]

      for (const test of sprintTests) {
        try {
          const response = await fetch(`${siteUrl}/api/send-sprint-completion-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userEmail,
              sprintData: test.sprintData,
              userProgress: test.userProgress,
              completionData: test.completionData,
              userName: userEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
            })
          })
          const result = await response.json()
          results.push({
            test: `Sprint - ${test.name}`,
            success: result.success,
            emailId: result.emailId,
            error: result.error
          })
        } catch (error) {
          results.push({
            test: `Sprint - ${test.name}`,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      }
    }

    const successCount = results.filter(r => r.success).length
    
    console.log('[TEST-PERSONALIZED-EMAILS] ✅ Sent', successCount, 'personalized test emails')
    
    return NextResponse.json({
      success: true,
      totalTests: results.length,
      successfulEmails: successCount,
      results
    })
    
  } catch (error) {
    console.error('[TEST-PERSONALIZED-EMAILS] Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}