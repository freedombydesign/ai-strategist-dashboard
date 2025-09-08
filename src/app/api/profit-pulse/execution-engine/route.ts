// ProfitPulse API - Execution Action Engine Endpoints
// Automated business action execution and management

import { NextRequest, NextResponse } from 'next/server'
import { executionActionEngineService } from '@/services/executionActionEngineService'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const action = searchParams.get('action')
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    switch (action) {
      case 'dashboard':
        const startDate = searchParams.get('startDate')
        const endDate = searchParams.get('endDate')
        const actionType = searchParams.get('actionType')

        const dashboard = await executionActionEngineService
          .getExecutionDashboard(userId, {
            startDate: startDate || undefined,
            endDate: endDate || undefined,
            actionType: actionType as any
          })

        return NextResponse.json({
          success: true,
          data: dashboard,
          timestamp: new Date().toISOString()
        })

      case 'business_impact':
        const period = searchParams.get('period') || 'quarter'
        const impactReport = await executionActionEngineService
          .getBusinessImpactReport(userId, period)

        return NextResponse.json({
          success: true,
          data: impactReport,
          timestamp: new Date().toISOString()
        })

      default:
        return NextResponse.json({ error: 'Invalid action parameter' }, { status: 400 })
    }

  } catch (error) {
    console.error('Execution Engine API error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch execution engine data',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, userId } = body
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    switch (action) {
      case 'create_action':
        const { actionType, trigger, configuration, context, automation } = body
        
        const executionAction = await executionActionEngineService
          .createExecutionAction(userId, {
            actionType,
            trigger,
            configuration,
            context,
            automation
          })

        return NextResponse.json({
          success: true,
          data: executionAction,
          message: 'Execution action created successfully',
          timestamp: new Date().toISOString()
        })

      case 'execute_action':
        const { actionId } = body
        
        if (!actionId) {
          return NextResponse.json({ error: 'Action ID is required' }, { status: 400 })
        }

        const executionResult = await executionActionEngineService
          .executeAction(userId, actionId)

        return NextResponse.json({
          success: true,
          data: executionResult,
          message: 'Action executed successfully',
          timestamp: new Date().toISOString()
        })

      default:
        return NextResponse.json({ error: 'Invalid action parameter' }, { status: 400 })
    }

  } catch (error) {
    console.error('Execution Engine POST API error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to process execution engine request',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}