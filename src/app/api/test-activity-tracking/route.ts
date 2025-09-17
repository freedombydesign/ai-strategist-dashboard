import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const baseUrl = request.url.replace('/api/test-activity-tracking', '')

    // Test the setup endpoint first
    console.log('1. Testing setup endpoint...')
    const setupResponse = await fetch(`${baseUrl}/api/setup-activity-tracking`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })
    const setupResult = await setupResponse.json()
    console.log('Setup result:', setupResult)

    if (!setupResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Setup failed',
        details: setupResult
      }, { status: 500 })
    }

    // Test POST endpoint - create activity entry
    console.log('2. Testing POST activity endpoint...')
    const testUserId = '00000000-0000-0000-0000-000000000000' // Replace with actual user ID
    const testActivityData = {
      userId: testUserId,
      trackingDate: '2024-01-15',
      hoursWorked: 8.5,
      hoursInFulfillment: 6.0,
      hoursInCoordination: 1.5,
      hoursInBusinessDevelopment: 1.0,
      weekendHours: 0,
      revenueGenerated: 2500.00,
      expensesIncurred: 350.00,
      tasksDelegated: 5,
      clientInteractionsHandledByTeam: 3,
      stressLevel: 4,
      jobSatisfaction: 8,
      energyLevel: 7,
      manualTasksCompleted: 12,
      automatedProcessesTriggered: 8,
      newClientsOnboarded: 1,
      clientIssuesResolved: 2,
      notes: "Test entry - great day with new automation"
    }

    const postResponse = await fetch(`${baseUrl}/api/dashboard/activity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testActivityData)
    })
    const postResult = await postResponse.json()
    console.log('POST result:', postResult)

    // Test GET endpoint - retrieve activity data
    console.log('3. Testing GET activity endpoint...')
    const getResponse = await fetch(`${baseUrl}/api/dashboard/activity?userId=${testUserId}&period=30`)
    const getResult = await getResponse.json()
    console.log('GET result:', getResult)

    // Test another POST with different date
    console.log('4. Testing second activity entry...')
    const testActivityData2 = {
      ...testActivityData,
      trackingDate: '2024-01-14',
      hoursWorked: 7.0,
      hoursInFulfillment: 5.5,
      revenueGenerated: 1800.00,
      stressLevel: 3,
      jobSatisfaction: 9,
      notes: "Another test entry - smooth workflow"
    }

    const post2Response = await fetch(`${baseUrl}/api/dashboard/activity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testActivityData2)
    })
    const post2Result = await post2Response.json()
    console.log('Second POST result:', post2Result)

    // Test GET again to see aggregated data
    console.log('5. Testing GET with multiple entries...')
    const get2Response = await fetch(`${baseUrl}/api/dashboard/activity?userId=${testUserId}&period=30`)
    const get2Result = await get2Response.json()
    console.log('Final GET result:', get2Result)

    return NextResponse.json({
      success: true,
      message: 'Activity tracking test completed successfully - v2',
      tests: {
        setup: setupResult,
        firstPost: postResult,
        firstGet: getResult,
        secondPost: post2Result,
        finalGet: get2Result
      },
      summary: {
        setupWorked: setupResult.success,
        postWorked: postResult.success,
        getWorked: getResult.success,
        dataAggregation: get2Result.success && get2Result.data?.currentPeriod?.totalHours > 0
      }
    })

  } catch (error) {
    console.error('Error testing activity tracking:', error)
    return NextResponse.json({
      success: false,
      error: 'Activity tracking test failed',
      details: error.message
    }, { status: 500 })
  }
}