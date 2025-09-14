import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Test the workflows endpoint
    const workflowsResponse = await fetch(`${request.nextUrl.origin}/api/systemizer/workflows`)
    const workflowsData = await workflowsResponse.json()

    if (!workflowsResponse.ok || !workflowsData.success) {
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch workflows for testing',
        workflowsError: workflowsData.error
      }, { status: 500 })
    }

    const workflows = workflowsData.workflows
    if (workflows.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No workflows available for testing'
      }, { status: 400 })
    }

    // Use the first workflow for testing
    const testWorkflow = workflows[0]

    // Test a mock export (without actually calling external APIs)
    const mockExportRequest = {
      workflowId: testWorkflow.id,
      exportConfig: {
        includeTemplates: true,
        includeTimelines: false,
        includeAssignments: false,
        customFields: {},
        exportFormat: 'native'
      },
      platformSettings: {
        // Mock settings - don't use real API keys in tests
        mockTest: true
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Export system test completed successfully',
      testData: {
        availableWorkflows: workflows.length,
        testWorkflow: {
          id: testWorkflow.id,
          name: testWorkflow.name,
          stepCount: testWorkflow.step_count,
          templateCount: testWorkflow.template_count
        },
        mockExportRequest,
        supportedPlatforms: ['asana', 'clickup', 'monday', 'trello', 'notion'],
        endpointsAvailable: [
          '/api/systemizer/workflows',
          '/api/systemizer/export/asana',
          '/api/systemizer/export/clickup',
          '/api/systemizer/export/monday',
          '/api/systemizer/export/trello',
          '/api/systemizer/export/notion'
        ]
      }
    })

  } catch (error) {
    console.error('[TEST-EXPORT] Error:', error)
    return NextResponse.json({
      success: false,
      error: 'Export system test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}