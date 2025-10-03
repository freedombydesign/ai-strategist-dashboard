// Marketing Spend Management API
// Manual marketing spend entry and retrieval

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Get manual marketing spend settings
    const { data: settings, error: settingsError } = await supabase
      .from('user_marketing_settings')
      .select('*')
      .eq('user_email', userId)
      .single()

    if (settingsError && settingsError.code !== 'PGRST116') {
      throw settingsError
    }

    // Get total from marketing_costs table (includes Facebook, Google, etc.)
    const { data: marketingCosts, error: costsError } = await supabase
      .from('marketing_costs')
      .select('amount')
      .eq('user_id', userId)

    if (costsError) throw costsError

    const totalFromIntegrations = marketingCosts?.reduce((sum, cost) => sum + cost.amount, 0) || 0
    const manualSpend = settings?.manual_monthly_spend || 0
    const totalSpend = manualSpend + totalFromIntegrations

    return NextResponse.json({
      success: true,
      data: {
        manualSpend,
        integrationSpend: totalFromIntegrations,
        totalSpend,
        hasManualSpend: manualSpend > 0,
        hasIntegrations: totalFromIntegrations > 0
      }
    })

  } catch (error) {
    console.error('Get marketing spend error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch marketing spend',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, manualMonthlySpend } = body

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    if (typeof manualMonthlySpend !== 'number' || manualMonthlySpend < 0) {
      return NextResponse.json({
        error: 'Valid manual monthly spend amount is required'
      }, { status: 400 })
    }

    // Upsert manual marketing spend
    const { error } = await supabase
      .from('user_marketing_settings')
      .upsert({
        user_email: userId,
        manual_monthly_spend: manualMonthlySpend,
        updated_at: new Date().toISOString()
      })

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: 'Manual marketing spend saved successfully',
      data: {
        manualMonthlySpend
      }
    })

  } catch (error) {
    console.error('Save marketing spend error:', error)
    return NextResponse.json(
      {
        error: 'Failed to save marketing spend',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
