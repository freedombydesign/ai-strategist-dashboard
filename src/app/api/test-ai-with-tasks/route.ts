import { NextRequest, NextResponse } from 'next/server'

// Task ID to human-readable name mapping (copied from AI route for testing)
function getTaskName(taskId: string): string {
  const taskMapping: Record<string, string> = {
    // Profitable Service Sprint
    'profit-1-1': 'Analyze Service Profitability',
    'profit-1-2': 'Identify High-Value Clients', 
    'profit-2-1': 'Document Your Golden Service',
    'profit-3-1': 'Create Service Focus Plan',
  };
  
  return taskMapping[taskId] || taskId;
}

export async function POST(request: NextRequest) {
  try {
    // Simulate the AI call with completed tasks
    const testUserId = 'f85eba27-6eb9-4933-9459-2517739ef846'
    const manualCompletedTasks = ['140b8cda-0074-4ca0-a48a-5e310747c18b:profit-1-1']
    
    // Test the task mapping
    console.log('=== TESTING TASK MAPPING ===');
    manualCompletedTasks.forEach(taskId => {
      const actualTaskId = taskId.includes(':') ? taskId.split(':')[1] : taskId;
      const taskName = getTaskName(actualTaskId);
      console.log(`Task ID: ${actualTaskId} -> Task Name: ${taskName}`);
    });
    
    // Call our own AI API with the completed tasks
    const aiResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3004'}/api/ai-strategist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: testUserId,
        message: "What tasks have I completed? Tell me the specific names of my completed tasks.",
        freedom_score: null, // Simplified for test
        is_fresh_start: false,
        completed_tasks: manualCompletedTasks
      })
    })
    
    const aiData = await aiResponse.json()
    
    return NextResponse.json({
      success: true,
      test: 'AI called with completed tasks',
      aiResponse: aiData,
      sentCompletedTasks: manualCompletedTasks
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}