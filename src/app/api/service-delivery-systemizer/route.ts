import { NextRequest, NextResponse } from 'next/server'

// Mock workflow data for demonstration
const mockWorkflows = [
  {
    id: '1',
    name: 'Client Onboarding',
    description: 'Standard client onboarding process',
    category: 'Customer Management',
    created_at: new Date().toISOString(),
    steps: 15,
    efficiency: 85
  },
  {
    id: '2',
    name: 'Service Delivery',
    description: 'Service delivery workflow',
    category: 'Operations',
    created_at: new Date().toISOString(),
    steps: 12,
    efficiency: 67
  },
  {
    id: '3',
    name: 'Quality Assurance',
    description: 'Quality assurance process',
    category: 'Quality Control',
    created_at: new Date().toISOString(),
    steps: 10,
    efficiency: 92
  }
]

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: mockWorkflows
    })
  } catch (error) {
    console.error('Error fetching workflows:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch workflows' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { workflowName, workflowSteps } = await request.json()

    if (!workflowName || !workflowSteps) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: workflowName and workflowSteps' },
        { status: 400 }
      )
    }

    // Simulate workflow processing
    const newWorkflow = {
      id: String(mockWorkflows.length + 1),
      name: workflowName,
      description: `Workflow: ${workflowName}`,
      category: 'Custom',
      created_at: new Date().toISOString(),
      steps: workflowSteps.split('\n').filter(step => step.trim()).length,
      efficiency: Math.floor(Math.random() * 30) + 70, // Random efficiency 70-100%
      workflowSteps
    }

    // Add to mock data (in real app, this would save to database)
    mockWorkflows.push(newWorkflow)

    console.log('Workflow created successfully:', newWorkflow)

    return NextResponse.json({
      success: true,
      message: 'Workflow created successfully',
      data: newWorkflow
    })

  } catch (error) {
    console.error('Error creating workflow:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create workflow' },
      { status: 500 }
    )
  }
}