import { NextRequest, NextResponse } from 'next/server'
import { invoicePaymentTrackingService } from '@/services/invoicePaymentTrackingService'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const clientId = searchParams.get('clientId')
    const status = searchParams.get('status')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const includeAnalytics = searchParams.get('includeAnalytics') === 'true'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    // Build query
    let query = supabase
      .from('cash_flow_invoices')
      .select(`
        *,
        cash_flow_clients!inner(
          id,
          name,
          company,
          email,
          industry,
          payment_terms as client_payment_terms
        ),
        cash_flow_payment_history(*),
        cash_flow_invoice_line_items(*),
        ${includeAnalytics ? 'cash_flow_payment_predictions(*)' : ''}
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    // Apply filters
    if (clientId) {
      query = query.eq('client_id', clientId)
    }

    if (status) {
      query = query.eq('status', status)
    }

    if (startDate) {
      query = query.gte('issue_date', startDate)
    }

    if (endDate) {
      query = query.lte('issue_date', endDate)
    }

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data: invoices, error, count } = await query

    if (error) {
      throw new Error(`Failed to fetch invoices: ${error.message}`)
    }

    // Get summary metrics
    const summaryQuery = supabase
      .from('cash_flow_invoices')
      .select('id, status, total_amount, due_date, issue_date')
      .eq('user_id', userId)

    if (clientId) summaryQuery.eq('client_id', clientId)
    if (status) summaryQuery.eq('status', status)
    if (startDate) summaryQuery.gte('issue_date', startDate)
    if (endDate) summaryQuery.lte('issue_date', endDate)

    const { data: allInvoices, error: summaryError } = await summaryQuery

    if (summaryError) {
      console.error('[INVOICES-API] Error fetching summary:', summaryError)
    }

    // Calculate summary metrics
    const summary = calculateInvoiceSummary(allInvoices || [])

    // Format response data
    const formattedInvoices = (invoices || []).map(invoice => ({
      id: invoice.id,
      invoiceNumber: invoice.invoice_number,
      clientId: invoice.client_id,
      client: {
        id: invoice.cash_flow_clients.id,
        name: invoice.cash_flow_clients.name,
        company: invoice.cash_flow_clients.company,
        email: invoice.cash_flow_clients.email,
        industry: invoice.cash_flow_clients.industry
      },
      description: invoice.description,
      totalAmount: invoice.total_amount,
      taxAmount: invoice.tax_amount,
      subtotalAmount: invoice.subtotal_amount,
      issueDate: invoice.issue_date,
      dueDate: invoice.due_date,
      status: invoice.status,
      paymentTerms: invoice.payment_terms,
      currency: invoice.currency,
      recurringSchedule: invoice.recurring_schedule,
      lineItems: invoice.cash_flow_invoice_line_items || [],
      paymentHistory: invoice.cash_flow_payment_history || [],
      analytics: includeAnalytics ? invoice.cash_flow_payment_predictions?.[0] : undefined,
      createdAt: invoice.created_at,
      updatedAt: invoice.updated_at,
      // Calculated fields
      totalPaid: (invoice.cash_flow_payment_history || [])
        .filter((p: any) => p.status === 'completed')
        .reduce((sum: number, p: any) => sum + p.amount, 0),
      outstandingAmount: invoice.total_amount - (invoice.cash_flow_payment_history || [])
        .filter((p: any) => p.status === 'completed')
        .reduce((sum: number, p: any) => sum + p.amount, 0),
      daysOverdue: invoice.status === 'overdue' 
        ? Math.ceil((Date.now() - new Date(invoice.due_date).getTime()) / (1000 * 60 * 60 * 24))
        : 0
    }))

    return NextResponse.json({
      invoices: formattedInvoices,
      summary,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    console.error('[INVOICES-API] Error fetching invoices:', error)
    return NextResponse.json({
      error: 'Failed to fetch invoices',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    const requiredFields = ['userId', 'clientId', 'description', 'lineItems', 'issueDate', 'dueDate', 'paymentTerms']
    const missingFields = requiredFields.filter(field => !body[field])
    
    if (missingFields.length > 0) {
      return NextResponse.json({
        error: 'Missing required fields',
        missingFields
      }, { status: 400 })
    }

    // Create invoice
    const result = await invoicePaymentTrackingService.createInvoice({
      userId: body.userId,
      clientId: body.clientId,
      invoiceNumber: body.invoiceNumber, // Optional, will be generated if not provided
      description: body.description,
      totalAmount: body.totalAmount || 0, // Will be calculated
      taxAmount: body.taxAmount || 0,
      subtotalAmount: body.subtotalAmount || 0, // Will be calculated
      issueDate: body.issueDate,
      dueDate: body.dueDate,
      status: body.status || 'draft',
      paymentTerms: body.paymentTerms,
      currency: body.currency || 'USD',
      recurringSchedule: body.recurringSchedule,
      projectId: body.projectId,
      lineItems: body.lineItems.map((item: any) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice || (item.quantity * item.unitPrice),
        taxRate: item.taxRate,
        category: item.category
      })),
      paymentHistory: []
    })

    if (!result.success) {
      return NextResponse.json({
        error: result.error
      }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      invoice: result.invoice
    }, { status: 201 })

  } catch (error) {
    console.error('[INVOICES-API] Error creating invoice:', error)
    return NextResponse.json({
      error: 'Failed to create invoice',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id: invoiceId, ...updateData } = body

    if (!invoiceId) {
      return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 })
    }

    // Update invoice
    const { data: invoice, error: updateError } = await supabase
      .from('cash_flow_invoices')
      .update({
        description: updateData.description,
        total_amount: updateData.totalAmount,
        tax_amount: updateData.taxAmount,
        subtotal_amount: updateData.subtotalAmount,
        due_date: updateData.dueDate,
        status: updateData.status,
        payment_terms: updateData.paymentTerms,
        currency: updateData.currency,
        recurring_schedule: updateData.recurringSchedule,
        updated_at: new Date().toISOString()
      })
      .eq('id', invoiceId)
      .select()
      .single()

    if (updateError) {
      throw new Error(`Failed to update invoice: ${updateError.message}`)
    }

    // Update line items if provided
    if (updateData.lineItems) {
      // Delete existing line items
      await supabase
        .from('cash_flow_invoice_line_items')
        .delete()
        .eq('invoice_id', invoiceId)

      // Insert new line items
      const lineItemsWithInvoiceId = updateData.lineItems.map((item: any) => ({
        invoice_id: invoiceId,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total_price: item.totalPrice || (item.quantity * item.unitPrice),
        tax_rate: item.taxRate,
        category: item.category
      }))

      await supabase
        .from('cash_flow_invoice_line_items')
        .insert(lineItemsWithInvoiceId)
    }

    // Re-analyze payment probability
    await invoicePaymentTrackingService.analyzePaymentProbability(invoiceId)

    return NextResponse.json({
      success: true,
      invoice: {
        ...invoice,
        id: invoiceId
      }
    })

  } catch (error) {
    console.error('[INVOICES-API] Error updating invoice:', error)
    return NextResponse.json({
      error: 'Failed to update invoice',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const invoiceId = searchParams.get('id')

    if (!invoiceId) {
      return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 })
    }

    // Check if invoice has payments
    const { data: payments, error: paymentsError } = await supabase
      .from('cash_flow_payment_history')
      .select('id')
      .eq('invoice_id', invoiceId)
      .limit(1)

    if (paymentsError) {
      throw new Error(`Failed to check payments: ${paymentsError.message}`)
    }

    if (payments && payments.length > 0) {
      return NextResponse.json({
        error: 'Cannot delete invoice with payment history'
      }, { status: 400 })
    }

    // Delete line items first
    await supabase
      .from('cash_flow_invoice_line_items')
      .delete()
      .eq('invoice_id', invoiceId)

    // Delete payment predictions
    await supabase
      .from('cash_flow_payment_predictions')
      .delete()
      .eq('invoice_id', invoiceId)

    // Delete invoice
    const { error: deleteError } = await supabase
      .from('cash_flow_invoices')
      .delete()
      .eq('id', invoiceId)

    if (deleteError) {
      throw new Error(`Failed to delete invoice: ${deleteError.message}`)
    }

    return NextResponse.json({
      success: true,
      message: 'Invoice deleted successfully'
    })

  } catch (error) {
    console.error('[INVOICES-API] Error deleting invoice:', error)
    return NextResponse.json({
      error: 'Failed to delete invoice',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Helper function to calculate invoice summary
function calculateInvoiceSummary(invoices: any[]) {
  const now = new Date()
  
  const summary = {
    total: {
      count: invoices.length,
      amount: invoices.reduce((sum, inv) => sum + inv.total_amount, 0)
    },
    byStatus: {
      draft: { count: 0, amount: 0 },
      pending: { count: 0, amount: 0 },
      sent: { count: 0, amount: 0 },
      viewed: { count: 0, amount: 0 },
      partial_payment: { count: 0, amount: 0 },
      paid: { count: 0, amount: 0 },
      overdue: { count: 0, amount: 0 },
      cancelled: { count: 0, amount: 0 }
    },
    outstanding: {
      count: 0,
      amount: 0
    },
    overdue: {
      count: 0,
      amount: 0,
      avgDaysOverdue: 0
    },
    thisMonth: {
      issued: { count: 0, amount: 0 },
      paid: { count: 0, amount: 0 }
    }
  }

  let totalOverdueDays = 0

  invoices.forEach(invoice => {
    // Count by status
    if (summary.byStatus[invoice.status as keyof typeof summary.byStatus]) {
      summary.byStatus[invoice.status as keyof typeof summary.byStatus].count++
      summary.byStatus[invoice.status as keyof typeof summary.byStatus].amount += invoice.total_amount
    }

    // Outstanding invoices
    if (['pending', 'sent', 'viewed', 'partial_payment', 'overdue'].includes(invoice.status)) {
      summary.outstanding.count++
      summary.outstanding.amount += invoice.total_amount
    }

    // Overdue analysis
    if (invoice.status === 'overdue') {
      const daysOverdue = Math.ceil((now.getTime() - new Date(invoice.due_date).getTime()) / (1000 * 60 * 60 * 24))
      summary.overdue.count++
      summary.overdue.amount += invoice.total_amount
      totalOverdueDays += daysOverdue
    }

    // This month analysis
    const issueDate = new Date(invoice.issue_date)
    if (issueDate.getMonth() === now.getMonth() && issueDate.getFullYear() === now.getFullYear()) {
      summary.thisMonth.issued.count++
      summary.thisMonth.issued.amount += invoice.total_amount
      
      if (invoice.status === 'paid') {
        summary.thisMonth.paid.count++
        summary.thisMonth.paid.amount += invoice.total_amount
      }
    }
  })

  // Calculate average days overdue
  summary.overdue.avgDaysOverdue = summary.overdue.count > 0 
    ? Math.round(totalOverdueDays / summary.overdue.count)
    : 0

  // Round amounts to 2 decimal places
  const roundAmount = (obj: any) => {
    if (typeof obj === 'object') {
      Object.keys(obj).forEach(key => {
        if (key === 'amount') {
          obj[key] = Math.round(obj[key] * 100) / 100
        } else if (typeof obj[key] === 'object') {
          roundAmount(obj[key])
        }
      })
    }
  }

  roundAmount(summary)
  
  return summary
}