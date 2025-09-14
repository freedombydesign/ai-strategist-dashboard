import { NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

export async function POST() {
  try {
    console.log('[IMPORT-SPRINT-CATEGORIES] Starting import of Ruth\'s sprint categories...')
    
    // Ruth's sprint categories from Airtable
    const sprintCategories = [
      {
        category_name: 'Lock in Your Most Profitable Service Zone',
        description: 'Align what you do best with what people are ready to invest in. We\'ll pinpoint your most profitable service zone, simplify your message, and identify exactly where you need support (and where you don\'t).',
        outcome: 'Set your offer, story, and structure for high-margin sales without founder bottlenecks',
        phase_number: 1.0,
        time_saved_hours: 3.0,
        included_steps: 'Complete Sweet Spot Positioning, Build Your Market Message Map, Clarify Your Service Story, Define Your Lean Team Needs, Map Your Buyer Journey',
        step_numbers: '1.0, 2.0, 3.0, 4.0, 5.0',
        connected_ai_prompts: 'Offer Positioning Audit, Profit Check, Backend Audit',
        step_range_start: 1.0,
        step_range_end: 5.0
      },
      {
        category_name: 'Create A Smooth Path From First Contact to Commitment',
        description: 'Map a clear, human-centered path that turns interest into commitment without high-pressure tactics. You\'ll outline the journey, pre-qualify clients, and create a sales experience that feels personal yet runs without you.',
        outcome: 'Create a friction-free, relational path from interest to commitment',
        phase_number: 2.0,
        time_saved_hours: 4.0,
        included_steps: 'Map Your Buyer Journey, Set Up Client Form, Create Connection Based Sales Video, Build Sales Page Wireframe',
        step_numbers: '5.0, 6.0, 7.0, 8.0',
        connected_ai_prompts: 'Journey Map Draft, FAQ Script',
        step_range_start: 5.0,
        step_range_end: 8.0
      },
      {
        category_name: 'Sell Without Being The Bottleneck',
        description: 'Set up systems that convert prospects into clients without requiring your constant involvement. You\'ll create follow-up sequences, conversion flows, and sales materials that work while you focus on delivery.',
        outcome: 'Automate and streamline conversions while staying human',
        phase_number: 3.0,
        time_saved_hours: 5.0,
        included_steps: 'Draft Your Follow-Up Emails, Install Your Say Yes CTA Flow, Record Your Loom Sales Walkthrough',
        step_numbers: '9.0, 10.0, 11.0',
        connected_ai_prompts: 'SOP From Voice, Sales Narrative Builder, Gentle Follow-Up Flow',
        step_range_start: 9.0,
        step_range_end: 11.0
      },
      {
        category_name: 'Streamline Client Delivery Without Losing Your Personal Touch',
        description: 'Set your client delivery on autopilot while keeping your personal touch. You\'ll install smooth onboarding, automated welcome messages, and a support system that prevents inbox overwhelm.',
        outcome: 'Smooth client onboarding, delivery and support without constant founder involvement',
        phase_number: 4.0,
        time_saved_hours: 6.0,
        included_steps: 'Implement Client Intake Checklist, Automate Welcome Email +Voice Note, Build Support System Templates',
        step_numbers: '12.0, 13.0, 14.0',
        connected_ai_prompts: 'Client Welcome Pack, Delegation Script, SOP From Voice',
        step_range_start: 12.0,
        step_range_end: 14.0
      },
      {
        category_name: 'Continuously Improve Without Burning it Down',
        description: 'Audit your systems to see what\'s working, let go of what\'s draining you, and plan your next growth sprint, without burning it all down to start over.',
        outcome: 'Ongoing improvements that scale without rebuilding from scratch',
        phase_number: 5.0,
        time_saved_hours: 2.0,
        included_steps: 'Complete System Self Audit, Archive Low-ROI Processes, Plan Next 90 Day Growth Sprint',
        step_numbers: '15.0, 16.0, 17.0',
        connected_ai_prompts: 'Process Audit, Continuous Improvement Plan, Backend Audit',
        step_range_start: 15.0,
        step_range_end: 17.0
      }
    ];

    // Import all sprint categories
    const importedCategories = [];
    for (const category of sprintCategories) {
      try {
        const { data, error } = await supabase
          .from('sprint_categories')
          .insert({
            category_name: category.category_name,
            description: category.description,
            outcome: category.outcome,
            phase_number: category.phase_number,
            time_saved_hours: category.time_saved_hours,
            included_steps: category.included_steps,
            step_numbers: category.step_numbers,
            connected_ai_prompts: category.connected_ai_prompts,
            step_range_start: category.step_range_start,
            step_range_end: category.step_range_end,
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) {
          console.log(`[IMPORT-SPRINT-CATEGORIES] Warning - could not insert ${category.category_name}:`, error.message);
        } else {
          importedCategories.push(data);
          console.log(`[IMPORT-SPRINT-CATEGORIES] ✅ Imported: ${category.category_name}`);
        }
      } catch (err) {
        console.log(`[IMPORT-SPRINT-CATEGORIES] Error importing ${category.category_name}:`, err);
      }
    }
    
    console.log(`[IMPORT-SPRINT-CATEGORIES] Import completed. Imported ${importedCategories.length} sprint categories.`);
    
    return NextResponse.json({
      success: true,
      message: `Successfully imported ${importedCategories.length} sprint categories with descriptions, outcomes, and AI prompt connections from your Airtable system`,
      imported_count: importedCategories.length,
      imported_categories: importedCategories.map(c => c.category_name)
    })
    
  } catch (error) {
    console.error('[IMPORT-SPRINT-CATEGORIES] Error:', error)
    return NextResponse.json({
      error: 'Failed to import sprint categories',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}