import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { hubspotIntegrationService } from '@/services/hubspotIntegrationService'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const leadId = searchParams.get('leadId')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '25')
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    let query = supabase
      .from('convert_flow_proposals')
      .select(`
        *,
        convert_flow_leads!inner(
          id,
          first_name,
          last_name,
          email,
          company,
          phone
        )
      `, { count: 'exact' })

    // Apply filters
    if (leadId) {
      query = query.eq('lead_id', leadId)
    }

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    // Apply sorting
    const validSortColumns = ['created_at', 'updated_at', 'total_amount', 'valid_until', 'proposal_number']
    if (validSortColumns.includes(sortBy)) {
      query = query.order(sortBy, { ascending: sortOrder === 'asc' })
    }

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data: proposals, error, count } = await query

    if (error) {
      console.error('[CONVERT-FLOW] Error fetching proposals:', error)
      return NextResponse.json({ error: 'Failed to fetch proposals' }, { status: 500 })
    }

    // Calculate proposal analytics
    const analytics = await calculateProposalAnalytics()

    return NextResponse.json({
      proposals: proposals || [],
      pagination: {
        total: count || 0,
        page,
        limit,
        pages: Math.ceil((count || 0) / limit)
      },
      analytics
    })

  } catch (error) {
    console.error('[CONVERT-FLOW] Unexpected error fetching proposals:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const proposalData = await request.json()

    // Validate required fields
    const requiredFields = ['lead_id', 'title', 'line_items']
    for (const field of requiredFields) {
      if (!proposalData[field]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 })
      }
    }

    // Validate lead exists
    const { data: lead, error: leadError } = await supabase
      .from('convert_flow_leads')
      .select('id, first_name, last_name, company')
      .eq('id', proposalData.lead_id)
      .single()

    if (leadError || !lead) {
      return NextResponse.json({ error: 'Invalid lead_id' }, { status: 400 })
    }

    // Calculate totals from line items
    const { subtotal, tax_amount, discount_amount, total_amount } = calculateProposalTotals(
      proposalData.line_items,
      proposalData.tax_rate || 0,
      proposalData.discount_amount || 0
    )

    // Generate proposal number
    const proposalNumber = await generateProposalNumber()

    // Set default valid until date (30 days from now)
    const validUntil = proposalData.valid_until || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    // Create proposal
    const { data: newProposal, error } = await supabase
      .from('convert_flow_proposals')
      .insert({
        ...proposalData,
        proposal_number: proposalNumber,
        subtotal,
        tax_amount,
        discount_amount,
        total_amount,
        valid_until: validUntil,
        status: 'draft',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select(`
        *,
        convert_flow_leads!inner(*)
      `)
      .single()

    if (error) {
      console.error('[CONVERT-FLOW] Error creating proposal:', error)
      return NextResponse.json({ error: 'Failed to create proposal' }, { status: 500 })
    }

    // Update lead stage if it's still in early stages
    if (lead && ['new', 'contacted', 'qualified'].includes(lead.stage)) {
      await supabase
        .from('convert_flow_leads')
        .update({ 
          stage: 'proposal',
          estimated_value: total_amount,
          updated_at: new Date().toISOString()
        })
        .eq('id', proposalData.lead_id)
    }

    // Log activity
    await supabase
      .from('convert_flow_lead_activities')
      .insert({
        lead_id: proposalData.lead_id,
        activity_type: 'proposal_created',
        activity_data: { 
          proposal_id: newProposal.id,
          proposal_number: proposalNumber,
          total_amount
        },
        score_change: 20, // Bonus for reaching proposal stage
        created_at: new Date().toISOString()
      })

    return NextResponse.json({
      proposal: newProposal,
      message: 'Proposal created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('[CONVERT-FLOW] Unexpected error creating proposal:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Calculate proposal totals from line items
function calculateProposalTotals(
  lineItems: any[], 
  taxRate: number = 0, 
  discountAmount: number = 0
) {
  const subtotal = lineItems.reduce((sum, item) => {
    return sum + ((item.quantity || 1) * (item.unit_price || 0))
  }, 0)

  const tax_amount = subtotal * (taxRate / 100)
  const total_amount = subtotal + tax_amount - discountAmount

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    tax_amount: Math.round(tax_amount * 100) / 100,
    discount_amount: discountAmount,
    total_amount: Math.round(total_amount * 100) / 100
  }
}

// Generate unique proposal number
async function generateProposalNumber(): Promise<string> {
  const year = new Date().getFullYear()
  const month = String(new Date().getMonth() + 1).padStart(2, '0')
  
  // Get the count of proposals this month
  const startOfMonth = `${year}-${month}-01`
  const endOfMonth = `${year}-${month}-31`
  
  const { count } = await supabase
    .from('convert_flow_proposals')
    .select('id', { count: 'exact' })
    .gte('created_at', startOfMonth)
    .lte('created_at', endOfMonth)

  const sequence = String((count || 0) + 1).padStart(3, '0')
  return `PROP-${year}${month}-${sequence}`
}

// Calculate proposal analytics
async function calculateProposalAnalytics() {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

    // Get all proposals for analytics
    const { data: allProposals } = await supabase
      .from('convert_flow_proposals')
      .select('status, total_amount, created_at, sent_at, responded_at')

    // Get recent proposals
    const { data: recentProposals } = await supabase
      .from('convert_flow_proposals')
      .select('status, total_amount, created_at')
      .gte('created_at', thirtyDaysAgo)

    const totalProposals = allProposals?.length || 0
    const recentProposalCount = recentProposals?.length || 0

    // Status distribution
    const statusDistribution = allProposals?.reduce((acc, proposal) => {
      acc[proposal.status] = (acc[proposal.status] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    // Calculate win rate (accepted proposals)
    const acceptedProposals = allProposals?.filter(p => p.status === 'accepted').length || 0
    const sentProposals = allProposals?.filter(p => ['sent', 'viewed', 'accepted', 'rejected'].includes(p.status)).length || 0
    const winRate = sentProposals > 0 ? (acceptedProposals / sentProposals) * 100 : 0

    // Calculate average proposal value
    const totalValue = allProposals?.reduce((sum, p) => sum + (p.total_amount || 0), 0) || 0
    const avgProposalValue = totalProposals > 0 ? totalValue / totalProposals : 0

    // Calculate average response time (for responded proposals)
    const respondedProposals = allProposals?.filter(p => p.sent_at && p.responded_at) || []
    const avgResponseTime = respondedProposals.length > 0
      ? respondedProposals.reduce((sum, p) => {
          const sentTime = new Date(p.sent_at).getTime()
          const respondedTime = new Date(p.responded_at).getTime()
          return sum + (respondedTime - sentTime)
        }, 0) / respondedProposals.length
      : 0

    // Convert to days
    const avgResponseDays = avgResponseTime > 0 ? Math.round(avgResponseTime / (1000 * 60 * 60 * 24)) : 0

    // Pipeline value (pending proposals)
    const pipelineValue = allProposals
      ?.filter(p => ['draft', 'sent', 'viewed'].includes(p.status))
      ?.reduce((sum, p) => sum + (p.total_amount || 0), 0) || 0

    return {
      totalProposals,
      recentProposals: recentProposalCount,
      winRate: Math.round(winRate * 100) / 100,
      avgProposalValue: Math.round(avgProposalValue * 100) / 100,
      avgResponseDays,
      pipelineValue: Math.round(pipelineValue * 100) / 100,
      statusDistribution
    }

  } catch (error) {
    console.error('[CONVERT-FLOW] Error calculating proposal analytics:', error)
    return {
      totalProposals: 0,
      recentProposals: 0,
      winRate: 0,
      avgProposalValue: 0,
      avgResponseDays: 0,
      pipelineValue: 0,
      statusDistribution: {}
    }
  }
}