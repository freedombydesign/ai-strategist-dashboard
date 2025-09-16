import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('[SETUP-DIAGNOSTIC] Starting comprehensive diagnostic system setup...')

    // 1. Create all diagnostic tables
    console.log('[SETUP-DIAGNOSTIC] Creating diagnostic tables...')

    const createTablesSQL = `
      -- 1. USERS TABLE
      CREATE TABLE IF NOT EXISTS users (
        user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        name VARCHAR(255),
        email VARCHAR(255) UNIQUE,
        business_type VARCHAR(50) CHECK (business_type IN (
          'coach', 'agency', 'va', 'consultant', 'freelancer',
          'service_provider', 'course_creator', 'other'
        )),
        revenue_level VARCHAR(50) CHECK (revenue_level IN (
          'under_5k', '5k_10k', '10k_25k', '25k_50k',
          '50k_100k', '100k_250k', '250k_500k', 'over_500k'
        )),
        team_size INTEGER DEFAULT 1,
        years_in_business INTEGER,
        primary_service VARCHAR(255),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- 2. ASSESSMENTS TABLE
      CREATE TABLE IF NOT EXISTS assessments (
        assessment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
        date_taken TIMESTAMPTZ DEFAULT NOW(),
        overall_score NUMERIC(5,2) CHECK (overall_score >= 0 AND overall_score <= 100),
        money_freedom_score NUMERIC(5,2),
        systems_freedom_score NUMERIC(5,2),
        team_freedom_score NUMERIC(5,2),
        stress_freedom_score NUMERIC(5,2),
        time_freedom_score NUMERIC(5,2),
        impact_freedom_score NUMERIC(5,2),
        archetype VARCHAR(100),
        archetype_confidence NUMERIC(3,2),
        completion_status VARCHAR(20) DEFAULT 'in_progress' CHECK (completion_status IN ('in_progress', 'completed', 'abandoned')),
        total_questions INTEGER,
        questions_answered INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- 3. DIAGNOSTIC QUESTIONS TABLE
      CREATE TABLE IF NOT EXISTS diagnostic_questions (
        question_id INTEGER PRIMARY KEY,
        question_order INTEGER UNIQUE,
        category VARCHAR(50) NOT NULL CHECK (category IN (
          'sales_money', 'delivery_systems', 'team_delegation',
          'operations_stress', 'time_impact'
        )),
        component VARCHAR(50) NOT NULL CHECK (component IN (
          'money_freedom', 'systems_freedom', 'team_freedom',
          'stress_freedom', 'time_freedom', 'impact_freedom'
        )),
        question_text TEXT NOT NULL,
        subtitle TEXT,
        scale_description JSONB,
        weight NUMERIC(3,2) DEFAULT 1.0,
        sprint_trigger VARCHAR(100),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- 4. DIAGNOSTIC RESPONSES TABLE
      CREATE TABLE IF NOT EXISTS diagnostic_responses (
        response_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        assessment_id UUID REFERENCES assessments(assessment_id) ON DELETE CASCADE,
        question_id INTEGER REFERENCES diagnostic_questions(question_id) ON DELETE CASCADE,
        score INTEGER NOT NULL CHECK (score >= 1 AND score <= 10),
        response_time_seconds INTEGER,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(assessment_id, question_id)
      );

      -- 5. SPRINTS TABLE
      CREATE TABLE IF NOT EXISTS sprints (
        sprint_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        sprint_key VARCHAR(20) UNIQUE NOT NULL,
        category VARCHAR(50) NOT NULL,
        sprint_title VARCHAR(255) NOT NULL,
        description TEXT,
        detailed_outcome TEXT,
        estimated_time_hours INTEGER,
        difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
        prerequisites JSONB,
        recommended_order INTEGER,
        assets_generated JSONB,
        tools_required JSONB,
        primary_component VARCHAR(50) CHECK (primary_component IN (
          'money_freedom', 'systems_freedom', 'team_freedom',
          'stress_freedom', 'time_freedom', 'impact_freedom'
        )),
        expected_score_improvement INTEGER,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- 6. RECOMMENDATIONS TABLE
      CREATE TABLE IF NOT EXISTS recommendations (
        recommendation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        assessment_id UUID REFERENCES assessments(assessment_id) ON DELETE CASCADE,
        sprint_id UUID REFERENCES sprints(sprint_id) ON DELETE CASCADE,
        priority_rank INTEGER NOT NULL,
        confidence_score NUMERIC(3,2),
        reasoning TEXT,
        estimated_impact_points INTEGER,
        estimated_time_to_complete INTEGER,
        status VARCHAR(20) DEFAULT 'recommended' CHECK (status IN (
          'recommended', 'accepted', 'in_progress', 'completed',
          'skipped', 'deferred'
        )),
        user_notes TEXT,
        started_at TIMESTAMPTZ,
        completed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(assessment_id, sprint_id)
      );
    `

    const { error: tablesError } = await supabase.rpc('exec', { sql: createTablesSQL })
    if (tablesError) {
      console.error('[SETUP-DIAGNOSTIC] Error creating tables:', tablesError)
      return NextResponse.json({
        error: 'Failed to create tables',
        details: tablesError.message
      }, { status: 500 })
    }

    console.log('[SETUP-DIAGNOSTIC] Tables created successfully')

    // 2. Seed diagnostic questions
    console.log('[SETUP-DIAGNOSTIC] Seeding diagnostic questions...')

    const questionsData = [
      {
        question_id: 1,
        question_order: 1,
        category: 'sales_money',
        component: 'money_freedom',
        question_text: 'How predictable is your monthly revenue?',
        subtitle: 'Consider consistency of income over the past 6 months',
        scale_description: { "1": "Completely unpredictable", "10": "I can forecast exactly what I'll earn" },
        weight: 1.2,
        sprint_trigger: 'S1',
        is_active: true
      },
      {
        question_id: 2,
        question_order: 2,
        category: 'sales_money',
        component: 'money_freedom',
        question_text: 'How efficient is your client acquisition process?',
        subtitle: 'Time and effort required to get new clients',
        scale_description: { "1": "Constant hustle with no system", "10": "Automated system brings qualified leads" },
        weight: 1.0,
        sprint_trigger: 'S1',
        is_active: true
      },
      {
        question_id: 3,
        question_order: 3,
        category: 'delivery_systems',
        component: 'systems_freedom',
        question_text: 'How standardized is your service delivery?',
        subtitle: 'Consistency of process from client to client',
        scale_description: { "1": "Every project is completely custom", "10": "Identical process every time" },
        weight: 1.1,
        sprint_trigger: 'S3',
        is_active: true
      }
    ]

    const { error: questionsError } = await supabase
      .from('diagnostic_questions')
      .upsert(questionsData, { onConflict: 'question_id' })

    if (questionsError) {
      console.error('[SETUP-DIAGNOSTIC] Error seeding questions:', questionsError)
    } else {
      console.log('[SETUP-DIAGNOSTIC] Questions seeded successfully')
    }

    // 3. Seed sprints data
    console.log('[SETUP-DIAGNOSTIC] Seeding sprints data...')

    const sprintsData = [
      {
        sprint_key: 'S1',
        category: 'sales_money',
        sprint_title: 'Acquisition Engine',
        description: 'Build a predictable client acquisition system with automated lead generation and qualification.',
        detailed_outcome: 'A complete acquisition funnel with lead magnets, automated email sequences, and tracking systems that generates 5-10 qualified leads per week.',
        estimated_time_hours: 16,
        difficulty_level: 'intermediate',
        prerequisites: [],
        recommended_order: 1,
        assets_generated: {
          templates: ["Lead Magnet Template", "Email Sequence Template", "Lead Scoring Worksheet"],
          sops: ["Lead Qualification SOP", "Follow-up Process SOP"],
          automations: ["Email Automation", "Lead Scoring Automation"]
        },
        tools_required: {
          required: ["Email Platform", "CRM"],
          optional: ["Landing Page Builder", "Analytics Tool"]
        },
        primary_component: 'money_freedom',
        expected_score_improvement: 15,
        is_active: true
      },
      {
        sprint_key: 'S2',
        category: 'sales_money',
        sprint_title: 'Pricing Engine',
        description: 'Create value-based pricing structure with clear packages and automated proposal generation.',
        detailed_outcome: 'Standardized pricing packages with automated proposal system that increases average deal size by 30%.',
        estimated_time_hours: 12,
        difficulty_level: 'beginner',
        prerequisites: [],
        recommended_order: 2,
        assets_generated: {
          templates: ["Pricing Package Template", "Proposal Template", "Value Calculator"],
          sops: ["Pricing Discussion SOP", "Proposal Process SOP"],
          automations: ["Proposal Generation"]
        },
        tools_required: {
          required: ["Proposal Tool"],
          optional: ["Contract Management"]
        },
        primary_component: 'money_freedom',
        expected_score_improvement: 12,
        is_active: true
      },
      {
        sprint_key: 'S3',
        category: 'sales_money',
        sprint_title: 'Offer Stabilization',
        description: 'Standardize service offerings into repeatable packages to eliminate custom work.',
        detailed_outcome: 'Core service packages that deliver consistent results while reducing delivery time by 40%.',
        estimated_time_hours: 20,
        difficulty_level: 'intermediate',
        prerequisites: ["S2"],
        recommended_order: 3,
        assets_generated: {
          templates: ["Service Package Template", "Scope Definition Template", "Delivery Timeline"],
          sops: ["Service Delivery SOP", "Scope Management SOP"],
          automations: ["Service Packaging"]
        },
        tools_required: {
          required: ["Project Management Tool"],
          optional: ["Client Portal"]
        },
        primary_component: 'systems_freedom',
        expected_score_improvement: 18,
        is_active: true
      }
    ]

    const { error: sprintsError } = await supabase
      .from('sprints')
      .upsert(sprintsData, { onConflict: 'sprint_key' })

    if (sprintsError) {
      console.error('[SETUP-DIAGNOSTIC] Error seeding sprints:', sprintsError)
    } else {
      console.log('[SETUP-DIAGNOSTIC] Sprints seeded successfully')
    }

    // 4. Verify setup
    const { data: sprintsCheck, error: sprintsCheckError } = await supabase
      .from('sprints')
      .select('sprint_key, difficulty_level, sprint_title')
      .limit(3)

    const { data: questionsCheck, error: questionsCheckError } = await supabase
      .from('diagnostic_questions')
      .select('question_id, question_text')
      .limit(3)

    console.log('[SETUP-DIAGNOSTIC] Setup verification:', {
      sprints: { data: sprintsCheck, error: sprintsCheckError },
      questions: { data: questionsCheck, error: questionsCheckError }
    })

    return NextResponse.json({
      success: true,
      message: 'Diagnostic system setup completed successfully!',
      data: {
        tablesCreated: true,
        sprintsSeeded: sprintsData.length,
        questionsSeeded: questionsData.length,
        verification: {
          sprints: sprintsCheck,
          questions: questionsCheck
        }
      }
    })

  } catch (error) {
    console.error('[SETUP-DIAGNOSTIC] Setup error:', error)
    return NextResponse.json({
      error: 'Diagnostic setup failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}