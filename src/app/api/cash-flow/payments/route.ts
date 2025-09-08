import { NextRequest, NextResponse } from 'next/server'
import { invoicePaymentTrackingService } from '@/services/invoicePaymentTrackingService'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const invoiceId = searchParams.get('invoiceId')
    const clientId = searchParams.get('clientId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const status = searchParams.get('status')
    const analysisType = searchParams.get('analysisType')

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    // Handle different analysis types
    switch (analysisType) {
      case 'probability':
        return await getPaymentProbabilityAnalysis(userId, invoiceId)
      
      case 'acceleration':
        return await getPaymentAccelerationStrategies(invoiceId)
      
      case 'behavior':
        return await getClientPaymentBehavior(clientId)
      
      case 'dashboard':
        return await getPaymentDashboardData(userId, { startDate, endDate })
      
      default:
        return await getPaymentHistory(userId, { invoiceId, clientId, startDate, endDate, status })
    }

  } catch (error) {
    console.error('[PAYMENTS-API] Error in GET:', error)
    return NextResponse.json({
      error: 'Failed to fetch payment data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type } = body

    switch (type) {
      case 'record_payment':
        return await recordPayment(body)
      
      case 'analyze_probability':
        return await analyzePaymentProbability(body.invoiceId)
      
      case 'generate_strategies':
        return await generateAccelerationStrategies(body.invoiceId)
      
      default:
        return NextResponse.json({ error: 'Invalid operation type' }, { status: 400 })
    }

  } catch (error) {
    console.error('[PAYMENTS-API] Error in POST:', error)
    return NextResponse.json({
      error: 'Failed to process payment operation',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Get payment history with filters
async function getPaymentHistory(userId: string, filters: any) {
  let query = supabase
    .from('cash_flow_payment_history')
    .select(`
      *,
      cash_flow_invoices!inner(
        id,
        invoice_number,
        total_amount,
        user_id,
        cash_flow_clients!inner(
          id,
          name,
          company,
          email
        )
      )
    `)
    .eq('cash_flow_invoices.user_id', userId)
    .order('payment_date', { ascending: false })

  // Apply filters
  if (filters.invoiceId) {
    query = query.eq('invoice_id', filters.invoiceId)
  }

  if (filters.clientId) {
    query = query.eq('cash_flow_invoices.client_id', filters.clientId)
  }

  if (filters.status) {
    query = query.eq('status', filters.status)
  }

  if (filters.startDate) {
    query = query.gte('payment_date', filters.startDate)
  }

  if (filters.endDate) {
    query = query.lte('payment_date', filters.endDate)
  }

  const { data: payments, error } = await query.limit(100)

  if (error) {
    throw new Error(`Failed to fetch payments: ${error.message}`)
  }

  // Calculate summary metrics
  const summary = calculatePaymentSummary(payments || [])

  // Format response
  const formattedPayments = (payments || []).map(payment => ({
    id: payment.id,
    invoiceId: payment.invoice_id,
    invoice: {
      id: payment.cash_flow_invoices.id,
      number: payment.cash_flow_invoices.invoice_number,
      totalAmount: payment.cash_flow_invoices.total_amount,
      client: payment.cash_flow_invoices.cash_flow_clients
    },
    paymentDate: payment.payment_date,
    amount: payment.amount,
    paymentMethod: payment.payment_method,
    reference: payment.reference,
    notes: payment.notes,
    status: payment.status,
    processingFee: payment.processing_fee,
    netAmount: payment.net_amount,
    createdAt: payment.created_at
  }))

  return NextResponse.json({
    payments: formattedPayments,
    summary
  })
}

// Get payment probability analysis
async function getPaymentProbabilityAnalysis(userId: string, invoiceId?: string) {
  if (!invoiceId) {
    return NextResponse.json({ error: 'invoiceId is required for probability analysis' }, { status: 400 })
  }

  // Verify invoice belongs to user
  const { data: invoice, error: invoiceError } = await supabase
    .from('cash_flow_invoices')
    .select('id, user_id')
    .eq('id', invoiceId)
    .eq('user_id', userId)
    .single()

  if (invoiceError || !invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
  }

  const analysis = await invoicePaymentTrackingService.analyzePaymentProbability(invoiceId)

  return NextResponse.json({
    analysis
  })
}

// Get payment acceleration strategies
async function getPaymentAccelerationStrategies(invoiceId?: string) {
  if (!invoiceId) {
    return NextResponse.json({ error: 'invoiceId is required for acceleration strategies' }, { status: 400 })
  }

  const strategies = await invoicePaymentTrackingService.generatePaymentAccelerationStrategies(invoiceId)

  return NextResponse.json({
    strategies
  })
}

// Get client payment behavior analysis
async function getClientPaymentBehavior(clientId?: string) {
  if (!clientId) {
    return NextResponse.json({ error: 'clientId is required for behavior analysis' }, { status: 400 })
  }

  const behavior = await invoicePaymentTrackingService.getClientPaymentBehavior(clientId)

  return NextResponse.json({
    behavior
  })
}

// Get payment dashboard data
async function getPaymentDashboardData(userId: string, filters: { startDate?: string; endDate?: string }) {
  const endDate = filters.endDate || new Date().toISOString().split('T')[0]
  const startDate = filters.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  // Get payment metrics in parallel
  const [
    recentPayments,
    paymentMethods,
    clientRisks,
    overdueInvoices,
    paymentTrends
  ] = await Promise.all([
    getRecentPayments(userId, 10),
    getPaymentMethodAnalysis(userId, startDate, endDate),
    getClientRiskAnalysis(userId),
    getOverdueInvoicesAnalysis(userId),
    getPaymentTrendAnalysis(userId, startDate, endDate)
  ])

  return NextResponse.json({
    dashboard: {
      recentPayments,
      paymentMethods,
      clientRisks,
      overdueInvoices,
      paymentTrends,
      dateRange: { startDate, endDate }
    }
  })
}

// Record a new payment
async function recordPayment(data: any) {
  const requiredFields = ['invoiceId', 'amount', 'paymentDate', 'paymentMethod']
  const missingFields = requiredFields.filter(field => !data[field])
  
  if (missingFields.length > 0) {
    return NextResponse.json({
      error: 'Missing required fields',
      missingFields
    }, { status: 400 })
  }

  const result = await invoicePaymentTrackingService.recordPayment({
    invoiceId: data.invoiceId,
    paymentDate: data.paymentDate,
    amount: parseFloat(data.amount),
    paymentMethod: data.paymentMethod,
    reference: data.reference,
    notes: data.notes,
    status: data.status || 'completed',
    processingFee: data.processingFee ? parseFloat(data.processingFee) : undefined,
    netAmount: data.netAmount ? parseFloat(data.netAmount) : undefined
  })

  if (!result.success) {
    return NextResponse.json({
      error: result.error
    }, { status: 400 })
  }

  return NextResponse.json({
    success: true,
    payment: result.payment
  }, { status: 201 })
}

// Analyze payment probability for an invoice
async function analyzePaymentProbability(invoiceId: string) {
  const analysis = await invoicePaymentTrackingService.analyzePaymentProbability(invoiceId)
  
  return NextResponse.json({
    analysis
  })
}

// Generate payment acceleration strategies
async function generateAccelerationStrategies(invoiceId: string) {
  const strategies = await invoicePaymentTrackingService.generatePaymentAccelerationStrategies(invoiceId)
  
  return NextResponse.json({
    strategies
  })
}

// Helper functions
async function getRecentPayments(userId: string, limit: number) {
  const { data: payments, error } = await supabase
    .from('cash_flow_payment_history')
    .select(`
      *,
      cash_flow_invoices!inner(
        invoice_number,
        user_id,
        cash_flow_clients!inner(name, company)
      )
    `)
    .eq('cash_flow_invoices.user_id', userId)
    .eq('status', 'completed')
    .order('payment_date', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching recent payments:', error)
    return []
  }

  return (payments || []).map(payment => ({
    id: payment.id,
    invoiceNumber: payment.cash_flow_invoices.invoice_number,
    clientName: payment.cash_flow_invoices.cash_flow_clients.name,
    clientCompany: payment.cash_flow_invoices.cash_flow_clients.company,
    amount: payment.amount,
    paymentDate: payment.payment_date,
    paymentMethod: payment.payment_method,
    reference: payment.reference
  }))
}

async function getPaymentMethodAnalysis(userId: string, startDate: string, endDate: string) {
  const { data: payments, error } = await supabase
    .from('cash_flow_payment_history')
    .select(`
      payment_method,
      amount,
      processing_fee,
      cash_flow_invoices!inner(user_id)
    `)
    .eq('cash_flow_invoices.user_id', userId)
    .eq('status', 'completed')
    .gte('payment_date', startDate)
    .lte('payment_date', endDate)

  if (error) {
    console.error('Error fetching payment methods:', error)
    return {}
  }

  const analysis = (payments || []).reduce((acc, payment) => {
    const method = payment.payment_method
    if (!acc[method]) {
      acc[method] = { count: 0, totalAmount: 0, totalFees: 0 }
    }
    
    acc[method].count++
    acc[method].totalAmount += payment.amount
    acc[method].totalFees += payment.processing_fee || 0
    
    return acc
  }, {} as Record<string, any>)

  // Calculate percentages and averages
  const total = Object.values(analysis).reduce((sum: number, method: any) => sum + method.totalAmount, 0)
  
  Object.keys(analysis).forEach(method => {
    analysis[method].percentage = total > 0 ? (analysis[method].totalAmount / total) * 100 : 0
    analysis[method].avgAmount = analysis[method].count > 0 ? analysis[method].totalAmount / analysis[method].count : 0
    analysis[method].avgFee = analysis[method].count > 0 ? analysis[method].totalFees / analysis[method].count : 0
  })

  return analysis
}

async function getClientRiskAnalysis(userId: string) {
  // Get all clients with their payment behavior
  const { data: clients, error } = await supabase
    .from('cash_flow_clients')
    .select('id, name, company')
    .eq('user_id', userId)
    .limit(50)

  if (error) {
    console.error('Error fetching clients for risk analysis:', error)
    return []
  }

  const clientRisks = await Promise.all(
    (clients || []).map(async (client) => {
      const behavior = await invoicePaymentTrackingService.getClientPaymentBehavior(client.id)
      return {
        clientId: client.id,
        name: client.name,
        company: client.company,
        riskLevel: behavior.riskLevel,
        paymentReliabilityScore: behavior.paymentReliabilityScore,
        averagePaymentDays: behavior.averagePaymentDays,
        totalInvoicesIssued: behavior.totalInvoicesIssued,
        totalInvoicesPaid: behavior.totalInvoicesPaid
      }
    })
  )

  // Sort by risk (critical first) and limit to top 20
  return clientRisks
    .sort((a, b) => {
      const riskOrder = { critical: 4, high: 3, medium: 2, low: 1 }
      return riskOrder[b.riskLevel] - riskOrder[a.riskLevel] || b.averagePaymentDays - a.averagePaymentDays
    })
    .slice(0, 20)
}

async function getOverdueInvoicesAnalysis(userId: string) {
  const { data: overdueInvoices, error } = await supabase
    .from('cash_flow_invoices')
    .select(`
      id,
      invoice_number,
      total_amount,
      due_date,
      status,
      cash_flow_clients!inner(name, company)
    `)
    .eq('user_id', userId)
    .eq('status', 'overdue')
    .order('due_date', { ascending: true })
    .limit(50)

  if (error) {
    console.error('Error fetching overdue invoices:', error)
    return []
  }

  const now = new Date()
  
  return (overdueInvoices || []).map(invoice => {
    const daysOverdue = Math.ceil((now.getTime() - new Date(invoice.due_date).getTime()) / (1000 * 60 * 60 * 24))
    
    return {
      id: invoice.id,
      invoiceNumber: invoice.invoice_number,
      clientName: invoice.cash_flow_clients.name,
      clientCompany: invoice.cash_flow_clients.company,
      amount: invoice.total_amount,
      dueDate: invoice.due_date,
      daysOverdue,
      urgency: daysOverdue > 60 ? 'critical' : daysOverdue > 30 ? 'high' : 'medium'
    }
  })
}

async function getPaymentTrendAnalysis(userId: string, startDate: string, endDate: string) {
  const { data: payments, error } = await supabase
    .from('cash_flow_payment_history')
    .select(`
      payment_date,
      amount,
      cash_flow_invoices!inner(user_id, issue_date)
    `)
    .eq('cash_flow_invoices.user_id', userId)
    .eq('status', 'completed')
    .gte('payment_date', startDate)
    .lte('payment_date', endDate)
    .order('payment_date')

  if (error) {
    console.error('Error fetching payment trends:', error)
    return { dailyTrends: [], weeklyTrends: [] }
  }

  // Group by date
  const dailyTrends = (payments || []).reduce((acc, payment) => {
    const date = payment.payment_date
    if (!acc[date]) {
      acc[date] = { date, count: 0, amount: 0 }
    }
    acc[date].count++
    acc[date].amount += payment.amount
    return acc
  }, {} as Record<string, any>)

  // Group by week
  const weeklyTrends = Object.values(dailyTrends).reduce((acc, day: any) => {
    const date = new Date(day.date)
    const weekStart = new Date(date)
    weekStart.setDate(date.getDate() - date.getDay()) // Start of week (Sunday)
    const weekKey = weekStart.toISOString().split('T')[0]
    
    if (!acc[weekKey]) {
      acc[weekKey] = { week: weekKey, count: 0, amount: 0, days: 0 }
    }
    acc[weekKey].count += day.count
    acc[weekKey].amount += day.amount
    acc[weekKey].days++
    
    return acc
  }, {} as Record<string, any>)

  return {
    dailyTrends: Object.values(dailyTrends).sort((a: any, b: any) => a.date.localeCompare(b.date)),
    weeklyTrends: Object.values(weeklyTrends).sort((a: any, b: any) => a.week.localeCompare(b.week))
  }
}

function calculatePaymentSummary(payments: any[]) {
  const completed = payments.filter(p => p.status === 'completed')
  const pending = payments.filter(p => p.status === 'pending')
  const failed = payments.filter(p => p.status === 'failed')

  const totalAmount = completed.reduce((sum, p) => sum + p.amount, 0)
  const totalFees = completed.reduce((sum, p) => sum + (p.processing_fee || 0), 0)
  const netAmount = totalAmount - totalFees

  // Payment method breakdown
  const methodBreakdown = completed.reduce((acc, payment) => {
    const method = payment.payment_method
    if (!acc[method]) {
      acc[method] = { count: 0, amount: 0 }
    }
    acc[method].count++
    acc[method].amount += payment.amount
    return acc
  }, {} as Record<string, any>)

  return {
    total: {
      count: payments.length,
      amount: totalAmount,
      fees: totalFees,
      netAmount
    },
    byStatus: {
      completed: { count: completed.length, amount: completed.reduce((sum, p) => sum + p.amount, 0) },
      pending: { count: pending.length, amount: pending.reduce((sum, p) => sum + p.amount, 0) },
      failed: { count: failed.length, amount: failed.reduce((sum, p) => sum + p.amount, 0) }
    },
    methodBreakdown,
    avgPaymentAmount: completed.length > 0 ? totalAmount / completed.length : 0,
    avgProcessingFee: completed.length > 0 ? totalFees / completed.length : 0
  }
}