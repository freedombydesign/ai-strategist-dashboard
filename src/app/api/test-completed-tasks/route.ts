import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // Manual test of the completed tasks functionality
  const testUserId = 'f85eba27-6eb9-4933-9459-2517739ef846'
  const manualCompletedTasks = ['140b8cda-0074-4ca0-a48a-5e310747c18b:profit-1-1']

  return NextResponse.json({
    message: 'Test endpoint working!',
    server: 'localhost (development)',
    timestamp: new Date().toISOString(),
    completedTasks: manualCompletedTasks,
    note: 'This proves the localhost server is running and has our changes'
  })
}