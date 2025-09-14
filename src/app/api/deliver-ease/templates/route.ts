import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const serviceType = searchParams.get('serviceType')
    const industry = searchParams.get('industry')
    
    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let query = supabase
      .from('delivery_templates')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('usage_count', { ascending: false })

    if (serviceType) {
      query = query.eq('service_type', serviceType)
    }
    
    if (industry) {
      query = query.eq('industry_vertical', industry)
    }

    const { data: templates, error } = await query

    if (error) {
      console.error('Error fetching templates:', error)
      return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 })
    }

    return NextResponse.json({ templates })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validate required fields
    const requiredFields = ['template_name', 'service_type', 'phases_config', 'tasks_template', 'estimated_duration_days']
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 })
      }
    }

    // Create delivery template with sophisticated configuration
    const templateData = {
      user_id: user.id,
      template_name: body.template_name,
      service_type: body.service_type,
      industry_vertical: body.industry_vertical || null,
      methodology: body.methodology || 'hybrid',
      estimated_duration_days: body.estimated_duration_days,
      complexity_level: body.complexity_level || 'medium',
      phases_config: body.phases_config, // Detailed phase definitions
      tasks_template: body.tasks_template, // Template task structure
      deliverables_config: body.deliverables_config || [],
      quality_gates: body.quality_gates || [],
      base_price: body.base_price || null,
      pricing_model: body.pricing_model || 'fixed',
      estimated_hours: body.estimated_hours || null,
      auto_assign_rules: body.auto_assign_rules || {},
      communication_templates: body.communication_templates || {},
      escalation_rules: body.escalation_rules || {},
      created_by: user.id,
      version: '1.0'
    }

    const { data: template, error } = await supabase
      .from('delivery_templates')
      .insert(templateData)
      .select()
      .single()

    if (error) {
      console.error('Error creating template:', error)
      return NextResponse.json({ error: 'Failed to create template' }, { status: 500 })
    }

    return NextResponse.json({ 
      template,
      message: 'Delivery template created successfully' 
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { template_id, ...updateData } = body
    
    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!template_id) {
      return NextResponse.json({ error: 'Template ID required' }, { status: 400 })
    }

    // Update template with version increment
    const { data: currentTemplate } = await supabase
      .from('delivery_templates')
      .select('version')
      .eq('id', template_id)
      .eq('user_id', user.id)
      .single()

    if (!currentTemplate) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    // Increment version
    const currentVersion = parseFloat(currentTemplate.version || '1.0')
    const newVersion = (currentVersion + 0.1).toFixed(1)

    const { data: template, error } = await supabase
      .from('delivery_templates')
      .update({
        ...updateData,
        version: newVersion,
        updated_at: new Date().toISOString()
      })
      .eq('id', template_id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating template:', error)
      return NextResponse.json({ error: 'Failed to update template' }, { status: 500 })
    }

    return NextResponse.json({ 
      template,
      message: 'Template updated successfully' 
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Get pre-built industry templates for quick setup
export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    
    if (action === 'get_prebuilt') {
      // Return pre-built templates for different service types
      const prebuiltTemplates = [
        {
          id: 'consulting-strategic',
          template_name: 'Strategic Business Consulting',
          service_type: 'consulting',
          industry_vertical: 'business_consulting',
          methodology: 'waterfall',
          estimated_duration_days: 90,
          complexity_level: 'complex',
          phases_config: [
            {
              phase_name: 'Discovery & Assessment',
              duration_days: 14,
              description: 'Deep dive into current state analysis',
              key_activities: ['Stakeholder interviews', 'Process mapping', 'SWOT analysis', 'Competitive landscape'],
              deliverables: ['Current State Report', 'Gap Analysis', 'Stakeholder Map']
            },
            {
              phase_name: 'Strategy Development',
              duration_days: 21,
              description: 'Develop comprehensive strategic roadmap',
              key_activities: ['Market analysis', 'Strategic planning', 'Financial modeling', 'Risk assessment'],
              deliverables: ['Strategic Plan', 'Financial Projections', 'Implementation Roadmap']
            },
            {
              phase_name: 'Implementation Planning',
              duration_days: 14,
              description: 'Detailed execution planning',
              key_activities: ['Project planning', 'Resource allocation', 'Timeline development', 'Success metrics'],
              deliverables: ['Implementation Plan', 'Resource Plan', 'Success Metrics Dashboard']
            },
            {
              phase_name: 'Execution Support',
              duration_days: 28,
              description: 'Guide implementation and measure progress',
              key_activities: ['Progress monitoring', 'Issue resolution', 'Team coaching', 'Performance tracking'],
              deliverables: ['Progress Reports', 'Issue Logs', 'Performance Dashboard']
            },
            {
              phase_name: 'Review & Optimization',
              duration_days: 13,
              description: 'Evaluate results and optimize approach',
              key_activities: ['Results analysis', 'Process optimization', 'Lessons learned', 'Future planning'],
              deliverables: ['Final Report', 'Optimization Recommendations', 'Future Roadmap']
            }
          ],
          tasks_template: [
            { task_type: 'research', estimated_hours: 8, skill_requirements: ['analysis', 'research'] },
            { task_type: 'analysis', estimated_hours: 12, skill_requirements: ['analysis', 'strategic_thinking'] },
            { task_type: 'planning', estimated_hours: 16, skill_requirements: ['planning', 'project_management'] },
            { task_type: 'documentation', estimated_hours: 6, skill_requirements: ['writing', 'documentation'] },
            { task_type: 'presentation', estimated_hours: 4, skill_requirements: ['presentation', 'communication'] }
          ],
          quality_gates: [
            { gate_name: 'Discovery Review', phase: 'Discovery & Assessment', criteria: ['Data completeness', 'Stakeholder sign-off'] },
            { gate_name: 'Strategy Approval', phase: 'Strategy Development', criteria: ['Executive approval', 'Budget alignment'] },
            { gate_name: 'Implementation Ready', phase: 'Implementation Planning', criteria: ['Resource confirmation', 'Timeline approval'] },
            { gate_name: 'Progress Checkpoint', phase: 'Execution Support', criteria: ['Milestone completion', 'KPI tracking'] },
            { gate_name: 'Final Delivery', phase: 'Review & Optimization', criteria: ['Results validation', 'Client satisfaction'] }
          ],
          base_price: 75000,
          estimated_hours: 280
        },
        {
          id: 'agency-marketing',
          template_name: 'Digital Marketing Campaign',
          service_type: 'agency',
          industry_vertical: 'marketing',
          methodology: 'agile',
          estimated_duration_days: 45,
          complexity_level: 'medium',
          phases_config: [
            {
              phase_name: 'Campaign Strategy & Planning',
              duration_days: 7,
              description: 'Develop comprehensive campaign strategy',
              key_activities: ['Market research', 'Audience analysis', 'Channel strategy', 'Creative brief'],
              deliverables: ['Campaign Strategy', 'Creative Brief', 'Media Plan']
            },
            {
              phase_name: 'Creative Development',
              duration_days: 14,
              description: 'Create campaign assets and content',
              key_activities: ['Creative concepts', 'Asset creation', 'Copy development', 'Visual design'],
              deliverables: ['Creative Assets', 'Campaign Copy', 'Visual Elements']
            },
            {
              phase_name: 'Campaign Launch & Optimization',
              duration_days: 21,
              description: 'Execute campaign with continuous optimization',
              key_activities: ['Campaign setup', 'Launch execution', 'Performance monitoring', 'A/B testing'],
              deliverables: ['Live Campaign', 'Performance Reports', 'Optimization Recommendations']
            },
            {
              phase_name: 'Analysis & Reporting',
              duration_days: 3,
              description: 'Comprehensive campaign analysis',
              key_activities: ['Data analysis', 'ROI calculation', 'Insights generation', 'Recommendations'],
              deliverables: ['Campaign Report', 'ROI Analysis', 'Future Recommendations']
            }
          ],
          tasks_template: [
            { task_type: 'strategy', estimated_hours: 6, skill_requirements: ['strategy', 'marketing'] },
            { task_type: 'creative', estimated_hours: 20, skill_requirements: ['design', 'creative'] },
            { task_type: 'execution', estimated_hours: 15, skill_requirements: ['campaign_management', 'digital_marketing'] },
            { task_type: 'analysis', estimated_hours: 8, skill_requirements: ['analytics', 'reporting'] }
          ],
          base_price: 25000,
          estimated_hours: 120
        },
        {
          id: 'coaching-program',
          template_name: 'Executive Leadership Coaching',
          service_type: 'coaching',
          industry_vertical: 'leadership',
          methodology: 'hybrid',
          estimated_duration_days: 120,
          complexity_level: 'medium',
          phases_config: [
            {
              phase_name: 'Leadership Assessment',
              duration_days: 14,
              description: 'Comprehensive leadership evaluation',
              key_activities: ['360 assessment', 'Leadership interview', 'Goals setting', 'Development planning'],
              deliverables: ['Assessment Report', 'Development Plan', 'Coaching Agreement']
            },
            {
              phase_name: 'Core Leadership Modules',
              duration_days: 56,
              description: 'Structured leadership development program',
              key_activities: ['Weekly coaching sessions', 'Skill development', 'Practice assignments', 'Progress reviews'],
              deliverables: ['Module Completions', 'Progress Reports', 'Action Plans']
            },
            {
              phase_name: 'Applied Leadership Practice',
              duration_days: 35,
              description: 'Real-world leadership application',
              key_activities: ['Leadership projects', 'Team interactions', 'Feedback sessions', 'Skill refinement'],
              deliverables: ['Project Results', 'Feedback Reports', 'Skill Assessments']
            },
            {
              phase_name: 'Integration & Sustainability',
              duration_days: 15,
              description: 'Long-term leadership sustainability',
              key_activities: ['Integration planning', 'Sustainability strategies', 'Future development', 'Program review'],
              deliverables: ['Sustainability Plan', 'Future Development Roadmap', 'Program Completion Report']
            }
          ],
          base_price: 15000,
          estimated_hours: 80
        }
      ]

      return NextResponse.json({ prebuilt_templates: prebuiltTemplates })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}